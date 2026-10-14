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
    light: 'solid'
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
    speed: clamp(source.speed, 1, 5, base.speed),
    gap: Math.round(clamp(source.gap, 0, 80, base.gap)),
    blinkHz: clampBlinkHz(source.blinkHz),
    light: source.light === 'gradient' ? 'gradient' : 'solid'
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

export function speedPxPerSec(level) {
  const table = { 1: 36, 2: 64, 3: 104, 4: 156, 5: 220 };
  return table[clamp(level, 1, 5, 3)] || table[3];
}

export function marqueeDurationMs(distancePx, speedLevel, reduced) {
  const distance = Math.max(1, Number(distancePx) || 1);
  const rate = speedPxPerSec(speedLevel) * (reduced ? 0.45 : 1);
  return Math.max(1200, Math.round((distance / rate) * 1000));
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

export function fitScrollFontPx(crossPx) {
  return Math.max(28, Math.round(Math.max(0, crossPx) * 0.6));
}

export function staticScale(textWidth, textHeight, limitWidth, limitHeight) {
  if (!textWidth || !textHeight || !limitWidth || !limitHeight) return 1;
  return Math.min(1, limitWidth / textWidth, limitHeight / textHeight);
}

export function gapPx(gap, alongPx) {
  return Math.round(Math.max(0, alongPx) * (clamp(gap, 0, 80, 16) / 100));
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
    light: next.light
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
