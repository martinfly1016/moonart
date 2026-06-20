(function () {
  const root = document.querySelector('[data-ascii-art-generator]');
  if (!root) return;

  const config = window.MojiMoonAsciiArtConfig || {};
  const ui = {
    copied: 'Copied',
    copiedToast: 'Copied',
    copy: 'Copy',
    download: 'Download .txt',
    emptyText: 'Type text or upload an image to generate ASCII art.',
    imageReady: 'Image ready',
    imageMissing: 'Upload an image to convert it into ASCII.',
    textUnsupportedOnly: 'Text mode supports A-Z, numbers, spaces, !, ?, and -.',
    unsupportedText: 'Unsupported characters were skipped: {chars}',
    ...(config.ui || {})
  };

  const textInput = root.querySelector('[data-ascii-text]');
  const renderTextInput = root.querySelector('[data-ascii-render-text]');
  const imageInput = root.querySelector('[data-ascii-image]');
  const modeButtons = Array.from(root.querySelectorAll('[data-ascii-mode]'));
  const modePanels = Array.from(root.querySelectorAll('[data-ascii-panel]'));
  const widthInput = root.querySelector('[data-ascii-width]');
  const widthValue = root.querySelector('[data-ascii-width-value]');
  const charsetInput = root.querySelector('[data-ascii-charset]');
  const fillInput = root.querySelector('[data-ascii-fill]');
  const fillCustomInput = root.querySelector('[data-ascii-fill-custom]');
  const fillCustomField = root.querySelector('[data-ascii-fill-custom-field]');
  const renderWeightInput = root.querySelector('[data-ascii-render-weight]');
  const renderWeightValue = root.querySelector('[data-ascii-render-weight-value]');
  const invertInput = root.querySelector('[data-ascii-invert]');
  const contrastInput = root.querySelector('[data-ascii-contrast]');
  const contrastValue = root.querySelector('[data-ascii-contrast-value]');
  const output = root.querySelector('[data-ascii-output]');
  const outputMeta = root.querySelector('[data-ascii-output-meta]');
  const textWarning = root.querySelector('[data-ascii-text-warning]');
  const copyButton = root.querySelector('[data-copy-ascii]');
  const downloadButton = root.querySelector('[data-download-ascii]');
  const samples = Array.from(root.querySelectorAll('[data-ascii-sample]'));
  const renderSamples = Array.from(root.querySelectorAll('[data-ascii-render-sample]'));
  const toast = document.querySelector('[data-toast]');

  const defaultText = config.defaultText || 'MOJI MOON';
  const renderDefaultText = config.renderDefaultText || defaultText;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const textCanvas = document.createElement('canvas');
  const textContext = textCanvas.getContext('2d', { willReadFrequently: true });
  let mode = 'text';
  let currentImage = null;
  let currentImageName = 'ascii-art';

  const charsets = {
    standard: '@%#*+=-:. ',
    blocks: '█▓▒░ ',
    clean: '#*+=-:. ',
    dense: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`\'. '
  };

  const fontMap = {
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
    X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    4: ['10010', '10010', '10010', '11111', '00010', '00010', '00010'],
    5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
    6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
    7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
    '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
    '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
    '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000']
  };

  function setMode(nextMode) {
    mode = ['text', 'render', 'image'].includes(nextMode) ? nextMode : 'text';
    root.classList.toggle('is-text-mode', mode === 'text');
    root.classList.toggle('is-render-mode', mode === 'render');
    root.classList.toggle('is-image-mode', mode === 'image');
    modeButtons.forEach((button) => {
      const active = button.dataset.asciiMode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    modePanels.forEach((panel) => {
      const active = panel.dataset.asciiPanel === mode;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
    generate();
    track('ascii_mode_select', { mode });
  }

  function selectedCharset() {
    return charsets[charsetInput.value] || charsets.standard;
  }

  function selectedFillChar() {
    if (!fillInput) return '#';
    const raw = fillInput && fillInput.value === 'custom'
      ? (fillCustomInput ? fillCustomInput.value : '#')
      : fillInput.value;
    const chars = Array.from((raw || '#').trim());
    return chars[0] || '#';
  }

  function selectedWidth() {
    const maxWidth = Number(widthInput.value || 80);
    return Math.max(24, Math.min(140, maxWidth));
  }

  function estimateReadableRenderWidth(lines) {
    const widest = Math.max(...lines.map((line) => {
      return Array.from(line).reduce((total, char) => total + renderCharWidth(char), 0);
    }));
    return Math.max(32, Math.min(120, widest + 8));
  }

  function renderCharWidth(char) {
    if (/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\u3000-\u303f]/u.test(char)) return 16;
    if (char.codePointAt(0) > 0xffff) return 14;
    if (/\s/u.test(char)) return 4;
    return 8;
  }

  function syncWidthControl(minWidth = 32) {
    if (!widthInput || !widthValue) return;
    widthInput.min = String(minWidth);
    if (Number(widthInput.value) < minWidth) {
      widthInput.value = String(minWidth);
    }
    widthValue.textContent = widthInput.value;
  }

  function selectedRenderWeight() {
    return Math.max(350, Math.min(900, Number(renderWeightInput ? renderWeightInput.value : 650) || 650));
  }

  function generateTextAscii(text) {
    const rawSource = (text || '').trim();
    const source = rawSource || defaultText;
    const normalized = source.toUpperCase().replace(/\s+/gu, ' ');
    const lines = Array.from({ length: 7 }, () => []);
    const unsupported = new Set();
    let supportedCount = 0;
    const fillChar = selectedFillChar();

    Array.from(normalized).forEach((char) => {
      if (char === ' ') {
        if (supportedCount > 0) {
          lines.forEach((line) => line.push('   '));
        }
        return;
      }
      const pattern = fontMap[char];
      if (!pattern) {
        unsupported.add(char);
        return;
      }
      supportedCount += 1;
      pattern.forEach((row, index) => {
        lines[index].push(row.replace(/1/g, fillChar).replace(/0/g, ' '));
      });
    });

    const value = supportedCount
      ? lines.map((line) => line.join('  ').replace(/\s+$/u, '')).join('\n')
      : '';

    return {
      value,
      unsupported: Array.from(unsupported)
    };
  }

  function generateRenderedTextAscii() {
    if (!context || !textContext) return '';
    const source = (renderTextInput && renderTextInput.value.trim()) || renderDefaultText;
    const lines = source
      .replace(/\r/gu, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4);

    if (!lines.length) return '';

    const minReadableWidth = estimateReadableRenderWidth(lines);
    syncWidthControl(minReadableWidth);
    const targetWidth = selectedWidth();
    const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif';
    const fontWeight = selectedRenderWeight();
    const longestLineLength = Math.max(...lines.map((line) => Array.from(line).length));
    let fontSize = Math.max(18, Math.min(54, Math.floor((targetWidth - 8) / Math.max(1, longestLineLength) * 2.15)));
    textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    while (
      fontSize > 14 &&
      Math.max(...lines.map((line) => textContext.measureText(line).width)) > targetWidth - 8
    ) {
      fontSize -= 1;
      textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    }

    const lineHeight = Math.ceil(fontSize * 1.25);
    const renderHeight = Math.ceil((lineHeight * lines.length) + 16);
    const targetHeight = Math.max(8, Math.min(90, Math.round(renderHeight * 0.48)));
    const renderScale = 4;

    textCanvas.width = targetWidth * renderScale;
    textCanvas.height = renderHeight * renderScale;
    textContext.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    textContext.imageSmoothingEnabled = true;
    textContext.clearRect(0, 0, targetWidth, renderHeight);
    textContext.fillStyle = '#000';
    textContext.fillRect(0, 0, targetWidth, renderHeight);
    textContext.fillStyle = '#fff';
    textContext.textAlign = 'center';
    textContext.textBaseline = 'middle';
    textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    lines.forEach((line, index) => {
      textContext.fillText(line, targetWidth / 2, 8 + (lineHeight * index) + (lineHeight / 2));
    });

    const bounds = findBrightBounds(textContext, textCanvas.width, textCanvas.height);
    if (!bounds) return '';

    const cropPadding = Math.round(renderScale * 1.5);
    const sourceX = Math.max(0, bounds.left - cropPadding);
    const sourceY = Math.max(0, bounds.top - cropPadding);
    const sourceRight = Math.min(textCanvas.width, bounds.right + cropPadding + 1);
    const sourceBottom = Math.min(textCanvas.height, bounds.bottom + cropPadding + 1);
    const sourceWidth = sourceRight - sourceX;
    const sourceHeight = sourceBottom - sourceY;
    const outputWidth = Math.max(8, Math.min(targetWidth, Math.ceil(sourceWidth / renderScale)));
    const outputHeight = Math.max(8, Math.round((sourceHeight / renderScale) * 0.72));

    canvas.width = outputWidth;
    canvas.height = outputHeight;
    context.clearRect(0, 0, outputWidth, outputHeight);
    context.imageSmoothingEnabled = true;
    context.drawImage(
      textCanvas,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    return canvasToTextAscii(outputWidth, outputHeight);
  }

  function generateImageAscii() {
    if (!currentImage || !context) return '';
    syncWidthControl(32);
    const targetWidth = selectedWidth();
    const ratio = currentImage.height / currentImage.width;
    const targetHeight = Math.max(8, Math.round(targetWidth * ratio * 0.48));
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.clearRect(0, 0, targetWidth, targetHeight);
    context.drawImage(currentImage, 0, 0, targetWidth, targetHeight);
    return canvasToAscii(targetWidth, targetHeight);
  }

  function canvasToAscii(targetWidth, targetHeight, options = {}) {
    const data = context.getImageData(0, 0, targetWidth, targetHeight).data;
    const chars = selectedCharset();
    const invert = invertInput.checked;
    const contrast = Number(contrastInput.value || 0);
    const rows = [];

    for (let y = 0; y < targetHeight; y += 1) {
      let row = '';
      for (let x = 0; x < targetWidth; x += 1) {
        const index = (y * targetWidth + x) * 4;
        const alpha = data[index + 3] / 255;
        const brightness = ((data[index] * 0.2126) + (data[index + 1] * 0.7152) + (data[index + 2] * 0.0722)) / 255;
        const adjusted = clamp(((brightness - 0.5) * (1 + contrast / 100)) + 0.5, 0, 1);
        const value = invert ? adjusted : 1 - adjusted;
        const charIndex = alpha < 0.08 ? chars.length - 1 : Math.round(value * (chars.length - 1));
        row += chars[charIndex] || ' ';
      }
      rows.push(row.replace(/\s+$/u, ''));
    }
    return options.trimWhitespace ? trimAsciiWhitespace(rows).join('\n') : rows.join('\n');
  }

  function canvasToTextAscii(targetWidth, targetHeight) {
    const data = context.getImageData(0, 0, targetWidth, targetHeight).data;
    const chars = selectedCharset();
    const solidChar = chars[0] && chars[0] !== ' ' ? chars[0] : '@';
    const edgeChar = chars[2] && chars[2] !== ' ' ? chars[2] : solidChar;
    const rows = [];

    for (let y = 0; y < targetHeight; y += 1) {
      let row = '';
      for (let x = 0; x < targetWidth; x += 1) {
        const index = (y * targetWidth + x) * 4;
        const brightness = ((data[index] * 0.2126) + (data[index + 1] * 0.7152) + (data[index + 2] * 0.0722)) / 255;
        if (brightness > 0.42) {
          row += solidChar;
        } else if (brightness > 0.18) {
          row += edgeChar;
        } else {
          row += ' ';
        }
      }
      rows.push(row.replace(/\s+$/u, ''));
    }

    return trimAsciiWhitespace(rows).join('\n');
  }

  function trimAsciiWhitespace(rows) {
    let start = 0;
    let end = rows.length;
    while (start < end && rows[start].trim() === '') start += 1;
    while (end > start && rows[end - 1].trim() === '') end -= 1;
    const trimmedRows = rows.slice(start, end);
    const leftPadding = trimmedRows
      .filter((row) => row.trim() !== '')
      .reduce((min, row) => Math.min(min, row.search(/\S/u)), Infinity);

    if (!Number.isFinite(leftPadding) || leftPadding <= 0) {
      return trimmedRows;
    }
    return trimmedRows.map((row) => row.slice(leftPadding));
  }

  function findBrightBounds(sourceContext, width, height) {
    const pixels = sourceContext.getImageData(0, 0, width, height).data;
    const threshold = 24;
    let left = width;
    let right = -1;
    let top = height;
    let bottom = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const brightness = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
        if (brightness <= threshold) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }

    if (right < left || bottom < top) return null;
    return { left, right, top, bottom };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateMeta(text) {
    const lineCount = text ? text.split('\n').length : 0;
    const maxLine = text ? Math.max(...text.split('\n').map((line) => line.length)) : 0;
    outputMeta.textContent = config.meta
      ? config.meta(lineCount, maxLine)
      : `${lineCount} lines · ${maxLine} columns`;
    copyButton.disabled = !text;
    downloadButton.disabled = !text;
  }

  function updateTextWarning(unsupported) {
    if (!textWarning) return;
    if (!unsupported.length) {
      textWarning.hidden = true;
      textWarning.textContent = '';
      return;
    }
    const chars = unsupported.join(' ');
    textWarning.textContent = ui.unsupportedText.replace('{chars}', chars);
    textWarning.hidden = false;
  }

  function updateFillCustomState() {
    if (!fillInput || !fillCustomInput || !fillCustomField) return;
    const showCustom = fillInput.value === 'custom';
    fillCustomField.hidden = !showCustom;
    if (showCustom && !fillCustomInput.value) {
      fillCustomInput.value = '#';
    }
  }

  function generate() {
    let value = '';
    let emptyMessage = ui.imageMissing;

    if (mode === 'image') {
      value = generateImageAscii();
      updateTextWarning([]);
    } else if (mode === 'render') {
      value = generateRenderedTextAscii();
      updateTextWarning([]);
      emptyMessage = ui.emptyText;
    } else {
      syncWidthControl(32);
      const result = generateTextAscii(textInput.value);
      value = result.value;
      updateTextWarning(result.unsupported);
      emptyMessage = result.unsupported.length ? ui.textUnsupportedOnly : ui.emptyText;
    }

    output.textContent = value || emptyMessage;
    output.classList.toggle('is-empty', !value);
    updateMeta(value);
  }

  async function copyText(text, button) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const fallback = document.createElement('textarea');
      fallback.value = text;
      fallback.setAttribute('readonly', '');
      fallback.style.position = 'fixed';
      fallback.style.left = '-9999px';
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand('copy');
      fallback.remove();
    }
    flash(button);
    showToast(ui.copiedToast);
    track('ascii_copy', { mode, output_length: text.length });
  }

  function downloadText(text) {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${downloadName()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    track('ascii_download', { mode, output_length: text.length });
  }

  function downloadName() {
    if (mode === 'image') return currentImageName || 'ascii-art';
    if (mode === 'render') return 'rendered-text-ascii';
    return 'block-text-ascii';
  }

  function flash(button) {
    if (!button) return;
    const original = button.dataset.originalText || button.textContent;
    button.dataset.originalText = original;
    button.textContent = ui.copied;
    button.classList.add('copied');
    window.clearTimeout(button.copyTimer);
    button.copyTimer = window.setTimeout(() => {
      button.textContent = original;
      button.classList.remove('copied');
    }, 1200);
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1300);
  }

  function track(name, params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    );
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('event', name, {
      event_category: 'ascii_art_generator',
      tool_slug: config.slug || 'ascii-art-generator',
      page_path: window.location.pathname,
      ...cleanParams
    });
  }

  function loadImage(file) {
    if (!file) return;
    const image = new Image();
    const reader = new FileReader();
    currentImageName = file.name.replace(/\.[^.]+$/u, '') || 'ascii-art';
    reader.addEventListener('load', () => {
      image.addEventListener('load', () => {
        currentImage = image;
        generate();
        showToast(ui.imageReady);
        track('ascii_image_upload', {
          image_type: file.type,
          image_size: file.size
        });
      });
      image.src = reader.result;
    });
    reader.readAsDataURL(file);
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.asciiMode));
  });
  samples.forEach((button) => {
    button.addEventListener('click', () => {
      textInput.value = button.dataset.asciiSample || defaultText;
      setMode('text');
      generate();
      track('ascii_sample_select', { sample_length: textInput.value.length });
    });
  });
  renderSamples.forEach((button) => {
    button.addEventListener('click', () => {
      renderTextInput.value = button.dataset.asciiRenderSample || renderDefaultText;
      setMode('render');
      generate();
      track('ascii_render_sample_select', { sample_length: renderTextInput.value.length });
    });
  });
  textInput.addEventListener('input', generate);
  if (renderTextInput) {
    renderTextInput.addEventListener('input', generate);
  }
  imageInput.addEventListener('change', () => loadImage(imageInput.files && imageInput.files[0]));
  if (fillInput) {
    fillInput.addEventListener('change', () => {
      updateFillCustomState();
      generate();
    });
  }
  if (fillCustomInput) {
    fillCustomInput.addEventListener('input', generate);
  }
  widthInput.addEventListener('input', () => {
    generate();
  });
  if (renderWeightInput) {
    renderWeightInput.addEventListener('input', () => {
      renderWeightValue.textContent = renderWeightInput.value;
      generate();
    });
  }
  charsetInput.addEventListener('change', generate);
  invertInput.addEventListener('change', generate);
  contrastInput.addEventListener('input', () => {
    contrastValue.textContent = `${contrastInput.value}%`;
    generate();
  });
  copyButton.addEventListener('click', () => copyText(output.textContent.trimEnd(), copyButton));
  downloadButton.addEventListener('click', () => downloadText(output.textContent.trimEnd()));

  widthValue.textContent = widthInput.value;
  if (renderWeightInput && renderWeightValue) {
    renderWeightValue.textContent = renderWeightInput.value;
  }
  contrastValue.textContent = `${contrastInput.value}%`;
  textInput.value = textInput.value || defaultText;
  if (renderTextInput) {
    renderTextInput.value = renderTextInput.value || renderDefaultText;
  }
  updateFillCustomState();
  setMode(mode);
})();
