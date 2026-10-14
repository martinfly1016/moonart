import {
  FONTS,
  colorName,
  decodeShareHash,
  detectOs,
  encodeShareHash,
  isInAppBrowser,
  isIosDevice,
  loadMembers,
  trackToolEvent
} from './oshi-settings.js';
import { createDisplaySession, isStandaloneDisplay } from './led-display.js';
import { bindStickyPreview } from './sticky-preview.js';
import {
  acknowledgePhoto,
  blinkDurationMs,
  contrastLow,
  durationBucket,
  fontPxForInk,
  shrinkToWidth,
  gapPx,
  hasPhotoAck,
  inkFor,
  loadFavorites,
  loadRecent,
  marqueeDurationMs,
  marqueeKeyframes,
  normalizeBanner,
  pushRecent,
  splitEmoji,
  stateFromHash,
  staticScale,
  stepColor,
  toggleFavorite
} from './led-state.js';

const root = document.querySelector('[data-led-banner]');

function track(name, params = {}) {
  trackToolEvent(name, { tool_slug: 'led-banner', ...params });
}

function prefersReduced() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}

function boot() {
  if (!root) return;
  const stage = root.querySelector('[data-stage]');
  const board = root.querySelector('[data-board]');
  const viewport = root.querySelector('[data-viewport]');
  const trackNode = root.querySelector('[data-track]');
  const exitButton = root.querySelector('[data-exit]');
  const enterButtons = [...document.querySelectorAll('[data-enter]')];
  const tip = root.querySelector('[data-lock-tip]');
  const textInput = root.querySelector('[data-text]');
  const shareDialog = document.querySelector('[data-share-dialog]');
  const shareSummary = document.querySelector('[data-share-summary]');
  const photoDialog = document.querySelector('[data-photo-dialog]');
  const toast = document.querySelector('[data-toast]');
  const displayControls = root.querySelector('[data-display-controls]');
  let state = normalizeBanner();
  let source = 'editor';
  let builtKey = '';
  let motion = null;
  let blink = null;
  let fitFrame = 0;
  let startedAt = 0;
  let displayed = false;
  const storage = window.localStorage;

  const shared = stateFromHash(decodeShareHash(window.location.hash));
  if (shared) {
    state = shared;
    source = 'share';
    document.querySelector('[data-share-banner]').hidden = false;
    track('share_link_open', { tool: 'led-banner', channel: 'url' });
  } else if (prefersReduced()) {
    state.effect = 'still';
  }

  if (isInAppBrowser()) root.querySelector('[data-inapp]').hidden = false;
  setupInstall();

  let syncSticky = () => {};
  const session = createDisplaySession({
    stage,
    board,
    exitButton,
    enterButton: enterButtons[0],
    onEnter({ method, wake }) {
      syncSticky();
      track('fullscreen_result', { method, os: detectOs() });
      track('wakelock_result', { status: wake.status, os: detectOs() });
      tip.hidden = wake.status === 'ok';
      paintBoard();
      startedAt = Date.now();
      displayed = true;
      if (state.text.trim()) pushRecent(storage, state);
      track('banner_display_start', {
        mode: state.mode === 'penlight' ? 'penlight' : 'banner',
        effect: state.mode === 'penlight' ? state.light : state.effect,
        font: state.font,
        source
      });
      source = 'editor';
      scheduleFit();
      paintSaved();
    },
    onWakeRenew(wake) {
      tip.hidden = wake.status === 'ok';
    },
    onResize() {
      scheduleFit();
    },
    onExit() {
      syncSticky();
      if (displayed) {
        const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
        track('banner_display_end', { duration_sec: durationBucket(seconds) });
      }
      displayed = false;
      tip.hidden = true;
      paintBoard();
      scheduleFit();
    }
  });

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function scrolling() {
    return state.mode === 'banner' && state.effect === 'scroll' && Boolean(state.text.trim());
  }

  function verticalScroll() {
    return scrolling() && (state.direction === 'up' || state.direction === 'down');
  }

  function paintBoard() {
    if (state.mode === 'penlight') {
      board.style.background = state.light === 'gradient'
        ? `linear-gradient(115deg, ${state.fill} 0%, ${state.fill2} 100%)`
        : state.fill;
      trackNode.style.setProperty('--led-ink', inkFor(state.fill));
    } else {
      board.style.background = state.bg;
      trackNode.style.setProperty('--led-ink', state.fill);
    }
    const font = FONTS[state.font] || FONTS.dela;
    trackNode.style.setProperty('--led-font', font.family);
    trackNode.style.setProperty('--led-weight', String(font.weight));
    viewport.classList.toggle('is-scroll', scrolling());
    viewport.classList.toggle('is-vertical', verticalScroll());
    viewport.setAttribute('aria-label', state.mode === 'penlight'
      ? `ペンライト ${colorName(state.fill)}`
      : (state.text || '電光掲示板'));
    const lightOn = session.isActive() && state.mode === 'penlight';
    displayControls.classList.toggle('is-light', lightOn);
    root.querySelector('[data-light-prev]').hidden = !lightOn;
    root.querySelector('[data-light-next]').hidden = !lightOn;
  }

  function buildTrack() {
    const copies = scrolling() ? 2 : 1;
    const shown = state.text.trim() || '文字を入力';
    trackNode.replaceChildren();
    trackNode.classList.toggle('is-vertical', verticalScroll());
    for (let index = 0; index < copies; index += 1) {
      const copy = document.createElement('div');
      copy.className = 'led-copy';
      if (index > 0) copy.setAttribute('aria-hidden', 'true');
      const parts = splitEmoji(shown);
      (parts.length ? parts : [{ emoji: false, value: shown }]).forEach((part) => {
        const span = document.createElement('span');
        span.className = part.emoji ? 'led-emoji' : 'led-plain';
        span.textContent = part.value;
        copy.append(span);
      });
      trackNode.append(copy);
    }
  }

  function stopMotion() {
    motion?.cancel();
    blink?.cancel();
    motion = null;
    blink = null;
    trackNode.classList.remove('is-moving');
  }

  function glyphMetrics(node) {
    const canvas = glyphMetrics.canvas || (glyphMetrics.canvas = document.createElement('canvas'));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const size = 200;
    const style = getComputedStyle(node);
    ctx.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
    const metrics = ctx.measureText(node.textContent || ' ');
    const ascent = metrics.actualBoundingBoxAscent || 0;
    const descent = metrics.actualBoundingBoxDescent || 0;
    if (ascent + descent < 1) return null;
    const fontAscent = metrics.fontBoundingBoxAscent || ascent;
    const fontDescent = metrics.fontBoundingBoxDescent || descent;
    return {
      perEm: (ascent + descent) / size,
      // Positive when the painted glyphs sit below the center of the em box.
      offsetEm: ((fontAscent - fontDescent) - (ascent - descent)) / 2 / size
    };
  }

  function measureInk(copy) {
    const nodes = [...copy.querySelectorAll('.led-plain, .led-emoji')];
    const metrics = nodes.map(glyphMetrics).filter(Boolean);
    if (!metrics.length) return { perEm: 1, offsetEm: 0 };
    return metrics.reduce((tallest, item) => (item.perEm > tallest.perEm ? item : tallest));
  }

  function applyFit() {
    const height = viewport.clientHeight;
    const width = viewport.clientWidth;
    if (!height || !width) return;
    const copies = [...trackNode.querySelectorAll('.led-copy')];
    if (!copies.length) return;
    const vertical = verticalScroll();
    const gap = scrolling() ? gapPx(state.gap, vertical ? height : width) : 0;
    copies.forEach((copy) => {
      copy.style.top = '0px';
      copy.style.paddingRight = vertical ? '0px' : `${gap}px`;
      copy.style.paddingBottom = vertical ? `${gap}px` : '0px';
    });
    if (state.mode === 'penlight') {
      const base = Math.max(28, Math.round(Math.min(width, height) * 0.22));
      copies.forEach((copy) => {
        copy.style.fontSize = `${base}px`;
      });
      if (copies[0]) {
        const scale = staticScale(copies[0].scrollWidth, copies[0].scrollHeight, width * 0.9, height * 0.42);
        copies[0].style.fontSize = `${Math.max(22, Math.floor(base * scale))}px`;
      }
      return;
    }
    const sample = measureInk(copies[0]);
    // Viewport clientHeight is the board height inside the safe-area padding.
    let fontPx = fontPxForInk(height, state.scale, sample.perEm);
    if (!scrolling()) {
      copies[0].style.fontSize = `${fontPx}px`;
      fontPx = shrinkToWidth(fontPx, copies[0].scrollWidth, width * 0.92);
    }
    const shift = Math.round(-(sample.offsetEm || 0) * fontPx);
    copies.forEach((copy) => {
      copy.style.position = 'relative';
      copy.style.fontSize = `${fontPx}px`;
      copy.style.top = `${shift}px`;
    });
  }

  function startMotion() {
    stopMotion();
    const reduced = prefersReduced();
    if (scrolling()) {
      const copy = trackNode.querySelector('.led-copy');
      const distance = verticalScroll() ? copy?.offsetHeight : copy?.offsetWidth;
      if (distance) {
        trackNode.classList.add('is-moving');
        motion = trackNode.animate(marqueeKeyframes(state.direction), {
          duration: marqueeDurationMs(distance, state.speed, reduced),
          iterations: Infinity,
          easing: 'linear'
        });
      }
    }
    if (state.mode === 'banner' && state.effect === 'blink' && !reduced) {
      blink = viewport.animate([
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: 0.42 },
        { opacity: 0, offset: 0.5 },
        { opacity: 0, offset: 0.92 },
        { opacity: 1, offset: 1 }
      ], {
        duration: blinkDurationMs(state.blinkHz),
        iterations: Infinity,
        easing: 'linear'
      });
    }
    if (document.hidden) {
      motion?.pause();
      blink?.pause();
    }
  }

  function scheduleFit() {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(() => {
      applyFit();
      startMotion();
    });
  }

  function structureKey() {
    return [
      state.mode,
      state.effect,
      state.direction,
      state.text,
      state.font,
      prefersReduced()
    ].join('\n');
  }

  function syncControls() {
    textInput.value = state.text;
    root.querySelector('[data-count]').textContent = `${Array.from(state.text).length}/40`;
    root.querySelector('[data-color-name]').textContent = colorName(state.fill);
    root.querySelector('[data-fill-label]').textContent = state.mode === 'penlight' ? '光の色' : '文字色';
    root.querySelector('[data-bg-label]').textContent = state.light === 'gradient' && state.mode === 'penlight'
      ? '2色目'
      : '背景色';
    root.querySelector('[data-speed]').value = String(state.speed);
    root.querySelector('[data-speed-label]').textContent = String(state.speed);
    root.querySelector('[data-gap]').value = String(state.gap);
    root.querySelector('[data-gap-label]').textContent = String(state.gap);
    root.querySelector('[data-scale]').value = String(state.scale);
    root.querySelector('[data-scale-label]').textContent = `${state.scale}%`;
    root.querySelector('[data-blink]').value = String(state.blinkHz);
    root.querySelector('[data-blink-label]').textContent = `${state.blinkHz}回/秒`;
    root.querySelector('[data-custom-fill]').value = state.fill;
    root.querySelector('[data-custom-bg]').value = state.mode === 'penlight' ? state.fill2 : state.bg;
    root.querySelector('[data-banner-only]').hidden = state.mode === 'penlight';
    root.querySelector('[data-penlight-only]').hidden = state.mode !== 'penlight';
    root.querySelector('[data-direction-row]').hidden = state.effect !== 'scroll';
    root.querySelector('[data-speed-row]').hidden = state.effect !== 'scroll';
    root.querySelector('[data-gap-row]').hidden = state.effect !== 'scroll';
    root.querySelector('[data-blink-row]').hidden = state.effect !== 'blink';
    root.querySelector('[data-bg-block]').hidden = state.mode === 'penlight' && state.light !== 'gradient';
    root.querySelector('[data-motion-note]').hidden = !prefersReduced();
    root.querySelector('[data-contrast]').hidden = state.mode !== 'banner' || !contrastLow(state.fill, state.bg);
    press('[data-mode]', state.mode, 'mode');
    press('[data-effect]', state.effect, 'effect');
    press('[data-direction]', state.direction, 'direction');
    press('[data-font]', state.font, 'font');
    press('[data-light]', state.light, 'light');
    press('[data-fill]', state.fill, 'fill');
    press('[data-bg]', state.mode === 'penlight' ? state.fill2 : state.bg, 'bg');
    const favoriteOn = loadFavorites(storage).some((item) => item.text === state.text && item.mode === state.mode);
    root.querySelector('[data-favorite]').setAttribute('aria-pressed', favoriteOn ? 'true' : 'false');
  }

  function press(selector, value, key) {
    root.querySelectorAll(selector).forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset[key] === value ? 'true' : 'false');
    });
  }

  function paintSaved() {
    const members = loadMembers();
    const memberBox = root.querySelector('[data-members]');
    const memberBlock = root.querySelector('[data-members-block]');
    memberBlock.hidden = members.length === 0;
    memberBox.replaceChildren();
    members.forEach((member, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'member-apply';
      button.dataset.member = String(index);
      const dot = document.createElement('span');
      dot.className = 'swatch-dot';
      dot.style.background = member.color;
      button.append(dot, document.createTextNode(member.name));
      memberBox.append(button);
    });
    fillChips('[data-favorites]', loadFavorites(storage), 'favorite-item');
    fillChips('[data-recent]', loadRecent(storage), 'recent-item');
  }

  function fillChips(selector, items, flag) {
    const box = root.querySelector(selector);
    box.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('span');
      empty.className = 'hint';
      empty.textContent = 'まだありません';
      box.append(empty);
      return;
    }
    items.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute(flag === 'favorite-item' ? 'data-favorite-item' : 'data-recent-item', String(index));
      button.textContent = item.text;
      box.append(button);
    });
  }

  function render({ rebuild = true } = {}) {
    state = normalizeBanner(state);
    syncControls();
    paintBoard();
    const key = structureKey();
    if (rebuild || key !== builtKey) {
      builtKey = key;
      buildTrack();
      scheduleFit();
    }
  }

  function markEdited() {
    source = 'editor';
  }

  function applyStored(item) {
    if (!item) return;
    state = normalizeBanner(item);
    markEdited();
    render();
  }

  async function askPhoto() {
    if (hasPhotoAck(storage)) return true;
    if (typeof photoDialog.showModal !== 'function') {
      const ok = window.confirm('点滅する表示は、光過敏の方に影響することがあります。続けますか？');
      if (ok) {
        acknowledgePhoto(storage);
        track('photosensitivity_ack');
      }
      return ok;
    }
    photoDialog.showModal();
    const ok = await new Promise((resolve) => {
      photoDialog.addEventListener('close', () => resolve(photoDialog.returnValue === 'ok'), { once: true });
    });
    if (ok) {
      acknowledgePhoto(storage);
      track('photosensitivity_ack');
    }
    return ok;
  }

  async function setEffect(effect) {
    if (effect === 'blink' && !(await askPhoto())) return;
    state.effect = effect;
    markEdited();
    render();
  }

  function setFill(color) {
    state.fill = color;
    markEdited();
    track('preset_select', { type: 'color' });
    render({ rebuild: false });
  }

  function setSecondary(color) {
    if (state.mode === 'penlight') state.fill2 = color;
    else state.bg = color;
    markEdited();
    track('preset_select', { type: 'color' });
    render({ rebuild: false });
  }

  async function ensureFont() {
    const font = FONTS[state.font] || FONTS.dela;
    if (!document.fonts?.load) return;
    try {
      await document.fonts.load(`${font.weight} 64px ${font.family}`);
    } catch (error) {
      // The preview falls back to the device font.
    }
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      const area = document.createElement('textarea');
      area.value = value;
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
  }

  function confirmShare() {
    const motionLabel = state.mode === 'penlight'
      ? (state.light === 'gradient' ? 'グラデーション' : '単色')
      : { scroll: 'スクロール', still: '静止', blink: '点滅' }[state.effect];
    shareSummary.textContent = `「${state.text}」 / ${colorName(state.fill)} / ${motionLabel}`;
    if (typeof shareDialog.showModal === 'function') shareDialog.showModal();
    else shareDialog.setAttribute('open', '');
    return new Promise((resolve) => {
      shareDialog.addEventListener('close', () => resolve(shareDialog.returnValue === 'ok'), { once: true });
    });
  }

  async function shareLink() {
    if (!state.text.trim() && state.mode !== 'penlight') {
      showToast('文字を入力してください');
      return;
    }
    const compact = encodeShareHash(state);
    const decoded = stateFromHash(decodeShareHash(compact));
    if (decoded && state.text && decoded.text !== state.text) showToast('共有リンクでは40文字までです');
    if (!(await confirmShare())) return;
    const url = `${window.location.origin}${window.location.pathname}#${compact}`;
    let channel = 'copy';
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: '電光掲示板', url });
        channel = 'native';
      } catch (error) {
        if (error?.name === 'AbortError') return;
        await copyText(url);
        showToast('リンクをコピーしました');
      }
    } else {
      await copyText(url);
      showToast('リンクをコピーしました');
    }
    if (channel === 'native') showToast('共有しました');
    track('share_link_create', { tool: 'led-banner', channel });
  }

  function setupInstall() {
    const hint = root.querySelector('[data-install-hint]');
    const text = root.querySelector('[data-install-text]');
    const button = root.querySelector('[data-install]');
    let deferred = null;
    if (isIosDevice() && !isStandaloneDisplay(window)) {
      text.textContent = 'iPhoneでは、共有ボタンから「ホーム画面に追加」すると、アドレスバーなしで開けます。';
      hint.hidden = false;
    }
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferred = event;
      text.textContent = 'ホーム画面に追加すると、アプリのようにすぐ開けます。';
      button.hidden = false;
      hint.hidden = false;
    });
    button.addEventListener('click', async () => {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      button.hidden = true;
    });
  }

  textInput.addEventListener('input', () => {
    state.text = textInput.value;
    markEdited();
    render();
  });

  root.addEventListener('input', (event) => {
    const target = event.target;
    if (target.matches('[data-speed]')) {
      state.speed = Number(target.value);
      markEdited();
      syncControls();
      scheduleFit();
    } else if (target.matches('[data-gap]')) {
      state.gap = Number(target.value);
      markEdited();
      syncControls();
      scheduleFit();
    } else if (target.matches('[data-scale]')) {
      state.scale = Number(target.value);
      markEdited();
      syncControls();
      scheduleFit();
    } else if (target.matches('[data-blink]')) {
      state.blinkHz = Number(target.value);
      markEdited();
      syncControls();
      scheduleFit();
    } else if (target.matches('[data-custom-fill]')) {
      setFill(target.value);
    } else if (target.matches('[data-custom-bg]')) {
      setSecondary(target.value);
    }
  });

  root.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button || !root.contains(button)) return;
    if (button.dataset.mode) {
      state.mode = button.dataset.mode;
      markEdited();
      render();
    } else if (button.dataset.effect) {
      await setEffect(button.dataset.effect);
    } else if (button.dataset.direction) {
      state.direction = button.dataset.direction;
      markEdited();
      render();
    } else if (button.dataset.font) {
      state.font = button.dataset.font;
      markEdited();
      track('preset_select', { type: 'font' });
      render();
      ensureFont().then(scheduleFit);
    } else if (button.dataset.light) {
      state.light = button.dataset.light;
      markEdited();
      render({ rebuild: false });
    } else if (button.dataset.fill) {
      setFill(button.dataset.fill);
    } else if (button.dataset.bg) {
      setSecondary(button.dataset.bg);
    } else if (button.dataset.phrase) {
      state.text = button.dataset.phrase;
      markEdited();
      track('preset_select', { type: 'fansa' });
      render();
    } else if (button.dataset.kaomoji) {
      state.text = normalizeBanner({ ...state, text: `${state.text}${button.dataset.kaomoji}` }).text;
      markEdited();
      track('preset_select', { type: 'kaomoji' });
      render();
    } else if (button.dataset.member) {
      const member = loadMembers()[Number(button.dataset.member)];
      if (!member) return;
      state.text = member.name;
      state.fill = member.color;
      markEdited();
      track('preset_select', { type: 'member' });
      render();
    } else if (button.dataset.favoriteItem) {
      applyStored(loadFavorites(storage)[Number(button.dataset.favoriteItem)]);
    } else if (button.dataset.recentItem) {
      applyStored(loadRecent(storage)[Number(button.dataset.recentItem)]);
    } else if (button.matches('[data-favorite]')) {
      if (!state.text.trim()) {
        showToast('文字を入力してください');
        return;
      }
      const result = toggleFavorite(storage, state);
      paintSaved();
      syncControls();
      showToast(result.added ? 'お気に入りに保存しました' : 'お気に入りから外しました');
    } else if (button.matches('[data-share]')) {
      shareLink();
    } else if (button.matches('[data-light-prev]')) {
      state.fill = stepColor(state.fill, -1);
      markEdited();
      render({ rebuild: false });
    } else if (button.matches('[data-light-next]')) {
      state.fill = stepColor(state.fill, 1);
      markEdited();
      render({ rebuild: false });
    }
  });

  enterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      session.enter();
    });
  });
  exitButton.addEventListener('click', () => {
    session.exit();
  });

  document.querySelector('[data-open-uchiwa]')?.addEventListener('click', (event) => {
    event.preventDefault();
    const hash = encodeShareHash({ ...state, mode: 'uchiwa' });
    window.location.assign(`/uchiwa-moji/#${hash}`);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      motion?.pause();
      blink?.pause();
    } else {
      motion?.play();
      blink?.play();
    }
  });

  window.addEventListener('hashchange', () => {
    const next = stateFromHash(decodeShareHash(window.location.hash));
    if (!next) return;
    state = next;
    source = 'share';
    document.querySelector('[data-share-banner]').hidden = false;
    track('share_link_open', { tool: 'led-banner', channel: 'url' });
    render();
  });

  syncSticky = bindStickyPreview(stage, {
    controls: root.querySelector('.led-controls'),
    isSuppressed: () => stage.classList.contains('is-open'),
    onChange() {
      scheduleFit();
    }
  }).sync;

  window.addEventListener('resize', scheduleFit);
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.addEventListener?.('change', () => render());

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/led-banner/sw.js', { scope: '/led-banner/' }).catch(() => {});
  }

  paintSaved();
  render();
  ensureFont().then(scheduleFit);
}

boot();
