(function () {
  const root = document.querySelector('[data-zenkaku-converter]');
  if (!root) return;

  const input = root.querySelector('[data-zen-input]');
  const output = root.querySelector('[data-zen-output]');
  const copyButton = root.querySelector('[data-copy-output]');
  const clearButton = root.querySelector('[data-clear-input]');
  const swapButton = root.querySelector('[data-swap-output]');
  const statsInput = Array.from(root.querySelectorAll('[data-stat-input]'));
  const statsOutput = Array.from(root.querySelectorAll('[data-stat-output]'));
  const statsChanged = root.querySelector('[data-stat-changed]');
  const recentWrap = root.querySelector('[data-zen-recent]');
  const toast = document.querySelector('[data-toast]');
  const recentKey = 'mojimoon:zenkaku-hankaku-converter:recent';
  const recentLimit = 8;

  const presets = {
    form: {
      letters: 'half',
      numbers: 'half',
      symbols: 'half',
      spaces: 'half',
      katakana: 'full',
      kana: 'keep'
    },
    toHalf: {
      letters: 'half',
      numbers: 'half',
      symbols: 'half',
      spaces: 'half',
      katakana: 'half',
      kana: 'keep'
    },
    toFull: {
      letters: 'full',
      numbers: 'full',
      symbols: 'full',
      spaces: 'full',
      katakana: 'full',
      kana: 'keep'
    },
    alnumHalf: {
      letters: 'half',
      numbers: 'half',
      symbols: 'keep',
      spaces: 'keep',
      katakana: 'keep',
      kana: 'keep'
    },
    kanaFull: {
      letters: 'keep',
      numbers: 'keep',
      symbols: 'keep',
      spaces: 'keep',
      katakana: 'full',
      kana: 'keep'
    },
    hiragana: {
      letters: 'keep',
      numbers: 'keep',
      symbols: 'keep',
      spaces: 'keep',
      katakana: 'full',
      kana: 'hiragana'
    },
    katakana: {
      letters: 'keep',
      numbers: 'keep',
      symbols: 'keep',
      spaces: 'keep',
      katakana: 'full',
      kana: 'katakana'
    }
  };

  let state = { ...presets.form };
  let recent = readStoredList(recentKey);
  const desktopQuery = window.matchMedia('(min-width: 821px)');
  let recentOpen = desktopQuery.matches;
  let inputTrackTimer;

  const fullToHalfSymbolMap = {
    '￥': '¥',
    '￠': '¢',
    '￡': '£',
    '￢': '¬',
    '￣': '¯',
    '￤': '¦',
    '￦': '₩'
  };

  const halfToFullSymbolMap = Object.fromEntries(
    Object.entries(fullToHalfSymbolMap).map(([full, half]) => [half, full])
  );

  const halfKanaChars = Array.from('｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ');
  const fullToHalfKanaMap = buildFullToHalfKanaMap();

  function buildFullToHalfKanaMap() {
    const map = {};
    halfKanaChars.forEach((half) => {
      const full = half.normalize('NFKC');
      map[full] = half;
    });
    halfKanaChars.forEach((half) => {
      ['ﾞ', 'ﾟ'].forEach((mark) => {
        const full = (half + mark).normalize('NFKC');
        if (Array.from(full).length === 1) {
          map[full] = half + mark;
        }
      });
    });
    map['゛'] = 'ﾞ';
    map['゜'] = 'ﾟ';
    map['\u3099'] = 'ﾞ';
    map['\u309A'] = 'ﾟ';
    return map;
  }

  function convertText(source, options) {
    let text = source.normalize('NFC');

    if (options.katakana === 'full' || options.kana !== 'keep') {
      text = text.replace(/[\uFF61-\uFF9F]+/g, (match) => match.normalize('NFKC'));
    }

    if (options.kana === 'hiragana') {
      text = katakanaToHiragana(text);
    } else if (options.kana === 'katakana') {
      text = hiraganaToKatakana(text);
    }

    if (options.katakana === 'half' && options.kana !== 'hiragana') {
      text = fullKanaToHalf(text);
    }

    return Array.from(text).map((char) => convertWidthChar(char, options)).join('');
  }

  function convertWidthChar(char, options) {
    const code = char.codePointAt(0);

    if (char === '　' && options.spaces === 'half') return ' ';
    if (char === ' ' && options.spaces === 'full') return '　';

    if (code >= 0xff01 && code <= 0xff5e) {
      const half = String.fromCodePoint(code - 0xfee0);
      if (shouldConvertAsciiChar(half, options, 'half')) return half;
      return char;
    }

    if (code >= 0x21 && code <= 0x7e) {
      if (shouldConvertAsciiChar(char, options, 'full')) {
        return String.fromCodePoint(code + 0xfee0);
      }
      return char;
    }

    if (options.symbols === 'half' && fullToHalfSymbolMap[char]) return fullToHalfSymbolMap[char];
    if (options.symbols === 'full' && halfToFullSymbolMap[char]) return halfToFullSymbolMap[char];

    return char;
  }

  function shouldConvertAsciiChar(char, options, target) {
    if (/[A-Za-z]/.test(char)) return options.letters === target;
    if (/[0-9]/.test(char)) return options.numbers === target;
    return options.symbols === target;
  }

  function fullKanaToHalf(text) {
    return Array.from(text).map((char) => fullToHalfKanaMap[char] || char).join('');
  }

  function katakanaToHiragana(text) {
    return Array.from(text).map((char) => {
      const code = char.codePointAt(0);
      if (code >= 0x30a1 && code <= 0x30f6) return String.fromCodePoint(code - 0x60);
      return char;
    }).join('');
  }

  function hiraganaToKatakana(text) {
    return Array.from(text).map((char) => {
      const code = char.codePointAt(0);
      if (code >= 0x3041 && code <= 0x3096) return String.fromCodePoint(code + 0x60);
      return char;
    }).join('');
  }

  function countChanged(source, converted) {
    const before = Array.from(source);
    const after = Array.from(converted);
    if (!before.length && !after.length) return 0;
    if (source === converted) return 0;

    let start = 0;
    while (start < before.length && start < after.length && before[start] === after[start]) {
      start += 1;
    }

    let beforeEnd = before.length - 1;
    let afterEnd = after.length - 1;
    while (beforeEnd >= start && afterEnd >= start && before[beforeEnd] === after[afterEnd]) {
      beforeEnd -= 1;
      afterEnd -= 1;
    }

    return Math.max(beforeEnd - start + 1, afterEnd - start + 1, 0);
  }

  function update() {
    const value = input.value;
    const converted = convertText(value, state);
    output.value = converted;
    const inputLength = Array.from(value).length;
    const outputLength = Array.from(converted).length;
    const changed = countChanged(value, converted);

    statsInput.forEach((item) => {
      item.textContent = `${inputLength}文字`;
    });
    statsOutput.forEach((item) => {
      item.textContent = `${outputLength}文字`;
    });
    if (statsChanged) statsChanged.textContent = changed ? `${changed}文字を変換` : '変更なし';
    copyButton.disabled = !converted;
    swapButton.disabled = !converted;
    renderControls();
  }

  function renderControls() {
    root.querySelectorAll('[data-option]').forEach((button) => {
      button.classList.toggle('active', state[button.dataset.option] === button.dataset.value);
    });
    root.querySelectorAll('[data-preset]').forEach((button) => {
      button.classList.toggle('active', matchesPreset(button.dataset.preset));
    });
  }

  function matchesPreset(name) {
    const preset = presets[name];
    if (!preset) return false;
    return Object.keys(preset).every((key) => preset[key] === state[key]);
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
    rememberRecent(text);
    flashCopied(button);
    showToast('コピーしました');
  }

  function flashCopied(button) {
    if (!button) return;
    const original = button.dataset.originalText || button.textContent;
    button.dataset.originalText = original;
    button.textContent = 'コピー済み';
    button.classList.add('copied');
    window.clearTimeout(button.copyTimer);
    button.copyTimer = window.setTimeout(() => {
      button.textContent = original;
      button.classList.remove('copied');
    }, 1200);
  }

  function rememberRecent(text) {
    recent = recent.filter((item) => item !== text);
    recent.unshift(text);
    recent = recent.slice(0, recentLimit);
    writeStoredList(recentKey, recent);
    renderRecent();
  }

  function renderRecent() {
    if (!recentWrap) return;
    recentWrap.innerHTML = '';
    recentWrap.hidden = false;
    recentWrap.classList.toggle('is-open', recentOpen);
    recentWrap.classList.toggle('is-empty', !recent.length);
    recentWrap.setAttribute('aria-label', '最近コピー');

    const bar = document.createElement('div');
    bar.className = 'zen-recent-bar';

    const toggle = document.createElement('button');
    toggle.className = 'zen-recent-toggle';
    toggle.type = 'button';
    toggle.dataset.toggleRecent = '';
    toggle.setAttribute('aria-expanded', recentOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', recentOpen ? '最近コピーを閉じる' : '最近コピーを開く');
    toggle.innerHTML = `
      <span class="zen-recent-icon" aria-hidden="true">${recentOpen ? '⌄' : '⌃'}</span>
      <span class="zen-recent-title">最近コピー</span>
      <span class="zen-recent-count">${recent.length ? `${recent.length}件` : 'コピー履歴はありません'}</span>
      <span class="zen-recent-action">${recentOpen ? '閉じる' : '開く'}</span>
    `;

    const latest = document.createElement('button');
    latest.className = 'zen-recent-latest';
    latest.type = 'button';
    latest.dataset.copyLatest = '';
    latest.disabled = !recent.length;
    latest.textContent = '最新をコピー';
    if (recent[0]) latest.dataset.recentValue = recent[0];
    bar.append(toggle, latest);

    const body = document.createElement('div');
    body.className = 'zen-recent-body';

    if (!recent.length) {
      const empty = document.createElement('p');
      empty.className = 'zen-recent-empty';
      empty.textContent = 'コピーした文字がここに表示されます。';
      body.appendChild(empty);
      recentWrap.append(bar, body);
      return;
    }

    const head = document.createElement('div');
    head.className = 'zen-recent-head';
    const title = document.createElement('strong');
    title.textContent = '最近コピー';
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.dataset.clearRecent = '';
    clear.textContent = '履歴を消去';
    head.append(title, clear);

    const chips = document.createElement('div');
    chips.className = 'zen-recent-chips';
    recent.forEach((item) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.dataset.recentValue = item;
      chip.textContent = item;
      chips.appendChild(chip);
    });
    body.append(head, chips);
    recentWrap.append(bar, body);
  }

  function readStoredList(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value.filter(Boolean).slice(0, recentLimit) : [];
    } catch (error) {
      return [];
    }
  }

  function writeStoredList(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Storage may be unavailable in private browsing.
    }
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toast.hideTimer);
    toast.hideTimer = window.setTimeout(() => {
      toast.classList.remove('show');
    }, 1600);
  }

  function track(action, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', `zenkaku_hankaku_${action}`, params || {});
  }

  root.addEventListener('click', (event) => {
    const preset = event.target.closest('[data-preset]');
    if (preset) {
      state = { ...presets[preset.dataset.preset] };
      update();
      track('preset_select', { preset: preset.dataset.preset });
      return;
    }

    const option = event.target.closest('[data-option]');
    if (option) {
      state[option.dataset.option] = option.dataset.value;
      update();
      track('option_select', { option: option.dataset.option, value: option.dataset.value });
      return;
    }

    const sample = event.target.closest('[data-sample]');
    if (sample) {
      input.value = sample.dataset.sample || '';
      input.focus();
      update();
      track('sample_select', { input_length: input.value.length });
    }
  });

  recentWrap?.addEventListener('click', (event) => {
    if (event.target.closest('[data-toggle-recent]')) {
      recentOpen = !recentOpen;
      renderRecent();
      track('recent_panel_toggle', { open: recentOpen });
      return;
    }
    if (event.target.closest('[data-clear-recent]')) {
      recent = [];
      writeStoredList(recentKey, recent);
      recentOpen = false;
      renderRecent();
      track('recent_clear');
      return;
    }
    const button = event.target.closest('[data-recent-value], [data-copy-latest]');
    if (!button) return;
    copyText(button.dataset.recentValue, button);
    track('recent_copy', { output_length: button.dataset.recentValue.length });
  });

  input.addEventListener('input', () => {
    update();
    window.clearTimeout(inputTrackTimer);
    inputTrackTimer = window.setTimeout(() => {
      if (input.value.trim()) track('input', { input_length: input.value.trim().length });
    }, 900);
  });

  copyButton.addEventListener('click', () => {
    copyText(output.value, copyButton);
    track('copy', { output_length: output.value.length });
  });

  clearButton.addEventListener('click', () => {
    input.value = '';
    input.focus();
    update();
  });

  swapButton.addEventListener('click', () => {
    if (!output.value) return;
    input.value = output.value;
    input.focus();
    update();
    track('swap');
  });

  desktopQuery.addEventListener('change', (event) => {
    recentOpen = event.matches;
    renderRecent();
  });

  update();
  renderRecent();

  window.MojiMoonZenkakuHankakuConverter = {
    convertText,
    presets
  };
})();
