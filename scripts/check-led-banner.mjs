import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  NO_SLEEP_VIDEO_DEFAULT,
  chooseFullscreenMethod,
  createDisplaySession,
  fullscreenApiAvailable,
  isStandaloneDisplay,
  requestScreenWakeLock,
  shouldRenewWakeLock,
  shouldUsePortraitRotation
} from '../assets/js/led-display.js';
import { decodeShareHash, encodeShareHash } from '../assets/js/oshi-settings.js';
import {
  blinkDurationMs,
  clampBlinkHz,
  durationBucket,
  gapPx,
  marqueeKeyframes,
  pushRecent,
  splitEmoji,
  stateFromHash,
  staticScale,
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
assert.equal(fullscreenApiAvailable({}), false);
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

function createHarness({ api = true, lock = true, portrait = true, wake = 'ok' } = {}) {
  const listeners = new Map();
  const doc = {
    visibilityState: 'visible',
    fullscreenElement: null,
    body: { classList: createClassList() },
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
    navigator: {},
    addEventListener(type, fn) {
      listeners.set(`win:${type}`, fn);
    },
    removeEventListener(type) {
      listeners.delete(`win:${type}`);
    }
  };
  const stage = {
    classList: createClassList(),
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
  return { session, stage, board, exitButton, doc, listeners, events, counts: () => ({ locks, requests, releases }) };
}

const apiSession = await createHarness();
await apiSession.session.enter();
assert.deepEqual(apiSession.events[0], ['enter', 'api', 'ok', true]);
assert.equal(apiSession.stage.classList.contains('is-open'), true);
assert.equal(apiSession.stage.classList.contains('is-api'), true);
assert.equal(apiSession.board.classList.contains('is-rotated'), false);
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
assert.equal(apiSession.exitButton.hidden, true);
assert.equal(apiSession.counts().releases, 2);
assert.deepEqual(apiSession.events.at(-1), ['exit']);

const pseudo = await createHarness({ api: false, wake: 'missing' });
await pseudo.session.enter();
assert.deepEqual(pseudo.events[0], ['enter', 'pseudo', 'unsupported', false]);
assert.equal(pseudo.stage.classList.contains('is-api'), false);
assert.equal(pseudo.board.classList.contains('is-rotated'), true);
await pseudo.listeners.get('doc:keydown')({ key: 'Escape' });
assert.equal(pseudo.session.isActive(), false);

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
assert.match(css, /translate3d|transform: rotate\(90deg\)/);
const stageHtml = page.slice(page.indexOf('data-stage'), page.indexOf('led-controls'));
assert.equal(stageHtml.includes('led-ad-slot'), false);
assert.match(page, /led-ad-slot/);

assert.equal(clampBlinkHz(10), 3);
assert.equal(clampBlinkHz(0), 0.5);
assert.equal(blinkDurationMs(3), 333);
assert.equal(gapPx(0, 800), 0);
assert.equal(staticScale(200, 100, 100, 100), 0.5);
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
  font: 'rounded'
})));
assert.equal(shared.mode, 'penlight');
assert.equal(shared.text, '初参戦');
assert.equal(shared.light, 'gradient');
assert.equal(shared.direction, 'up');
assert.equal(shared.gap, 0);
assert.equal(shared.blinkHz, 3);
assert.equal(shared.font, 'rounded');
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

console.log('led-banner checks passed');
