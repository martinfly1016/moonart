(function (root) {
  var decorative = {
    'あ': 'ぁ',
    'い': 'ﾚヽ',
    'う': 'ぅ',
    'え': 'ぇ',
    'お': 'ぉ',
    'か': 'ｶゝ',
    'き': '(ｷ',
    'く': '＜',
    'け': 'ﾚﾅ',
    'こ': '⊇',
    'さ': '±',
    'し': 'ι',
    'す': '￡',
    'せ': '世',
    'そ': 'ξ',
    'た': 'ﾅ=',
    'ち': '干',
    'つ': '⊃',
    'て': 'τ',
    'と': '┠',
    'な': 'ﾅヽ',
    'に': '二',
    'ぬ': 'йu',
    'ね': 'йё',
    'の': 'σ',
    'は': 'l±',
    'ひ': 'ん',
    'ふ': '、ζ、',
    'へ': '∧',
    'ほ': '木',
    'ま': 'мα',
    'み': '彡',
    'む': '￡￡',
    'め': '×',
    'も': 'м○',
    'や': 'ゃ',
    'ゆ': 'ф',
    'よ': 'чo',
    'ら': 'яα',
    'り': 'L|',
    'る': 'ゐ',
    'れ': 'яё',
    'ろ': 'з',
    'わ': 'ωα',
    'を': 'ё',
    'ん': 'ω',
    'が': 'ｶゝ\u309B',
    'ぎ': '(ｷ\u309B',
    'ぐ': '＜\u309B',
    'げ': 'ﾚﾅ\u309B',
    'ご': '⊇\u309B',
    'ざ': '±\u309B',
    'じ': 'ι\u309B',
    'ず': '￡\u309B',
    'ぜ': '世\u309B',
    'ぞ': 'ξ\u309B',
    'だ': 'ﾅ=\u309B',
    'ぢ': '干\u309B',
    'づ': '⊃\u309B',
    'で': 'τ\u309B',
    'ど': '┠\u309B',
    'ば': 'l±\u309B',
    'び': 'ん\u309B',
    'ぶ': '、ζ、\u309B',
    'べ': '∧\u309B',
    'ぼ': '木\u309B',
    'ぱ': 'l±\u309C',
    'ぴ': 'ん\u309C',
    'ぷ': '、ζ、\u309C',
    'ぺ': '∧\u309C',
    'ぽ': '木\u309C',
    'ぁ': 'ぁ',
    'ぃ': 'ｨ',
    'ぅ': 'ぅ',
    'ぇ': 'ｪ',
    'ぉ': 'ｫ',
    'っ': 'ｯ',
    'ゃ': 'ｬ',
    'ゅ': 'ｭ',
    'ょ': 'ｮ',
    'ゎ': 'ゎ',
    'ゔ': 'ｳﾞ',
    'ー': '─'
  };

  var halfwidth = {
    'あ': 'ｱ', 'い': 'ｲ', 'う': 'ｳ', 'え': 'ｴ', 'お': 'ｵ',
    'か': 'ｶ', 'き': 'ｷ', 'く': 'ｸ', 'け': 'ｹ', 'こ': 'ｺ',
    'さ': 'ｻ', 'し': 'ｼ', 'す': 'ｽ', 'せ': 'ｾ', 'そ': 'ｿ',
    'た': 'ﾀ', 'ち': 'ﾁ', 'つ': 'ﾂ', 'て': 'ﾃ', 'と': 'ﾄ',
    'な': 'ﾅ', 'に': 'ﾆ', 'ぬ': 'ﾇ', 'ね': 'ﾈ', 'の': 'ﾉ',
    'は': 'ﾊ', 'ひ': 'ﾋ', 'ふ': 'ﾌ', 'へ': 'ﾍ', 'ほ': 'ﾎ',
    'ま': 'ﾏ', 'み': 'ﾐ', 'む': 'ﾑ', 'め': 'ﾒ', 'も': 'ﾓ',
    'や': 'ﾔ', 'ゆ': 'ﾕ', 'よ': 'ﾖ',
    'ら': 'ﾗ', 'り': 'ﾘ', 'る': 'ﾙ', 'れ': 'ﾚ', 'ろ': 'ﾛ',
    'わ': 'ﾜ', 'を': 'ｦ', 'ん': 'ﾝ',
    'が': 'ｶﾞ', 'ぎ': 'ｷﾞ', 'ぐ': 'ｸﾞ', 'げ': 'ｹﾞ', 'ご': 'ｺﾞ',
    'ざ': 'ｻﾞ', 'じ': 'ｼﾞ', 'ず': 'ｽﾞ', 'ぜ': 'ｾﾞ', 'ぞ': 'ｿﾞ',
    'だ': 'ﾀﾞ', 'ぢ': 'ﾁﾞ', 'づ': 'ﾂﾞ', 'で': 'ﾃﾞ', 'ど': 'ﾄﾞ',
    'ば': 'ﾊﾞ', 'び': 'ﾋﾞ', 'ぶ': 'ﾌﾞ', 'べ': 'ﾍﾞ', 'ぼ': 'ﾎﾞ',
    'ぱ': 'ﾊﾟ', 'ぴ': 'ﾋﾟ', 'ぷ': 'ﾌﾟ', 'ぺ': 'ﾍﾟ', 'ぽ': 'ﾎﾟ',
    'ぁ': 'ｧ', 'ぃ': 'ｨ', 'ぅ': 'ｩ', 'ぇ': 'ｪ', 'ぉ': 'ｫ',
    'っ': 'ｯ', 'ゃ': 'ｬ', 'ゅ': 'ｭ', 'ょ': 'ｮ', 'ゎ': 'ﾜ',
    'ゔ': 'ｳﾞ',
    'ー': 'ｰ', '。': '｡', '、': '､', '「': '｢', '」': '｣', '・': '･'
  };

  function toHiraganaChar(char) {
    var code = char.codePointAt(0);
    if (code >= 0x30A1 && code <= 0x30F6) return String.fromCodePoint(code - 0x60);
    return char;
  }

  function convertWith(text, table) {
    return Array.from(String(text || '').normalize('NFC')).map(function (char) {
      if (Object.prototype.hasOwnProperty.call(table, char)) return table[char];
      var hira = toHiraganaChar(char);
      if (hira !== char && Object.prototype.hasOwnProperty.call(table, hira)) return table[hira];
      return char;
    }).join('');
  }

  function isPlainScript(value) {
    var chars = Array.from(value);
    if (!chars.length) return true;
    return chars.every(function (char) {
      var code = char.codePointAt(0);
      return (code >= 0x3040 && code <= 0x309F) ||
        (code >= 0x30A0 && code <= 0x30FF) ||
        (code >= 0x4E00 && code <= 0x9FFF);
    });
  }

  function pairsByLength(table, skipPlain) {
    return Object.keys(table).map(function (key) {
      return [key, table[key]];
    }).filter(function (pair) {
      if (!skipPlain) return true;
      if (!pair[1] || pair[1] === pair[0]) return false;
      if (isPlainScript(pair[1])) return false;
      return true;
    }).sort(function (a, b) {
      return b[1].length - a[1].length;
    });
  }

  var decorativePairs = pairsByLength(decorative, true);
  var halfwidthPairs = pairsByLength(halfwidth, false);

  function decodeWith(text, pairs) {
    var source = String(text || '');
    var index = 0;
    var out = '';
    while (index < source.length) {
      var matched = false;
      for (var i = 0; i < pairs.length; i += 1) {
        var value = pairs[i][1];
        if (!value || !source.startsWith(value, index)) continue;
        out += pairs[i][0];
        index += value.length;
        matched = true;
        break;
      }
      if (matched) continue;
      var code = source.codePointAt(index);
      out += String.fromCodePoint(code);
      index += code > 0xFFFF ? 2 : 1;
    }
    return out;
  }

  function chartRows() {
    return Object.keys(decorative).filter(function (key) {
      return key >= '\u3041' && key <= '\u3096';
    }).map(function (key) {
      return {
        source: key,
        decorative: decorative[key],
        halfwidth: halfwidth[key] || key
      };
    });
  }

  root.MojiMoonGyaru = {
    decorative: decorative,
    halfwidth: halfwidth,
    toDecorative: function (text) { return convertWith(text, decorative); },
    toHalfwidth: function (text) { return convertWith(text, halfwidth); },
    fromDecorative: function (text) { return decodeWith(text, decorativePairs); },
    fromHalfwidth: function (text) { return decodeWith(text, halfwidthPairs); },
    chartRows: chartRows
  };

  if (typeof document === 'undefined') return;

  var input = document.querySelector('[data-gyaru-input]');
  var results = document.querySelector('[data-gyaru-results]');
  var count = document.querySelector('[data-gyaru-count]');
  var toast = document.querySelector('[data-toast]');
  if (!input || !results) return;

  var toastTimer;
  var outputs = [
    { id: 'decorative', label: '記号多め', convert: root.MojiMoonGyaru.toDecorative },
    { id: 'halfwidth', label: '半角カタカナ', convert: root.MojiMoonGyaru.toHalfwidth },
    { id: 'from-decorative', label: '記号から戻す', convert: root.MojiMoonGyaru.fromDecorative },
    { id: 'from-halfwidth', label: '半角から戻す', convert: root.MojiMoonGyaru.fromHalfwidth }
  ];

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
    results.innerHTML = '';
    if (!text.trim()) {
      var empty = document.createElement('p');
      empty.className = 'fancy-empty';
      empty.textContent = 'ひらがなを入れると、記号多めと半角カタカナの両方が出ます。';
      results.appendChild(empty);
      return;
    }
    outputs.forEach(function (row) {
      var value = row.convert(text);
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
      output.className = 'fancy-output';
      output.textContent = value;
      main.appendChild(label);
      main.appendChild(output);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-output-btn';
      button.textContent = 'コピー';
      button.addEventListener('click', function () {
        copyText(value, button);
      });
      article.appendChild(main);
      article.appendChild(button);
      results.appendChild(article);
    });
  }

  input.addEventListener('input', paint);

  document.querySelectorAll('[data-gyaru-sample]').forEach(function (button) {
    button.addEventListener('click', function () {
      input.value = button.getAttribute('data-gyaru-sample') || '';
      paint();
      input.focus();
    });
  });

  var clearButton = document.querySelector('[data-gyaru-clear]');
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
