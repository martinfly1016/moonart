export const TOOL_SLUG = 'uchiwa-moji';
export const MEMBER_STORAGE_KEY = 'mojimoon.oshi.members.v1';
export const TEXT_LIMIT = 40;
export const MEMBER_LIMIT = 10;

export const MEMBER_COLORS = [
  { name: 'レッド', value: '#e23b3b' },
  { name: 'ピンク', value: '#ff4d88' },
  { name: 'ローズ', value: '#e85a9b' },
  { name: 'オレンジ', value: '#f58220' },
  { name: 'イエロー', value: '#f5c518' },
  { name: 'グリーン', value: '#2fad5b' },
  { name: 'ミント', value: '#3dcdb8' },
  { name: 'スカイ', value: '#3aa0e8' },
  { name: 'ブルー', value: '#3a5bdb' },
  { name: 'パープル', value: '#8a4ad8' },
  { name: 'ホワイト', value: '#ffffff' },
  { name: 'ブラック', value: '#1a1a1a' }
];

export const FAN_PRESETS = {
  regular: { w: 243, h: 215, label: 'レギュラー' },
  jumbo: { w: 295, h: 285, label: 'ジャンボ' }
};

export const PAPERS = {
  A4: { id: 'A4', w: 210, h: 297, pxW: 2480, pxH: 3508 },
  A3: { id: 'A3', w: 297, h: 420, pxW: 3508, pxH: 4961 }
};

export const FONTS = {
  dela: {
    id: 'dela',
    label: '太字',
    family: '"Uchiwa Dela Gothic One"',
    weight: 400,
    displayName: 'Dela Gothic One',
    license: 'SIL Open Font License',
    licenseHref: '/assets/fonts/uchiwa/DelaGothicOne-OFL.txt'
  },
  rounded: {
    id: 'rounded',
    label: '丸文字',
    family: '"Uchiwa Rounded"',
    weight: 700,
    displayName: 'M PLUS Rounded 1c',
    license: 'SIL Open Font License',
    licenseHref: '/assets/fonts/uchiwa/MPLUSRounded1c-OFL.txt'
  }
};

export function defaultState() {
  return {
    v: 1,
    mode: 'uchiwa',
    text: '大好き',
    font: 'dela',
    writing: 'vertical',
    fill: '#ff4d88',
    fill2: '',
    rainbow: false,
    strokes: [{ color: '#ffffff', width: 3.2 }],
    layout: 'single',
    perFan: 1,
    size: 'jumbo',
    customW: 295,
    customH: 285,
    paper: 'A3',
    speed: 3,
    effect: 'still',
    direction: 'left',
    blinkHz: 0,
    bg: '#1a1a1a',
    gap: 16,
    light: 'solid'
  };
}

export function codePoints(value) {
  return Array.from(value || '');
}

export function clampText(value) {
  return codePoints(value).slice(0, TEXT_LIMIT).join('');
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeColor(value, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value.toLowerCase() : fallback;
}

function round1(value) {
  return Math.round(Number(value) * 10) / 10;
}

export function fanSizeMm(state) {
  if (state.size === 'custom') {
    return {
      w: clamp(state.customW, 80, 420, FAN_PRESETS.jumbo.w),
      h: clamp(state.customH, 80, 420, FAN_PRESETS.jumbo.h)
    };
  }
  return FAN_PRESETS[state.size] || FAN_PRESETS.jumbo;
}

export function splitFans(text, layout, perFan) {
  const normalized = `${text || ''}`.normalize('NFC');
  if (layout !== 'renketsu') return [normalized];
  const chars = codePoints(normalized).filter((char) => !/\s/u.test(char));
  const size = perFan === 2 ? 2 : 1;
  const fans = [];
  for (let index = 0; index < chars.length; index += size) {
    fans.push(chars.slice(index, index + size).join(''));
  }
  return fans.length ? fans : [''];
}

export function planPaperPages(fan, paper) {
  if (fan.w <= paper.w && fan.h <= paper.h) {
    const originX = (paper.w - fan.w) / 2;
    const originY = (paper.h - fan.h) / 2;
    return [{
      single: true,
      tight: originX < 6 || originY < 6,
      originX,
      originY,
      col: 0,
      row: 0,
      cols: 1,
      rows: 1
    }];
  }
  const margin = 10;
  const cellW = paper.w - margin * 2;
  const cellH = paper.h - margin * 2;
  const cols = Math.max(1, Math.ceil(fan.w / cellW));
  const rows = Math.max(1, Math.ceil(fan.h / cellH));
  const pages = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      pages.push({
        tiled: true,
        margin,
        cellW,
        cellH,
        windowX: col * cellW,
        windowY: row * cellH,
        col,
        row,
        cols,
        rows
      });
    }
  }
  return pages;
}

export function compactState(state) {
  const source = { ...defaultState(), ...state };
  const result = {
    v: 1,
    m: source.mode === 'penlight' ? 'p' : source.mode === 'banner' ? 'b' : 'u',
    t: clampText(source.text),
    f: source.font === 'rounded' ? 'r' : 'd',
    w: source.writing === 'horizontal' ? 'h' : 'v',
    c: normalizeColor(source.fill, '#ff4d88'),
    c2: normalizeColor(source.fill2, ''),
    rb: source.rainbow ? 1 : 0,
    s: (source.strokes || []).slice(0, 3).map((stroke) => [
      normalizeColor(stroke.color, '#ffffff'),
      round1(clamp(stroke.width, 0.6, 8, 3.2))
    ]),
    l: source.layout === 'renketsu' ? 'r' : 's',
    n: source.perFan === 2 ? 2 : 1,
    z: source.size === 'regular' ? 'r' : source.size === 'custom' ? 'c' : 'j',
    mm: [
      round1(clamp(source.customW, 80, 420, 295)),
      round1(clamp(source.customH, 80, 420, 285))
    ],
    p: source.paper === 'A4' ? 'A4' : 'A3',
    sp: clamp(source.speed, 1, 5, 3),
    ef: ['still', 'scroll', 'blink', 'rainbow'].includes(source.effect) ? source.effect : 'still',
    dir: ['left', 'right', 'up', 'down'].includes(source.direction) ? source.direction : 'left',
    bk: round1(clamp(source.blinkHz, 0, 3, 0)),
    bg: normalizeColor(source.bg, '#1a1a1a'),
    gp: Math.round(clamp(source.gap, 0, 80, 16)),
    lt: source.light === 'gradient' ? 'g' : 's'
  };
  if (source.mode === 'banner' || source.mode === 'penlight') {
    const scale = Number(source.scale);
    result.sz = Number.isFinite(scale) ? Math.round(Math.min(100, Math.max(60, scale))) : 95;
  }
  return result;
}

export function expandState(data) {
  if (!data || data.v !== 1) return null;
  const base = defaultState();
  const mode = data.m === 'p' ? 'penlight' : data.m === 'b' ? 'banner' : 'uchiwa';
  const strokes = Array.isArray(data.s) && data.s.length
    ? data.s.slice(0, 3).map((stroke) => ({
      color: normalizeColor(stroke?.[0], '#ffffff'),
      width: clamp(stroke?.[1], 0.6, 8, 3.2)
    }))
    : base.strokes;
  return {
    ...base,
    mode,
    text: clampText(typeof data.t === 'string' ? data.t : base.text),
    font: data.f === 'r' ? 'rounded' : 'dela',
    writing: data.w === 'h' ? 'horizontal' : 'vertical',
    fill: normalizeColor(data.c, base.fill),
    fill2: normalizeColor(data.c2, ''),
    rainbow: data.rb === 1,
    strokes,
    layout: data.l === 'r' ? 'renketsu' : 'single',
    perFan: data.n === 2 ? 2 : 1,
    size: data.z === 'r' ? 'regular' : data.z === 'c' ? 'custom' : 'jumbo',
    customW: clamp(data.mm?.[0], 80, 420, base.customW),
    customH: clamp(data.mm?.[1], 80, 420, base.customH),
    paper: data.p === 'A4' ? 'A4' : 'A3',
    speed: clamp(data.sp, 1, 5, 3),
    effect: ['still', 'scroll', 'blink', 'rainbow'].includes(data.ef) ? data.ef : 'still',
    direction: ['left', 'right', 'up', 'down'].includes(data.dir) ? data.dir : 'left',
    blinkHz: clamp(data.bk, 0, 3, 0),
    bg: normalizeColor(data.bg, base.bg),
    gap: Math.round(clamp(data.gp, 0, 80, base.gap)),
    light: data.lt === 'g' ? 'gradient' : 'solid',
    scale: Number.isFinite(Number(data.sz)) ? Number(data.sz) : 95
  };
}

function bytesToBase64Url(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function encodeShareHash(state) {
  const json = JSON.stringify(compactState(state));
  return bytesToBase64Url(new TextEncoder().encode(json));
}

export function decodeShareHash(hash) {
  const raw = `${hash || ''}`.replace(/^#/, '').trim();
  if (!raw) return null;
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(raw));
    return expandState(JSON.parse(json));
  } catch (error) {
    return null;
  }
}

export function loadMembers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MEMBER_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((member) => member && typeof member.name === 'string' && /^#[0-9a-fA-F]{6}$/.test(member.color || '')).slice(0, MEMBER_LIMIT).map((member) => ({
      name: clampText(member.name),
      color: member.color.toLowerCase()
    })).filter((member) => member.name);
  } catch (error) {
    return [];
  }
}

export function saveMembers(members) {
  const next = (members || []).slice(0, MEMBER_LIMIT);
  localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function detectOs() {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  if (/iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Win/.test(ua)) return 'windows';
  if (/Mac/.test(ua)) return 'mac';
  if (/Linux/.test(ua)) return 'linux';
  return 'other';
}

export function isIosDevice() {
  return detectOs() === 'ios';
}

export function isInAppBrowser() {
  const ua = navigator.userAgent || '';
  return /Line\/|Twitter|Instagram|FBAN|FBAV|MicroMessenger|\bX\//i.test(ua);
}

export function trackToolEvent(name, params = {}) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, {
    tool_slug: TOOL_SLUG,
    page_path: window.location.pathname,
    page_location: window.location.origin + window.location.pathname,
    ...params
  });
}

export function colorName(value) {
  const found = MEMBER_COLORS.find((color) => color.value.toLowerCase() === `${value || ''}`.toLowerCase());
  return found ? found.name : 'カスタム';
}
