import { createServer } from 'node:http';
import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';

const rootDir = normalize(join(fileURLToPath(import.meta.url), '..', '..'));
const reportDir = join(rootDir, 'reports', 'mobile-audit');
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const pages = (process.env.MOBILE_AUDIT_PAGES || [
  '/emoji-copy/',
  '/kaomoji/',
  '/kaomoji/cat/',
  '/special-characters/',
  '/emoji-combinations/'
].join(',')).split(',').map((page) => page.trim()).filter(Boolean);

const devices = [
  { name: 'iphone-se', width: 375, height: 667, dpr: 2, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
  { name: 'iphone-15', width: 390, height: 844, dpr: 3, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
  { name: 'pixel', width: 412, height: 915, dpr: 2.625, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36' }
];

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8']
]);

function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const filePath = normalize(join(rootDir, pathname));
      if (!filePath.startsWith(rootDir)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }
      const body = await readFile(filePath);
      response.writeHead(200, {
        'content-type': mimeTypes.get(extname(filePath)) || 'application/octet-stream'
      });
      response.end(body);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDevtoolsPort(profileDir) {
  const activePortFile = join(profileDir, 'DevToolsActivePort');
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const [port] = (await readFile(activePortFile, 'utf8')).trim().split('\n');
      if (port) return Number(port);
    } catch {
      await wait(250);
    }
  }
  throw new Error('Chrome did not expose a DevTools port.');
}

async function launchChrome() {
  const profileDir = join(tmpdir(), `mojimoon-mobile-audit-${Date.now()}`);
  await mkdir(profileDir, { recursive: true });
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  chrome.stderr.pipe(createWriteStream(join(reportDir, 'chrome.log')));
  const chromeFailed = new Promise((_, reject) => {
    chrome.once('error', reject);
    chrome.once('exit', (code, signal) => {
      reject(new Error(`Chrome exited before DevTools was ready: code=${code} signal=${signal}`));
    });
  });
  const port = await Promise.race([waitForDevtoolsPort(profileDir), chromeFailed]);
  return { chrome, port, profileDir };
}

async function createTab(port, url) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, {
    method: 'PUT'
  });
  if (!response.ok) throw new Error(`Could not create Chrome tab: ${response.status}`);
  return response.json();
}

class CdpSession {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();
    this.ws = new WebSocket(wsUrl);
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result || {});
        return;
      }
      const listeners = this.events.get(message.method) || [];
      for (const listener of listeners) listener(message.params || {});
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        this.events.set(method, (this.events.get(method) || []).filter((item) => item !== listener));
        resolve(params);
      };
      this.events.set(method, [...(this.events.get(method) || []), listener]);
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId;
    this.nextId += 1;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.ws.close();
  }
}

async function capturePng(session, filePath) {
  const screenshot = await session.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false
  });
  await writeFile(filePath, Buffer.from(screenshot.data, 'base64'));
}

async function auditPage(session, baseUrl, page, device) {
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: device.width,
    height: device.height,
    deviceScaleFactor: device.dpr,
    mobile: true
  });
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await session.send('Network.setUserAgentOverride', { userAgent: device.userAgent });

  const loadEvent = session.once('Page.loadEventFired');
  await session.send('Page.navigate', { url: `${baseUrl}${page}` });
  await loadEvent;
  await wait(600);

  const result = await session.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      const pageOverflow = scrollWidth > viewportWidth + 1;
      const all = Array.from(document.body.querySelectorAll('*'));
      const visible = (el, rect) => {
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const overflow = pageOverflow ? all.map((el) => {
        const rect = el.getBoundingClientRect();
        return { el, rect };
      }).filter(({ el, rect }) => visible(el, rect) && (rect.right > viewportWidth + 1 || rect.left < -1))
        .slice(0, 12)
        .map(({ el, rect }) => ({
          tag: el.tagName.toLowerCase(),
          className: String(el.className || ''),
          text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ').slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        })) : [];
      const tapSelectors = 'button, input, textarea, [role="button"], .item-card, .tool-tab, .related-card, .category-links a';
      const tapIssues = Array.from(document.querySelectorAll(tapSelectors)).map((el) => {
        const rect = el.getBoundingClientRect();
        return { el, rect };
      }).filter(({ el, rect }) => visible(el, rect) && (rect.width < 40 || rect.height < 36))
        .slice(0, 12)
        .map(({ el, rect }) => ({
          tag: el.tagName.toLowerCase(),
          className: String(el.className || ''),
          text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ').slice(0, 80),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        }));
      const composerSheet = document.querySelector('.composer-sheet-bar');
      return {
        title: document.title,
        viewportWidth,
        viewportHeight,
        scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        pageOverflow,
        mobileComposer: Boolean(composerSheet && getComputedStyle(composerSheet).display !== 'none'),
        overflow,
        tapIssues
      };
    })()`
  });

  const slug = page.split('/').filter(Boolean).join('-') || 'home';
  const screenshotPath = join(reportDir, `${slug}-${device.name}.png`);
  await capturePng(session, screenshotPath);

  return {
    page,
    device: device.name,
    screenshot: screenshotPath.replace(`${rootDir}/`, ''),
    ...result.result.value
  };
}

function renderReport(results) {
  const lines = [
    '# Mobile Audit Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    '| Page | Device | Size | Height | Composer | Overflow | Tap issues | Screenshot |',
    '| --- | --- | --- | ---: | --- | ---: | ---: | --- |'
  ];

  for (const item of results) {
    lines.push(`| ${item.page} | ${item.device} | ${item.viewportWidth}x${item.viewportHeight} | ${item.scrollHeight} | ${item.mobileComposer ? 'sheet' : '-'} | ${item.overflow.length} | ${item.tapIssues.length} | ${item.screenshot} |`);
  }

  lines.push('', '## Details', '');
  for (const item of results) {
    lines.push(`### ${item.page} - ${item.device}`, '');
    lines.push(`- Title: ${item.title}`);
    lines.push(`- Scroll: ${item.scrollWidth} x ${item.scrollHeight}`);
    lines.push(`- Mobile composer: ${item.mobileComposer ? 'sheet visible' : 'not detected'}`);
    lines.push(`- Screenshot: ${item.screenshot}`);
    lines.push(`- Horizontal overflow: ${item.overflow.length ? 'needs review' : 'ok'}`);
    if (item.overflow.length) {
      for (const issue of item.overflow) {
        lines.push(`  - ${issue.tag}.${issue.className || '-'} right=${issue.right} width=${issue.width} text="${issue.text}"`);
      }
    }
    lines.push(`- Tap targets: ${item.tapIssues.length ? 'needs review' : 'ok'}`);
    if (item.tapIssues.length) {
      for (const issue of item.tapIssues) {
        lines.push(`  - ${issue.tag}.${issue.className || '-'} ${issue.width}x${issue.height} text="${issue.text}"`);
      }
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  await rm(reportDir, { recursive: true, force: true });
  await mkdir(reportDir, { recursive: true });

  const { server, port: sitePort } = await startStaticServer();
  const baseUrl = `http://127.0.0.1:${sitePort}`;
  let chrome;
  let profileDir;

  try {
    const launched = await launchChrome();
    chrome = launched.chrome;
    profileDir = launched.profileDir;

    const tab = await createTab(launched.port, `${baseUrl}/`);
    const session = new CdpSession(tab.webSocketDebuggerUrl);
    await session.send('Page.enable');
    await session.send('Runtime.enable');
    await session.send('Network.enable');

    const results = [];
    for (const page of pages) {
      for (const device of devices) {
        results.push(await auditPage(session, baseUrl, page, device));
      }
    }
    session.close();

    await writeFile(join(reportDir, 'report.md'), renderReport(results));

    const failed = results.some((item) => item.pageOverflow);
    console.log(`Mobile audit completed: ${join(reportDir, 'report.md')}`);
    console.log(`Screenshots: ${reportDir}`);
    if (failed) {
      console.log('Horizontal overflow was detected. See report details.');
      process.exitCode = 1;
    }
  } finally {
    server.close();
    if (chrome) chrome.kill();
    if (profileDir) {
      await wait(300);
      await rm(profileDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

const keepAlive = setInterval(() => {}, 1000);

main()
  .then(() => clearInterval(keepAlive))
  .catch((error) => {
    clearInterval(keepAlive);
    console.error(error);
    process.exit(1);
  });
