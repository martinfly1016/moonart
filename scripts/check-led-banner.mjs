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

console.log('led-banner checks passed');
