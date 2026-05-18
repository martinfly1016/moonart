(function () {
  const root = document.querySelector('[data-slack-emoji-maker]');
  if (!root) return;

  const textInput = root.querySelector('[data-emoji-text]');
  const charCount = root.querySelector('[data-char-count]');
  const fontSelect = root.querySelector('[data-font-family]');
  const exportSize = root.querySelector('[data-export-size]');
  const textColor = root.querySelector('[data-text-color]');
  const bgColor = root.querySelector('[data-bg-color]');
  const transparentBg = root.querySelector('[data-transparent-bg]');
  const canvas = root.querySelector('[data-preview-canvas]');
  const downloadButton = root.querySelector('[data-download-png]');
  const resetButton = root.querySelector('[data-reset-maker]');
  const fileStatus = root.querySelector('[data-file-status]');
  const presetButtons = Array.from(root.querySelectorAll('[data-preset]'));
  const toast = document.querySelector('[data-toast]');
  const ctx = canvas.getContext('2d');
  const defaultState = {
    text: '確認中',
    font: 'system',
    size: '128',
    textColor: '#ffffff',
    bgColor: '#4f46e5',
    transparent: false
  };

  function track(name, params = {}) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      tool_name: 'slack_emoji_generator',
      ...params
    });
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => toast.classList.remove('show'), 1600);
  }

  function getFontStack(fontKey) {
    if (fontKey === 'rounded') {
      return '"Hiragino Maru Gothic ProN", "Yu Gothic", "Meiryo", sans-serif';
    }
    if (fontKey === 'mincho') {
      return '"Yu Mincho", "Hiragino Mincho ProN", serif';
    }
    if (fontKey === 'bold') {
      return '"Arial Black", "Hiragino Sans", "Yu Gothic", sans-serif';
    }
    return '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif';
  }

  function getFontWeight(fontKey) {
    if (fontKey === 'mincho') return '800';
    return '900';
  }

  function normalizeLines(value) {
    const text = value.trim() || defaultState.text;
    const manualLines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    if (manualLines.length > 1) return manualLines.slice(0, 2);
    if (text.length > 5 && !/[A-Za-z0-9 ]/.test(text)) {
      const midpoint = Math.ceil(text.length / 2);
      return [text.slice(0, midpoint), text.slice(midpoint)].filter(Boolean);
    }
    return [text];
  }

  function fitFontSize(lines, size, fontKey) {
    const maxWidth = size * 0.82;
    const maxHeight = size * 0.72;
    const fontStack = getFontStack(fontKey);
    let fontSize = Math.floor(lines.length > 1 ? size * 0.34 : size * 0.48);
    while (fontSize > 16) {
      ctx.font = `${getFontWeight(fontKey)} ${fontSize}px ${fontStack}`;
      const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
      const totalHeight = fontSize * lines.length * 1.12;
      if (widest <= maxWidth && totalHeight <= maxHeight) break;
      fontSize -= 2;
    }
    return fontSize;
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function render() {
    const size = Number(exportSize.value);
    const lines = normalizeLines(textInput.value);
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    if (!transparentBg.checked) {
      ctx.fillStyle = bgColor.value;
      roundRect(ctx, 0, 0, size, size, Math.round(size * 0.16));
      ctx.fill();
    }

    ctx.fillStyle = textColor.value;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const fontSize = fitFontSize(lines, size, fontSelect.value);
    ctx.font = `${getFontWeight(fontSelect.value)} ${fontSize}px ${getFontStack(fontSelect.value)}`;

    const lineHeight = fontSize * 1.08;
    const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      ctx.fillText(line, size / 2, y);
    });

    charCount.textContent = String(textInput.value.length);
    updatePresetState();
    updateFileStatus();
  }

  function updatePresetState() {
    const current = `${textColor.value.toLowerCase()},${bgColor.value.toLowerCase()}`;
    presetButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.preset.toLowerCase() === current && !transparentBg.checked);
    });
  }

  function updateFileStatus() {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const kb = Math.max(1, Math.round(blob.size / 1024));
      fileStatus.textContent = `現在のPNG目安: ${kb}KB`;
      fileStatus.classList.toggle('is-warning', blob.size > 128 * 1024);
      fileStatus.classList.toggle('is-good', blob.size <= 128 * 1024);
    }, 'image/png');
  }

  function downloadPng() {
    render();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = (textInput.value.trim() || 'slack-emoji')
        .replace(/[^\w\u3040-\u30ff\u3400-\u9fff-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32) || 'slack-emoji';
      link.href = url;
      link.download = `${safeName}-${exportSize.value}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      track('slack_emoji_download', {
        export_size: exportSize.value,
        transparent_background: transparentBg.checked,
        file_kb: Math.round(blob.size / 1024)
      });
      showToast('PNGをダウンロードしました');
    }, 'image/png');
  }

  function applyPreset(value) {
    const [foreground, background] = value.split(',');
    textColor.value = foreground;
    bgColor.value = background;
    transparentBg.checked = false;
    track('slack_emoji_preset_select', { background });
    render();
  }

  function reset() {
    textInput.value = defaultState.text;
    fontSelect.value = defaultState.font;
    exportSize.value = defaultState.size;
    textColor.value = defaultState.textColor;
    bgColor.value = defaultState.bgColor;
    transparentBg.checked = defaultState.transparent;
    render();
  }

  root.addEventListener('input', render);
  root.addEventListener('change', render);
  root.addEventListener('click', (event) => {
    const templateButton = event.target.closest('[data-template]');
    if (templateButton) {
      textInput.value = templateButton.dataset.template;
      track('slack_emoji_template_select', { template: templateButton.dataset.template });
      render();
      textInput.focus();
      return;
    }

    const presetButton = event.target.closest('[data-preset]');
    if (presetButton) {
      applyPreset(presetButton.dataset.preset);
    }
  });

  downloadButton.addEventListener('click', downloadPng);
  resetButton.addEventListener('click', reset);
  render();
}());
