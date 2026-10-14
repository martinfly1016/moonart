// Display session for /led-banner/: Fullscreen API, portrait overlay, and screen wake lock.

export const NO_SLEEP_VIDEO_DEFAULT = false;

export function chooseFullscreenMethod({ apiAvailable, standalone }) {
  if (standalone) return 'standalone';
  if (apiAvailable) return 'api';
  return 'pseudo';
}

export function fullscreenApiAvailable(element) {
  return typeof element?.requestFullscreen === 'function';
}

export function isStandaloneDisplay(win) {
  const query = win.matchMedia?.('(display-mode: standalone)');
  return Boolean(query?.matches || win.navigator?.standalone);
}

export function shouldUsePortraitRotation({ method, lockedLandscape, width, height }) {
  if (method === 'api' && lockedLandscape) return false;
  return height > width;
}

export function shouldRenewWakeLock(visibilityState, active) {
  return Boolean(active) && visibilityState === 'visible';
}

export async function requestScreenWakeLock(wakeLock) {
  if (!wakeLock || typeof wakeLock.request !== 'function') {
    return { status: 'unsupported', sentinel: null };
  }
  try {
    const sentinel = await wakeLock.request('screen');
    return { status: 'ok', sentinel };
  } catch (error) {
    return { status: 'error', sentinel: null, reason: error?.name || 'error' };
  }
}

async function lockLandscape(screenRef) {
  const orientation = screenRef?.orientation;
  if (typeof orientation?.lock !== 'function') return false;
  try {
    await orientation.lock('landscape');
    return true;
  } catch (error) {
    return false;
  }
}

export function createDisplaySession(options) {
  const stage = options.stage;
  const board = options.board;
  const exitButton = options.exitButton;
  const doc = options.doc || document;
  const win = options.win || window;
  const getSize = options.getSize || (() => ({
    width: win.innerWidth,
    height: win.innerHeight
  }));
  const wakeLock = options.wakeLock === undefined ? win.navigator?.wakeLock : options.wakeLock;
  const screenRef = options.screenRef === undefined ? win.screen : options.screenRef;

  let active = false;
  let entering = false;
  let method = null;
  let lockedLandscape = false;
  let sentinel = null;

  function syncClasses() {
    const size = getSize();
    const rotate = active && shouldUsePortraitRotation({
      method,
      lockedLandscape,
      width: size.width,
      height: size.height
    });
    stage.classList.toggle('is-open', active);
    stage.classList.toggle('is-api', active && method === 'api');
    board?.classList.toggle('is-rotated', rotate);
    if (exitButton) exitButton.hidden = !active;
    doc.body?.classList.toggle('led-display-open', active);
  }

  async function acquireWakeLock() {
    if (sentinel?.release) {
      try {
        await sentinel.release();
      } catch (error) {
        // The system may already have released the lock.
      }
      sentinel = null;
    }
    const result = await requestScreenWakeLock(wakeLock);
    sentinel = result.sentinel;
    return result;
  }

  async function onVisibility() {
    if (!shouldRenewWakeLock(doc.visibilityState, active)) return;
    const wake = await acquireWakeLock();
    options.onWakeRenew?.(wake);
  }

  function onResize() {
    if (!active) return;
    syncClasses();
    options.onResize?.();
  }

  function onFullscreenChange() {
    if (!active || method !== 'api' || doc.fullscreenElement) return;
    exit();
  }

  function onKey(event) {
    if (event.key !== 'Escape' || !active || method === 'api') return;
    exit();
  }

  function bind() {
    doc.addEventListener('visibilitychange', onVisibility);
    doc.addEventListener('fullscreenchange', onFullscreenChange);
    win.addEventListener('resize', onResize);
    win.addEventListener('orientationchange', onResize);
    doc.addEventListener('keydown', onKey);
  }

  function unbind() {
    doc.removeEventListener('visibilitychange', onVisibility);
    doc.removeEventListener('fullscreenchange', onFullscreenChange);
    win.removeEventListener('resize', onResize);
    win.removeEventListener('orientationchange', onResize);
    doc.removeEventListener('keydown', onKey);
  }

  async function enter() {
    if (active || entering) return null;
    entering = true;
    try {
      const standalone = options.standalone === undefined
        ? isStandaloneDisplay(win)
        : options.standalone;
      method = chooseFullscreenMethod({
        apiAvailable: fullscreenApiAvailable(stage),
        standalone
      });
      lockedLandscape = false;
      if (method === 'api') {
        try {
          await stage.requestFullscreen();
          lockedLandscape = await lockLandscape(screenRef);
          if (!doc.fullscreenElement) method = 'pseudo';
        } catch (error) {
          method = 'pseudo';
          lockedLandscape = false;
        }
      }
      active = true;
      bind();
      syncClasses();
      const wake = await acquireWakeLock();
      const detail = { method, wake, lockedLandscape };
      options.onEnter?.(detail);
      exitButton?.focus?.();
      return detail;
    } finally {
      entering = false;
    }
  }

  async function exit() {
    if (!active) return;
    const closingMethod = method;
    active = false;
    method = null;
    lockedLandscape = false;
    unbind();
    if (sentinel?.release) {
      try {
        await sentinel.release();
      } catch (error) {
        // Already released.
      }
    }
    sentinel = null;
    if (closingMethod === 'api' && doc.fullscreenElement && doc.exitFullscreen) {
      try {
        await doc.exitFullscreen();
      } catch (error) {
        // The browser may already have left fullscreen.
      }
    }
    syncClasses();
    options.enterButton?.focus?.();
    options.onExit?.();
  }

  return {
    enter,
    exit,
    isActive: () => active
  };
}
