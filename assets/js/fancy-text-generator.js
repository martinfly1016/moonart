(function () {
  const config = window.MojiMoonFancyTextConfig || {};
  const lang = config.lang || (document.documentElement.lang || 'en').slice(0, 2);
  const root = document.querySelector('[data-fancy-text-generator]');
  if (!root) return;

  const input = root.querySelector('[data-fancy-input]');
  const count = root.querySelector('[data-fancy-count]');
  const tabs = root.querySelector('[data-style-tabs]');
  const results = root.querySelector('[data-fancy-results]');
  const resultCount = root.querySelector('[data-result-count]');
  const recentWrap = root.querySelector('[data-fancy-recent]');
  const clearInput = root.querySelector('[data-clear-input]');
  const toast = document.querySelector('[data-toast]');
  const favoriteKey = `mojimoon:${config.slug || 'fancy-text-generator'}:favorites`;
  const recentKey = `mojimoon:${config.slug || 'fancy-text-generator'}:recent`;
  const maxLength = Number(config.maxLength || 80);
  const recentLimit = Number(config.recentLimit || 8);

  const ui = {
    copy: 'Copy',
    copied: 'Copied',
    copiedToast: 'Copied to clipboard',
    empty: 'Type text to see fancy styles.',
    noResults: 'No styles in this tab yet.',
    favoritesEmpty: 'Favorite styles will appear here.',
    favorite: 'Favorite style',
    removeFavorite: 'Remove favorite',
    recentTitle: 'Recently copied',
    recentEmpty: 'Copied text will appear here.',
    recentCount: (value) => `${value} saved`,
    openRecent: 'Open recently copied text',
    closeRecent: 'Close recently copied text',
    open: 'Open',
    close: 'Close',
    copyLatest: 'Copy latest',
    clearRecent: 'Clear',
    clear: 'Clear',
    chars: (value, limit) => `${value}/${limit}`,
    outputCount: (value) => `${value} styles`,
    platformLabel: 'Good for',
    ...(config.ui || {})
  };

  const categories = config.categories || [
    { id: 'popular', label: 'Popular' },
    { id: 'cute', label: 'Cute' },
    { id: 'small', label: 'Small Text' },
    { id: 'bold', label: 'Bold / Italic' },
    { id: 'bubble', label: 'Bubble' },
    { id: 'upside', label: 'Upside Down' },
    { id: 'gothic', label: 'Gothic / Serif' },
    { id: 'aesthetic', label: 'Fullwidth' },
    { id: 'favorites', label: 'Favorites' }
  ];

  let activeCategory = categories[0]?.id || 'popular';
  let favorites = readStoredList(favoriteKey);
  let recent = readStoredList(recentKey);
  const desktopQuery = window.matchMedia('(min-width: 721px)');
  let recentOpen = desktopQuery.matches;
  let inputTrackTimer;

  const superscriptMap = {
    A: 'ᴬ', B: 'ᴮ', C: 'ᶜ', D: 'ᴰ', E: 'ᴱ', F: 'ᶠ', G: 'ᴳ', H: 'ᴴ', I: 'ᴵ', J: 'ᴶ', K: 'ᴷ', L: 'ᴸ', M: 'ᴹ',
    N: 'ᴺ', O: 'ᴼ', P: 'ᴾ', Q: 'Q', R: 'ᴿ', S: 'ˢ', T: 'ᵀ', U: 'ᵁ', V: 'ⱽ', W: 'ᵂ', X: 'ˣ', Y: 'ʸ', Z: 'ᶻ',
    a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ',
    n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', q: 'q', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
    0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾'
  };

  const subscriptMap = {
    A: 'ₐ', E: 'ₑ', H: 'ₕ', I: 'ᵢ', J: 'ⱼ', K: 'ₖ', L: 'ₗ', M: 'ₘ', N: 'ₙ', O: 'ₒ', P: 'ₚ', R: 'ᵣ', S: 'ₛ',
    T: 'ₜ', U: 'ᵤ', V: 'ᵥ', X: 'ₓ',
    a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ',
    t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
    0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎'
  };

  const smallCapsMap = {
    A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ꜰ', G: 'ɢ', H: 'ʜ', I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ',
    N: 'ɴ', O: 'ᴏ', P: 'ᴘ', Q: 'ǫ', R: 'ʀ', S: 'ꜱ', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'x', Y: 'ʏ', Z: 'ᴢ',
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ',
    n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
  };

  const upsideDownMap = {
    a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'ʃ', m: 'ɯ',
    n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z',
    A: '∀', B: '𐐒', C: 'Ɔ', D: 'ᗡ', E: 'Ǝ', F: 'Ⅎ', G: '⅁', H: 'H', I: 'I', J: 'ſ', K: 'Ʞ', L: '˥', M: 'W',
    N: 'N', O: 'O', P: 'Ԁ', Q: 'Ό', R: 'ᴚ', S: 'S', T: '⊥', U: '∩', V: 'Λ', W: 'M', X: 'X', Y: '⅄', Z: 'Z',
    0: '0', 1: 'Ɩ', 2: 'ᄅ', 3: 'Ɛ', 4: 'ㄣ', 5: 'ϛ', 6: '9', 7: 'ㄥ', 8: '8', 9: '6',
    '.': '˙', ',': "'", "'": ',', '"': '„', '`': ',', '?': '¿', '!': '¡', '[': ']', ']': '[', '(': ')', ')': '(',
    '{': '}', '}': '{', '<': '>', '>': '<', '&': '⅋', '_': '‾', ';': '؛'
  };

  const styles = [
    {
      id: 'fullwidth',
      groups: ['popular', 'aesthetic'],
      labels: { en: 'Fullwidth aesthetic', ja: '全角 Aesthetic' },
      notes: { en: 'Wide Unicode text for bios and names.', ja: 'プロフィールや名前に使いやすい全角文字。' },
      platforms: { en: ['Instagram bio', 'X name'], ja: ['Instagramプロフィール', 'Xの名前'] },
      transform: fullwidth
    },
    {
      id: 'small-caps',
      groups: ['popular', 'small'],
      labels: { en: 'Small caps', ja: '小さめ英字' },
      notes: { en: 'Compact letters for usernames and profile labels.', ja: '英字の名前やラベルを小さく見せる文字。' },
      platforms: { en: ['Discord name', 'bio'], ja: ['Discord名', 'プロフィール'] },
      transform: (text) => mapByTable(text, smallCapsMap)
    },
    {
      id: 'superscript',
      groups: ['popular', 'small'],
      labels: { en: 'Small text superscript', ja: '上付き小さい文字' },
      notes: { en: 'Tiny raised text for captions and display names.', ja: '小さい上付き文字で名前や一言を軽く装飾。' },
      platforms: { en: ['small text', 'caption'], ja: ['小さい文字', '一言'] },
      transform: (text) => mapByTable(text, superscriptMap)
    },
    {
      id: 'bold',
      groups: ['popular', 'bold'],
      labels: { en: 'Bold', ja: '太字' },
      notes: { en: 'Strong Unicode letters that stand out in feeds.', ja: '投稿や名前で目立たせやすい太字Unicode。' },
      platforms: { en: ['post title', 'Discord'], ja: ['投稿タイトル', 'Discord'] },
      transform: (text) => mapRanges(text, 0x1d400, 0x1d41a, 0x1d7ce)
    },
    {
      id: 'script',
      groups: ['popular', 'gothic'],
      labels: { en: 'Script', ja: '筆記体風' },
      notes: { en: 'Decorative Unicode script letters.', ja: 'おしゃれな筆記体風のUnicode文字。' },
      platforms: { en: ['bio', 'name'], ja: ['プロフィール', '名前'] },
      transform: (text) => mapRanges(text, 0x1d4d0, 0x1d4ea)
    },
    {
      id: 'circled',
      groups: ['popular', 'bubble'],
      labels: { en: 'Bubble letters', ja: '丸文字・囲み文字' },
      notes: { en: 'Circled letters and numbers for playful names.', ja: '丸で囲まれた文字や数字。' },
      platforms: { en: ['gaming name', 'bio'], ja: ['ゲーム名', 'プロフィール'] },
      transform: circled
    },
    {
      id: 'upside-down',
      groups: ['popular', 'upside'],
      labels: { en: 'Upside down text', ja: '逆さ文字' },
      notes: { en: 'Flips the text for playful posts.', ja: '文字を逆さにして遊び心のある見た目に。' },
      platforms: { en: ['status', 'chat'], ja: ['ステータス', 'チャット'] },
      transform: upsideDown,
      allowSame: true
    },
    {
      id: 'kawaii-heart',
      groups: ['popular', 'cute'],
      labels: { en: 'Soft hearts', ja: 'ハート囲み' },
      notes: { en: 'A cute framed version for bios.', ja: '名前や一言をハートでかわいく囲みます。' },
      platforms: { en: ['Instagram bio', 'LINE'], ja: ['Instagramプロフィール', 'LINE'] },
      transform: (text) => `♡ ${text} ♡`,
      allowSame: true
    },
    {
      id: 'spaced',
      groups: ['popular', 'aesthetic'],
      labels: { en: 'Spaced aesthetic', ja: 'スペース入り' },
      notes: { en: 'Adds airy spacing between characters.', ja: '文字の間にスペースを入れて余白感を出します。' },
      platforms: { en: ['caption', 'profile'], ja: ['キャプション', 'プロフィール'] },
      transform: spaced,
      allowSame: true
    },
    {
      id: 'italic',
      groups: ['bold'],
      labels: { en: 'Italic', ja: 'イタリック' },
      notes: { en: 'Slanted Unicode letters.', ja: '斜めのUnicode英字。' },
      platforms: { en: ['bio', 'quote'], ja: ['プロフィール', '引用'] },
      transform: (text) => mapRanges(text, 0x1d434, 0x1d44e, null, { h: 'ℎ' })
    },
    {
      id: 'bold-italic',
      groups: ['bold'],
      labels: { en: 'Bold italic', ja: '太字イタリック' },
      notes: { en: 'A stronger slanted style.', ja: '強めに見せる太字イタリック。' },
      platforms: { en: ['post title', 'name'], ja: ['投稿タイトル', '名前'] },
      transform: (text) => mapRanges(text, 0x1d468, 0x1d482)
    },
    {
      id: 'sans-bold',
      groups: ['bold'],
      labels: { en: 'Sans bold', ja: 'サンセリフ太字' },
      notes: { en: 'Clean bold letters for readable labels.', ja: '読みやすいサンセリフ風の太字。' },
      platforms: { en: ['label', 'Discord'], ja: ['ラベル', 'Discord'] },
      transform: (text) => mapRanges(text, 0x1d5d4, 0x1d5ee, 0x1d7ec)
    },
    {
      id: 'subscript',
      groups: ['small'],
      labels: { en: 'Subscript text', ja: '下付き小さい文字' },
      notes: { en: 'Tiny lowered letters and numbers.', ja: '下付きの小さい文字と数字。' },
      platforms: { en: ['small text', 'decoration'], ja: ['小さい文字', '装飾'] },
      transform: (text) => mapByTable(text, subscriptMap)
    },
    {
      id: 'tiny-quote',
      groups: ['small', 'cute'],
      labels: { en: 'Tiny label', ja: '小さなラベル' },
      notes: { en: 'Small text with a soft wrapper.', ja: '小さい文字をやわらかく囲みます。' },
      platforms: { en: ['bio label', 'status'], ja: ['プロフィールラベル', 'ステータス'] },
      transform: (text) => `˗ˏˋ ${mapByTable(text, superscriptMap)} ˎˊ˗`,
      allowSame: true
    },
    {
      id: 'negative-circled',
      groups: ['bubble'],
      labels: { en: 'Dark circled', ja: '黒丸囲み' },
      notes: { en: 'Dark circled numbers and uppercase letters.', ja: '黒丸数字と大文字の囲み文字。' },
      platforms: { en: ['gaming name', 'list'], ja: ['ゲーム名', 'リスト'] },
      transform: negativeCircled
    },
    {
      id: 'bubble-wrap',
      groups: ['popular', 'bubble', 'cute'],
      labels: { en: 'Bubble frame', ja: 'バブル囲み' },
      notes: { en: 'A round, soft text frame.', ja: '丸くやわらかい雰囲気の囲み。' },
      platforms: { en: ['bio', 'chat'], ja: ['プロフィール', 'チャット'] },
      transform: (text) => `꒰ ${text} ꒱`,
      allowSame: true
    },
    {
      id: 'parenthesized',
      groups: ['bubble'],
      labels: { en: 'Parenthesized', ja: '括弧アレンジ' },
      notes: { en: 'Simple rounded decoration.', ja: 'シンプルな括弧付きアレンジ。' },
      platforms: { en: ['name', 'status'], ja: ['名前', 'ステータス'] },
      transform: (text) => `(${text})`,
      allowSame: true
    },
    {
      id: 'reversed',
      groups: ['upside'],
      labels: { en: 'Reversed text', ja: '逆読み' },
      notes: { en: 'Reverses character order without flipping letters.', ja: '文字の順番だけを逆にします。' },
      platforms: { en: ['chat', 'status'], ja: ['チャット', 'ステータス'] },
      transform: (text) => Array.from(text).reverse().join(''),
      allowSame: true
    },
    {
      id: 'upside-frame',
      groups: ['upside', 'cute'],
      labels: { en: 'Upside down framed', ja: '逆さ文字フレーム' },
      notes: { en: 'Upside down text with small symbols.', ja: '逆さ文字を記号で囲みます。' },
      platforms: { en: ['fun post', 'chat'], ja: ['投稿', 'チャット'] },
      transform: (text) => `↯ ${upsideDown(text)} ↯`,
      allowSame: true
    },
    {
      id: 'fraktur',
      groups: ['gothic'],
      labels: { en: 'Gothic', ja: 'ゴシック風' },
      notes: { en: 'Bold fraktur-style Unicode text.', ja: '重めのゴシック風Unicode文字。' },
      platforms: { en: ['gaming name', 'title'], ja: ['ゲーム名', 'タイトル'] },
      transform: (text) => mapRanges(text, 0x1d56c, 0x1d586)
    },
    {
      id: 'monospace',
      groups: ['gothic', 'aesthetic'],
      labels: { en: 'Monospace', ja: '等幅風' },
      notes: { en: 'Code-like Unicode letters.', ja: 'コードっぽく見える等幅風の文字。' },
      platforms: { en: ['Discord', 'profile'], ja: ['Discord', 'プロフィール'] },
      transform: (text) => mapRanges(text, 0x1d670, 0x1d68a, 0x1d7f6)
    },
    {
      id: 'serif-bold',
      groups: ['gothic', 'bold'],
      labels: { en: 'Serif bold', ja: 'セリフ太字' },
      notes: { en: 'Classic bold mathematical text.', ja: 'クラシックな太字の英数字。' },
      platforms: { en: ['title', 'bio'], ja: ['タイトル', 'プロフィール'] },
      transform: (text) => mapRanges(text, 0x1d400, 0x1d41a, 0x1d7ce)
    },
    {
      id: 'dot-spaced',
      groups: ['aesthetic'],
      labels: { en: 'Dot spaced', ja: 'ドット区切り' },
      notes: { en: 'Separates letters with middle dots.', ja: '文字の間をドットで区切ります。' },
      platforms: { en: ['bio', 'caption'], ja: ['プロフィール', 'キャプション'] },
      transform: (text) => joinWords(text, '・', '   '),
      allowSame: true
    },
    {
      id: 'underline',
      groups: ['aesthetic'],
      labels: { en: 'Underline', ja: '下線付き' },
      notes: { en: 'Adds a Unicode underline mark.', ja: 'Unicodeの下線を文字に重ねます。' },
      platforms: { en: ['caption', 'label'], ja: ['キャプション', 'ラベル'] },
      transform: (text) => addCombiningMark(text, '\u0332')
    },
    {
      id: 'strike',
      groups: ['aesthetic'],
      labels: { en: 'Strikethrough', ja: '取り消し線' },
      notes: { en: 'Adds a Unicode strike mark.', ja: 'Unicodeの取り消し線を重ねます。' },
      platforms: { en: ['joke', 'status'], ja: ['ネタ投稿', 'ステータス'] },
      transform: (text) => addCombiningMark(text, '\u0336')
    },
    {
      id: 'sparkle-frame',
      groups: ['popular', 'cute'],
      labels: { en: 'Sparkle frame', ja: 'キラキラ囲み' },
      notes: { en: 'Sparkle symbols around your text.', ja: 'キラキラ記号で文字を囲みます。' },
      platforms: { en: ['caption', 'bio'], ja: ['キャプション', 'プロフィール'] },
      transform: (text) => `✦ ${text} ✦`,
      allowSame: true
    },
    {
      id: 'ribbon-frame',
      groups: ['popular', 'cute'],
      labels: { en: 'Ribbon frame', ja: 'リボン囲み' },
      notes: { en: 'Cute ribbon-style decoration.', ja: 'リボン風のかわいい囲み。' },
      platforms: { en: ['name', 'fan profile'], ja: ['名前', '推し活プロフィール'] },
      transform: (text) => `୨୧ ${text} ୨୧`,
      allowSame: true
    },
    {
      id: 'angel-frame',
      groups: ['cute'],
      labels: { en: 'Angel frame', ja: '天使フレーム' },
      notes: { en: 'Soft wing symbols for names and notes.', ja: '羽の記号でやわらかく見せます。' },
      platforms: { en: ['bio', 'LINE'], ja: ['プロフィール', 'LINE'] },
      transform: (text) => `꒰ঌ ${text} ໒꒱`,
      allowSame: true
    },
    {
      id: 'moon-frame',
      groups: ['popular', 'cute', 'aesthetic'],
      labels: { en: 'Moon frame', ja: '月フレーム' },
      notes: { en: 'A MojiMoon-style moon wrapper.', ja: 'MojiMoonらしい月の囲み。' },
      platforms: { en: ['bio', 'status'], ja: ['プロフィール', 'ステータス'] },
      transform: (text) => `☾ ${text} ☽`,
      allowSame: true
    }
  ];

  function readStoredList(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function writeStoredList(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function labelFor(style, field) {
    return style[field]?.[lang] || style[field]?.en || '';
  }

  function platformsFor(style) {
    return style.platforms?.[lang] || style.platforms?.en || [];
  }

  function mapRanges(text, upperBase, lowerBase, digitBase, exceptions = {}) {
    let changed = false;
    const value = Array.from(text).map((char) => {
      if (Object.prototype.hasOwnProperty.call(exceptions, char)) {
        changed = true;
        return exceptions[char];
      }
      const code = char.charCodeAt(0);
      if (upperBase && code >= 65 && code <= 90) {
        changed = true;
        return String.fromCodePoint(upperBase + code - 65);
      }
      if (lowerBase && code >= 97 && code <= 122) {
        changed = true;
        return String.fromCodePoint(lowerBase + code - 97);
      }
      if (digitBase && code >= 48 && code <= 57) {
        changed = true;
        return String.fromCodePoint(digitBase + code - 48);
      }
      return char;
    }).join('');
    return changed ? value : text;
  }

  function mapByTable(text, table) {
    let changed = false;
    const value = Array.from(text).map((char) => {
      if (!Object.prototype.hasOwnProperty.call(table, char)) return char;
      changed = true;
      return table[char];
    }).join('');
    return changed ? value : text;
  }

  function fullwidth(text) {
    let changed = false;
    const value = Array.from(text).map((char) => {
      const code = char.charCodeAt(0);
      if (code === 32) {
        changed = true;
        return '　';
      }
      if (code >= 33 && code <= 126) {
        changed = true;
        return String.fromCharCode(code + 0xfee0);
      }
      return char;
    }).join('');
    return changed ? value : text;
  }

  function circled(text) {
    const digitMap = { 0: '⓪', 1: '①', 2: '②', 3: '③', 4: '④', 5: '⑤', 6: '⑥', 7: '⑦', 8: '⑧', 9: '⑨' };
    let changed = false;
    const value = Array.from(text).map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        changed = true;
        return String.fromCodePoint(0x24b6 + code - 65);
      }
      if (code >= 97 && code <= 122) {
        changed = true;
        return String.fromCodePoint(0x24d0 + code - 97);
      }
      if (Object.prototype.hasOwnProperty.call(digitMap, char)) {
        changed = true;
        return digitMap[char];
      }
      return char;
    }).join('');
    return changed ? value : text;
  }

  function negativeCircled(text) {
    const digitMap = { 0: '⓿', 1: '❶', 2: '❷', 3: '❸', 4: '❹', 5: '❺', 6: '❻', 7: '❼', 8: '❽', 9: '❾' };
    let changed = false;
    const value = Array.from(text).map((char) => {
      const upper = char.toUpperCase();
      const code = upper.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        changed = true;
        return String.fromCodePoint(0x1f150 + code - 65);
      }
      if (Object.prototype.hasOwnProperty.call(digitMap, char)) {
        changed = true;
        return digitMap[char];
      }
      return char;
    }).join('');
    return changed ? value : text;
  }

  function upsideDown(text) {
    return Array.from(text).reverse().map((char) => upsideDownMap[char] || char).join('');
  }

  function spaced(text) {
    return joinWords(text, ' ', '   ');
  }

  function joinWords(text, letterJoiner, wordJoiner) {
    return text.trim().split(/\s+/).map((word) => Array.from(word).join(letterJoiner)).join(wordJoiner);
  }

  function addCombiningMark(text, mark) {
    let changed = false;
    const value = Array.from(text).map((char) => {
      if (/\s/.test(char)) return char;
      changed = true;
      return `${char}${mark}`;
    }).join('');
    return changed ? value : text;
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1400);
  }

  function track(name, params = {}) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      tool_slug: config.slug || 'fancy-text-generator',
      page_path: window.location.pathname,
      ...params
    });
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
    showToast(ui.copiedToast);
  }

  function flashCopied(button) {
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

  function rememberRecent(text) {
    recent = recent.filter((item) => item !== text);
    recent.unshift(text);
    recent = recent.slice(0, recentLimit);
    writeStoredList(recentKey, recent);
    renderRecent();
  }

  function filteredStyles() {
    const text = input.value.trim();
    const favoriteSet = new Set(favorites);
    return styles.filter((style) => {
      if (activeCategory === 'favorites') return favoriteSet.has(style.id);
      return style.groups.includes(activeCategory);
    }).map((style) => {
      const value = style.transform(text);
      return { style, value };
    }).filter((item, index, list) => {
      if (!text) return false;
      if (!item.style.allowSame && item.value === text) return false;
      return list.findIndex((candidate) => candidate.value === item.value) === index;
    });
  }

  function renderTabs() {
    tabs.innerHTML = '';
    categories.forEach((category) => {
      const button = document.createElement('button');
      button.className = `style-tab${category.id === activeCategory ? ' active' : ''}`;
      button.type = 'button';
      button.dataset.category = category.id;
      button.textContent = category.label;
      if (category.id === activeCategory) button.setAttribute('aria-current', 'page');
      tabs.appendChild(button);
    });
  }

  function renderResults() {
    const text = input.value.trim();
    const rows = filteredStyles();
    results.innerHTML = '';
    if (count) count.textContent = ui.chars(Array.from(input.value).length, maxLength);
    if (resultCount) resultCount.textContent = ui.outputCount(rows.length);

    if (!text) {
      renderEmpty(ui.empty);
      return;
    }
    if (!rows.length) {
      renderEmpty(activeCategory === 'favorites' ? ui.favoritesEmpty : ui.noResults);
      return;
    }

    rows.forEach(({ style, value }) => {
      const row = document.createElement('article');
      row.className = 'fancy-result';
      row.dataset.styleId = style.id;

      const favorite = document.createElement('button');
      favorite.className = `favorite-btn${favorites.includes(style.id) ? ' active' : ''}`;
      favorite.type = 'button';
      favorite.dataset.favoriteStyle = style.id;
      favorite.setAttribute('aria-label', favorites.includes(style.id) ? ui.removeFavorite : ui.favorite);
      favorite.textContent = favorites.includes(style.id) ? '★' : '☆';

      const main = document.createElement('div');
      main.className = 'fancy-result-main';

      const output = document.createElement('div');
      output.className = 'fancy-output';
      output.textContent = value;

      const meta = document.createElement('div');
      meta.className = 'fancy-meta';

      const title = document.createElement('strong');
      title.textContent = labelFor(style, 'labels');
      const note = document.createElement('span');
      note.textContent = labelFor(style, 'notes');
      meta.append(title, note);

      const platformList = platformsFor(style);
      if (platformList.length) {
        const chips = document.createElement('div');
        chips.className = 'platform-chip-row';
        platformList.forEach((item) => {
          const chip = document.createElement('span');
          chip.className = 'platform-chip';
          chip.textContent = item;
          chips.appendChild(chip);
        });
        meta.appendChild(chips);
      }

      main.append(output, meta);

      const copy = document.createElement('button');
      copy.className = 'copy-output-btn';
      copy.type = 'button';
      copy.dataset.copyValue = value;
      copy.textContent = ui.copy;

      row.append(favorite, main, copy);
      results.appendChild(row);
    });
  }

  function renderEmpty(message) {
    const empty = document.createElement('div');
    empty.className = 'fancy-empty';
    empty.textContent = message;
    results.appendChild(empty);
  }

  function renderRecent() {
    if (!recentWrap) return;
    recentWrap.innerHTML = '';
    recentWrap.hidden = false;
    recentWrap.classList.toggle('is-open', recentOpen);
    recentWrap.classList.toggle('is-empty', !recent.length);
    recentWrap.setAttribute('aria-label', ui.recentTitle);

    const bar = document.createElement('div');
    bar.className = 'fancy-recent-bar';

    const toggle = document.createElement('button');
    toggle.className = 'fancy-recent-toggle';
    toggle.type = 'button';
    toggle.dataset.toggleRecent = '';
    toggle.setAttribute('aria-expanded', recentOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', recentOpen ? ui.closeRecent : ui.openRecent);
    toggle.innerHTML = `
      <span class="fancy-recent-icon" aria-hidden="true">${recentOpen ? '⌄' : '⌃'}</span>
      <span class="fancy-recent-title">${ui.recentTitle}</span>
      <span class="fancy-recent-count">${recent.length ? ui.recentCount(recent.length) : ui.recentEmpty}</span>
      <span class="fancy-recent-action">${recentOpen ? ui.close : ui.open}</span>
    `;

    const latest = document.createElement('button');
    latest.className = 'fancy-recent-latest';
    latest.type = 'button';
    latest.dataset.copyLatest = '';
    latest.disabled = !recent.length;
    latest.textContent = ui.copyLatest;
    if (recent[0]) latest.dataset.recentValue = recent[0];
    bar.append(toggle, latest);

    const body = document.createElement('div');
    body.className = 'fancy-recent-body';

    if (!recent.length) {
      const empty = document.createElement('p');
      empty.className = 'fancy-recent-empty';
      empty.textContent = ui.recentEmpty;
      body.appendChild(empty);
      recentWrap.append(bar, body);
      return;
    }

    const head = document.createElement('div');
    head.className = 'fancy-recent-head';
    const title = document.createElement('strong');
    title.textContent = ui.recentTitle;
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.dataset.clearRecent = '';
    clear.textContent = ui.clearRecent;
    head.append(title, clear);

    const chips = document.createElement('div');
    chips.className = 'fancy-recent-chips';
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

  function toggleFavorite(styleId) {
    if (favorites.includes(styleId)) {
      favorites = favorites.filter((item) => item !== styleId);
    } else {
      favorites.unshift(styleId);
    }
    writeStoredList(favoriteKey, favorites);
    renderResults();
  }

  function setupSamples() {
    root.querySelectorAll('[data-sample]').forEach((button) => {
      button.addEventListener('click', () => {
        input.value = button.dataset.sample || '';
        input.dispatchEvent(new Event('input'));
        input.focus();
        track('sample_select', { sample_length: input.value.length });
      });
    });
  }

  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    renderTabs();
    renderResults();
    track('category_select', { category: activeCategory });
  });

  results.addEventListener('click', (event) => {
    const favorite = event.target.closest('[data-favorite-style]');
    if (favorite) {
      toggleFavorite(favorite.dataset.favoriteStyle);
      track('favorite_toggle', { category: activeCategory });
      return;
    }
    const copy = event.target.closest('[data-copy-value]');
    if (!copy) return;
    copyText(copy.dataset.copyValue, copy);
    track('tool_copy', { category: activeCategory, output_length: copy.dataset.copyValue.length });
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
      track('draft_clear_history');
      return;
    }
    const button = event.target.closest('[data-recent-value], [data-copy-latest]');
    if (!button) return;
    copyText(button.dataset.recentValue, button);
    track('recent_copy', { output_length: button.dataset.recentValue.length });
  });

  input.addEventListener('input', () => {
    if (Array.from(input.value).length > maxLength) {
      input.value = Array.from(input.value).slice(0, maxLength).join('');
    }
    renderResults();
    window.clearTimeout(inputTrackTimer);
    inputTrackTimer = window.setTimeout(() => {
      if (input.value.trim()) track('tool_input', { input_length: input.value.trim().length });
    }, 900);
  });

  clearInput?.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus();
  });

  desktopQuery.addEventListener('change', (event) => {
    recentOpen = event.matches;
    renderRecent();
  });

  setupSamples();
  renderTabs();
  renderResults();
  renderRecent();
})();
