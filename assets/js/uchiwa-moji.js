import {
  FAN_PRESETS,
  FONTS,
  MEMBER_LIMIT,
  PAPERS,
  clampText,
  codePoints,
  colorName,
  decodeShareHash,
  defaultState,
  detectOs,
  encodeShareHash,
  fanSizeMm,
  isInAppBrowser,
  isIosDevice,
  loadMembers,
  planPaperPages,
  saveMembers,
  splitFans,
  trackToolEvent
} from './oshi-settings.js';
import {
  a3FallbackSlices,
  buildPng,
  deflateZlib,
  encodeRgbaPng,
  exceedsCanvasLimit,
  insertPhysChunk,
  tileSpans
} from './png-phys.js';

const root = document.querySelector('[data-uchiwa]');
const preview = root.querySelector('[data-preview]');
const textInput = root.querySelector('[data-text]');
const countNode = root.querySelector('[data-count]');
const colorNameNode = root.querySelector('[data-color-name]');
const memberList = root.querySelector('[data-members]');
const statusNode = root.querySelector('[data-export-status]');
const shareDialog = document.querySelector('[data-share-dialog]');
const shareSummary = document.querySelector('[data-share-summary]');
const toast = document.querySelector('[data-toast]');
const previewCtx = preview.getContext('2d');

let state = defaultState();
let members = [];
let drawing = false;
let toastTimer = 0;

function fontCss(fontId, size) {
  const font = FONTS[fontId] || FONTS.dela;
  return `${font.weight} ${size}px ${font.family}, "Hiragino Sans", "Hiragino Maru Gothic ProN", "Noto Sans JP", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
}

function roundedPath(ctx, x, y, w, h) {
  const radius = Math.min(w, h) * 0.22;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  const r = Math.min(radius, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeFill(ctx, x, y, w, h, fan) {
  if (fan.rainbow) {
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    ['#ff4d4d', '#ff9f1a', '#ffe14a', '#3dcb6e', '#3aa0e8', '#7a5cff', '#ff4d88'].forEach((color, index, list) => {
      gradient.addColorStop(index / (list.length - 1), color);
    });
    return gradient;
  }
  if (fan.fill2) {
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, fan.fill);
    gradient.addColorStop(1, fan.fill2);
    return gradient;
  }
  return fan.fill;
}

function paintGlyph(ctx, glyph, x, y, fillStyle, strokes, fanWpx, fanWmm) {
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.lineCap = 'round';
  const ordered = strokes.slice().sort((a, b) => b.width - a.width);
  ordered.forEach((stroke) => {
    ctx.lineWidth = Math.max(1, stroke.width * (fanWpx / fanWmm));
    ctx.strokeStyle = stroke.color;
    ctx.strokeText(glyph, x, y);
  });
  ctx.fillStyle = fillStyle;
  ctx.fillText(glyph, x, y);
}

function verticalOptions(text) {
  if (text.includes('\n')) {
    const columns = text.split('\n').map((line) => codePoints(line)).filter((line) => line.length);
    return columns.length ? [columns] : [[[' ']]];
  }
  const chars = codePoints(text);
  if (!chars.length) return [[[' ']]];
  const options = [];
  const maxCols = Math.min(4, chars.length);
  for (let cols = 1; cols <= maxCols; cols += 1) {
    const per = Math.ceil(chars.length / cols);
    const columns = [];
    for (let index = 0; index < cols; index += 1) {
      const slice = chars.slice(index * per, (index + 1) * per);
      if (slice.length) columns.push(slice);
    }
    options.push(columns);
  }
  return options;
}

function fitVertical(ctx, text, inner, fan) {
  let best = null;
  verticalOptions(text).forEach((columns) => {
    let low = 8;
    let high = inner.h;
    let chosen = 8;
    for (let step = 0; step < 14; step += 1) {
      const size = (low + high) / 2;
      ctx.font = fontCss(fan.font, size);
      const blockW = columns.length * size * 1.08;
      const blockH = Math.max(...columns.map((column) => column.length)) * size * 1.08;
      if (blockW <= inner.w && blockH <= inner.h) {
        chosen = size;
        low = size;
      } else {
        high = size;
      }
    }
    if (!best || chosen > best.size) best = { size: chosen, columns: columns.slice().reverse() };
  });
  return best;
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  `${text}`.split('\n').forEach((part) => {
    let line = '';
    codePoints(part).forEach((char) => {
      const next = line + char;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = next;
      }
    });
    lines.push(line);
  });
  return lines.length ? lines : [''];
}

function fitHorizontal(ctx, text, inner, fan) {
  let low = 8;
  let high = inner.h;
  let chosen = { size: 12, lines: [text], lineHeight: 16 };
  for (let step = 0; step < 14; step += 1) {
    const size = (low + high) / 2;
    ctx.font = fontCss(fan.font, size);
    const lines = wrapText(ctx, text, inner.w);
    const lineHeight = size * 1.18;
    const width = Math.max(...lines.map((line) => ctx.measureText(line || ' ').width), 0);
    const height = lines.length * lineHeight;
    if (width <= inner.w && height <= inner.h) {
      chosen = { size, lines, lineHeight };
      low = size;
    } else {
      high = size;
    }
  }
  return chosen;
}

export function drawFanFace(ctx, x, y, w, h, fan, options = {}) {
  ctx.save();
  roundedPath(ctx, x, y, w, h);
  ctx.fillStyle = '#fffefb';
  ctx.fill();
  ctx.lineWidth = Math.max(2, w * (options.showCut ? 0.004 : 0.008));
  ctx.strokeStyle = options.showCut ? '#64748b' : 'rgba(23, 32, 51, 0.16)';
  ctx.setLineDash(options.showCut ? [Math.max(10, w * 0.018), Math.max(7, w * 0.012)] : []);
  ctx.stroke();
  ctx.setLineDash([]);

  const padX = w * 0.13;
  const padY = h * 0.12;
  const inner = { x: x + padX, y: y + padY, w: w - padX * 2, h: h - padY * 2 };
  const text = fan.text && fan.text.trim() ? fan.text : (options.placeholder ? 'なまえ' : '');
  if (!text) {
    ctx.restore();
    return;
  }
  const fillStyle = options.placeholder ? '#d5dbe8' : makeFill(ctx, x, y, w, h, fan);
  const strokes = options.placeholder ? [] : (fan.strokes || []);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (fan.writing === 'horizontal') {
    const fitted = fitHorizontal(ctx, text, inner, fan);
    ctx.font = fontCss(fan.font, fitted.size);
    const blockH = fitted.lines.length * fitted.lineHeight;
    fitted.lines.forEach((line, index) => {
      const baseline = inner.y + (inner.h - blockH) / 2 + fitted.lineHeight * index + fitted.lineHeight / 2;
      paintGlyph(ctx, line || ' ', inner.x + inner.w / 2, baseline, fillStyle, strokes, w, fan.fanWidthMm);
    });
  } else {
    const fitted = fitVertical(ctx, text, inner, fan);
    ctx.font = fontCss(fan.font, fitted.size);
    const colW = fitted.size * 1.08;
    const blockW = fitted.columns.length * colW;
    const startX = inner.x + (inner.w - blockW) / 2 + colW / 2;
    fitted.columns.forEach((column, colIndex) => {
      const blockH = column.length * fitted.size * 1.08;
      const startY = inner.y + (inner.h - blockH) / 2 + fitted.size * 0.54;
      column.forEach((char, row) => {
        paintGlyph(ctx, char, startX + colIndex * colW, startY + row * fitted.size * 1.08, fillStyle, strokes, w, fan.fanWidthMm);
      });
    });
  }
  ctx.restore();
}

function drawHandle(ctx, x, y, w, h) {
  const handleW = w * 0.11;
  const handleH = h * 0.16;
  const hx = x + (w - handleW) / 2;
  const hy = y + h - 1;
  ctx.save();
  ctx.fillStyle = '#f0c9a0';
  ctx.fillRect(hx, hy, handleW, handleH);
  ctx.restore();
  return handleH;
}

function drawBadge(ctx, x, y, label) {
  ctx.save();
  ctx.font = '700 13px sans-serif';
  ctx.fillStyle = '#172033';
  ctx.beginPath();
  ctx.arc(x + 12, y + 12, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#d7deee';
  ctx.stroke();
  ctx.fillStyle = '#172033';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(label), x + 12, y + 13);
  ctx.restore();
}

function drawCropMarks(ctx, x, y, w, h) {
  const len = Math.max(18, Math.min(w, h) * 0.035);
  ctx.save();
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 3;
  [[x, y, -1, -1], [x + w, y, 1, -1], [x, y + h, -1, 1], [x + w, y + h, 1, 1]].forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * 8, cy);
    ctx.lineTo(cx + dx * len, cy);
    ctx.moveTo(cx, cy + dy * 8);
    ctx.lineTo(cx, cy + dy * len);
    ctx.stroke();
  });
  ctx.restore();
}

function pageLabel(page, fanIndex, fanCount) {
  const parts = [];
  if (fanCount > 1) parts.push(`うちわ ${fanIndex + 1}/${fanCount}`);
  if (page.rows * page.cols > 1) parts.push(`${page.row * page.cols + page.col + 1}/${page.rows * page.cols}`);
  return parts.join(' · ');
}

function drawExportPage(ctx, paper, page, fanSpec, fanIndex, fanCount) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, paper.pxW, paper.pxH);
  const sx = paper.pxW / paper.w;
  const sy = paper.pxH / paper.h;
  if (page.tiled) {
    const ox = page.margin * sx;
    const oy = page.margin * sy;
    const cellW = page.cellW * sx;
    const cellH = page.cellH * sy;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, cellW, cellH);
    ctx.clip();
    ctx.translate(ox - page.windowX * sx, oy - page.windowY * sy);
    drawFanFace(ctx, 0, 0, fanSpec.mm.w * sx, fanSpec.mm.h * sy, fanSpec, { showCut: true });
    ctx.restore();
    drawCropMarks(ctx, ox, oy, cellW, cellH);
  } else {
    drawFanFace(
      ctx,
      page.originX * sx,
      page.originY * sy,
      fanSpec.mm.w * sx,
      fanSpec.mm.h * sy,
      fanSpec,
      { showCut: true }
    );
  }
  const label = pageLabel(page, fanIndex, fanCount);
  if (label) {
    ctx.fillStyle = '#334155';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, paper.pxW / 2, paper.pxH - 28);
  }
  ctx.restore();
}

function schedulePreview() {
  if (drawing) return;
  drawing = true;
  window.requestAnimationFrame(() => {
    drawing = false;
    drawPreview();
  });
}

function previewBudget() {
  const stage = preview.parentElement;
  const width = stage.clientWidth || stage.getBoundingClientRect().width || 280;
  const compact = window.innerWidth < 960;
  const maxHeight = compact ? Math.min(250, Math.round(window.innerHeight * 0.32)) : 480;
  return { width: Math.max(120, width), maxHeight };
}

function drawPreview() {
  const stage = preview.parentElement;
  const fans = splitFans(state.text, state.layout, state.perFan);
  const mm = fanSizeMm(state);
  const gap = 12;
  const budget = previewBudget();
  const columns = Math.max(1, fans.length);
  const handleRatio = 0.14;
  let fanW = columns === 1
    ? budget.width
    : Math.min(150, (budget.width - gap * (columns - 1)) / columns);
  let fanH = fanW * (mm.h / mm.w);
  const totalH = fanH * (1 + handleRatio);
  if (totalH > budget.maxHeight) {
    const scale = budget.maxHeight / totalH;
    fanW *= scale;
    fanH *= scale;
  }
  const cssW = columns * fanW + (columns - 1) * gap;
  const cssH = fanH * (1 + handleRatio);
  stage.style.justifyContent = cssW <= budget.width + 1 ? 'center' : 'flex-start';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  preview.style.width = `${cssW}px`;
  preview.style.height = `${cssH}px`;
  preview.width = Math.max(1, Math.round(cssW * dpr));
  preview.height = Math.max(1, Math.round(cssH * dpr));
  previewCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  previewCtx.clearRect(0, 0, cssW, cssH);
  fans.forEach((text, index) => {
    const x = index * (fanW + gap);
    const fan = {
      ...state,
      text,
      fanWidthMm: mm.w
    };
    drawFanFace(previewCtx, x, 0, fanW, fanH, fan, { placeholder: !text.trim() });
    drawHandle(previewCtx, x, 0, fanW, fanH);
    if (fans.length > 1) drawBadge(previewCtx, x + 8, 8, index + 1);
  });
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1800);
}

function setStatus(message) {
  if (statusNode) statusNode.textContent = message || '';
}

function isLight(hex) {
  const value = `${hex || ''}`.replace('#', '');
  if (value.length !== 6) return false;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return ((r * 299) + (g * 587) + (b * 114)) / 1000 > 206;
}

function syncControls() {
  if (textInput.value !== state.text) {
    const caret = textInput.selectionStart ?? state.text.length;
    textInput.value = state.text;
    if (document.activeElement === textInput) {
      const next = Math.min(caret, state.text.length);
      textInput.setSelectionRange(next, next);
    }
  }
  countNode.textContent = `${codePoints(state.text).length}/40`;
  colorNameNode.textContent = state.rainbow ? '虹' : colorName(state.fill);
  root.querySelectorAll('[data-font]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.font === state.font));
  });
  root.querySelectorAll('[data-fill]').forEach((button) => {
    button.setAttribute('aria-pressed', String(!state.rainbow && button.dataset.fill.toLowerCase() === state.fill));
  });
  root.querySelector('[data-rainbow]').setAttribute('aria-pressed', String(state.rainbow));
  root.querySelectorAll('[data-writing]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.writing === state.writing));
  });
  root.querySelectorAll('[data-layout]').forEach((button) => {
    const selected = button.dataset.layout === state.layout && Number(button.dataset.per || 1) === state.perFan;
    button.setAttribute('aria-pressed', String(selected));
  });
  root.querySelectorAll('[data-size]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.size === state.size));
  });
  root.querySelectorAll('[data-paper]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.paper === state.paper));
  });
  root.querySelectorAll('[data-layers]').forEach((button) => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.layers) === state.strokes.length));
  });
  const custom = root.querySelector('[data-custom-size]');
  custom.hidden = state.size !== 'custom';
  root.querySelector('[data-custom-w]').value = String(state.customW);
  root.querySelector('[data-custom-h]').value = String(state.customH);
  const fill2 = root.querySelector('[data-fill2]');
  fill2.value = state.fill2 || '#7a5cff';
  root.querySelector('[data-fill2-clear]').hidden = !state.fill2;
  root.querySelector('[data-custom-color]').value = /^#[0-9a-fA-F]{6}$/.test(state.fill) ? state.fill : '#ff4d88';
  const mm = fanSizeMm(state);
  root.querySelector('[data-size-note]').textContent = state.size === 'custom'
    ? `扇面の目安は横${mm.w}mm × 縦${mm.h}mmです。`
    : `${FAN_PRESETS[state.size].label}の扇面は横${mm.w}mm × 縦${mm.h}mmです。`;
  root.querySelectorAll('[data-stroke-row]').forEach((row) => {
    const index = Number(row.dataset.strokeRow);
    const stroke = state.strokes[index];
    row.hidden = !stroke;
    if (!stroke) return;
    row.querySelector('[data-stroke-width]').value = String(stroke.width);
    row.querySelectorAll('[data-stroke-color]').forEach((button) => {
      const expected = button.dataset.strokeColor === 'fill' ? state.fill : button.dataset.strokeColor;
      button.setAttribute('aria-pressed', String(expected.toLowerCase() === stroke.color));
    });
  });
  const pale = !state.rainbow && !state.fill2 && isLight(state.fill) && state.strokes.every((stroke) => isLight(stroke.color));
  root.querySelector('[data-contrast-note]').hidden = !pale;
  const fans = splitFans(state.text, state.layout, state.perFan).filter((text) => text.trim());
  root.querySelector('[data-fan-count]').textContent = state.layout === 'renketsu'
    ? `${Math.max(fans.length, 1)}枚になります。`
    : '';
  const sheets = planPaperPages(mm, PAPERS[state.paper] || PAPERS.A3).length * Math.max(fans.length, 1);
  root.querySelector('[data-sheet-note]').textContent = sheets > 1 ? ` この設定ではPNGが${sheets}枚になります。` : '';
  renderMembers();
}

function renderMembers() {
  memberList.replaceChildren();
  if (!members.length) {
    const empty = document.createElement('p');
    empty.className = 'member-empty';
    empty.textContent = 'まだ保存していません。名前と色は、この端末に10人まで残せます。';
    memberList.appendChild(empty);
    return;
  }
  members.forEach((member, index) => {
    const item = document.createElement('div');
    item.className = 'member-chip';
    const apply = document.createElement('button');
    apply.type = 'button';
    apply.className = 'member-apply';
    apply.dataset.member = String(index);
    const dot = document.createElement('span');
    dot.className = 'swatch-dot';
    dot.style.background = member.color;
    apply.append(dot, document.createTextNode(member.name));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'member-remove';
    remove.dataset.removeMember = String(index);
    remove.setAttribute('aria-label', `${member.name}を削除`);
    remove.textContent = '×';
    item.append(apply, remove);
    memberList.appendChild(item);
  });
}

function render() {
  syncControls();
  schedulePreview();
}

function setText(value, { fromPreset = false } = {}) {
  const next = clampText(value);
  if (codePoints(value).length > codePoints(next).length && !fromPreset) {
    showToast('40文字までです');
  }
  state.text = next;
  render();
}

function insertAtCursor(snippet) {
  const start = textInput.selectionStart ?? state.text.length;
  const end = textInput.selectionEnd ?? start;
  const chars = codePoints(state.text);
  const before = codePoints(state.text.slice(0, start)).length;
  const selected = codePoints(state.text.slice(start, end)).length;
  const next = chars.slice(0, before).concat(codePoints(snippet), chars.slice(before + selected)).join('');
  if (codePoints(next).length > 40) {
    showToast('40文字までです');
    return;
  }
  state.text = next;
  render();
  const cursor = before + codePoints(snippet).length;
  const utf16 = codePoints(state.text).slice(0, cursor).join('').length;
  textInput.focus();
  textInput.setSelectionRange(utf16, utf16);
}

function setLayerCount(count) {
  const next = state.strokes.slice(0, count);
  const extras = ['#ffffff', '#111111', state.fill];
  while (next.length < count) {
    const previous = next[next.length - 1];
    next.push({
      color: extras[next.length] || '#111111',
      width: Math.min(8, Math.round(((previous?.width || 3.2) + 1.6) * 10) / 10)
    });
  }
  state.strokes = next;
  render();
}

async function ensureFont(fontId) {
  const font = FONTS[fontId] || FONTS.dela;
  try {
    await document.fonts.load(`${font.weight} 64px ${font.family}`);
    await document.fonts.ready;
  } catch (error) {
    error.reason = 'font';
    throw error;
  }
  if (!document.fonts.check(`${font.weight} 64px ${font.family}`)) {
    const error = new Error('font unavailable');
    error.reason = 'font';
    throw error;
  }
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  if (canvas.width !== width || canvas.height !== height) {
    const error = new Error('canvas limit');
    error.reason = 'memory';
    throw error;
  }
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!ctx) {
    const error = new Error('canvas context');
    error.reason = 'memory';
    throw error;
  }
  return { canvas, ctx };
}

function releaseCanvas(canvas) {
  canvas.width = 0;
  canvas.height = 0;
}

async function blobFromCanvas(canvas) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(Object.assign(new Error('toBlob failed'), { reason: 'memory' }));
    }, 'image/png');
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return new Blob([insertPhysChunk(bytes)], { type: 'image/png' });
}

async function renderTiledPng(width, height, draw) {
  const tileHeight = Math.max(1, Math.min(1536, Math.floor(15000000 / Math.max(1, width))));
  const spans = tileSpans(height, tileHeight);
  async function* rows() {
    for (const span of spans) {
      const created = createCanvas(width, span.size);
      try {
        created.ctx.setTransform(1, 0, 0, 1, 0, -span.offset);
        created.ctx.beginPath();
        created.ctx.rect(0, span.offset, width, span.size);
        created.ctx.clip();
        draw(created.ctx);
        const image = created.ctx.getImageData(0, 0, width, span.size);
        for (let y = 0; y < span.size; y += 1) {
          const scan = new Uint8Array(1 + width * 3);
          scan[0] = 1;
          let prevR = 0;
          let prevG = 0;
          let prevB = 0;
          const row = y * width * 4;
          for (let x = 0; x < width; x += 1) {
            const index = row + x * 4;
            const r = image.data[index];
            const g = image.data[index + 1];
            const b = image.data[index + 2];
            const dest = 1 + x * 3;
            scan[dest] = (r - prevR) & 255;
            scan[dest + 1] = (g - prevG) & 255;
            scan[dest + 2] = (b - prevB) & 255;
            prevR = r;
            prevG = g;
            prevB = b;
          }
          yield scan;
        }
      } finally {
        releaseCanvas(created.canvas);
      }
    }
  }
  try {
    const zlibBytes = await deflateZlib(rows());
    return new Blob([buildPng({ width, height, zlibBytes })], { type: 'image/png' });
  } catch (error) {
    if (!error.reason) error.reason = 'memory';
    throw error;
  }
}

async function renderPageBlob(paper, page, fanSpec, fanIndex, fanCount) {
  const draw = (ctx) => drawExportPage(ctx, paper, page, fanSpec, fanIndex, fanCount);
  const mustTile = Boolean(window.__uchiwa?.forceTile) || exceedsCanvasLimit(paper.pxW, paper.pxH) || (isIosDevice() && paper.id === 'A3');
  if (!mustTile) {
    const created = createCanvas(paper.pxW, paper.pxH);
    try {
      draw(created.ctx);
      return blobFromCanvas(created.canvas);
    } finally {
      releaseCanvas(created.canvas);
    }
  }
  return renderTiledPng(paper.pxW, paper.pxH, draw);
}

async function renderA3Fallback(paper, page, fanSpec, fanIndex, fanCount) {
  const draw = (ctx) => drawExportPage(ctx, paper, page, fanSpec, fanIndex, fanCount);
  const blobs = [];
  for (const slice of a3FallbackSlices()) {
    const created = createCanvas(paper.pxW, slice.height);
    try {
      created.ctx.setTransform(1, 0, 0, 1, 0, -slice.y);
      created.ctx.beginPath();
      created.ctx.rect(0, slice.y, paper.pxW, slice.height);
      created.ctx.clip();
      draw(created.ctx);
      blobs.push(await blobFromCanvas(created.canvas));
    } finally {
      releaseCanvas(created.canvas);
    }
  }
  return blobs;
}

function downloadBlob(blob, name) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function deliver(files) {
  const objects = files.map((file) => new File([file.blob], file.name, { type: 'image/png' }));
  if (navigator.canShare && navigator.canShare({ files: objects })) {
    try {
      await navigator.share({ files: objects, title: 'うちわ文字' });
      return 'share';
    } catch (error) {
      if (error && error.name === 'AbortError') return 'cancel';
    }
  }
  for (let index = 0; index < files.length; index += 1) {
    downloadBlob(files[index].blob, files[index].name);
    if (index < files.length - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
  }
  return 'download';
}

function exportErrorReason(error) {
  if (error?.reason === 'memory' || error?.reason === 'font') return error.reason;
  const message = `${error?.message || error || ''}`.toLowerCase();
  if (/memory|canvas|quota|size/.test(message)) return 'memory';
  return 'other';
}

async function exportPng() {
  if (!state.text.trim()) {
    showToast('文字を入力してください');
    textInput.focus();
    return;
  }
  const buttons = root.querySelectorAll('[data-export], [data-share]');
  buttons.forEach((button) => { button.disabled = true; });
  setStatus('フォントを読み込んでいます');
  let exported = false;
  try {
    await ensureFont(state.font);
    const paper = PAPERS[state.paper] || PAPERS.A3;
    const mm = fanSizeMm(state);
    const fans = splitFans(state.text, state.layout, state.perFan).filter((text) => text.trim());
    const files = [];
    let usedFallback = false;
    for (let fanIndex = 0; fanIndex < fans.length; fanIndex += 1) {
      const pages = planPaperPages(mm, paper);
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
        setStatus(`書き出しています ${files.length + 1}枚目`);
        const fanSpec = { ...state, text: fans[fanIndex], fanWidthMm: mm.w, mm };
        const nameBase = `${paper.id.toLowerCase()}`;
        try {
          const blob = await renderPageBlob(paper, pages[pageIndex], fanSpec, fanIndex, fans.length);
          const suffix = fans.length * pages.length > 1 ? `-${files.length + 1}` : '';
          files.push({ blob, name: `uchiwa-${nameBase}${suffix}.png` });
        } catch (error) {
          if (paper.id !== 'A3') throw error;
          trackToolEvent('uchiwa_export_error', { reason: 'memory', os: detectOs() });
          setStatus('A3を2枚のA4に分けています');
          const blobs = await renderA3Fallback(paper, pages[pageIndex], fanSpec, fanIndex, fans.length);
          blobs.forEach((blob) => {
            files.push({ blob, name: `uchiwa-a3-a4-${files.length + 1}.png` });
          });
          usedFallback = true;
        }
      }
    }
    setStatus(usedFallback ? 'A4を2枚保存しています。上下を貼り合わせてください。' : '保存しています');
    const method = await deliver(files);
    if (method === 'cancel') {
      setStatus('');
      return;
    }
    exported = true;
    trackToolEvent('uchiwa_export', {
      paper: state.paper,
      layout: state.layout === 'renketsu' ? 'renketsu' : 'single',
      pages: files.length,
      method,
      os: detectOs()
    });
    setStatus(usedFallback
      ? 'A3を1枚にできなかったため、A4を2枚保存しました。上の紙と下の紙を貼り合わせてください。'
      : '保存しました。印刷するときは倍率を100%にしてください。');
    showToast('PNGを保存しました');
  } catch (error) {
    const reason = exportErrorReason(error);
    if (!exported) {
      trackToolEvent('uchiwa_export_error', { reason, os: detectOs() });
    }
    setStatus(reason === 'font'
      ? 'フォントを読み込めませんでした。通信を確認して、もう一度保存してください。'
      : '保存できませんでした。ページを開き直して、もう一度お試しください。');
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch (error) {
    const area = document.createElement('textarea');
    area.value = value;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

function confirmShare() {
  const size = fanSizeMm(state);
  const layout = state.layout === 'renketsu' ? `連結うちわ（${state.perFan}文字）` : '1枚';
  shareSummary.textContent = `「${state.text}」 / ${colorName(state.fill)} / ${FONTS[state.font].displayName} / ${layout} / 扇面${size.w}×${size.h}mm`;
  if (typeof shareDialog.showModal === 'function') {
    shareDialog.showModal();
  } else {
    shareDialog.setAttribute('open', '');
  }
  return new Promise((resolve) => {
    shareDialog.addEventListener('close', () => resolve(shareDialog.returnValue === 'ok'), { once: true });
  });
}

async function shareLink() {
  if (!state.text.trim()) {
    showToast('文字を入力してください');
    return;
  }
  const compact = encodeShareHash(state);
  const decoded = decodeShareHash(compact);
  if (decoded && decoded.text !== state.text) showToast('共有リンクでは40文字までです');
  const accepted = await confirmShare();
  if (!accepted) return;
  const url = `${window.location.origin}${window.location.pathname}#${compact}`;
  let channel = 'copy';
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'うちわ文字', text: 'うちわ文字の設定', url });
      channel = 'native';
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      await copyText(url);
      showToast('リンクをコピーしました');
    }
  } else {
    await copyText(url);
    showToast('リンクをコピーしました');
  }
  if (channel === 'native') showToast('共有しました');
  trackToolEvent('share_link_create', { tool: 'uchiwa-moji', channel });
}

function applyMember(index) {
  const member = members[index];
  if (!member) return;
  state.text = member.name;
  state.fill = member.color;
  state.rainbow = false;
  trackToolEvent('preset_select', { type: 'member' });
  render();
}

function saveCurrentMember() {
  const name = state.text.trim();
  if (!name) {
    showToast('文字を入力してから保存してください');
    return;
  }
  const next = members.filter((member) => member.name !== name);
  next.unshift({ name: clampText(name), color: state.fill });
  if (next.length > MEMBER_LIMIT) {
    showToast('10人までです。古い保存を消してください');
    return;
  }
  members = saveMembers(next);
  render();
  showToast('この端末に保存しました');
}

function onClick(event) {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.font) {
    state.font = button.dataset.font;
    trackToolEvent('preset_select', { type: 'font' });
    ensureFont(state.font).then(render).catch(() => showToast('フォントを読み込めませんでした'));
    render();
    return;
  }
  if (button.dataset.fill) {
    state.fill = button.dataset.fill;
    state.rainbow = false;
    trackToolEvent('preset_select', { type: 'color' });
    render();
    return;
  }
  if (button.dataset.rainbow !== undefined && button.hasAttribute('data-rainbow')) {
    state.rainbow = !state.rainbow;
    trackToolEvent('preset_select', { type: 'color' });
    render();
    return;
  }
  if (button.dataset.writing) {
    state.writing = button.dataset.writing;
    render();
    return;
  }
  if (button.dataset.layout) {
    state.layout = button.dataset.layout;
    state.perFan = Number(button.dataset.per || 1);
    render();
    return;
  }
  if (button.dataset.size) {
    state.size = button.dataset.size;
    render();
    return;
  }
  if (button.dataset.paper) {
    state.paper = button.dataset.paper;
    render();
    return;
  }
  if (button.dataset.layers) {
    setLayerCount(Number(button.dataset.layers));
    return;
  }
  if (button.dataset.strokeColor !== undefined && button.closest('[data-stroke-row]')) {
    const index = Number(button.closest('[data-stroke-row]').dataset.strokeRow);
    const color = button.dataset.strokeColor === 'fill' ? state.fill : button.dataset.strokeColor;
    state.strokes[index].color = color;
    render();
    return;
  }
  if (button.dataset.phrase) {
    setText(button.dataset.phrase, { fromPreset: true });
    trackToolEvent('preset_select', { type: 'fansa' });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    textInput.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    return;
  }
  if (button.dataset.copy) {
    copyText(button.dataset.copy).then(() => showToast('コピーしました'));
    trackToolEvent('preset_select', { type: 'fansa' });
    return;
  }
  if (button.dataset.insert) {
    insertAtCursor(button.dataset.insert);
    trackToolEvent('preset_select', { type: 'kaomoji' });
    return;
  }
  if (button.dataset.member) {
    applyMember(Number(button.dataset.member));
    return;
  }
  if (button.dataset.removeMember) {
    members = saveMembers(members.filter((_, index) => index !== Number(button.dataset.removeMember)));
    render();
    return;
  }
  if (button.dataset.saveMember !== undefined && button.hasAttribute('data-save-member')) {
    saveCurrentMember();
    return;
  }
  if (button.dataset.fill2Clear !== undefined && button.hasAttribute('data-fill2-clear')) {
    state.fill2 = '';
    render();
    return;
  }
  if (button.dataset.export !== undefined && button.hasAttribute('data-export')) {
    exportPng();
    return;
  }
  if (button.dataset.share !== undefined && button.hasAttribute('data-share')) {
    shareLink();
  }
}

function onInput(event) {
  const target = event.target;
  if (target === textInput) {
    setText(target.value);
    return;
  }
  if (target.matches('[data-custom-color]')) {
    state.fill = target.value;
    state.rainbow = false;
    if (event.type === 'change') trackToolEvent('preset_select', { type: 'color' });
    render();
    return;
  }
  if (target.matches('[data-fill2]')) {
    state.fill2 = target.value;
    state.rainbow = false;
    if (event.type === 'change') trackToolEvent('preset_select', { type: 'color' });
    render();
    return;
  }
  if (target.matches('[data-stroke-width]')) {
    const index = Number(target.closest('[data-stroke-row]').dataset.strokeRow);
    state.strokes[index].width = Number(target.value);
    render();
    return;
  }
  if (target.matches('[data-custom-w]')) {
    state.customW = Number(target.value);
    render();
    return;
  }
  if (target.matches('[data-custom-h]')) {
    state.customH = Number(target.value);
    render();
  }
}

function applySharedState(shared, { track = true } = {}) {
  state = { ...shared, mode: 'uchiwa' };
  document.querySelector('[data-share-banner]').hidden = false;
  if (track) trackToolEvent('share_link_open', { tool: 'uchiwa-moji', channel: 'url' });
  render();
  ensureFont(state.font).then(schedulePreview).catch(() => {
    setStatus('フォントを読み込めませんでした。表示は端末のフォントになります。');
  });
}

function boot() {
  const shared = decodeShareHash(window.location.hash);
  if (shared) applySharedState(shared);
  window.addEventListener('hashchange', () => {
    const next = decodeShareHash(window.location.hash);
    if (next) applySharedState(next);
  });
  try {
    members = loadMembers();
  } catch (error) {
    members = [];
  }
  if (isInAppBrowser()) document.querySelector('[data-inapp-note]').hidden = false;
  document.querySelector('[data-open-led]')?.addEventListener('click', (event) => {
    event.preventDefault();
    const hash = encodeShareHash({ ...state, mode: 'banner' });
    window.location.assign(`/led-banner/#${hash}`);
  });
  document.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  window.addEventListener('resize', schedulePreview);
  render();
  drawPreview();
  ensureFont(state.font).then(drawPreview).catch(() => {
    setStatus('フォントを読み込めませんでした。表示は端末のフォントになります。');
  });
  window.__uchiwa = {
    encodeRgbaPng,
    getState: () => state,
    forceTile: false,
    exportPng
  };
}

boot();
