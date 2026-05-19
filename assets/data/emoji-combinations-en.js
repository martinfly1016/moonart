(function () {
  const data = window.MojiMoonToolData;
  if (!data) return;

  const categories = {
    all: 'All',
    kawaii: 'Cute',
    white: 'White',
    pink: 'Pink',
    heart: 'Hearts',
    season: 'Seasonal',
    bio: 'Bio'
  };

  const labelMap = {
    '透明感': 'Clear aesthetic',
    '夜空': 'Night sky',
    '白くまスイーツ': 'White bear sweets',
    '白系プロフィール': 'White profile',
    'ピンク可愛い': 'Cute pink',
    '甘いピンク': 'Sweet pink',
    'バレエコア': 'Balletcore',
    '天使ハート': 'Angel heart',
    'きゅん': 'Heart flutter',
    'ラブレター': 'Love letter',
    '春': 'Spring',
    '夏': 'Summer',
    '秋': 'Autumn',
    '冬': 'Winter',
    '名前デコ': 'Name decoration',
    '推し活': 'Fan profile',
    '日常アカウント': 'Daily account',
    'ムード': 'Mood',
    'ありがとう': 'Thank you',
    'おやすみ': 'Good night',
    '誕生日': 'Birthday',
    '投稿告知': 'New post'
  };

  data.slug = 'emoji-combinations-en';
  data.ui = {
    copied: 'Copied',
    emptyDraft: 'Add a combination before copying.',
    openDraft: 'Open copy draft',
    closeDraft: 'Close copy draft',
    draftTitle: 'Copy draft',
    emptyCount: 'Empty',
    open: 'Open',
    close: 'Close',
    copy: 'Copy',
    copiedToast: 'Copied',
    draftLimit: (limit) => `You can add up to ${limit} characters.`,
    noResults: 'No combinations found. Try another keyword.',
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
    { label: 'Cute', query: 'cute kawaii' },
    { label: 'White', query: 'white clear aesthetic' },
    { label: 'Pink', query: 'pink' },
    { label: 'Hearts', query: 'heart love' },
    { label: 'Bio', query: 'bio profile instagram' },
    { label: 'Caption', query: 'caption post message' },
    { label: 'Birthday', query: 'birthday' },
    { label: 'Seasonal', query: 'spring summer autumn winter' },
    { label: 'Fan', query: 'fan profile name' }
  ];
  data.categories = data.categories.map((category) => ({
    ...category,
    label: categories[category.id] || category.label
  }));
  data.items = data.items.map((item) => ({
    ...item,
    label: labelMap[item.label] || categories[item.category] || 'Combination',
    tags: [
      ...(item.tags || []),
      categories[item.category],
      item.category,
      labelMap[item.label],
      'emoji combination',
      'copy paste'
    ].filter(Boolean)
  }));
})();
