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
    '大泣き': 'Loudly crying',
    '嬉し泣き': 'Tears of joy',
    '照れる': 'Blushing',
    'とける': 'Melting',
    'ひみつ': 'Secret',
    '指ハート': 'Finger heart',
    '了解': 'Got it',
    '拍手': 'Clapping',
    'うるうる': 'Pleading eyes',
    'くすくす': 'Giggle',
    '泣き顔': 'Crying face',
    '涙の笑顔': 'Smiling with tear',
    '泣き猫': 'Crying cat',
    'しずく': 'Droplet',
    'にっこり': 'Grinning',
    '大笑い': 'Big laugh',
    'やさしい笑顔': 'Soft smile',
    '微笑み': 'Slight smile',
    '笑顔': 'Smiling face',
    '猫の笑顔': 'Smiling cat',
    'いいね': 'Thumbs up',
    'ピース': 'Peace sign',
    'OK': 'OK hand',
    '握手': 'Handshake',
    '土下座する人': 'Bowing person',
    '土下座する女性': 'Bowing woman',
    '土下座する男性': 'Bowing man',
    'ハートの手': 'Heart hands'
  };
  const tagMap = {
    '大泣き': ['tear', 'crying', 'sad'],
    '嬉し泣き': ['tear', 'crying', 'laugh', 'joy'],
    'うるうる': ['tear', 'crying', 'emotional', 'pleading'],
    '泣き顔': ['tear', 'crying', 'sad'],
    '涙の笑顔': ['tear', 'smile', 'crying', 'emotional'],
    '泣き猫': ['tear', 'crying', 'cat'],
    'しずく': ['tear', 'drop', 'droplet'],
    'にこにこ': ['smile', 'happy', 'soft'],
    'くすくす': ['smile', 'happy', 'laugh'],
    'にっこり': ['smile', 'happy', 'grin'],
    '大笑い': ['smile', 'happy', 'laugh'],
    'やさしい笑顔': ['smile', 'happy', 'soft'],
    '微笑み': ['smile', 'happy', 'soft'],
    '笑顔': ['smile', 'happy'],
    '猫の笑顔': ['smile', 'happy', 'cat'],
    '拍手': ['hand', 'clap', 'celebrate'],
    'お願い': ['please', 'thanks'],
    'いいね': ['hand', 'thumbs up', 'like'],
    'ピース': ['hand', 'peace'],
    'OK': ['hand', 'ok'],
    '握手': ['hand', 'handshake', 'thanks'],
    '土下座する人': ['hand', 'bow', 'sorry', 'please'],
    '土下座する女性': ['hand', 'bow', 'sorry', 'please'],
    '土下座する男性': ['hand', 'bow', 'sorry', 'please'],
    'ハートの手': ['hand', 'heart', 'love', 'thanks'],
    '指ハート': ['hand', 'heart', 'finger heart']
  };
  const valueTagMap = {
    '🙏': ['hand', 'folded hands', 'please', 'thanks']
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
    { label: 'Tears', query: 'tear crying' },
    { label: 'Hands', query: 'hand please thanks' },
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
      ...(tagMap[item.label] || []),
      ...(valueTagMap[item.value] || []),
      categories[item.category],
      item.category,
      labelMap[item.label],
      'emoji',
      'copy paste'
    ].filter(Boolean)
  }));
})();
