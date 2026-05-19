(function () {
  const data = window.MojiMoonToolData;
  if (!data) return;

  const categories = {
    all: 'All',
    kawaii: 'Cute',
    heart: 'Hearts',
    sparkle: 'Sparkles',
    face: 'Faces',
    social: 'Social'
  };

  const labelMap = {
    'きゅん': 'Heart hands',
    'お願い': 'Please',
    '透明感': 'Clear aesthetic',
    '天使': 'Angel',
    'リボン': 'Ribbon',
    'くま': 'Bear',
    'ミラー': 'Mirror',
    '魔法': 'Magic',
    '白ハート': 'White heart',
    'ピンクハート': 'Pink heart',
    '恋': 'Love',
    'きらめく恋': 'Sparkling love',
    'ラブレター': 'Love letter',
    '熱いハート': 'Fire heart',
    '定番キラキラ': 'Classic sparkle',
    '星': 'Star',
    '輝く星': 'Glowing star',
    '流れ星': 'Shooting star',
    '月': 'Moon',
    '雲': 'Cloud',
    'チューリップ': 'Tulip',
    'さくらんぼ': 'Cherries',
    'カップケーキ': 'Cupcake',
    'ミルク': 'Milk',
    'カフェ': 'Cafe',
    '写真': 'Photo',
    '音楽': 'Music',
    'メモ': 'Note',
    'にこにこ': 'Smile',
    '泣く': 'Crying',
    '笑う': 'Laughing',
    '照れる': 'Blushing',
    'とける': 'Melting',
    'ひみつ': 'Secret',
    '指ハート': 'Finger heart',
    '了解': 'Got it'
  };

  data.slug = 'emoji-copy-en';
  data.ui = {
    copied: 'Copied',
    emptyDraft: 'Add emoji before copying.',
    openDraft: 'Open copy draft',
    closeDraft: 'Close copy draft',
    draftTitle: 'Copy draft',
    emptyCount: 'Empty',
    open: 'Open',
    close: 'Close',
    copy: 'Copy',
    copiedToast: 'Copied',
    draftLimit: (limit) => `You can add up to ${limit} characters.`,
    noResults: 'No emoji found. Try another keyword.',
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
    { label: 'Pink', query: 'pink heart' },
    { label: 'Hearts', query: 'heart love' },
    { label: 'Sparkles', query: 'sparkle star' },
    { label: 'Faces', query: 'face smile' },
    { label: 'Instagram', query: 'instagram profile' },
    { label: 'Bio', query: 'bio name profile' },
    { label: 'Discord', query: 'discord chat reaction' }
  ];
  data.categories = data.categories.map((category) => ({
    ...category,
    label: categories[category.id] || category.label
  }));
  data.items = data.items.map((item) => ({
    ...item,
    label: labelMap[item.label] || categories[item.category] || 'Emoji',
    tags: [
      ...(item.tags || []),
      categories[item.category],
      item.category,
      labelMap[item.label],
      'emoji',
      'copy paste'
    ].filter(Boolean)
  }));
})();
