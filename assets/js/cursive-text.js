(function (root) {
  var thinUpper = {
    B: '\u212C',
    E: '\u2130',
    F: '\u2131',
    H: '\u210B',
    I: '\u2110',
    L: '\u2112',
    M: '\u2133',
    R: '\u211B'
  };
  var thinLower = {
    e: '\u212F',
    g: '\u210A',
    o: '\u2134'
  };
  var italicLower = {
    h: '\u210E'
  };

  function mapLatin(text, upperBase, lowerBase, upperEx, lowerEx) {
    return Array.from(String(text || '')).map(function (char) {
      if (upperEx && Object.prototype.hasOwnProperty.call(upperEx, char)) return upperEx[char];
      if (lowerEx && Object.prototype.hasOwnProperty.call(lowerEx, char)) return lowerEx[char];
      var code = char.charCodeAt(0);
      if (upperBase && code >= 65 && code <= 90) return String.fromCodePoint(upperBase + code - 65);
      if (lowerBase && code >= 97 && code <= 122) return String.fromCodePoint(lowerBase + code - 97);
      return char;
    }).join('');
  }

  function toThin(text) {
    return mapLatin(text, 0x1D49C, 0x1D4B6, thinUpper, thinLower);
  }

  function toBold(text) {
    return mapLatin(text, 0x1D4D0, 0x1D4EA, null, null);
  }

  function toItalic(text) {
    return mapLatin(text, 0x1D434, 0x1D44E, null, italicLower);
  }

  var frames = {
    plain: function (text) { return text; },
    name: function (text) { return '♡ ' + text + ' ♡'; },
    instagram: function (text) { return '˚✧ ' + text + ' ✧˚\n𓃃𓈒𓏏'; },
    line: function (text) { return '♡︎' + text; },
    sticker: function (text) { return '꒰⋆ ' + text + ' ⋆꒱'; },
    christmas: function (text) { return '🎄 ' + text + ' 🎄'; },
    birthday: function (text) { return '🎂 ' + text + ' 🎂'; }
  };

  var styles = [
    { id: 'thin', label: '細い筆記体', convert: toThin },
    { id: 'bold', label: '太い筆記体', convert: toBold },
    { id: 'italic', label: '斜体', convert: toItalic }
  ];

  var presets = [
    { id: 'name', label: '名前', sample: 'Momo', frame: 'name' },
    { id: 'instagram', label: 'Instagram', sample: 'moon girl', frame: 'instagram' },
    { id: 'line', label: 'LINEの名前', sample: 'momo', frame: 'line' },
    { id: 'sticker', label: 'ネップリ', sample: 'Momo', frame: 'sticker' },
    { id: 'christmas', label: 'Merry Christmas', sample: 'Merry Christmas', frame: 'christmas' },
    { id: 'birthday', label: 'Happy Birthday', sample: 'Happy Birthday', frame: 'birthday' }
  ];

  function hasUnconverted(text) {
    return /[\u3040-\u30ff\u4e00-\u9fff\uff66-\uff9f]/.test(String(text || ''));
  }

  function render(text, frameId) {
    var frame = frames[frameId] || frames.plain;
    return styles.map(function (style) {
      return {
        id: style.id,
        label: style.label,
        value: frame(style.convert(text))
      };
    });
  }

  root.MojiMoonCursive = {
    toThin: toThin,
    toBold: toBold,
    toItalic: toItalic,
    frames: frames,
    styles: styles,
    presets: presets,
    hasUnconverted: hasUnconverted,
    render: render
  };

  if (typeof document === 'undefined') return;

  var input = document.querySelector('[data-cursive-input]');
  var results = document.querySelector('[data-cursive-results]');
  var warning = document.querySelector('[data-cursive-warning]');
  var count = document.querySelector('[data-cursive-count]');
  var toast = document.querySelector('[data-toast]');
  if (!input || !results) return;

  var pressedFrame = document.querySelector('[data-cursive-frame][aria-pressed="true"]');
  var frameId = pressedFrame ? pressedFrame.getAttribute('data-cursive-frame') || 'plain' : 'plain';
  var toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 1400);
  }

  function copyText(text, button) {
    var done = function () {
      if (!button) return;
      var original = button.textContent;
      button.textContent = 'コピー済み';
      button.classList.add('copied');
      showToast('コピーしました');
      setTimeout(function () {
        button.textContent = original;
        button.classList.remove('copied');
      }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text);
        done();
      });
      return;
    }
    fallbackCopy(text);
    done();
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }

  function paint() {
    var text = input.value;
    if (count) count.textContent = Array.from(text).length + '/80';
    if (warning) warning.hidden = !hasUnconverted(text);
    var rows = text.trim() ? render(text, frameId) : [];
    results.innerHTML = '';
    if (!rows.length) {
      var empty = document.createElement('p');
      empty.className = 'fancy-empty';
      empty.textContent = '英字を入力すると、細い筆記体・太い筆記体・斜体が出ます。';
      results.appendChild(empty);
      return;
    }
    rows.forEach(function (row) {
      var article = document.createElement('article');
      article.className = 'fancy-result fancy-result-plain';
      var main = document.createElement('div');
      main.className = 'fancy-result-main';
      var label = document.createElement('p');
      label.className = 'fancy-meta';
      var strong = document.createElement('strong');
      strong.textContent = row.label;
      label.appendChild(strong);
      var output = document.createElement('p');
      output.className = 'fancy-output fancy-output-pre';
      output.textContent = row.value;
      main.appendChild(label);
      main.appendChild(output);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-output-btn';
      button.textContent = 'コピー';
      button.addEventListener('click', function () {
        copyText(row.value, button);
      });
      article.appendChild(main);
      article.appendChild(button);
      results.appendChild(article);
    });
  }

  input.addEventListener('input', paint);

  document.querySelectorAll('[data-cursive-frame]').forEach(function (button) {
    button.addEventListener('click', function () {
      frameId = button.getAttribute('data-cursive-frame') || 'plain';
      document.querySelectorAll('[data-cursive-frame]').forEach(function (item) {
        if (item === button) item.setAttribute('aria-pressed', 'true');
        else item.removeAttribute('aria-pressed');
      });
      paint();
    });
  });

  document.querySelectorAll('[data-cursive-preset]').forEach(function (button) {
    button.addEventListener('click', function () {
      var preset = presets.find(function (item) {
        return item.id === button.getAttribute('data-cursive-preset');
      });
      if (!preset) return;
      input.value = preset.sample;
      frameId = preset.frame;
      document.querySelectorAll('[data-cursive-frame]').forEach(function (item) {
        if (item.getAttribute('data-cursive-frame') === frameId) item.setAttribute('aria-pressed', 'true');
        else item.removeAttribute('aria-pressed');
      });
      paint();
      input.focus();
    });
  });

  var clearButton = document.querySelector('[data-cursive-clear]');
  if (clearButton) {
    clearButton.addEventListener('click', function () {
      input.value = '';
      paint();
      input.focus();
    });
  }

  document.querySelectorAll('[data-static-copy]').forEach(function (button) {
    button.addEventListener('click', function () {
      var sample = button.parentElement && button.parentElement.querySelector('[data-static-value]');
      if (!sample) return;
      copyText(sample.textContent, button);
    });
  });

  paint();
})(typeof window !== 'undefined' ? window : globalThis);
