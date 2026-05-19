(function () {
  const data = window.MojiMoonToolData;
  if (!data) return;

  const categories = {
    all: 'All',
    heart: 'Hearts',
    star: 'Stars',
    line: 'Lines',
    bracket: 'Brackets',
    arrow: 'Arrows',
    number: 'Numbers'
  };

  const labelMap = {
    '白ハート': 'White heart',
    '黒ハート': 'Black heart',
    'ハート': 'Heart',
    '矢ハート': 'Arrow heart',
    '装飾ハート': 'Decorative heart',
    '小さなハート': 'Small heart',
    '四芒星': 'Four-point star',
    '白い星': 'White star',
    '星': 'Star',
    '黒星': 'Black star',
    '花': 'Flower',
    '花びら': 'Petal',
    'ゆる線': 'Soft line',
    '余白ドット': 'Spacer dots',
    '天使の羽': 'Angel wings',
    '小さな光': 'Tiny sparkle',
    '太線': 'Bold line',
    'リボン線': 'Ribbon line',
    'すみ付き括弧': 'Corner brackets',
    '白括弧': 'White brackets',
    '二重山括弧': 'Double angle brackets',
    '丸い括弧': 'Round brackets',
    '右矢印': 'Right arrow',
    '二重矢印': 'Double arrow',
    '細矢印': 'Thin arrow',
    '曲がり矢印': 'Bent arrow',
    '丸数字1': 'Circled number 1',
    '丸数字2': 'Circled number 2',
    '丸数字3': 'Circled number 3'
  };

  data.slug = 'special-characters-en';
  data.ui = {
    copied: 'Copied',
    emptyDraft: 'Add symbols before copying.',
    openDraft: 'Open copy draft',
    closeDraft: 'Close copy draft',
    draftTitle: 'Copy draft',
    emptyCount: 'Empty',
    open: 'Open',
    close: 'Close',
    copy: 'Copy',
    copiedToast: 'Copied',
    draftLimit: (limit) => `You can add up to ${limit} characters.`,
    noResults: 'No symbols found. Try another keyword.',
    fallbackLabel: 'Click to add',
    previous: 'Prev',
    next: 'Next',
    pageCount: (total, start, end) => `${start}-${end} of ${total}`,
    recentTitle: 'Recently used',
    clearRecent: 'Clear history',
    clearRecentToast: 'History cleared',
    addedToast: 'Added to draft',
    charCount: (count) => `${count} chars`,
    charLimitCount: (count, limit) => `${count}/${limit} chars`
  };
  data.quickFilters = [
    { label: 'Hearts', query: 'heart' },
    { label: 'Cute', query: 'cute kawaii' },
    { label: 'Sparkles', query: 'sparkle star' },
    { label: 'Stars', query: 'star' },
    { label: 'Lines', query: 'line divider' },
    { label: 'Brackets', query: 'bracket' },
    { label: 'Arrows', query: 'arrow' },
    { label: 'Bio', query: 'bio profile divider' },
    { label: 'Numbers', query: 'number circled' }
  ];
  data.categories = data.categories.map((category) => ({
    ...category,
    label: categories[category.id] || category.label
  }));
  data.items = data.items.map((item) => ({
    ...item,
    label: labelMap[item.label] || categories[item.category] || 'Symbol',
    tags: [
      ...(item.tags || []),
      categories[item.category],
      item.category,
      labelMap[item.label],
      'special character',
      'symbol',
      'copy paste'
    ].filter(Boolean)
  }));
})();
