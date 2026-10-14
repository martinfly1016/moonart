import { MEMBER_COLORS, clampText } from './oshi-settings.js';

export const RECENT_KEY = 'mojimoon.led.recent.v1';
export const FAVORITE_KEY = 'mojimoon.led.favorites.v1';
export const PHOTO_KEY = 'mojimoon.led.photo.v1';
export const RECENT_LIMIT = 8;
export const FAVORITE_LIMIT = 12;

export const PHRASES = [
  { group: 'ファンサ', text: 'ピースして' },
  { group: 'ファンサ', text: '指ハート' },
  { group: 'ファンサ', text: '手ふって' },
  { group: 'ファンサ', text: 'ウインクして' },
  { group: 'ファンサ', text: 'バーンして' },
  { group: '愛', text: 'だいすき' },
  { group: '愛', text: '一生推す' },
  { group: 'アピール', text: '初参戦' },
  { group: 'アピール', text: '誕生日おめでとう' },
  { group: 'アピール', text: '遠征' }
];

export const KAOMOJI = [
  '(♡´▽`♡)',
  '(ﾉ´∀`)ﾉ',
  '＼(^o^)／',
  '(*´꒳`*)',
  '(๑˃̵ᴗ˂̵)و',
  '♡(>ᴗ<)♡',
  '٩(ˊᗜˋ*)و',
  '(｡♥‿♥｡)'
];

const EMOJI_RE = /(?:\p{Extended_Pictographic})(?:\uFE0F|\uFE0E)?(?:\p{Emoji_Modifier})?(?:\u200D(?:\p{Extended_Pictographic})(?:\uFE0F|\uFE0E)?(?:\p{Emoji_Modifier})?)*/gu;

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function colorOr(value, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value.toLowerCase() : fallback;
}

export function bannerDefaults() {
  return {
    v: 1,
    mode: 'banner',
    text: '大好き',
    font: 'dela',
    fill: '#ff4d88',
    fill2: '#7a5cff',
    bg: '#1a1a1a',
    effect: 'scroll',
    direction: 'left',
    speed: 3,
    gap: 16,
    blinkHz: 1,
    light: 'solid',
    scale: 95
  };
}

export function clampBlinkHz(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  const stepped = Math.round(number * 2) / 2;
  return Math.min(3, Math.max(0.5, stepped));
}

export function normalizeBanner(input = {}) {
  const base = bannerDefaults();
  const source = { ...base, ...input };
  const effect = ['scroll', 'still', 'blink'].includes(source.effect) ? source.effect : base.effect;
  return {
    ...base,
    mode: source.mode === 'penlight' ? 'penlight' : 'banner',
    text: clampText(typeof source.text === 'string' ? source.text : base.text),
    font: source.font === 'rounded' ? 'rounded' : 'dela',
    fill: colorOr(source.fill, base.fill),
    fill2: colorOr(source.fill2, base.fill2),
    bg: colorOr(source.bg, base.bg),
    effect,
    direction: ['left', 'right', 'up', 'down'].includes(source.direction) ? source.direction : 'left',
    speed: clamp(source.speed, SPEED_MIN, SPEED_MAX, base.speed),
    gap: Math.round(clamp(source.gap, 0, 80, base.gap)),
    blinkHz: clampBlinkHz(source.blinkHz),
    light: source.light === 'gradient' ? 'gradient' : 'solid',
    scale: clampTextScale(source.scale)
  };
}

export function stateFromHash(decoded) {
  if (!decoded) return null;
  const effect = ['scroll', 'still', 'blink'].includes(decoded.effect) ? decoded.effect : 'scroll';
  return normalizeBanner({
    ...decoded,
    mode: decoded.mode === 'penlight' ? 'penlight' : 'banner',
    effect
  });
}

export function splitEmoji(value) {
  const text = `${value || ''}`;
  if (!text) return [];
  const parts = [];
  let cursor = 0;
  for (const match of text.matchAll(EMOJI_RE)) {
    const index = match.index || 0;
    if (index > cursor) parts.push({ emoji: false, value: text.slice(cursor, index) });
    parts.push({ emoji: true, value: match[0] });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) parts.push({ emoji: false, value: text.slice(cursor) });
  return parts;
}

export const SPEED_MIN = 1;
export const SPEED_MAX = 10;
export const SPEED_DEFAULT = 3;

// Character-heights per second. Levels 1–5 match the old pixel speeds on a
// 136px preview. Level 10 is twice that old top, so the slider maximum is
// twice as fast and the same level feels the same at any text size.
const HEIGHTS_PER_SEC = {
  1: 0.265,
  2: 0.471,
  3: 0.765,
  4: 1.147,
  5: 1.618,
  6: 1.942,
  7: 2.265,
  8: 2.589,
  9: 2.912,
  10: 3.236
};

export function speedHeightsPerSec(level) {
  const index = clamp(level, SPEED_MIN, SPEED_MAX, SPEED_DEFAULT);
  return HEIGHTS_PER_SEC[index] || HEIGHTS_PER_SEC[SPEED_DEFAULT];
}

export function speedPxPerSec(level, textHeightPx = 136) {
  const height = Math.max(28, Number(textHeightPx) || 136);
  return speedHeightsPerSec(level) * height;
}

export function marqueeDurationMs(distancePx, speedLevel, reduced, textHeightPx) {
  const distance = Math.max(1, Number(distancePx) || 1);
  const rate = speedPxPerSec(speedLevel, textHeightPx) * (reduced ? 0.45 : 1);
  return Math.max(400, Math.round((distance / rate) * 1000));
}

export function marqueeKeyframes(direction) {
  const vertical = direction === 'up' || direction === 'down';
  const reverse = direction === 'right' || direction === 'down';
  const from = reverse ? '-50%' : '0px';
  const to = reverse ? '0px' : '-50%';
  const start = vertical ? `translate3d(0, ${from}, 0)` : `translate3d(${from}, 0, 0)`;
  const end = vertical ? `translate3d(0, ${to}, 0)` : `translate3d(${to}, 0, 0)`;
  return [{ transform: start }, { transform: end }];
}

export function blinkDurationMs(hz) {
  return Math.round(1000 / clampBlinkHz(hz));
}

export function durationBucket(seconds) {
  const value = Number(seconds) || 0;
  if (value < 10) return '0-10';
  if (value < 30) return '10-30';
  if (value < 60) return '30-60';
  if (value < 180) return '60-180';
  return '180+';
}

export const TEXT_FILL_MIN = 60;
export const TEXT_FILL_MAX = 100;
export const TEXT_FILL_DEFAULT = 95;

export function clampTextScale(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return TEXT_FILL_DEFAULT;
  return Math.round(Math.min(TEXT_FILL_MAX, Math.max(TEXT_FILL_MIN, number)));
}

// font-size is the em box. CJK display fonts leave empty space inside it,
// so the em has to be taller than the board for the ink to fill it.
export function fontPxForInk(crossPx, scalePercent, inkPerEm) {
  const cross = Math.max(0, Number(crossPx) || 0);
  const fill = clampTextScale(scalePercent) / 100;
  const ink = Number(inkPerEm);
  const perEm = ink > 0.2 && ink < 2.5 ? ink : 1;
  return Math.max(28, Math.round((cross * fill) / perEm));
}

export function shrinkToWidth(fontPx, textWidth, limitWidth) {
  const size = Number(fontPx) || 0;
  const width = Number(textWidth) || 0;
  const limit = Number(limitWidth) || 0;
  if (!size || !width || !limit || width <= limit) return Math.max(22, Math.round(size));
  return Math.max(22, Math.floor(size * (limit / width)));
}

export function staticScale(textWidth, textHeight, limitWidth, limitHeight) {
  if (!textWidth || !textHeight || !limitWidth || !limitHeight) return 1;
  return Math.min(1, limitWidth / textWidth, limitHeight / textHeight);
}

export function gapPx(gap, alongPx) {
  return Math.round(Math.max(0, alongPx) * (clamp(gap, 0, 80, 16) / 100));
}

// One plan for the editor preview and the fullscreen board. Pixel sizes follow
// the board that is on screen; speed, gap ratio, and colors come from state.
export function presentationFor(state, box = {}) {
  const next = normalizeBanner(state);
  const text = next.text.trim();
  const scrolling = next.mode === 'banner' && next.effect === 'scroll' && Boolean(text);
  const vertical = scrolling && (next.direction === 'up' || next.direction === 'down');
  const width = Math.max(0, Number(box.width) || 0);
  const height = Math.max(0, Number(box.height) || 0);
  const along = vertical ? height : width;
  const reduced = Boolean(box.reduced);
  let fontPx = 0;
  if (next.mode === 'penlight') {
    const base = Math.max(28, Math.round(Math.min(width, height) * 0.22));
    if (box.textWidth && box.textHeight && width && height) {
      const scale = staticScale(box.textWidth, box.textHeight, width * 0.9, height * 0.42);
      fontPx = Math.max(22, Math.floor(base * scale));
    } else {
      fontPx = base;
    }
  } else if (width && height) {
    fontPx = fontPxForInk(height, next.scale, box.inkPerEm || 1);
    if (!scrolling && box.textWidth) fontPx = shrinkToWidth(fontPx, box.textWidth, width * 0.92);
  }
  const distance = Math.max(0, Number(box.distance) || 0);
  const shown = text || '文字を入力';
  const parts = splitEmoji(shown);
  return {
    mode: next.mode,
    effect: next.effect,
    direction: next.direction,
    text: shown,
    parts: parts.length ? parts : [{ emoji: false, value: shown }],
    font: next.font,
    fill: next.fill,
    fill2: next.fill2,
    bg: next.bg,
    light: next.light,
    scale: next.scale,
    speed: next.speed,
    gapSetting: next.gap,
    gap: scrolling ? gapPx(next.gap, along) : 0,
    fontPx,
    shift: Math.round(-(Number(box.offsetEm) || 0) * fontPx),
    vertical,
    copies: scrolling ? 2 : 1,
    duration: scrolling && distance ? marqueeDurationMs(distance, next.speed, reduced, fontPx || undefined) : 0,
    blink: next.mode === 'banner' && next.effect === 'blink' && !reduced ? blinkDurationMs(next.blinkHz) : 0,
    keyframes: scrolling ? marqueeKeyframes(next.direction) : null,
    background: next.mode === 'penlight'
      ? (next.light === 'gradient'
        ? `linear-gradient(115deg, ${next.fill} 0%, ${next.fill2} 100%)`
        : next.fill)
      : next.bg,
    ink: next.mode === 'penlight' ? inkFor(next.fill) : next.fill
  };
}

// Speed, gap, and board size retune the running animation. Direction, effect,
// and mode replace it, because the keyframes themselves change.
export function motionNeedsRestart(current, next) {
  if (!current || !next) return true;
  return current.mode !== next.mode
    || current.effect !== next.effect
    || current.direction !== next.direction
    || Boolean(current.duration) !== Boolean(next.duration)
    || Boolean(current.blink) !== Boolean(next.blink);
}

function channel(hex) {
  const value = Number.parseInt(hex, 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function luminance(color) {
  const hex = colorOr(color, '#000000').slice(1);
  const r = channel(hex.slice(0, 2));
  const g = channel(hex.slice(2, 4));
  const b = channel(hex.slice(4, 6));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function inkFor(color) {
  return luminance(color) > 0.45 ? '#1a1a1a' : '#ffffff';
}

export function contrastLow(fore, back) {
  const lighter = Math.max(luminance(fore), luminance(back));
  const darker = Math.min(luminance(fore), luminance(back));
  return (lighter + 0.05) / (darker + 0.05) < 2;
}

export function stepColor(current, delta) {
  const colors = MEMBER_COLORS.map((item) => item.value.toLowerCase());
  const index = colors.indexOf(colorOr(current, colors[0]));
  const start = index < 0 ? 0 : index;
  return colors[(start + delta + colors.length) % colors.length];
}

function readList(storage, key) {
  try {
    const parsed = JSON.parse(storage.getItem(key) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => normalizeBanner(item)).filter((item) => item.text);
  } catch (error) {
    return [];
  }
}

function snapshot(state) {
  const next = normalizeBanner(state);
  return {
    text: next.text,
    font: next.font,
    fill: next.fill,
    fill2: next.fill2,
    bg: next.bg,
    effect: next.effect,
    direction: next.direction,
    speed: next.speed,
    gap: next.gap,
    blinkHz: next.blinkHz,
    mode: next.mode,
    light: next.light,
    scale: next.scale
  };
}

export function loadRecent(storage) {
  return readList(storage, RECENT_KEY).slice(0, RECENT_LIMIT);
}

export function loadFavorites(storage) {
  return readList(storage, FAVORITE_KEY).slice(0, FAVORITE_LIMIT);
}

export function pushRecent(storage, state) {
  const next = snapshot(state);
  if (!next.text) return loadRecent(storage);
  const items = [next, ...loadRecent(storage).filter((item) => item.text !== next.text)].slice(0, RECENT_LIMIT);
  storage.setItem(RECENT_KEY, JSON.stringify(items));
  return items;
}

export function toggleFavorite(storage, state) {
  const next = snapshot(state);
  const current = loadFavorites(storage);
  const exists = current.some((item) => item.text === next.text && item.mode === next.mode);
  const items = exists
    ? current.filter((item) => !(item.text === next.text && item.mode === next.mode))
    : [next, ...current].slice(0, FAVORITE_LIMIT);
  storage.setItem(FAVORITE_KEY, JSON.stringify(items));
  return { items, added: !exists };
}

export function hasPhotoAck(storage) {
  return storage.getItem(PHOTO_KEY) === '1';
}

export function acknowledgePhoto(storage) {
  storage.setItem(PHOTO_KEY, '1');
}
