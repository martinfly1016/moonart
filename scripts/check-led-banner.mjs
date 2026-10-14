import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  NO_SLEEP_VIDEO_DEFAULT,
  chooseFullscreenMethod,
  createDisplaySession,
  controlPads,
  displayFrame,
  currentFullscreenElement,
  fullscreenApiAvailable,
  isIphoneSafari,
  isStandaloneDisplay,
  shouldShowIosDisplayHint,
  readSafeArea,
  readVisibleViewport,
  requestScreenWakeLock,
  shouldRenewWakeLock,
  shouldUsePortraitRotation
} from '../assets/js/led-display.js';
import { keyboardLikelyOpen, syncStickyPreview } from '../assets/js/sticky-preview.js';
import { decodeShareHash, encodeShareHash } from '../assets/js/oshi-settings.js';
import {
  blinkDurationMs,
  clampBlinkHz,
  durationBucket,
  gapPx,
  continuousMarqueeDelta,
  createMarqueeRunner,
  marqueeKeyframes,
  marqueeLoopPx,
  marqueeShift,
  snapMarqueeLoop,
  pushRecent,
  splitEmoji,
  stateFromHash,
  clampTextScale,
  fontPxForInk,
  motionNeedsRestart,
  speedHeightsPerSec,
  speedPxPerSec,
  SPEED_MAX,
  normalizeBanner,
  presentationFor,
  shrinkToWidth,
  staticScale,
  stepColor,
  toggleFavorite
} from '../assets/js/led-state.js';

const page = fs.readFileSync(new URL('../led-banner/index.html', import.meta.url), 'utf8');
const uchiwa = fs.readFileSync(new URL('../uchiwa-moji/index.html', import.meta.url), 'utf8');
const home = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(page, /href="https:\/\/mojimoon\.com\/led-banner\/"/);
assert.match(page, /href="\/led-banner\/" aria-current="page"/);
assert.match(page, /data-stage/);
assert.match(page, /data-enter/);
assert.match(page, /data-exit/);
assert.match(page, /data-lock-tip/);
assert.match(page, /src="\/assets\/js\/led-banner\.js"/);
assert.match(uchiwa, /href="\/led-banner\/"/);
assert.match(home, /href="\/led-banner\/">電光掲示板<\/a>/);
assert.equal(NO_SLEEP_VIDEO_DEFAULT, false);

assert.equal(chooseFullscreenMethod({ apiAvailable: true, standalone: false }), 'api');
assert.equal(chooseFullscreenMethod({ apiAvailable: false, standalone: false }), 'pseudo');
assert.equal(chooseFullscreenMethod({ apiAvailable: true, standalone: true }), 'standalone');
assert.equal(fullscreenApiAvailable({ requestFullscreen() {} }), true);
assert.equal(fullscreenApiAvailable({ webkitRequestFullscreen() {} }), true);
assert.equal(fullscreenApiAvailable({}), false);
const webkitDoc = { fullscreenElement: null, webkitFullscreenElement: { id: 'stage' } };
assert.equal(currentFullscreenElement(webkitDoc), webkitDoc.webkitFullscreenElement);
assert.equal(isIphoneSafari({
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
}), true);
assert.equal(isIphoneSafari({
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1'
}), false);
assert.equal(isIphoneSafari({
  userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
}), false);
assert.equal(shouldShowIosDisplayHint({
  iphoneSafari: true, standalone: false, method: 'pseudo', dismissed: false
}), true);
assert.equal(shouldShowIosDisplayHint({
  iphoneSafari: true, standalone: true, method: 'standalone', dismissed: false
}), false);
assert.equal(shouldShowIosDisplayHint({
  iphoneSafari: true, standalone: false, method: 'api', dismissed: false
}), false);
assert.equal(shouldShowIosDisplayHint({
  iphoneSafari: false, standalone: false, method: 'pseudo', dismissed: false
}), false);
assert.equal(shouldShowIosDisplayHint({
  iphoneSafari: true, standalone: false, method: 'pseudo', dismissed: true
}), false);
assert.equal(isStandaloneDisplay({ navigator: { standalone: true } }), true);
assert.equal(isStandaloneDisplay({
  navigator: {},
  matchMedia() {
    return { matches: false };
  }
}), false);
assert.equal(shouldUsePortraitRotation({
  method: 'api',
  lockedLandscape: true,
  width: 390,
  height: 844
}), false);
assert.equal(shouldUsePortraitRotation({
  method: 'pseudo',
  lockedLandscape: false,
  width: 390,
  height: 844
}), true);
assert.equal(shouldUsePortraitRotation({
  method: 'api',
  lockedLandscape: false,
  width: 844,
  height: 390
}), false);
assert.equal(shouldRenewWakeLock('visible', true), true);
assert.equal(shouldRenewWakeLock('hidden', true), false);
assert.equal(shouldRenewWakeLock('visible', false), false);

assert.deepEqual(await requestScreenWakeLock(null), { status: 'unsupported', sentinel: null });
const sentinel = { released: false };
const ok = await requestScreenWakeLock({
  async request(type) {
    assert.equal(type, 'screen');
    return sentinel;
  }
});
assert.equal(ok.status, 'ok');
assert.equal(ok.sentinel, sentinel);
const failed = await requestScreenWakeLock({
  async request() {
    const error = new Error('denied');
    error.name = 'NotAllowedError';
    throw error;
  }
});
assert.equal(failed.status, 'error');
assert.equal(failed.reason, 'NotAllowedError');

function createClassList() {
  const names = new Set();
  return {
    names,
    add(...items) {
      items.forEach((item) => names.add(item));
    },
    remove(...items) {
      items.forEach((item) => names.delete(item));
    },
    toggle(item, force) {
      const on = force === undefined ? !names.has(item) : Boolean(force);
      if (on) names.add(item);
      else names.delete(item);
      return on;
    },
    contains(item) {
      return names.has(item);
    }
  };
}

function createStyle() {
  const values = {};
  return {
    values,
    get top() { return values.top || ''; },
    set top(value) { values.top = value; },
    get left() { return values.left || ''; },
    set left(value) { values.left = value; },
    get width() { return values.width || ''; },
    set width(value) { values.width = value; },
    get height() { return values.height || ''; },
    set height(value) { values.height = value; },
    setProperty(name, value) { values[name] = value; },
    removeProperty(name) { delete values[name]; }
  };
}

function createHarness({
  api = true,
  lock = true,
  portrait = true,
  wake = 'ok',
  visualViewport = null,
  safe = null
} = {}) {
  const listeners = new Map();
  const doc = {
    visibilityState: 'visible',
    fullscreenElement: null,
    documentElement: { classList: createClassList() },
    body: { classList: createClassList(), style: {} },
    addEventListener(type, fn) {
      listeners.set(`doc:${type}`, fn);
    },
    removeEventListener(type) {
      listeners.delete(`doc:${type}`);
    },
    async exitFullscreen() {
      this.fullscreenElement = null;
    }
  };
  const win = {
    innerWidth: portrait ? 390 : 844,
    innerHeight: portrait ? 844 : 390,
    scrollY: 48,
    navigator: {},
    addEventListener(type, fn) {
      listeners.set(`win:${type}`, fn);
    },
    removeEventListener(type) {
      listeners.delete(`win:${type}`);
    },
    scrollTo(x, y) {
      this.scrollY = y;
    }
  };
  if (visualViewport) {
    visualViewport.addEventListener = (type, fn) => listeners.set(`vv:${type}`, fn);
    visualViewport.removeEventListener = (type) => listeners.delete(`vv:${type}`);
    win.visualViewport = visualViewport;
    win.innerWidth = visualViewport.width;
    win.innerHeight = visualViewport.height;
  }
  if (safe) {
    win.getComputedStyle = () => ({
      getPropertyValue(name) {
        const values = {
          '--sat': `${safe.top || 0}px`,
          '--sar': `${safe.right || 0}px`,
          '--sab': `${safe.bottom || 0}px`,
          '--sal': `${safe.left || 0}px`
        };
        return values[name] || '';
      }
    });
  }
  const stage = {
    classList: createClassList(),
    style: createStyle(),
    async requestFullscreen() {
      if (!api) throw new Error('unsupported');
      doc.fullscreenElement = stage;
    }
  };
  if (!api) delete stage.requestFullscreen;
  const board = { classList: createClassList() };
  const exitButton = { hidden: true, focus() {} };
  let locks = 0;
  let requests = 0;
  let releases = 0;
  const wakeLock = wake === 'missing' ? null : {
    async request() {
      requests += 1;
      if (wake === 'error') throw new Error('denied');
      return {
        async release() {
          releases += 1;
        }
      };
    }
  };
  const screenRef = {
    orientation: {
      async lock(value) {
        locks += 1;
        assert.equal(value, 'landscape');
        if (!lock) throw new Error('lock failed');
      }
    }
  };
  const events = [];
  const session = createDisplaySession({
    stage,
    board,
    exitButton,
    doc,
    win,
    wakeLock,
    screenRef,
    onEnter(detail) {
      events.push(['enter', detail.method, detail.wake.status, detail.lockedLandscape]);
    },
    onWakeRenew(result) {
      events.push(['renew', result.status]);
    },
    onExit() {
      events.push(['exit']);
    }
  });
  return { session, stage, board, exitButton, doc, win, listeners, events, counts: () => ({ locks, requests, releases }) };
}

const apiSession = await createHarness();
await apiSession.session.enter();
assert.deepEqual(apiSession.events[0], ['enter', 'api', 'ok', true]);
assert.equal(apiSession.stage.classList.contains('is-open'), true);
assert.equal(apiSession.stage.classList.contains('is-api'), true);
assert.equal(apiSession.board.classList.contains('is-rotated'), false);
assert.equal(apiSession.stage.style.width, '');
assert.equal(apiSession.stage.style.top, '');
assert.equal(apiSession.doc.documentElement.classList.contains('led-display-open'), true);
assert.equal(apiSession.doc.body.style.top, '-48px');
assert.equal(apiSession.exitButton.hidden, false);
assert.equal(apiSession.counts().locks, 1);
apiSession.doc.visibilityState = 'hidden';
await apiSession.listeners.get('doc:visibilitychange')();
apiSession.doc.visibilityState = 'visible';
await apiSession.listeners.get('doc:visibilitychange')();
assert.equal(apiSession.counts().requests, 2);
assert.deepEqual(apiSession.events[1], ['renew', 'ok']);
await apiSession.session.exit();
assert.equal(apiSession.stage.classList.contains('is-open'), false);
assert.equal(apiSession.doc.documentElement.classList.contains('led-display-open'), false);
assert.equal(apiSession.doc.body.style.top, '');
assert.equal(apiSession.win.scrollY, 48);
assert.equal(apiSession.exitButton.hidden, true);
assert.equal(apiSession.counts().releases, 2);
assert.deepEqual(apiSession.events.at(-1), ['exit']);

const pseudo = await createHarness({ api: false, wake: 'missing' });
await pseudo.session.enter();
assert.deepEqual(pseudo.events[0], ['enter', 'pseudo', 'unsupported', false]);
assert.equal(pseudo.stage.classList.contains('is-api'), false);
assert.equal(pseudo.board.classList.contains('is-rotated'), true);
assert.equal(pseudo.stage.style.top, '0px');
assert.equal(pseudo.stage.style.left, '0px');
assert.equal(pseudo.stage.style.width, '390px');
assert.equal(pseudo.stage.style.height, '844px');
assert.equal(pseudo.stage.style.values['--led-vv-w'], '390px');
assert.equal(pseudo.stage.style.values['--led-vv-h'], '844px');
await pseudo.listeners.get('doc:keydown')({ key: 'Escape' });
assert.equal(pseudo.session.isActive(), false);
assert.equal(pseudo.stage.style.width, '');
assert.equal(pseudo.stage.style.values['--led-vv-w'], undefined);

const visible = await createHarness({
  api: false,
  portrait: false,
  visualViewport: { offsetTop: 12, offsetLeft: 0, width: 800, height: 340 },
  safe: { top: 0, right: 47, bottom: 21, left: 47 }
});
await visible.session.enter();
assert.equal(visible.board.classList.contains('is-rotated'), false);
assert.equal(visible.stage.style.top, '12px');
assert.equal(visible.stage.style.left, '-47px');
assert.equal(visible.stage.style.width, '894px');
assert.equal(visible.stage.style.height, '361px');
assert.equal(visible.stage.style.values['--led-pad-l'], '94px');
assert.equal(visible.stage.style.values['--led-pad-r'], '94px');
assert.equal(visible.stage.style.values['--led-pad-b'], '42px');
assert.deepEqual(controlPads({ top: 59, right: 0, bottom: 34, left: 0 }, true), {
  t: 0,
  r: 68,
  b: 0,
  l: 118
});
assert.equal(visible.listeners.has('vv:resize'), true);
assert.equal(visible.listeners.has('vv:scroll'), true);
await visible.session.exit();
assert.equal(visible.listeners.has('vv:resize'), false);
assert.equal(visible.stage.style.left, '');

const safariPortrait = await createHarness({
  api: false,
  portrait: true,
  visualViewport: { offsetTop: 91, offsetLeft: 0, width: 390, height: 640 }
});
safariPortrait.win.innerWidth = 390;
safariPortrait.win.innerHeight = 844;
await safariPortrait.session.enter();
assert.equal(safariPortrait.board.classList.contains('is-rotated'), true);
assert.equal(safariPortrait.stage.style.top, '91px');
assert.equal(safariPortrait.stage.style.left, '0px');
assert.equal(safariPortrait.stage.style.width, '390px');
assert.equal(safariPortrait.stage.style.height, '640px');
assert.equal(safariPortrait.stage.style.values['--led-vv-w'], '390px');
assert.equal(safariPortrait.stage.style.values['--led-vv-h'], '640px');
await safariPortrait.session.exit();

assert.deepEqual(readVisibleViewport({
  innerWidth: 844,
  innerHeight: 390,
  visualViewport: { offsetTop: 4, offsetLeft: 2, width: 900, height: 400 }
}), { top: 4, left: 2, width: 844, height: 390 });
assert.deepEqual(displayFrame(
  { top: 4, left: 2, width: 800, height: 340 },
  { top: 0, right: 47, bottom: 21, left: 47 }
), { top: 4, left: -45, width: 894, height: 361 });
assert.deepEqual(readSafeArea({
  getComputedStyle: () => ({ getPropertyValue: () => '0px' })
}, { documentElement: {} }), { top: 0, right: 0, bottom: 0, left: 0 });

const sticky = { classList: createClassList() };
assert.deepEqual(syncStickyPreview(sticky, { top: 0, stickyTop: 0, editing: false }), { pinned: true, editing: false });
assert.equal(sticky.classList.contains('is-pinned'), true);
assert.deepEqual(syncStickyPreview(sticky, { top: 80, stickyTop: 0, editing: false }), { pinned: false, editing: false });
assert.equal(sticky.classList.contains('is-pinned'), false);
assert.deepEqual(syncStickyPreview(sticky, { top: 0, stickyTop: 0, editing: true }), { pinned: false, editing: true });
assert.equal(sticky.classList.contains('is-editing'), true);
assert.equal(sticky.classList.contains('is-pinned'), false);
assert.deepEqual(syncStickyPreview(sticky, { top: 0, editing: true, suppressed: true }), { pinned: false, editing: false });
assert.equal(sticky.classList.contains('is-editing'), false);
assert.equal(keyboardLikelyOpen({ innerHeight: 800, visualViewport: { height: 420 } }), true);
assert.equal(keyboardLikelyOpen({ innerHeight: 800, visualViewport: { height: 760 } }), false);

const unlocked = await createHarness({ lock: false });
await unlocked.session.enter();
assert.equal(unlocked.events[0][1], 'api');
assert.equal(unlocked.events[0][3], false);
assert.equal(unlocked.board.classList.contains('is-rotated'), true);

const homeScreen = createDisplaySession({
  stage: {
    classList: createClassList(),
    async requestFullscreen() {
      throw new Error('should not run');
    }
  },
  board: { classList: createClassList() },
  doc: {
    visibilityState: 'visible',
    fullscreenElement: null,
    body: { classList: createClassList() },
    addEventListener() {},
    removeEventListener() {}
  },
  win: {
    innerWidth: 390,
    innerHeight: 844,
    navigator: { standalone: true },
    addEventListener() {},
    removeEventListener() {}
  },
  wakeLock: null,
  screenRef: {
    orientation: {
      async lock() {
        throw new Error('should not lock');
      }
    }
  },
  standalone: true
});
const standaloneDetail = await homeScreen.enter();
assert.equal(standaloneDetail.method, 'standalone');

const css = fs.readFileSync(new URL('../assets/css/led-banner.css', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../led-banner/sw.js', import.meta.url), 'utf8');
const manifest = fs.readFileSync(new URL('../led-banner/manifest.webmanifest', import.meta.url), 'utf8');
const sitemap = fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const kaomoji = fs.readFileSync(new URL('../kaomoji/index.html', import.meta.url), 'utf8');
const bannerJs = fs.readFileSync(new URL('../assets/js/led-banner.js', import.meta.url), 'utf8');
assert.equal(page.includes('SEO'), false);
assert.match(page, /電光掲示板アプリ/);
assert.match(page, /電光掲示板をスマホ/);
assert.match(page, /ペンライトモード/);
assert.match(page, /ホーム画面に追加/);
assert.match(page, /href="\/"/);
assert.match(page, /href="\/uchiwa-moji\/"/);
assert.match(page, /href="\/kaomoji\/"/);
assert.match(kaomoji, /href="\/led-banner\/"/);
assert.match(uchiwa, /data-open-led/);
assert.match(sitemap, /https:\/\/mojimoon\.com\/led-banner\//);
assert.match(manifest, /"scope": "\/led-banner\/"/);
assert.match(manifest, /"display": "standalone"/);
assert.match(sw, /\/led-banner\//);
assert.match(bannerJs, /scope: '\/led-banner\/'/);
assert.match(css, /led-display-open \.led-ad-slot/);
assert.match(css, /html\.led-display-open/);
assert.match(css, /100svh/);
assert.equal(/\b100vw\b/.test(css), false);
assert.match(css, /env\(safe-area-inset-left\)/);
assert.match(css, /is-pinned/);
assert.match(css, /is-editing/);
assert.match(css, /position:\s*sticky/);
assert.match(page, /viewport-fit=cover/);
assert.ok(page.indexOf('data-install-hint') < page.indexOf('data-stage'));
assert.match(sw, /led-banner-v6/);
assert.match(bannerJs, /createMarqueeRunner/);
assert.match(bannerJs, /marqueeLoopPx/);
assert.equal(bannerJs.includes('trackNode.animate'), false);
assert.equal(css.includes('will-change: transform'), false);
assert.match(page, /data-ios-hint/);
assert.match(page, /画面縦向きのロック/);
assert.match(page, /data-speed min="1" max="10"/);
assert.equal(SPEED_MAX, 10);
assert.ok(Math.abs(speedPxPerSec(5, 136) - 220) < 1);
assert.ok(Math.abs(speedPxPerSec(3, 136) - 104) < 1);
assert.ok(speedHeightsPerSec(10) >= speedHeightsPerSec(5) * 2 - 0.001);
assert.ok(Math.abs(speedPxPerSec(3, 460) / 460 - speedPxPerSec(3, 136) / 136) < 0.001);
assert.equal(css.includes('led-display-open .tool-shell'), false);
assert.match(css, /led-display-open \.led-controls/);
assert.match(css, /led-display-open \.site-footer/);
assert.match(bannerJs, /presentationFor/);
assert.match(bannerJs, /updateTiming/);
assert.match(bannerJs, /motionNeedsRestart/);
assert.match(page, /data-scale/);
assert.match(page, /文字の大きさ/);
assert.match(sw, /sticky-preview\.js/);
const uchiwaCss = fs.readFileSync(new URL('../assets/css/uchiwa-moji.css', import.meta.url), 'utf8');
const uchiwaJs = fs.readFileSync(new URL('../assets/js/uchiwa-moji.js', import.meta.url), 'utf8');
assert.match(uchiwaCss, /position:\s*sticky/);
assert.match(uchiwaCss, /is-pinned/);
assert.match(uchiwaCss, /30svh/);
assert.match(uchiwaCss, /25svh/);
assert.match(uchiwaJs, /0\.30/);
assert.match(uchiwaJs, /0\.25/);
assert.match(uchiwaJs, /bindStickyPreview/);
assert.match(bannerJs, /bindStickyPreview/);
assert.match(css, /translate3d|transform: rotate\(90deg\)/);
const stageHtml = page.slice(page.indexOf('data-stage'), page.indexOf('led-controls'));
assert.equal(stageHtml.includes('led-ad-slot'), false);
assert.match(page, /led-ad-slot/);

assert.equal(clampBlinkHz(10), 3);
assert.equal(clampBlinkHz(0), 0.5);
assert.equal(blinkDurationMs(3), 333);
assert.equal(gapPx(0, 800), 0);
assert.equal(staticScale(200, 100, 100, 100), 0.5);
assert.equal(clampTextScale(undefined), 95);
assert.equal(clampTextScale(40), 60);
assert.equal(clampTextScale(140), 100);
assert.equal(fontPxForInk(390, 92, 0.7), 513);
assert.equal(fontPxForInk(390, 92, 1), 359);
assert.equal(shrinkToWidth(400, 800, 400), 200);
assert.equal(shrinkToWidth(400, 200, 400), 400);
assert.equal(durationBucket(12), '10-30');
assert.deepEqual(splitEmoji('だいすき💖'), [
  { emoji: false, value: 'だいすき' },
  { emoji: true, value: '💖' }
]);
const left = marqueeKeyframes('left');
const right = marqueeKeyframes('right');
const up = marqueeKeyframes('up');
assert.equal(left[1].transform.includes('-50%'), true);
assert.equal(right[0].transform.includes('-50%'), true);
assert.equal(up[1].transform.includes('-50%'), true);
assert.equal(left[0].transform, right[1].transform);
assert.equal(marqueeLoopPx(0, 0, 0, 844), 844);
assert.equal(snapMarqueeLoop(100.26, 2), 100.5);
assert.equal(snapMarqueeLoop(100.24, 2), 100);
assert.ok(Math.abs(snapMarqueeLoop(100.26, 2) - 100.26) <= 0.25);
assert.match(bannerJs, /snapMarqueeLoop/);
assert.equal(marqueeLoopPx(5, 5, 5, 5), 0);
assert.ok(Math.abs(marqueeLoopPx(0, 0, 3, 4) - 5) < 1e-9);
assert.equal(marqueeShift(0, 200, false), 0);
assert.equal(marqueeShift(50, 200, false), -50);
assert.equal(marqueeShift(200, 200, false), 0);
assert.equal(marqueeShift(0, 200, true), -200);
assert.equal(marqueeShift(50, 200, true), -150);
assert.ok(continuousMarqueeDelta(-180, -40, 800) > 100);

function driveMarquee({ loop, speed, reverse = false, frames }) {
  let now = 1000;
  const queue = [];
  const runner = createMarqueeRunner({
    loop,
    speed,
    reverse,
    apply() {},
    raf(callback) {
      queue.push(callback);
      return queue.length;
    },
    cancel() {
      queue.length = 0;
    }
  });
  const samples = [];
  function take(extra = {}) {
    samples.push({ t: now, ...runner.snapshot(), ...extra });
  }
  function pump(dt) {
    now += dt;
    const callback = queue.shift();
    if (!callback) throw new Error('marquee stopped');
    callback(now);
    take();
  }
  pump(0);
  frames.forEach((frame) => {
    if (frame.retune) {
      runner.retune(frame.retune);
      take({ retune: true });
    }
    pump(frame.dt);
  });
  runner.cancel();
  return samples;
}

function assertNoBackwardJump(samples, reverse) {
  let wraps = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const prev = samples[index - 1];
    const next = samples[index];
    const delta = continuousMarqueeDelta(prev.shift, next.shift, next.loop);
    const raw = next.shift - prev.shift;
    if (Math.abs(raw) > next.loop / 2) wraps += 1;
    if (next.retune || next.t === prev.t) {
      assert.ok(Math.abs(delta) <= 0.05, `resize moved the scroll by ${delta}px`);
      continue;
    }
    const expected = (reverse ? 1 : -1) * (prev.speed * (next.t - prev.t)) / 1000;
    const error = Math.abs(delta - expected);
    assert.ok(error <= 0.05, `frame ${index}: moved ${delta}px, expected ${expected}px`);
    if (!reverse) assert.ok(delta <= 0.05, `frame ${index} jumped backward by ${delta}px`);
    if (reverse) assert.ok(delta >= -0.05, `frame ${index} jumped backward by ${delta}px`);
  }
  return wraps;
}

const forwardFrames = [];
for (let index = 0; index < 90; index += 1) {
  const frame = { dt: 16 };
  if (index === 24) frame.retune = { loop: 640 };
  if (index === 48) frame.retune = { loop: 280.5 };
  if (index === 70) frame.retune = { speed: 1500 };
  forwardFrames.push(frame);
}
const forward = driveMarquee({ loop: 500, speed: 900, frames: forwardFrames });
const forwardWraps = assertNoBackwardJump(forward, false);
assert.ok(forwardWraps >= 3, `expected several wraps, saw ${forwardWraps}`);

const fractional = driveMarquee({
  loop: 100.4,
  speed: 240,
  frames: Array.from({ length: 40 }, () => ({ dt: 16 }))
});
assert.ok(assertNoBackwardJump(fractional, false) >= 1);

const shrunk = driveMarquee({
  loop: 100,
  speed: 1000,
  frames: Array.from({ length: 24 }, (_, index) => ({
    dt: 16,
    retune: index === 12 ? { loop: 40 } : undefined
  }))
});
assert.ok(assertNoBackwardJump(shrunk, false) >= 1);

const reverseFrames = [];
for (let index = 0; index < 50; index += 1) {
  const frame = { dt: 20 };
  if (index === 18) frame.retune = { loop: 360 };
  if (index === 32) frame.retune = { speed: 700 };
  reverseFrames.push(frame);
}
const backward = driveMarquee({ loop: 420, speed: 500, reverse: true, frames: reverseFrames });
assert.ok(assertNoBackwardJump(backward, true) >= 1);

const shared = stateFromHash(decodeShareHash(encodeShareHash({
  mode: 'penlight',
  text: '初参戦',
  fill: '#3aa0e8',
  fill2: '#f5c518',
  bg: '#1a1a1a',
  effect: 'blink',
  direction: 'up',
  speed: 2,
  gap: 0,
  blinkHz: 9,
  light: 'gradient',
  font: 'rounded',
  scale: 70
})));
assert.equal(shared.mode, 'penlight');
assert.equal(shared.text, '初参戦');
assert.equal(shared.light, 'gradient');
assert.equal(shared.direction, 'up');
assert.equal(shared.gap, 0);
assert.equal(shared.blinkHz, 3);
assert.equal(shared.font, 'rounded');
assert.equal(shared.scale, 70);
assert.equal(stateFromHash(decodeShareHash(encodeShareHash({ mode: 'banner', text: '大好き' }))).scale, 95);
assert.equal(stateFromHash(decodeShareHash(encodeShareHash({ mode: 'banner', text: '大好き', speed: 10 }))).speed, 10);
assert.equal(normalizeBanner({ speed: 11 }).speed, 10);
assert.equal(stateFromHash(decodeShareHash(encodeShareHash({ mode: 'uchiwa', text: '大好き', effect: 'rainbow' }))).effect, 'scroll');

const memory = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = String(value); }
};
assert.equal(pushRecent(memory, { text: '指ハート', fill: '#ff4d88' })[0].text, '指ハート');
assert.equal(pushRecent(memory, { text: '指ハート' }).length, 1);
const favorite = toggleFavorite(memory, { text: 'ピースして', mode: 'banner' });
assert.equal(favorite.added, true);
assert.equal(toggleFavorite(memory, { text: 'ピースして', mode: 'banner' }).added, false);

const previewBox = { width: 360, height: 120, distance: 500, inkPerEm: 0.8, offsetEm: 0.04, textWidth: 480, textHeight: 90 };
const displayBox = { width: 844, height: 390, distance: 1800, inkPerEm: 0.8, offsetEm: 0.04, textWidth: 900, textHeight: 200 };

function project(plan, box) {
  const along = plan.vertical ? box.height : box.width;
  return {
    background: plan.background,
    ink: plan.ink,
    font: plan.font,
    text: plan.text,
    parts: plan.parts,
    direction: plan.direction,
    effect: plan.effect,
    scale: plan.scale,
    speed: plan.speed,
    gapSetting: plan.gapSetting,
    blink: plan.blink,
    keyframes: plan.keyframes,
    copies: plan.copies,
    light: plan.light,
    gapRatio: along ? Math.round((plan.gap / along) * 100) : 0,
    rate: plan.duration && plan.fontPx
      ? Math.round((box.distance / plan.duration) * 1000 / plan.fontPx * 1000)
      : 0
  };
}

function surfacesMatch(state) {
  const preview = presentationFor(state, previewBox);
  const display = presentationFor(state, displayBox);
  const left = project(preview, previewBox);
  const right = project(display, displayBox);
  assert.equal(left.background, right.background);
  assert.equal(left.ink, right.ink);
  assert.equal(left.font, right.font);
  assert.equal(left.text, right.text);
  assert.deepEqual(left.parts, right.parts);
  assert.equal(left.direction, right.direction);
  assert.equal(left.effect, right.effect);
  assert.equal(left.scale, right.scale);
  assert.equal(left.speed, right.speed);
  assert.equal(left.gapSetting, right.gapSetting);
  assert.equal(left.blink, right.blink);
  assert.deepEqual(left.keyframes, right.keyframes);
  assert.equal(left.copies, right.copies);
  assert.equal(left.light, right.light);
  assert.equal(left.gapRatio, right.gapRatio);
  assert.ok(Math.abs(left.rate - right.rate) <= 20);
  assert.deepEqual(presentationFor(state, displayBox), presentationFor(state, displayBox));
}

const base = () => normalizeBanner({
  mode: 'banner',
  text: '大好き',
  effect: 'scroll',
  direction: 'left',
  speed: 3,
  gap: 16,
  fill: '#ff4d88',
  bg: '#1a1a1a',
  font: 'dela',
  scale: 95
});

const rows = [];
function audit(name, before, after, changed) {
  try {
    surfacesMatch(before);
    surfacesMatch(after);
    const previewBefore = presentationFor(before, previewBox);
    const displayBefore = presentationFor(before, displayBox);
    const previewAfter = presentationFor(after, previewBox);
    const displayAfter = presentationFor(after, displayBox);
    assert.deepEqual(previewBefore, presentationFor(before, previewBox));
    assert.deepEqual(displayBefore, presentationFor(before, displayBox));
    assert.equal(changed(previewBefore, previewAfter), true);
    assert.equal(changed(displayBefore, displayAfter), true);
    rows.push([name, 'pass']);
  } catch (error) {
    rows.push([name, 'fail']);
    return error;
  }
  return null;
}

const failures = [
  audit('text', base(), normalizeBanner({ ...base(), text: '初参戦' }), (a, b) => a.text !== b.text),
  audit('mode: scroll', normalizeBanner({ ...base(), effect: 'still' }), base(), (a, b) => a.duration > 0 && b.duration === 0 ? false : a.duration !== b.duration),
  audit('mode: static', base(), normalizeBanner({ ...base(), effect: 'still' }), (a, b) => a.duration > 0 && b.duration === 0 && a.copies !== b.copies),
  audit('mode: blink', base(), normalizeBanner({ ...base(), effect: 'blink', blinkHz: 2 }), (a, b) => a.blink === 0 && b.blink > 0),
  audit('speed', normalizeBanner({ ...base(), speed: 1 }), normalizeBanner({ ...base(), speed: 5 }), (a, b) => a.duration !== b.duration && a.speed !== b.speed),
  audit('gap', normalizeBanner({ ...base(), gap: 0 }), normalizeBanner({ ...base(), gap: 80 }), (a, b) => a.gap !== b.gap && a.gapSetting !== b.gapSetting),
  audit('direction', base(), normalizeBanner({ ...base(), direction: 'up' }), (a, b) => a.direction !== b.direction && a.vertical !== b.vertical),
  audit('text color', base(), normalizeBanner({ ...base(), fill: '#3aa0e8' }), (a, b) => a.ink !== b.ink),
  audit('background color', base(), normalizeBanner({ ...base(), bg: '#ffffff' }), (a, b) => a.background !== b.background),
  audit('member color preset', base(), normalizeBanner({ ...base(), text: '花', fill: '#e23b3b' }), (a, b) => a.text !== b.text && a.ink !== b.ink),
  audit('font', base(), normalizeBanner({ ...base(), font: 'rounded' }), (a, b) => a.font !== b.font),
  audit('size', normalizeBanner({ ...base(), scale: 60 }), normalizeBanner({ ...base(), scale: 100 }), (a, b) => a.fontPx !== b.fontPx && a.scale !== b.scale),
  audit('penlight solid', base(), normalizeBanner({ ...base(), mode: 'penlight', light: 'solid', fill: '#ff4d88' }), (a, b) => b.mode === 'penlight' && b.background === '#ff4d88' && b.duration === 0),
  audit('penlight gradient', normalizeBanner({ ...base(), mode: 'penlight', light: 'solid' }), normalizeBanner({ ...base(), mode: 'penlight', light: 'gradient', fill: '#ff4d88', fill2: '#7a5cff' }), (a, b) => a.background !== b.background && b.background.includes('linear-gradient')),
  audit('penlight color switch', normalizeBanner({ ...base(), mode: 'penlight', light: 'solid', fill: '#ff4d88' }), normalizeBanner({ ...base(), mode: 'penlight', light: 'solid', fill: stepColor('#ff4d88', 1) }), (a, b) => a.background !== b.background),
  audit('emoji', base(), normalizeBanner({ ...base(), text: '大好き💖' }), (a, b) => b.parts.some((part) => part.emoji) && !a.parts.some((part) => part.emoji))
];

const sharedPlan = normalizeBanner({
  ...base(),
  text: '大好き💖',
  speed: 1,
  gap: 80,
  fill: '#3aa0e8',
  bg: '#ffffff',
  font: 'rounded',
  scale: 70,
  effect: 'blink',
  direction: 'right',
  blinkHz: 2
});
failures.push((() => {
  try {
    const opened = stateFromHash(decodeShareHash(encodeShareHash(sharedPlan)));
    surfacesMatch(sharedPlan);
    surfacesMatch(opened);
    assert.deepEqual(presentationFor(sharedPlan, previewBox), presentationFor(opened, previewBox));
    assert.deepEqual(presentationFor(sharedPlan, displayBox), presentationFor(opened, displayBox));
    rows.push(['share link', 'pass']);
    return null;
  } catch (error) {
    rows.push(['share link', 'fail']);
    return error;
  }
})());
const slow = presentationFor(normalizeBanner({ ...base(), speed: 1, gap: 0 }), displayBox);
const fast = presentationFor(normalizeBanner({ ...base(), speed: 5, gap: 80 }), displayBox);
failures.push(audit(
  'change while open',
  normalizeBanner({ ...base(), speed: 1, gap: 0 }),
  normalizeBanner({ ...base(), speed: 5, gap: 80 }),
  (a, b) => a.duration !== b.duration && a.gap !== b.gap && motionNeedsRestart(a, b) === false
));
failures.push(audit(
  'reopen display',
  fast && normalizeBanner({ ...base(), speed: 5, gap: 80 }),
  normalizeBanner({ ...base(), speed: 5, gap: 80 }),
  (a, b) => motionNeedsRestart(slow, a) === false && a.duration === b.duration && a.gap === b.gap
));

const failedRows = failures.filter(Boolean);
console.log('| setting | preview vs display |');
console.log('| --- | --- |');
rows.forEach(([name, status]) => console.log(`| ${name} | ${status} |`));
if (failedRows.length) throw failedRows[0];

console.log('led-banner checks passed');
