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
    ...(config.ui || {})
  };

  const textInput = root.querySelector('[data-ascii-text]');
  const imageInput = root.querySelector('[data-ascii-image]');
  const modeButtons = Array.from(root.querySelectorAll('[data-ascii-mode]'));
  const modePanels = Array.from(root.querySelectorAll('[data-ascii-panel]'));
  const widthInput = root.querySelector('[data-ascii-width]');
  const widthValue = root.querySelector('[data-ascii-width-value]');
  const charsetInput = root.querySelector('[data-ascii-charset]');
  const invertInput = root.querySelector('[data-ascii-invert]');
  const contrastInput = root.querySelector('[data-ascii-contrast]');
  const contrastValue = root.querySelector('[data-ascii-contrast-value]');
  const output = root.querySelector('[data-ascii-output]');
  const outputMeta = root.querySelector('[data-ascii-output-meta]');
  const copyButton = root.querySelector('[data-copy-ascii]');
  const downloadButton = root.querySelector('[data-download-ascii]');
  const samples = Array.from(root.querySelectorAll('[data-ascii-sample]'));
  const toast = document.querySelector('[data-toast]');

  const defaultText = config.defaultText || 'MOJI MOON';
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
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
    mode = nextMode === 'image' ? 'image' : 'text';
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

  function generateTextAscii(text) {
    const source = (text || '').trim() || defaultText;
    const lines = Array.from({ length: 7 }, () => []);
    Array.from(source.toUpperCase()).forEach((char) => {
      if (char === ' ') {
        lines.forEach((line) => line.push('   '));
        return;
      }
      const pattern = fontMap[char];
      if (!pattern) {
        lines.forEach((line, index) => line.push(index === 3 ? char : ' '));
        return;
      }
      pattern.forEach((row, index) => {
        lines[index].push(row.replace(/1/g, '#').replace(/0/g, ' '));
      });
    });
    return lines.map((line) => line.join('  ').replace(/\s+$/u, '')).join('\n');
  }

  function generateImageAscii() {
    if (!currentImage || !context) return '';
    const maxWidth = Number(widthInput.value || 80);
    const targetWidth = Math.max(24, Math.min(140, maxWidth));
    const ratio = currentImage.height / currentImage.width;
    const targetHeight = Math.max(8, Math.round(targetWidth * ratio * 0.48));
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.clearRect(0, 0, targetWidth, targetHeight);
    context.drawImage(currentImage, 0, 0, targetWidth, targetHeight);
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
    return rows.join('\n');
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

  function generate() {
    const value = mode === 'image' ? generateImageAscii() : generateTextAscii(textInput.value);
    output.textContent = value || ui.imageMissing;
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
    link.download = `${currentImageName || 'ascii-art'}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    track('ascii_download', { mode, output_length: text.length });
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
  textInput.addEventListener('input', generate);
  imageInput.addEventListener('change', () => loadImage(imageInput.files && imageInput.files[0]));
  widthInput.addEventListener('input', () => {
    widthValue.textContent = widthInput.value;
    generate();
  });
  charsetInput.addEventListener('change', generate);
  invertInput.addEventListener('change', generate);
  contrastInput.addEventListener('input', () => {
    contrastValue.textContent = `${contrastInput.value}%`;
    generate();
  });
  copyButton.addEventListener('click', () => copyText(output.textContent.trimEnd(), copyButton));
  downloadButton.addEventListener('click', () => downloadText(output.textContent.trimEnd()));

  widthValue.textContent = widthInput.value;
  contrastValue.textContent = `${contrastInput.value}%`;
  textInput.value = textInput.value || defaultText;
  setMode(mode);
})();
