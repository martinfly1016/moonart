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

export function readVisibleViewport(win) {
  const vv = win.visualViewport;
  const width = Math.min(vv?.width || Infinity, win.innerWidth || Infinity);
  const height = Math.min(vv?.height || Infinity, win.innerHeight || Infinity);
  return {
    top: Number(vv?.offsetTop) || 0,
    left: Number(vv?.offsetLeft) || 0,
    width: Number.isFinite(width) ? width : 0,
    height: Number.isFinite(height) ? height : 0
  };
}

export function readSafeArea(win, doc) {
  const style = win.getComputedStyle?.(doc?.documentElement);
  if (!style?.getPropertyValue) return { top: 0, right: 0, bottom: 0, left: 0 };
  const px = (name) => {
    const value = parseFloat(style.getPropertyValue(name));
    return Number.isFinite(value) ? value : 0;
  };
  return {
    top: px('--sat'),
    right: px('--sar'),
    bottom: px('--sab'),
    left: px('--sal')
  };
}

export function displayFrame(viewport, safe) {
  return {
    top: viewport.top - safe.top,
    left: viewport.left - safe.left,
    width: viewport.width + safe.left + safe.right,
    height: viewport.height + safe.top + safe.bottom
  };
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
  const wakeLock = options.wakeLock === undefined ? win.navigator?.wakeLock : options.wakeLock;
  const screenRef = options.screenRef === undefined ? win.screen : options.screenRef;

  let active = false;
  let entering = false;
  let method = null;
  let lockedLandscape = false;
  let sentinel = null;
  let lockedScroll = 0;
  let resizeTimer = 0;

  function applyFrame(pseudo) {
    const style = stage.style;
    if (!style) return;
    if (!pseudo) {
      style.top = '';
      style.left = '';
      style.width = '';
      style.height = '';
      style.removeProperty?.('--led-vv-w');
      style.removeProperty?.('--led-vv-h');
      style.removeProperty?.('--led-bleed-t');
      style.removeProperty?.('--led-bleed-r');
      style.removeProperty?.('--led-bleed-b');
      style.removeProperty?.('--led-bleed-l');
      return;
    }
    const viewport = readVisibleViewport(win);
    const safe = readSafeArea(win, doc);
    const frame = displayFrame(viewport, safe);
    style.top = `${frame.top}px`;
    style.left = `${frame.left}px`;
    style.width = `${frame.width}px`;
    style.height = `${frame.height}px`;
    style.setProperty?.('--led-vv-w', `${frame.width}px`);
    style.setProperty?.('--led-vv-h', `${frame.height}px`);
    style.setProperty?.('--led-bleed-t', `${safe.top}px`);
    style.setProperty?.('--led-bleed-r', `${safe.right}px`);
    style.setProperty?.('--led-bleed-b', `${safe.bottom}px`);
    style.setProperty?.('--led-bleed-l', `${safe.left}px`);
  }

  function syncClasses() {
    const viewport = readVisibleViewport(win);
    const size = options.getSize ? options.getSize() : viewport;
    const rotate = active && shouldUsePortraitRotation({
      method,
      lockedLandscape,
      width: size.width,
      height: size.height
    });
    const wasOpen = Boolean(doc.body?.classList.contains('led-display-open'));
    if (active && !wasOpen) lockedScroll = win.scrollY || win.pageYOffset || 0;
    stage.classList.toggle('is-open', active);
    stage.classList.toggle('is-api', active && method === 'api');
    board?.classList.toggle('is-rotated', rotate);
    if (exitButton) exitButton.hidden = !active;
    doc.documentElement?.classList.toggle('led-display-open', active);
    doc.body?.classList.toggle('led-display-open', active);
    if (doc.body?.style) doc.body.style.top = active ? `-${lockedScroll}px` : '';
    applyFrame(active && method !== 'api');
    if (wasOpen && !active) win.scrollTo?.(0, lockedScroll);
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
    if (typeof win.clearTimeout === 'function') win.clearTimeout(resizeTimer);
    if (typeof win.setTimeout !== 'function') return;
    resizeTimer = win.setTimeout(() => {
      if (!active) return;
      syncClasses();
      options.onResize?.();
    }, 280);
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
    win.visualViewport?.addEventListener('resize', onResize);
    win.visualViewport?.addEventListener('scroll', onResize);
    doc.addEventListener('keydown', onKey);
  }

  function unbind() {
    doc.removeEventListener('visibilitychange', onVisibility);
    doc.removeEventListener('fullscreenchange', onFullscreenChange);
    win.removeEventListener('resize', onResize);
    win.removeEventListener('orientationchange', onResize);
    win.visualViewport?.removeEventListener('resize', onResize);
    win.visualViewport?.removeEventListener('scroll', onResize);
    doc.removeEventListener('keydown', onKey);
    if (typeof win.clearTimeout === 'function') win.clearTimeout(resizeTimer);
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
