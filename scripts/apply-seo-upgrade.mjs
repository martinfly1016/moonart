import fs from 'node:fs/promises';

const file = new URL('../_content/ja-copy-pages.json', import.meta.url);
const source = JSON.parse(await fs.readFile(file, 'utf8'));
const bead = (campaign) => `https://beads.mojimoon.com/?utm_source=mojimoon&utm_medium=referral&utm_campaign=${campaign}`;

const pair = (value, label, tags = [], extra = {}) => ({ value, label, tags, ...extra });
const group = (category, heading, tags, items, extra = {}) => ({ category, heading, tags, ...extra, items });

function placeholder(label) {
  return /^\S.{0,24}\s+\d+$/.test(String(label || '').trim());
}

function withLeftovers(oldPage, next) {
  if (!oldPage) return next;
  const have = new Set(next.itemGroups.flatMap((entry) => entry.items.map((item) => item.value)));
  const extra = [];
  for (const entry of oldPage.itemGroups || []) {
    for (const item of entry.items) {
      const value = typeof item === 'string' ? item : item.value;
      if (!value || have.has(value)) continue;
      have.add(value);
      const label = typeof item === 'string' ? value : (item.label || value);
      extra.push(pair(value, placeholder(label) ? value : label));
    }
  }
  if (!extra.length) return next;
  return {
    ...next,
    categories: next.categories.some((category) => category.id === 'more')
      ? next.categories
      : [...next.categories, { id: 'more', label: 'ほか' }],
    itemGroups: [...next.itemGroups, group('more', '前のページから残した候補', ['その他'], extra)]
  };
}

const base = {
  lastmod: '2026-10-11',
  skipGeneratedEnrichment: true,
  showGroupHeadings: true,
  pageSize: 160,
  changefreq: 'weekly',
  priority: '0.8'
};

const pages = [];

pages.push({
  ...base,
  slug: 'special-characters-line',
  path: '/special-characters/line/',
  family: 'special-characters',
  indexing: 'priority',
  priority: '0.85',
  title: '区切り線 コピペ | 飾り線・かわいいライン特殊文字 - MojiMoon',
  description: '区切り線コピペと飾り線を、細い点線・波線・星やリボンのライン・プロフィール用に分けてコピーできます。かわいい区切り線もこのページにまとめています。',
  ogTitle: '区切り線コピペ | 飾り線・かわいいライン',
  ogDescription: 'プロフィールや投稿の境目に置く区切り線と飾り線を、長さと雰囲気で選べます。',
  eyebrow: 'Divider Lines',
  h1: '区切り線コピペ・飾り線',
  hero: 'プロフィールの自己紹介とリンクのあいだ、投稿の見出しの下、メモの段落の切れ目。置く場所が先に決まると、線の長さも決まります。短い点線、名前の下にはえる飾り、インスタの一行に収まるものに分けました。',
  toolLabel: '区切り線コピペ',
  searchPlaceholder: '区切り線、飾り線、点線、インスタ、プロフィール',
  draftPlaceholder: '線をクリックするとここに入ります',
  composerHint: '上下の言葉を草稿で足してから、まとめてコピーできます。',
  recentLabel: '最近使った区切り線',
  categories: [
    { id: 'plain', label: '線だけ' },
    { id: 'cute', label: '飾り線' },
    { id: 'dot', label: '点線' },
    { id: 'profile', label: 'プロフィール' }
  ],
  quickFilters: [
    { label: '区切り線', query: '区切り線' },
    { label: '飾り線', query: '飾り' },
    { label: '点線', query: '点' },
    { label: 'インスタ', query: 'プロフィール' }
  ],
  itemGroups: [
    group('plain', '線だけの区切り', ['区切り線', 'ライン'], [
      pair('────', '細い横線', ['区切り線']),
      pair('━━━━', '太い横線', ['区切り線']),
      pair('┈┈┈┈', '点線', ['区切り線', '点']),
      pair('┅┅┅┅', '長い点線', ['区切り線', '点']),
      pair('〜〜〜〜', '波線', ['区切り線']),
      pair('﹏﹏﹏﹏', '下に揺れる波', ['区切り線']),
      pair('〰〰〰', '大きくうねる波', ['区切り線']),
      pair('⌇⌇⌇⌇', '斜めの切れ目', ['区切り線']),
      pair('╌╌╌╌', '破線', ['区切り線', '点']),
      pair('─────', '少し長い細線', ['区切り線']),
      pair('━━━━━━━━', '画面幅に近い太線', ['区切り線']),
      pair('┈┈┈┈┈┈', '文章の下に置く点線', ['区切り線', '点']),
      pair('⋯⋯⋯⋯', '中点の列', ['区切り線', '点']),
      pair('• • • •', '丸点の列', ['区切り線', '点']),
      pair('___', '下線だけの切れ目', ['区切り線'])
    ]),
    group('cute', '飾り線', ['飾り線', 'かわいい'], [
      pair('୨୧ ┈┈ ୨୧', 'リボンで止めた点線', ['飾り', 'リボン']),
      pair('♡ ┈┈ ♡', 'ハートの区切り', ['飾り', 'ハート']),
      pair('✦ ┈┈ ✦', '星で止めた点線', ['飾り', '星']),
      pair('𓂃 𓈒𓏸', '象形文字の余白', ['飾り', 'おしゃれ']),
      pair('₊˚⊹ 𓂃', '小さい光とゆる線', ['飾り']),
      pair('ꕤ*.ﾟ', '花びらの列', ['飾り', '花']),
      pair('꒰ঌ ໒꒱', '羽の飾り', ['飾り']),
      pair('⋆⸜ ♡ ⸝⋆', '中央にハート', ['飾り', 'ハート']),
      pair('✦ ━━ ✦', '星と太い線', ['飾り', '星']),
      pair('♡*.ﾟ', 'ハートと点', ['飾り']),
      pair('── ୨୧ ──', '中央にリボン', ['飾り', 'リボン']),
      pair('𓍯 𓂃 𓍯', '花のような象形文字', ['飾り']),
      pair('✧ favorite ✧', '好きなものリストの見出し', ['飾り', 'プロフィール']),
      pair('ꕤ profile ꕤ', 'プロフィールの小見出し', ['飾り', 'プロフィール']),
      pair('𖤐 diary 𖤐', '日記の見出し', ['飾り'])
    ]),
    group('dot', '点とドットの線', ['点', 'ドット', '区切り線'], [
      pair('· · · · ·', 'まばらな点', ['点', 'ドット']),
      pair('・‥…━━━', '点から実線へ', ['点', '区切り線']),
      pair('････････', '中黒の点線', ['点']),
      pair('∘ ∘ ∘ ∘', '小さい丸', ['点', 'ドット']),
      pair('✦ · ✦ · ✦', '星と点の交互', ['点', '星', 'ドット']),
      pair('♡ · ♡ · ♡', 'ハートと点', ['点', 'ハート']),
      pair('┈┈ · ┈┈', '点線の真ん中に一粒', ['点']),
      pair('⠀·⠀·⠀·⠀·', '間隔の広い点', ['ドット', '点'])
    ]),
    group('profile', 'プロフィールに置く行', ['プロフィール', 'インスタ', '区切り線'], [
      pair('about me 𓂃', '自己紹介の見出し', ['プロフィール']),
      pair('── about me ──', '自己紹介を線で挟む', ['プロフィール']),
      pair('link → 𓂃', 'リンク案内', ['プロフィール']),
      pair('✦ link below ✦', '下にリンクがある印', ['プロフィール']),
      pair('new post 𓈒𓏸', '新しい投稿の印', ['プロフィール']),
      pair('daily log ───', '日記の区切り', ['プロフィール']),
      pair('推し活 ୨୧', '推しの欄', ['プロフィール', 'リボン']),
      pair('♡ oshi ♡', '推しの名前の上', ['プロフィール', 'ハート']),
      pair('── memo ──', 'メモの境目', ['プロフィール']),
      pair('── contact ──', '連絡先の前', ['プロフィール']),
      pair('bio ﹏﹏', '自己紹介の下線', ['プロフィール']),
      pair('name 𓂃 𓈒𓏸', '名前の下', ['プロフィール'])
    ])
  ],
  seo: {
    heading: '線の長さで選ぶ',
    paragraphs: [
      '区切り線は情報の切れ目、飾り線はそこをかわいく見せるための線です。インスタの自己紹介は一行が短いので、━━━━ のような太い線ははみ出しやすく、┈┈ や 𓂃 のほうが収まります。',
      '線そのものが欲しいときは上の一覧、リボンの形が欲しいときはリボンのページです。'
    ],
    sections: [
      {
        heading: '飾り線とただの線',
        paragraphs: ['両端に星やハートが付いた線は、区切りをかわいく見せたいときに使います。本文の段落を切るだけなら、両端に飾りがない線のほうが読みやすいです。'],
        cards: [
          { title: '自己紹介の下', body: '𓂃 や ┈┈┈┈ は、名前の直下に置いても次の行の文字を食いません。' },
          { title: 'リンクの前', body: 'link → のように矢印を足すと、線が案内になります。矢印だけの一覧は矢印のページです。' },
          { title: '投稿の見出し', body: '✦ ━━ ✦ は写真のキャプション先頭に置くと、本文と見出しが分かれます。' }
        ]
      }
    ],
    links: [
      { href: '/special-characters/ribbon/', label: 'リボン' },
      { href: '/special-characters/dot/', label: 'ドット記号' },
      { href: '/special-characters/star/', label: '星' },
      { href: '/special-characters/', label: '特殊文字一覧' }
    ]
  },
  faq: [
    { question: '区切り線はインスタの自己紹介に入りますか？', answer: '短い点線や 𓂃 は入りやすいです。太い ━━━━ を何本も続けると、プロフィールの文字数を先に使い切ります。' },
    { question: '飾り線と区切り線は別物ですか？', answer: '切れ目としての線が区切り線、両端にハートや星が付いて見た目が主役になるものが飾り線です。このページでは両方コピーできます。' },
    { question: '点線が文字化けすることはありますか？', answer: '┈ や ⋯ は多くのスマホで表示されます。古い機種で点だけが四角になるときは、──── に替えると安全です。' }
  ],
  related: [
    { href: '/special-characters/ribbon/', title: 'リボン', description: '線ではなく、結び目の形が欲しいとき。' },
    { href: '/special-characters/star/', title: '星', description: '星だけで区切りを作りたいとき。' },
    { href: '/special-characters/instagram/', title: 'Instagramの記号', description: '自己紹介の行をまとめて整えたいとき。' }
  ]
});

pages.push({
  ...base,
  slug: 'special-characters-ribbon',
  path: '/special-characters/ribbon/',
  family: 'special-characters',
  indexing: 'priority',
  priority: '0.85',
  title: 'リボン コピペ | リボン特殊文字・ドットリボン - MojiMoon',
  description: 'リボンの特殊文字 ୨୧ や ୨ৎ、名前を挟む形、点で描いたドットリボンをコピーできます。ドットの形はアイロンビーズの図案にも移せます。',
  ogTitle: 'リボンコピペ | リボン特殊文字とドットリボン',
  ogDescription: '量産型の名前飾りから、点で描いたリボンまで。',
  eyebrow: 'Ribbon Symbols',
  h1: 'リボン特殊文字・ドットリボン コピペ',
  hero: '୨୧ はリボンというより、名前の両脇に置く小さな結び目です。絵文字の 🎀 は色が付いて大きく、ドットリボンはマス目に起こしやすい形です。欲しいのが「記号」か「絵」かで選んでください。',
  toolLabel: 'リボンコピペ',
  searchPlaceholder: 'リボン、ドットリボン、名前、量産型',
  draftPlaceholder: 'リボンをクリックするとここに入ります',
  composerHint: '名前を真ん中に置いてからコピーすると、フレームとして使えます。',
  recentLabel: '最近使ったリボン',
  categories: [
    { id: 'mark', label: '記号' },
    { id: 'name', label: '名前' },
    { id: 'dot', label: 'ドットリボン' },
    { id: 'emoji', label: '絵文字' }
  ],
  quickFilters: [
    { label: 'リボン', query: 'リボン' },
    { label: 'ドット', query: 'ドット' },
    { label: '名前', query: '名前' },
    { label: '量産型', query: '量産' }
  ],
  itemGroups: [
    group('mark', '一文字で貼るリボン', ['リボン', '特殊文字'], [
      pair('୨୧', 'いちばん貼られている結び目', ['リボン']),
      pair('୨ৎ', '片側がほどけた形', ['リボン']),
      pair('ꔫ', '小さな花結び', ['リボン']),
      pair('⋈', '交差したリボン', ['リボン']),
      pair('ʚɞ', '羽のような輪', ['リボン']),
      pair('ʚ♡ɞ', 'ハートを包んだ輪', ['リボン', 'ハート']),
      pair('꒰ঌ ໒꒱', '羽のフレーム', ['リボン']),
      pair('꒰ა ໒꒱', '手で包むフレーム', ['リボン']),
      pair('🎀', '色つきのリボン絵文字', ['リボン', '絵文字']),
      pair('🎗️', 'ループのリボン', ['リボン']),
      pair('𐙚', '極小の結び目', ['リボン', '小さい']),
      pair('ꨄ', 'ハートに見えるリボン', ['リボン', 'ハート'])
    ]),
    group('name', '名前の前後', ['リボン', '名前'], [
      pair('♡୨୧♡', 'ハートで挟んだ結び目', ['名前']),
      pair('₊˚୨୧˚₊', '光を足した名前飾り', ['名前']),
      pair('꒰ ୨୧ ꒱', '丸括弧の中のリボン', ['名前']),
      pair('˗ˏˋ ୨୧ ˎˊ˗', '両側に尾がある', ['名前']),
      pair('୨୧ name ୨୧', '名前を入れる型', ['名前']),
      pair('推し ୨୧', '推しの欄の印', ['名前', '量産']),
      pair('量産型 ୨୧', '量産型プロフィールの印', ['量産', '名前']),
      pair('ʚ ୨୧ ɞ', '輪の中の結び目', ['名前']),
      pair('𓂃 ୨ৎ 𓂃', '余白の多い名前', ['名前']),
      pair('⋆⸜ ୨୧ ⸝⋆', '中央にリボンを置く', ['名前'])
    ]),
    group('dot', 'ドットリボン', ['ドットリボン', 'ドット', 'リボン'], [
      pair('⣠⣄  ⣠⣄\n⠙⠋⠴⠛⠋\n  ⠈⠃', '輪が二つの小さなリボン', ['ドットリボン', 'ドット'], { wide: true, beadHref: bead('dot-ribbon') }),
      pair('╭╮╭╮\n╰╯╰╯\n ╰╯', '線で描いた輪', ['ドットリボン'], { wide: true, beadHref: bead('dot-ribbon') }),
      pair('♡⠀♡⠀♡', '点の間隔で並べたハート', ['ドット', 'ハート'], { beadHref: bead('dot-ribbon') }),
      pair('⠤⠤♡⠤⠤', '点線の中央にハート', ['ドットリボン'], { beadHref: bead('dot-ribbon') }),
      pair('· · ♡ · ·', 'まばらなドットリボン', ['ドットリボン', 'ドット'], { beadHref: bead('dot-ribbon') }),
      pair('⣿ 🎀 ⣿', 'ブロックで挟んだ絵文字', ['ドット', 'リボン'], { beadHref: bead('dot-ribbon') }),
      pair('═╗  ╔═\n ╚╗╔╝\n  ╚╝', '左右に尾のある結び', ['ドットリボン'], { wide: true, beadHref: bead('dot-ribbon') }),
      pair('˚₊· 🎀 ·₊˚', '絵文字リボンに点を添える', ['ドット', 'リボン'], { beadHref: bead('dot-ribbon') })
    ]),
    group('emoji', '色のついたリボン周り', ['リボン', '絵文字'], [
      pair('🎀💗', 'ピンクを足す', ['絵文字']),
      pair('🎀🤍', '白とリボン', ['絵文字']),
      pair('🎁🎀', '包みとリボン', ['絵文字']),
      pair('🧸🎀', 'ぬいぐるみとリボン', ['絵文字', 'かわいい']),
      pair('୨୧ ┈┈ ୨୧', 'リボンの区切り線', ['リボン', '区切り']),
      pair('♡ ୨୧ ♡', 'ハートとリボンの一行', ['リボン', 'ハート'])
    ])
  ],
  seo: {
    heading: '୨୧ とドットリボンは別の用途',
    paragraphs: [
      'リボンコピペで一番使われているのは ୨୧ です。名前の左右に置くと量産型のプロフィールらしくなり、単体で文末に置くとただの飾りで終わります。',
      'ドットリボンは、点やマスで結び目を描いたものです。マス目に起こすなら、各ドットの下にあるアイロンビーズのボタンから図案作成へ進めます。'
    ],
    sections: [
      {
        heading: '名前に置くとき',
        paragraphs: ['表示名は短いので、₊˚୨୧˚₊ のように光まで足すと文字数を食います。LINEの名前なら ୨୧ だけ、インスタの一行目なら光付き、と分けると読みやすいです。'],
        cards: [
          { title: '量産型', body: '白、ピンク、୨୧、小さめのハート。黒星や太い線は混ぜないほうが雰囲気が揃います。' },
          { title: 'ドット', body: 'シール帳やビーズに移すなら、色つき絵文字より点と線の形のほうが輪郭を追いやすいです。' }
        ]
      }
    ],
    links: [
      { href: '/special-characters/dot/', label: 'ドット記号' },
      { href: '/special-characters/heart/', label: 'ハート' },
      { href: '/special-characters/line/', label: '区切り線' },
      { href: '/kawaii-copy/ryosangata-profile/', label: '量産型プロフィール' }
    ]
  },
  faq: [
    { question: 'ドットリボンは何に使いますか？', answer: '点で描いた文字のリボンです。プロフィールの飾りや、アイロンビーズの下絵に使えます。' },
    { question: 'リボン記号は名前に使えますか？', answer: '୨୧ や 𐙚 は多くのアプリで名前に入ります。絵文字の 🎀 は名前欄では大きく見えることがあるので、貼ったあと実機で確認してください。' },
    { question: 'アイロンビーズにするには？', answer: 'ドットの形の下にある「アイロンビーズ図案にする」から、beads.mojimoon.com の図案作成を開けます。マスはそちらで塗ります。' }
  ],
  related: [
    { href: '/special-characters/dot/', title: 'ドット記号', description: '星やハートのドットもまとめて見る。' },
    { href: '/special-characters/heart/', title: 'ハート', description: 'リボンの隣に置く白いハート。' },
    { href: '/kawaii-copy/ryosangata-otaku/', title: '量産型', description: 'プロフィール文ごと整えたいとき。' }
  ]
});

const surprisedItems = [
  ['(ﾟдﾟ)', '目が見開いている', 'びっくり'],
  ['(⊙_⊙)', '丸い目', 'びっくり'],
  ['(°ロ°)', '口が四角', 'びっくり'],
  ['(๑°ㅁ°๑)', '口を開けたまま', 'びっくり'],
  ['(꒪⌓꒪)', '目が揺れている', 'びっくり'],
  ['Σ(ﾟДﾟ)', 'のけぞる', 'びっくり'],
  ['(；・∀・)', '軽く驚く', 'えっ'],
  ['(￣□￣;)', '焦って驚く', 'まじ'],
  ['(ﾟωﾟ)', 'ぽかん', 'えっ'],
  ['(●´ω｀●)', '目を丸くして固まる', 'えっ'],
  ['(ﾉ≧∀≦)ﾉ', '飛び上がる', 'びっくり'],
  ['∑(O_O;)', '汗をかいて驚く', 'まじ'],
  ['(☆_☆)', '目が星になる', 'かわいい'],
  ['(✧∀✧)', 'うれしい驚き', 'かわいい'],
  ['(๑°o°๑)', '口が丸い', 'えっ'],
  ['(°o°:)', '固まる', 'まじ'],
  ['(☉_☉)', '目が点', 'びっくり'],
  ['(◎_◎;)', '目がぐるぐるする前', 'まじ'],
  ['(ﾟoﾟ)', '小さい驚き', 'えっ'],
  ['(°Д°)', '大きい口', 'びっくり'],
  ['(๑°⌓°๑)', '眉が上がる', 'えっ'],
  ['(｡•́△•̀｡)', '口が三角', 'かわいい'],
  ['(°o°)', '無言の驚き', 'えっ'],
  ['(°□°)', '口が開いたまま', 'まじ'],
  ['(●o●)', '目も口も丸い', 'びっくり'],
  ['(°0°)', '数字の口', 'えっ'],
  ['(ﾟﾛﾟ)', 'カタカナの口', 'びっくり'],
  ['(；ﾟдﾟ)', '汗と驚き', 'まじ'],
  ['(°△°)', '口が三角の大驚き', 'びっくり'],
  ['(☆▽☆)', '星目で笑う驚き', 'かわいい'],
  ['えっ(ﾟдﾟ)', '短い返事', '返信'],
  ['まじ(⊙_⊙)', '信じられない', '返信'],
  ['知らなかった(ﾟωﾟ)', '初耳', '返信'],
  ['すごい(✧∀✧)', 'ほめたあとの驚き', '返信'],
  ['待って(；ﾟдﾟ)', '話を止める', '返信'],
  ['えー(°□°)', '声に出す驚き', '返信']
];

pages.push({
  ...base,
  slug: 'kaomoji-surprised',
  path: '/kaomoji/surprised/',
  family: 'kaomoji',
  indexing: 'priority',
  priority: '0.85',
  title: 'びっくり顔文字コピペ | 驚く・えっ・まじで - MojiMoon',
  description: 'びっくり顔文字を、軽い「えっ」、固まる「まじ」、うれしい驚きに分けてコピーできます。LINEの一言返信に付ける短い顔もまとめています。',
  ogTitle: 'びっくり顔文字コピペ',
  ogDescription: 'えっ、まじ、うれしい驚き。温度の違うびっくり顔文字。',
  eyebrow: 'Surprised Kaomoji',
  h1: 'びっくり顔文字コピペ',
  hero: '同じ「びっくり」でも、初耳の「えっ」と、予定が崩れた「まじ」では口の開き方が違います。大きい Σ は文章より顔が勝つので、チャットの最後の一言に向いています。',
  toolLabel: 'びっくり顔文字',
  searchPlaceholder: 'びっくり、えっ、まじ、かわいい',
  draftPlaceholder: '顔文字をクリックするとここに入ります',
  composerHint: '返事の言葉を先に書いて、顔は一つだけ足すと読みやすいです。',
  recentLabel: '最近使ったびっくり顔文字',
  categories: [
    { id: 'small', label: 'えっ' },
    { id: 'big', label: 'まじ' },
    { id: 'cute', label: 'かわいい' },
    { id: 'reply', label: '返信' }
  ],
  quickFilters: [
    { label: 'びっくり', query: 'びっくり' },
    { label: 'えっ', query: 'えっ' },
    { label: 'まじ', query: 'まじ' },
    { label: '返信', query: '返信' }
  ],
  itemGroups: [
    group('small', '軽い驚き', ['びっくり', 'えっ'], surprisedItems.filter((item) => item[2] === 'えっ').map(([value, label]) => pair(value, label, ['えっ', 'びっくり']))),
    group('big', '声が出る驚き', ['びっくり', 'まじ'], surprisedItems.filter((item) => item[2] === 'まじ' || item[2] === 'びっくり').map(([value, label, tag]) => pair(value, label, [tag, 'びっくり']))),
    group('cute', 'かわいく驚く', ['びっくり', 'かわいい'], surprisedItems.filter((item) => item[2] === 'かわいい').map(([value, label]) => pair(value, label, ['かわいい', 'びっくり']))),
    group('reply', '文の後ろに置く', ['返信', 'びっくり'], surprisedItems.filter((item) => item[2] === '返信').map(([value, label]) => pair(value, label, ['返信'])))
  ],
  seo: {
    heading: 'びっくりの大きさ',
    paragraphs: [
      'びっくり顔文字は、相手の話に乗った証拠として文末に置きます。(ﾟдﾟ) はまだ会話の中にいられて、Σ(ﾟДﾟ) は会話を一度止める顔です。嬉しい報告への返事に Σ を使うと、驚いているのか引いているのか伝わらなくなります。',
      '泣く顔や眠い顔と並べると、感情の目録になってしまいます。このページは「今、想定の外にいる」顔だけにしています。'
    ],
    sections: [
      {
        heading: '返信での置き方',
        cards: [
          { title: '初耳', body: '「知らなかった」の後ろに (ﾟωﾟ)。口を開きすぎないほうが、続きを聞けます。' },
          { title: '予定変更', body: '「待って」の後ろに (；ﾟдﾟ)。汗があると、怒りではなく焦りに見えます。' },
          { title: 'いい報告', body: '(✧∀✧) は驚きと喜びが同時です。祝福の文に付けると、びっくり単独よりあたたかいです。' }
        ]
      }
    ],
    links: [
      { href: '/kaomoji/sad/', label: '泣く顔文字' },
      { href: '/kaomoji/happy/', label: '嬉しい顔文字' },
      { href: '/kaomoji/', label: '顔文字一覧' }
    ]
  },
  faq: [
    { question: 'びっくり顔文字はどれが無難ですか？', answer: '初対面や目上の人には (ﾟдﾟ) や (ﾟωﾟ) が無難です。Σ から始まる顔は友達同士のチャット向きです。' },
    { question: '「まじで」に合う顔は？', answer: '信じきれないときは (⊙_⊙) や ∑(O_O;)。うれしくて「まじ」と言うなら (✧∀✧) のほうが意図がぶれません。' },
    { question: '絵文字の驚き顔とは違いますか？', answer: '😮 は色が付いた一文字、顔文字は括弧でできた表情です。文章の温度を細かく足したいときは顔文字のほうが段階を選べます。' }
  ],
  related: [
    { href: '/kaomoji/happy/', title: '嬉しい顔文字', description: '驚きが喜びに変わったあと。' },
    { href: '/kaomoji/sad/', title: '泣く顔文字', description: '驚きのあと、気持ちが沈んだとき。' },
    { href: '/kaomoji/confused/', title: '困る顔文字', description: '驚くというより、判断が付かないとき。' }
  ]
});

const thanks = [
  ['(人´∀`)', '頭を下げるお礼', 'ていねい'],
  ['(人 •͈ᴗ•͈)', '小さく頭を下げる', 'ていねい'],
  ['(*´▽`人)', '隣に人がいるお礼', 'ていねい'],
  ['(ㅅ´ ˘ `)', '猫がお辞儀', 'かわいい'],
  ['(ㅅ˘˘)', '目を細めたお辞儀', 'かわいい'],
  ['(｡•ᴗ•｡)♡', 'ハート付きのありがとう', 'かわいい'],
  ['(*´˘`*)♡', 'やわらかいお礼', 'かわいい'],
  ['(୨୧ᵕ̤ᴗᵕ̤)', 'リボンみたいな笑顔', 'かわいい'],
  ['(ᵕ̤ᴗᵕ̤)', '短い笑顔', 'みじかい'],
  ['(´▽`*)', '照れながらお礼', 'みじかい'],
  ['(*ˊᵕˋ*)', '控えめな笑顔', 'みじかい'],
  ['(｡･ω･｡)ﾉ', '手を振るありがとう', 'みじかい'],
  ['(♡´౪`♡)', '好きが混じったお礼', 'すき'],
  ['(｡♥‿♥｡)', '目がハートのお礼', 'すき'],
  ['(ღ˘⌣˘ღ)', 'まるいハートの顔', 'すき'],
  ['ありがとう(ᵕ̤ᴗᵕ̤)', '一言の後ろ', '返信'],
  ['助かった(人´∀`)', '手伝ってもらったあと', '返信'],
  ['おかげで(｡•ᴗ•｡)', '相手のおかげ', '返信'],
  ['また頼むね(*´▽`人)', '次もあるお礼', '返信'],
  ['ごめん、ありがとう(ㅅ˘˘)', '迷惑をかけたお礼', '返信'],
  ['(｡•ᴗ•｡)ﾉ♡', '手とハート', 'かわいい'],
  ['(๑˃ᴗ˂)ﻭ', '元気のお礼', 'みじかい'],
  ['(⁎˃ᴗ˂⁎)', '目を細めてにこ', 'みじかい'],
  ['(｡•̀ᴗ-)✧', 'ウインクのお礼', 'かわいい'],
  ['( ˘꒳˘)ﾉ', '眠そうでもお礼', 'みじかい'],
  ['(´｡•ᵕ•｡`)', 'やわらかい笑顔', 'かわいい'],
  ['(人´ω｀)', '素直に頭を下げる', 'ていねい'],
  ['m(_ _)m', '土下座に近いお礼', 'ていねい'],
  ['(〃￣∇￣)ﾉ', '明るいお辞儀', 'ていねい'],
  ['感謝(人 •͈ᴗ•͈)', '感謝の一言', '返信']
];

pages.push({
  ...base,
  slug: 'kaomoji-thank-you',
  path: '/kaomoji/thank-you/',
  family: 'kaomoji',
  indexing: 'priority',
  priority: '0.85',
  title: 'ありがとう顔文字コピペ | 感謝・お礼の顔文字 - MojiMoon',
  description: 'ありがとう顔文字を、短いお礼、頭を下げるお礼、かわいいお礼、好きが混じるお礼に分けてコピーできます。',
  ogTitle: 'ありがとう顔文字コピペ',
  ogDescription: '手伝ってもらったあと、甘くお礼したいあと。顔の下げ方が違います。',
  eyebrow: 'Thank You Kaomoji',
  h1: 'ありがとう顔文字コピペ',
  hero: '「ありがとう」は言葉が先で、顔は温度です。m(_ _)m は迷惑をかけたあとに向き、♡ の付いた顔はプレゼントや何気ない親切に向きます。同じお礼文でも、顔を替えると相手の受け取り方が変わります。',
  toolLabel: 'ありがとう顔文字',
  searchPlaceholder: 'ありがとう、感謝、かわいい、お礼',
  draftPlaceholder: '顔文字をクリックするとここに入ります',
  composerHint: 'お礼の一文を書いてから、顔を一つ足してください。',
  recentLabel: '最近使ったありがとう顔文字',
  categories: [
    { id: 'short', label: '短い' },
    { id: 'polite', label: '頭を下げる' },
    { id: 'cute', label: 'かわいい' },
    { id: 'reply', label: '文にする' }
  ],
  quickFilters: [
    { label: 'ありがとう', query: 'ありがとう' },
    { label: 'かわいい', query: 'かわいい' },
    { label: '感謝', query: '感謝' },
    { label: '返信', query: '返信' }
  ],
  itemGroups: [
    group('short', '短く添える', ['ありがとう', '短い'], thanks.filter((item) => item[2] === 'みじかい').map(([value, label]) => pair(value, label, ['ありがとう']))),
    group('polite', '頭を下げる', ['ありがとう', '感謝'], thanks.filter((item) => item[2] === 'ていねい').map(([value, label]) => pair(value, label, ['感謝', 'ありがとう']))),
    group('cute', 'かわいくお礼', ['ありがとう', 'かわいい'], thanks.filter((item) => item[2] === 'かわいい' || item[2] === 'すき').map(([value, label, tag]) => pair(value, label, [tag, 'かわいい']))),
    group('reply', '言葉とセット', ['ありがとう', '返信'], thanks.filter((item) => item[2] === '返信').map(([value, label]) => pair(value, label, ['返信', 'ありがとう'])))
  ],
  seo: {
    heading: 'お礼の顔は、借りたものの大きさに合わせる',
    paragraphs: [
      'ノートを貸してもらった程度なら (ᵕ̤ᴗᵕ̤) で足ります。締め切り前に手伝ってもらったなら、手の付いた (人´∀`) のほうが「面倒を見た」が残ります。土下座の m(_ _)m は友達の軽い親切に使うと、冗談か本気か分かりません。',
      '絵文字の 🙏 は一文字で済みます。顔文字は、お辞儀なのか笑顔なのかを選べるのが違いです。'
    ],
    sections: [
      {
        heading: '場面',
        cards: [
          { title: 'プレゼント', body: '物をもらった直後は、ハートの付いた顔のほうが「嬉しい」が先に伝わります。' },
          { title: '迷惑をかけた', body: '「ごめん、ありがとう」と書いてから (ㅅ˘˘)。お礼だけだと、かけた手間が消えません。' },
          { title: 'グループ', body: '全員へのお礼は短い顔を一つ。一人ひとりに Σ 級の顔を付けると、本文より顔文字が長くなります。' }
        ]
      }
    ],
    links: [
      { href: '/emoji-combinations/thank-you/', label: 'ありがとうの絵文字' },
      { href: '/kaomoji/sorry/', label: 'ごめん顔文字' },
      { href: '/emoji-copy/thank-you/', label: 'ありがとう絵文字' }
    ]
  },
  faq: [
    { question: '目上の人に顔文字のありがとうは使えますか？', answer: 'メールや改まったチャットでは言葉だけが無難です。普段から顔文字が飛ぶ相手なら、手を前に出す (人´ω｀) 程度に留めると軽いです。' },
    { question: 'かわいいありがとう顔文字はどれですか？', answer: '(ㅅ´ ˘ `) や (｡•ᴗ•｡)♡ は、笑顔のまま頭を下げているので、お礼が重くなりすぎません。' },
    { question: '絵文字と両方使っていいですか？', answer: '使えます。ただ、🙏 と m(_ _)m を同時に置くと頭を下げすぎに見えます。どちらか一つで足ります。' }
  ],
  related: [
    { href: '/kaomoji/sorry/', title: 'ごめん顔文字', description: 'お礼の前に謝りがあるとき。' },
    { href: '/emoji-combinations/thank-you-message/', title: 'ありがとうの文', description: '絵文字付きの短文が欲しいとき。' },
    { href: '/kaomoji/hug/', title: 'ハグ顔文字', description: 'お礼がスキンシップになるとき。' }
  ]
});

const sleepyFaces = [
  ['(っ ̫ -˘)', 'うとうと', '眠い'],
  ['(｡ρω-｡)', 'ねむねむ', '眠い'],
  ['(๑ᵕ⌓ᵕ̤)', '目が半分', '眠い'],
  ['(-_-)zzz', '寝息', '眠い'],
  ['(´-ωก`)', 'こっくり', '眠い'],
  ['(｡-ω-)zzz', '目を閉じて寝る', '眠い'],
  ['( ˘ω˘ )', 'すやすや', 'おやすみ'],
  ['( ˘꒳˘ )', '丸い寝顔', 'おやすみ'],
  ['(¦3[▓▓]', '布団に入った', '布団'],
  ['[▓▓]ε¦)', '布団から手', '布団'],
  ['(:3[____]', '横になった', '布団'],
  ['( ᵕᴗᵕ )*･☪︎·̩͙', '月を見ている', 'おやすみ'],
  ['おやすみ( ˘ω˘ )', 'おやすみの一言', '文'],
  ['おやすみなさい(｡-ω-)zzz', '少し丁寧', '文'],
  ['また明日(っ ̫ -˘)', '続きは明日', '文'],
  ['そろそろ寝るね( ˘ω˘ )', '会話を閉じる', '文'],
  ['いい夢みてね( ˘͈ ᵕ ˘͈ )', '相手に言う', '文'],
  ['返信は明日するね(｡ρω-｡)', '既読のまま寝る', '文'],
  ['もう寝落ちしそう(¦3[▓▓]', '限界', '文'],
  ['おふとんへ(_ _).｡o○', '布団へ行く', '布団'],
  ['(ᐡ- ﻌ -ᐡ)', '犬の寝顔', 'かわいい'],
  ['(ᐡᴗ ̫ ᴗᐡ)', '丸い犬', 'かわいい'],
  ['(=^-ω-^=)', '猫の寝顔', 'かわいい'],
  ['(ฅ˘ω˘ฅ)', '猫が眠い', 'かわいい'],
  ['(⸝⸝- ̫ -⸝⸝)', '小さい寝顔', 'かわいい'],
  ['(っ˘ω˘ς )', '頬杖で眠い', '眠い'],
  ['(ง ˘ω˘ )ว', '手を上げて寝る', 'おやすみ'],
  ['( ˘༥˘ )', '口をすぼめた眠気', '眠い'],
  ['(_ _).｡o○', '思考が寝ている', '眠い'],
  ['ゆっくり休んで( ˊ꒳ˋ )', '相手を休ませる', '文'],
  ['今日もありがとう( ᵕᴗᵕ )', '寝る前のお礼', '文'],
  ['good night( ˘꒳˘ )', '英語で閉じる', '文']
];

pages.push({
  ...base,
  slug: 'kaomoji-sleepy',
  path: '/kaomoji/sleepy/',
  family: 'kaomoji',
  indexing: 'priority',
  priority: '0.85',
  title: '眠い顔文字・おやすみ顔文字コピペ | うとうと・寝る - MojiMoon',
  description: '眠い顔文字とおやすみ顔文字を、うとうと、布団、会話を閉じる文に分けてコピーできます。月や星の絵文字で飾りたい場合はおやすみの組み合わせページへ。',
  ogTitle: '眠い顔文字・おやすみ顔文字コピペ',
  ogDescription: 'うとうとの返信と、おやすみで会話を閉じる顔は別です。',
  eyebrow: 'Sleepy Kaomoji',
  h1: '眠い顔文字・おやすみ顔文字コピペ',
  hero: '眠い顔は「まだ起きているけど厳しい」、おやすみ顔は「ここで今日は終わる」です。同じ ( ˘ω˘ ) でも、前の言葉が「ねむい」か「おやすみ」かで意味が変わります。おやすみの顔文字はこのページ、月や雲を並べた絵文字は別ページに置いています。',
  toolLabel: '眠い・おやすみ顔文字',
  searchPlaceholder: '眠い、おやすみ、うとうと、布団、寝る',
  draftPlaceholder: '顔文字をクリックするとここに入ります',
  composerHint: 'おやすみの文を書いてから、顔を一つ足すと自然です。',
  recentLabel: '最近使った眠い顔文字',
  categories: [
    { id: 'drowsy', label: '眠い' },
    { id: 'night', label: 'おやすみ' },
    { id: 'bed', label: '布団' },
    { id: 'line', label: '文にする' }
  ],
  quickFilters: [
    { label: '眠い', query: '眠い' },
    { label: 'おやすみ', query: 'おやすみ' },
    { label: 'うとうと', query: 'うとうと' },
    { label: '布団', query: '布団' }
  ],
  itemGroups: [
    group('drowsy', 'まだ起きている', ['眠い', 'うとうと'], sleepyFaces.filter((item) => item[2] === '眠い').map(([value, label]) => pair(value, label, ['眠い', 'うとうと']))),
    group('night', 'おやすみの顔', ['おやすみ', '顔文字'], sleepyFaces.filter((item) => item[2] === 'おやすみ' || item[2] === 'かわいい').map(([value, label, tag]) => pair(value, label, [tag, 'おやすみ']))),
    group('bed', '布団と寝落ち', ['布団', '寝る'], sleepyFaces.filter((item) => item[2] === '布団').map(([value, label]) => pair(value, label, ['布団', '寝る']))),
    group('line', 'そのまま送れる文', ['おやすみ', '返信'], sleepyFaces.filter((item) => item[2] === '文').map(([value, label]) => pair(value, label, ['おやすみ', '返信'])))
  ],
  seo: {
    heading: '眠いとおやすみを一つのページにした理由',
    paragraphs: [
      '「眠い顔文字」と「おやすみ顔文字」は、使う時刻が近く、顔も半分重なります。ページを二つに割ると、同じ ( ˘ω˘ ) が両方に出て、どちらを開けばいいか毎回迷います。会話を閉じる文も、布団の顔も、ここに置いています。',
      '月や星を並べたいだけのときは顔文字が邪魔です。その場合はおやすみの絵文字組み合わせを使ってください。単体の 🌙 はおやすみ絵文字のページです。'
    ],
    sections: [
      {
        heading: '送り方',
        cards: [
          { title: 'まだ話す', body: '「ねむい」とだけ書いて (っ ̫ -˘)。おやすみと言うと、相手は返事を止めます。' },
          { title: '終わりにする', body: '「おやすみ」のあと顔を一つ。布団の AA は長いので、最後の一言より前の会話に向きます。' },
          { title: '相手に言う', body: '「いい夢みてね」は自分の眠さではなく、相手を休ませる文です。自分の (¦3[▓▓] とは別にします。' }
        ]
      }
    ],
    links: [
      { href: '/emoji-combinations/good-night/', label: 'おやすみの絵文字組み合わせ' },
      { href: '/emoji-copy/good-night/', label: 'おやすみ絵文字' },
      { href: '/kaomoji/', label: '顔文字一覧' }
    ]
  },
  faq: [
    { question: '眠い顔文字とおやすみ顔文字は同じですか？', answer: '顔は似ています。違いは前に置く言葉です。まだ返信するなら眠い、今日は終わりならおやすみ、と書き分けてください。' },
    { question: 'うとうとの顔はどれですか？', answer: '(っ ̫ -˘) や (´-ωก`) のように、目が閉じきっていないものがうとうとです。zzz が付くと、もう寝ています。' },
    { question: '月の絵文字もここにありますか？', answer: 'このページは顔文字です。🌙 や ☁️ を並べた装飾は、おやすみ絵文字の組み合わせページにあります。' }
  ],
  related: [
    { href: '/emoji-combinations/good-night/', title: 'おやすみの組み合わせ', description: '月や雲で夜の一行を作る。' },
    { href: '/emoji-copy/good-night/', title: 'おやすみ絵文字', description: '🌙 を一つだけ欲しいとき。' },
    { href: '/kaomoji/good-morning/', title: 'おはよう顔文字', description: '翌朝の返事。' }
  ]
});

const friendNotes = [
  ['誕生日おめでとう。今年も変な話は、いちばんに聞かせて。🎂', 'いちばんに話す友達'],
  ['同じクラスじゃなくなっても、今日だけは先に祝いたかった。🎉', '離れた友達'],
  ['課題もバイトも今日は置いといて、好きなもの食べて。🍰', '忙しい友達'],
  ['遅れちゃった。昨日のうちに送るつもりだった。誕生日おめでとう。🎈', '遅れた友達'],
  ['写真はあとで送る。とりあえず、生まれてきてくれてよかった。📷', 'グループのあと'],
  ['次会ったとき奢るから、今日は自分でケーキ買って。🎁', '会えない友達']
];
const familyNotes = [
  ['お母さん、生まれてきてくれてありがとう。今年も元気でいてね。💐', '母へ'],
  ['お父さん、誕生日おめでとう。甘いものは控えめに、って言いつつケーキは食べるね。🎂', '父へ'],
  ['でかくなったな。誕生日おめでとう。兄ちゃんより先に大人ぶるなよ。🎁', '弟や妹へ'],
  ['おばあちゃん、今年も長い電話しよう。誕生日おめでとう。📞', '祖父母へ'],
  ['家族で食べるケーキ、切り分けはわたしがやる。おめでとう。🍰', '家族の食卓']
];
const partnerNotes = [
  ['生まれた日を、隣で祝えるのがうれしい。今日はちゃんと言葉にする。💗', '隣にいる相手'],
  ['おめでとう。今年のケーキはわたしが選ぶ。味の文句は明日でいい。🎂', '一緒にいる夜'],
  ['会えない誕生日だけど、電話は切らないでおく。生まれてきてくれてありがとう。🌙', '遠距離'],
  ['いつもより少し長いメッセージになる。好きだよ。誕生日おめでとう。💌', '手紙のように'],
  ['起きてすぐにこれ読んで。一番乗りのおめでとう。☀️', '朝一']
];
const oshiNotes = [
  ['生まれてきてくれてありがとう。今日はサイリウムの色で祝ってます。🎤', 'ライブの日'],
  ['推してる側の用事じゃなくて、あなたの誕生日。元気でいてくれたら、それが一番です。🌟', '本人へ届くかも'],
  ['新しい曲より先に、今日はお誕生日おめでとうを置いておきます。🎧', '音楽の推し'],
  ['同じ日を祝ってる人がこんなにいるの、ちょっとすごい。誕生日おめでとう。🎉', 'ファン同士'],
  ['現場には行けないけど、今日のタイムラインはあなたの色にしてます。💜', '遠征できない日']
];
const chatNotes = [
  ['みんなで祝えてよかった。写真は夜にまとめて上げるね。📸', 'グループのあと'],
  ['代表して送っとく。誕生日おめでとう。リアクションは各自で。🎈', 'グループの代表'],
  ['通話はこのあと。まず文字で、誕生日おめでとう。📞', '通話の前']
];

pages.push({
  ...base,
  slug: 'emoji-copy-birthday-message',
  path: '/emoji-copy/birthday-message/',
  family: 'emoji-copy',
  indexing: 'priority',
  priority: '0.85',
  draftMaxLength: 400,
  title: '誕生日メッセージ 友達 | 一言・絵文字つき例文 - MojiMoon',
  description: '友達、家族、恋人、推し、グループチャットに送る誕生日メッセージを、絵文字つきの一言でコピーできます。関係ごとに文面を分けています。',
  ogTitle: '誕生日メッセージ｜友達・家族・推しの一言',
  ogDescription: '誕生日おめでとうを、相手との距離に合わせて短く書く例文です。',
  eyebrow: 'Birthday Messages',
  h1: '誕生日メッセージ・友達への一言',
  hero: '「誕生日おめでとう」だけでは、誰にでも送れます。友達には内輪の話、家族には日頃言わない一言、推しには「生まれてきてくれて」が先に来ます。絵文字は文の最後に一つで足ります。組み合わせだけ欲しいときは、誕生日絵文字のページへ。',
  toolLabel: '誕生日メッセージ',
  searchPlaceholder: '友達、家族、恋人、推し、一言',
  draftPlaceholder: '例文をクリックするとここに入ります',
  composerHint: '名前を先頭に足してからコピーすると、その人の文になります。',
  recentLabel: '最近コピーした誕生日メッセージ',
  categories: [
    { id: 'friend', label: '友達' },
    { id: 'family', label: '家族' },
    { id: 'partner', label: '恋人' },
    { id: 'oshi', label: '推し' },
    { id: 'chat', label: 'グループ' },
    { id: 'mark', label: '絵文字だけ' }
  ],
  quickFilters: [
    { label: '友達', query: '友達' },
    { label: '一言', query: '一言' },
    { label: '推し', query: '推し' },
    { label: '家族', query: '家族' }
  ],
  itemGroups: [
    group('friend', '友達へ', ['友達', '誕生日', '一言'], friendNotes.map(([value, label]) => pair(value, label, ['友達', '一言']))),
    group('family', '家族へ', ['家族', '誕生日'], familyNotes.map(([value, label]) => pair(value, label, ['家族']))),
    group('partner', '恋人へ', ['恋人', '誕生日'], partnerNotes.map(([value, label]) => pair(value, label, ['恋人']))),
    group('oshi', '推しへ', ['推し', '誕生日'], oshiNotes.map(([value, label]) => pair(value, label, ['推し']))),
    group('chat', 'グループチャット', ['グループ', '誕生日'], chatNotes.map(([value, label]) => pair(value, label, ['友達', 'グループ']))),
    group('mark', '文を自分で書くときの絵文字', ['絵文字', '誕生日'], [
      pair('🎂', 'ケーキ', ['絵文字']),
      pair('🎉', 'クラッカー', ['絵文字']),
      pair('🎈', '風船', ['絵文字']),
      pair('🎁', 'プレゼント', ['絵文字']),
      pair('💐', '花束', ['絵文字']),
      pair('🍰', 'ショートケーキ', ['絵文字']),
      pair('🎂💗', 'ケーキとハート', ['絵文字']),
      pair('🎉✨', 'お祝いの光', ['絵文字']),
      pair('🎂🥂', '乾杯', ['絵文字']),
      pair('🥳🎂', 'パーティーの顔', ['絵文字'])
    ])
  ],
  seo: {
    heading: '友達への誕生日メッセージは、共有している時間を一つ入れる',
    paragraphs: [
      '検索の多くは「友達に何と送るか」です。上手い文より、二人だけの事実が一行あるほうが誕生日らしくなります。クラス、バイト、いつも聞く話。それが無いときは、遅れたことや、次に会う約束を書いたほうが、汎用文よりマシです。',
      '推しへの文は、友達への文を流用しないでください。「変な話聞かせて」はファンレターでは合いません。こちらは「生まれてきてくれて」と、今日どう祝っているかを書きます。年賀やビジネスの定型は扱っていません。'
    ],
    sections: [
      {
        heading: '関係で変えるところ',
        cards: [
          { title: '友達', body: '内輪の予定か、次に会う約束。絵文字は 🎂 か 🎉 のどちらか一つ。' },
          { title: '家族', body: '日頃言わない感謝を短く。長い手紙にすると、読まれずに既読が付きます。' },
          { title: '恋人', body: 'おめでとうのあとに、今日どう過ごすかを一つ。遠距離なら、電話を切らない等の具体です。' },
          { title: '推し', body: '要求で終わらせない。祝っているこちらの行動（色、曲、タイムライン）を書くと、報告になります。' }
        ]
      }
    ],
    links: [
      { href: '/emoji-combinations/birthday/', label: '誕生日の絵文字組み合わせ' },
      { href: '/emoji-copy/birthday/', label: '誕生日絵文字' },
      { href: '/kaomoji/happy/', label: '嬉しい顔文字' }
    ]
  },
  faq: [
    { question: '友達への誕生日メッセージはどれくらいの長さですか？', answer: 'LINEなら二文までが読まれやすいです。一行目でお祝い、二行目でその人だけの事実か約束、です。' },
    { question: '一言だけにするなら？', answer: '「誕生日おめでとう。今年も変な話はいちばんに聞かせて。」のように、お祝い＋一つだけ。絵文字は末尾に一つ。' },
    { question: '絵文字の並びだけ欲しいときは？', answer: '🎂💗🎀 のような装飾は、誕生日絵文字の組み合わせページにまとまっています。このページは文章が主です。' }
  ],
  related: [
    { href: '/emoji-combinations/birthday/', title: '誕生日の組み合わせ', description: '文ではなく、絵文字の並び。' },
    { href: '/emoji-copy/congratulations/', title: 'おめでとう絵文字', description: '誕生日以外のお祝い。' },
    { href: '/kaomoji/happy/', title: '嬉しい顔文字', description: '文章の代わりに顔で祝う。' }
  ]
});

pages.push({
  ...base,
  slug: 'emoji-combinations-good-night',
  path: '/emoji-combinations/good-night/',
  family: 'emoji-combinations',
  title: 'おやすみ絵文字 組み合わせ | 月・星・雲 - MojiMoon',
  description: 'おやすみに添える絵文字の組み合わせです。月と雲の短い一行、ストーリー用の夜、顔文字が欲しい人は眠い顔文字のページへ案内します。',
  ogTitle: 'おやすみ絵文字の組み合わせ',
  ogDescription: '🌙☁️ のような短い夜の一行。顔文字とは分けています。',
  eyebrow: 'Good Night Emoji',
  h1: 'おやすみ絵文字の組み合わせ',
  hero: 'ここでは顔を作りません。月、雲、星、枕もとの静けさを、三つか四つで一行にします。眠い表情が欲しいときは顔文字のページ、🌙 を一つだけ欲しいときはおやすみ絵文字です。',
  toolLabel: 'おやすみの組み合わせ',
  searchPlaceholder: 'おやすみ、月、星、白、雲',
  draftPlaceholder: '組み合わせをクリックするとここに入ります',
  composerHint: '「おやすみ」のうしろに、選んだ一行を足してください。',
  recentLabel: '最近使ったおやすみの組み合わせ',
  categories: [
    { id: 'short', label: '一行' },
    { id: 'white', label: '白い夜' },
    { id: 'story', label: 'ストーリー' },
    { id: 'text', label: '言葉つき' }
  ],
  quickFilters: [
    { label: 'おやすみ', query: 'おやすみ' },
    { label: '月', query: '月' },
    { label: '星', query: '星' },
    { label: '白', query: '白' }
  ],
  itemGroups: [
    group('short', '三つの夜', ['おやすみ', '組み合わせ'], [
      pair('🌙☁️🤍', '月と雲と白', ['月', '白']),
      pair('☁️🌙💤', '雲の向こうで寝る', ['月']),
      pair('🌙✨⭐', '月と光と星', ['星', '月']),
      pair('💤🌙', '先に寝息', ['おやすみ']),
      pair('🌙🧸', 'ぬいぐるみと月', ['かわいい']),
      pair('☾✨', '細い月と光', ['月', '星']),
      pair('🌙🫧', '泡のような月', ['白']),
      pair('⭐🌙⭐', '月を星で挟む', ['星'])
    ]),
    group('white', '色をほぼ使わない', ['白', 'おやすみ'], [
      pair('🤍🌙𓈒𓏸', '白と象形文字の余白', ['白']),
      pair('☾ 𓂃 🫧', '線と月', ['白', 'おしゃれ']),
      pair('☁️🤍☁️', '雲だけ', ['白']),
      pair('🪽🌙', '羽と月', ['白']),
      pair('𓂃🌙𓂃', '月の上下を線で', ['おしゃれ']),
      pair('⋆☾⋆', '記号の月', ['星'])
    ]),
    group('story', '少し物語がある並び', ['おやすみ', '夜'], [
      pair('🌃✨🌙', '街の灯が落ちたあと', ['夜']),
      pair('📖🌙', '本を閉じて', ['夜']),
      pair('🍵🌙', '最後の一杯のあと', ['夜']),
      pair('🛏️💤🌙', 'ベッドまで', ['夜']),
      pair('🌧️🌙', '雨の夜', ['夜']),
      pair('❄️🌙', '寒い夜', ['夜']),
      pair('🐱💤', '猫が先に寝た', ['かわいい']),
      pair('🎧🌙', '音楽を止めて', ['夜'])
    ]),
    group('text', '言葉が先の一行', ['おやすみ'], [
      pair('おやすみ 🌙', 'そのまま送る', ['おやすみ']),
      pair('おやすみなさい ☁️🌙', '少し丁寧', ['おやすみ']),
      pair('いい夢を 🌙✨', '相手に言う', ['おやすみ']),
      pair('また明日 ⭐', '続きは朝', ['おやすみ']),
      pair('もう寝る 💤', '自分の宣言', ['おやすみ']),
      pair('good night 🌙', '英語で閉じる', ['おやすみ'])
    ])
  ],
  seo: {
    heading: '組み合わせは三つか四つで止める',
    paragraphs: [
      'おやすみの絵文字を七つ並べると、夜ではなく看板になります。月を中心に、雲か星かを一つ足す。それ以上は、ストーリーの背景を説明するときだけです。',
      '顔文字の ( ˘ω˘ ) をここに混ぜると、絵文字の列が崩れます。表情が欲しくなったら眠い・おやすみ顔文字のページに戻ってください。'
    ],
    sections: [
      {
        heading: '置く場所',
        cards: [
          { title: 'LINEの最後', body: '「おやすみ」の直後に 🌙☁️🤍。文より絵文字が長いと、眠いのではなく装飾に見えます。' },
          { title: 'ストーリー', body: '🌃 や 🌧️ は写真のキャプション向きです。チャットの返事には情報が多いです。' },
          { title: '白でまとめたい', body: '🤍 と 𓂃 は色が主張しません。プロフィールの夜枠に向きます。' }
        ]
      }
    ],
    links: [
      { href: '/kaomoji/sleepy/', label: '眠い・おやすみ顔文字' },
      { href: '/emoji-copy/good-night/', label: 'おやすみ絵文字' },
      { href: '/special-characters/star/', label: '星の記号' }
    ]
  },
  faq: [
    { question: 'おやすみ顔文字はどこですか？', answer: '表情は /kaomoji/sleepy/ にまとめています。このページは 🌙 や ☁️ の並びだけです。' },
    { question: '何個まで並べるときれいですか？', answer: 'チャットなら三つまで。四つ目を足すときは、言葉を短くして絵文字側に意味を寄せてください。' },
    { question: '白黒の夜にしたいときは？', answer: '🤍、☾、𓂃 の組が色をほぼ使いません。💛 や 🌟 を混ぜると、急に明るくなります。' }
  ],
  related: [
    { href: '/kaomoji/sleepy/', title: '眠い顔文字', description: 'うとうとやおやすみの表情。' },
    { href: '/emoji-copy/star/', title: '星と月の絵文字', description: '単体で星や月を探す。' },
    { href: '/special-characters/hieroglyph/', title: '𓂃𓈒𓏸', description: '夜の行に余白を足す。' }
  ]
});

const hiero = [
  ['𓂃𓈒𓏸', 'いちばん貼られる並び', 'ライン'],
  ['𓂃', 'ゆるい波の線', 'ライン'],
  ['𓈒', '一粒の点', 'ライン'],
  ['𓏸', '三つの点', 'ライン'],
  ['𓏸𓈒𓂃', '逆から読む並び', 'ライン'],
  ['𓂃 𓈒𓏸 𓂃', '線で点を挟む', 'ライン'],
  ['𓈒𓏸', '点だけ', 'ライン'],
  ['𓆩𓆪', '角のある括弧', 'ライン'],
  ['𓆩 𓆪', '間を空けた括弧', 'ライン'],
  ['𓃃', '並びの先頭に置く文字', '並び'],
  ['𓏏', 'パンの象形文字', '並び'],
  ['𓃃𓈒𓏏', '別の三点の並び', '並び'],
  ['𓃃 𓈒 𓏏', '間を空けた別の並び', '並び'],
  ['𓈒𓏏', '点とパン', '並び'],
  ['𓃃𓂃', '象形と波線', '並び'],
  ['𓃃𓈒𓏸', '象形から点の列へ', '並び'],
  ['𓍯', '花に見える象形', '花'],
  ['𓇢', '植物の象形', '花'],
  ['𓆸', '束ねた花', '花'],
  ['𓆰', '花の枝', '花'],
  ['𓍯𓂃', '花と波', '花'],
  ['𓇢𓂃𓈒', '植物と余白', '花'],
  ['𓆸♡𓆸', '花でハートを挟む', 'ハート'],
  ['𓂃♡𓂃', '波線とハート', 'ハート'],
  ['♡𓈒𓏸', 'ハートのあとに点', 'ハート'],
  ['𓃃♡𓏏', '象形とハート', 'ハート'],
  ['𓂃𓈒♡', '余白の途中にハート', 'ハート'],
  ['❄️𓂃𓈒𓏸', '冬の余白', '季節'],
  ['🎄𓂃', 'ツリーと波線', '季節'],
  ['🌸𓇢', '桜と植物', '季節'],
  ['☀️𓇳', '太陽を二つ', '季節'],
  ['🍁𓂃', '紅葉と波', '季節'],
  ['🌊𓈒𓏸', '水しぶきと点', '季節'],
  ['𓇳', '太陽の象形', '季節'],
  ['name𓂃𓈒𓏸', '名前の下に余白', 'ライン'],
  ['𓃃𓈒𓏏 name', '名前の前に三つ', '並び']
];

pages.push({
  ...base,
  slug: 'special-characters-hieroglyph',
  path: '/special-characters/hieroglyph/',
  family: 'special-characters',
  title: '𓂃𓈒𓏸 コピペ | おしゃれ象形文字 - MojiMoon',
  description: '𓂃𓈒𓏸 を、ライン・花・ハート・季節の並びに分けてコピーできます。𓃃𓈒𓏏 などの別の並びも一緒に置けます。',
  ogTitle: '𓂃𓈒𓏸 のコピペ',
  ogDescription: 'プロフィールの余白に使う 𓂃𓈒𓏸 です。',
  eyebrow: 'Hieroglyph Symbols',
  h1: '𓂃𓈒𓏸 コピペ',
  hero: 'プロフィールで何も書いていない行を作るときに貼る文字です。いちばん使われている並びは 𓂃𓈒𓏸 で、波と点を横に置いたものです。𓃃𓈒𓏏 は別の並びで、文章としては読みません。余白、花、ハート、季節の飾りとして置いています。',
  toolLabel: '象形文字コピペ',
  searchPlaceholder: '𓂃𓈒𓏸、ライン、花、ハート',
  draftPlaceholder: '並びをクリックするとここに入ります',
  composerHint: '名前の下に一行だけ置くと、プロフィールが詰まりません。',
  recentLabel: '最近使った象形文字',
  categories: [
    { id: 'line', label: 'ライン' },
    { id: 'set', label: '𓃃𓈒𓏏' },
    { id: 'flower', label: '花' },
    { id: 'heart', label: 'ハート' },
    { id: 'season', label: '季節' }
  ],
  quickFilters: [
    { label: 'ライン', query: 'ライン' },
    { label: '花', query: '花' },
    { label: 'ハート', query: 'ハート' },
    { label: '季節', query: '季節' }
  ],
  itemGroups: [
    group('line', '余白のライン', ['ライン', 'おしゃれ'], hiero.filter((item) => item[2] === 'ライン').map(([value, label]) => pair(value, label, ['ライン', '𓂃']))),
    group('set', '𓃃𓈒𓏏 の並び', ['𓃃', 'おしゃれ'], hiero.filter((item) => item[2] === '並び').map(([value, label]) => pair(value, label, ['𓃃', '𓏏']))),
    group('flower', '花に見えるもの', ['花'], hiero.filter((item) => item[2] === '花').map(([value, label]) => pair(value, label, ['花']))),
    group('heart', 'ハートと混ぜる', ['ハート'], hiero.filter((item) => item[2] === 'ハート').map(([value, label]) => pair(value, label, ['ハート']))),
    group('season', '季節の端に置く', ['季節'], hiero.filter((item) => item[2] === '季節').map(([value, label]) => pair(value, label, ['季節'])))
  ],
  seo: {
    heading: '読ませないための文字',
    paragraphs: [
      '𓂃𓈒𓏸 はプロフィールの空行に貼る並びです。形が細いので、絵文字の ✨ より文章の邪魔をしません。',
      '𓃃𓈒𓏏 は、𓂃 の波線とは輪郭が違う並びです。同じプロフィールに両方入れると散らかります。どちらかの系統で通してください。古いスマホでは四角になることがあるので、名前の必須部分には使わないほうが安全です。'
    ],
    sections: [
      {
        heading: '入れ方',
        cards: [
          { title: '名前の下', body: 'name の次の行に 𓂃𓈒𓏸 だけ。その下に自己紹介を書くと、見出しと本文が分かれます。' },
          { title: 'ハートと', body: '𓂃♡𓂃 は余白の途中に気持ちを一つ置く形です。ハートを三つにすると、象形文字の細さが消えます。' },
          { title: '季節', body: '冬は ❄️ を端に一つ。象形文字側は増やさず、季節の絵文字だけ替えます。' }
        ]
      }
    ],
    links: [
      { href: '/special-characters/line/', label: '区切り線' },
      { href: '/special-characters/instagram/', label: 'Instagramの記号' },
      { href: '/special-characters/', label: '特殊文字一覧' }
    ]
  },
  faq: [
    { question: '𓂃𓈒𓏸 はどういう意味ですか？', answer: 'プロフィールでは意味を読ませず、余白として使われています。文字の名前を知らないままで貼って問題ありません。' },
    { question: '𓃃𓈒𓏏 と何が違いますか？', answer: '𓂃 の列は波と点で水平です。𓃃𓈒𓏏 は先頭の文字の形が違うので、行の高さが少し違って見えます。' },
    { question: '表示されない端末はありますか？', answer: 'あります。四角や空白になる機種では、┈┈ や ♡ に替えてください。相手の画面で確認できるなら、送る前に一度見てもらうと確実です。' }
  ],
  related: [
    { href: '/special-characters/line/', title: '区切り線', description: '象形文字以外の線。' },
    { href: '/special-characters/instagram/', title: 'Instagram', description: '自己紹介の行全体を組む。' },
    { href: '/emoji-combinations/good-night/', title: 'おやすみの組み合わせ', description: '夜の行に月を足す。' }
  ]
});

const dotPatterns = [
  ['⣠⣄  ⣠⣄\n⠙⠋⠴⠛⠋\n  ⠈⠃', '輪が二つのリボン', 'リボン'],
  ['╭╮╭╮\n╰╯╰╯\n ╰╯', '線だけのリボン', 'リボン'],
  ['═╗  ╔═\n ╚╗╔╝\n  ╚╝', '尾のある結び', 'リボン'],
  ['⠤⠤♡⠤⠤', '点線の中央にハート', 'リボン'],
  ['· · ♡ · ·', 'まばらなドットリボン', 'リボン'],
  ['  ✦\n ✦ ✦\n✦   ✦\n ✦ ✦\n  ✦', '五点の星', '星'],
  ['★☆★\n☆★☆\n★☆★', '塗りと白抜きの星', '星'],
  ['✦ · ✦ · ✦', '横一列の星ドット', '星'],
  ['⋆･⋆･⋆･⋆', '細かい星の点', '星'],
  ['⠀✦⠀✦⠀✦', '間隔の広い星', '星'],
  ['♡⠀♡⠀♡', 'ハートのドット', 'ハート'],
  ['⢀⣠⣤⣤⣄\n⠙♡  ♡⠋\n ⠈⠛⠛⠁', 'ハートを入れたリボン', 'ハート'],
  ['· ♡ · ♡ ·', '点とハートの交互', 'ハート'],
  ['♥︎.♥︎.♥︎', '小さい黒ハートの列', 'ハート'],
  ['  ★\n ★★★\n★★★★★\n  ┃', '星のツリー', 'クリスマス'],
  ['❄️ · ❄️ · ❄️', '雪のドット', 'クリスマス'],
  ['🎁┈🎁┈🎁', '包みの列', 'クリスマス'],
  ['· · 🎄 · ·', 'ツリーを点で挟む', 'クリスマス']
];

pages.push({
  ...base,
  slug: 'special-characters-dot',
  path: '/special-characters/dot/',
  family: 'special-characters',
  title: 'ドットリボン・星ドット コピペ | ドット記号 - MojiMoon',
  description: 'ドットリボン、星ドット、ハートのドット、クリスマスのドットをコピーできます。各模様からアイロンビーズの図案作成へ進めます。',
  ogTitle: 'ドットリボン・星ドットのコピペ',
  ogDescription: '点で描いたリボンと星。ビーズ図案の下絵にもなります。',
  eyebrow: 'Dot Symbols',
  h1: 'ドットリボン・星ドット コピペ',
  hero: 'ドットリボンや星ドットは、点と線で描いた文字の模様です。プロフィールの飾りや、シールの下絵に使えます。輪郭がマス目で追えるものには、アイロンビーズの図案作成へのボタンを付けています。',
  toolLabel: 'ドット記号',
  searchPlaceholder: 'ドットリボン、星ドット、ハート、クリスマス',
  draftPlaceholder: '模様をクリックするとここに入ります',
  composerHint: '幅の広い模様は、貼ったあと改行が残るか確認してください。',
  recentLabel: '最近使ったドット',
  categories: [
    { id: 'ribbon', label: 'リボン' },
    { id: 'star', label: '星' },
    { id: 'heart', label: 'ハート' },
    { id: 'xmas', label: 'クリスマス' }
  ],
  quickFilters: [
    { label: 'ドットリボン', query: 'リボン' },
    { label: '星', query: '星' },
    { label: 'ハート', query: 'ハート' },
    { label: 'クリスマス', query: 'クリスマス' }
  ],
  itemGroups: ['リボン', '星', 'ハート', 'クリスマス'].map((name) => {
    const id = { リボン: 'ribbon', 星: 'star', ハート: 'heart', クリスマス: 'xmas' }[name];
    return group(id, name === 'リボン' ? 'ドットリボン' : name === '星' ? '星ドット' : `${name}のドット`, ['ドット', name], dotPatterns.filter((item) => item[2] === name).map(([value, label]) => pair(value, label, ['ドット', name], { wide: value.includes('\n'), beadHref: bead(`dot-${id}`) })));
  }),
  seo: {
    heading: '模様をコピーして、必要ならビーズにする',
    paragraphs: [
      'ドット絵文字は、絵文字そのものではなく、点と線で小さい絵を作った文字です。スマホの幅で崩れないよう、一行あたりの文字数を短くしてあります。崩れないかは、コピーしたあとメモアプリで見てください。フォントが等幅でないと、星の点がずれます。',
      'アイロンビーズ図案にするボタンは、beads.mojimoon.com の図案作成を開きます。模様データは自動では渡りません。コピーした形を見ながらマスを塗るための入口です。'
    ],
    sections: [
      {
        heading: 'どれから見るか',
        cards: [
          { title: 'ドットリボン', body: '結び目の輪郭があるもの。量産型の区切りより、図案やシールの下絵向きです。' },
          { title: '星ドット', body: '五点で星を描いたものと、★☆ を交互に置いた列。列のほうはプロフィールに貼りやすいです。' },
          { title: 'クリスマス', body: 'ツリーは縦に長いので、チャットよりストーリーや待ち受けのメモ向きです。' }
        ]
      }
    ],
    links: [
      { href: '/special-characters/ribbon/', label: 'リボン記号' },
      { href: '/special-characters/star/', label: '星' },
      { href: '/emoji-combinations/christmas/', label: 'クリスマスの組み合わせ' }
    ]
  },
  faq: [
    { question: 'スマホで星の形がずれます。', answer: '等幅でないフォントでは、空白の幅が揃わず星が崩れます。メモアプリで等幅に近いかを見て、崩れるなら横一列の ✦ · ✦ · ✦ を使ってください。' },
    { question: 'ビーズ図案はそのまま開けますか？', answer: 'ボタンは図案作成アプリを開くだけです。マスの色は、コピーした模様を見ながらそちらで塗ります。' }
  ],
  related: [
    { href: '/special-characters/ribbon/', title: 'リボン記号', description: '୨୧ のような一文字のリボン。' },
    { href: '/special-characters/star/', title: '星', description: 'ドットではない星の記号。' },
    { href: '/kawaii-copy/ascii-art/', title: 'かわいいアスキーアート', description: 'もう少し絵に近い文字画。' }
  ]
});

const asciiPieces = [
  [' /\\_/\\\n( o.o )\n > ^ <', '正面の猫'],
  ['(\\_/)\n(•.•)\n/>  >', '歩いている猫'],
  [' /)/)\n( . .)\n(> < )', '丸い熊'],
  ['(\\_/)\n(>.<)\n(")(")', '耳の長い兎'],
  ['  ^~^\n (\'Y\')\nC(_ _)', '小さい兎'],
  ['  . .\n / V \\\n/(   )\\', 'ハートの線'],
  ['  ★\n ★ ★\n★   ★', '小さな星'],
  ['(•‿•)', '丸顔の一行'],
  ['( ˘ᵕ˘ )', '眠そうな一行'],
  [' ʕ•ᴥ•ʔ', '熊の一行'],
  ['(=^･ω･^=)', '猫の一行'],
  ['(っ˘ω˘)っ', '差し出す手'],
  ['  ☁\n ⋆  ⋆', '雲と星'],
  [' (\\(\\ \n ( -.-)\no_(")(")', '横向きの兎'],
  ['  /) /)\n ( • ༝ •)\n c( づ  )', '猫が手を出す'],
  [' ♡\n(   )\n ---', '箱のハート'],
  ['  __\n (oo)\n--||--', '正面の顔'],
  [' ✧\n(  )\n ✧', '上下に光'],
  ['(づ｡◕‿‿◕｡)づ', '渡してくる顔'],
  [' ／l、\n（ﾟ､ ｡ ７\n  l、ﾞ~ヽ\n  じしf_)ノ', 'ちいさな犬'],
  ['  ∧＿∧\n（｡･ω･｡)つ━☆・*。', '星を渡す'],
  ['(✿◠‿◠)', '花のついた笑顔']
];

pages.push({
  ...base,
  slug: 'kawaii-copy-ascii-art',
  path: '/kawaii-copy/ascii-art/',
  family: 'kawaii-copy',
  title: 'かわいいアスキーアート コピペ | 猫・ハート・星 - MojiMoon',
  description: '1行から5行のかわいいアスキーアートをコピーできます。猫、兎、ハート、星を、スマホの幅で崩れにくい短さにしています。写真からの変換は別のツールです。',
  ogTitle: 'かわいいアスキーアート コピペ',
  ogDescription: '短い猫やハートのAA。長い2ch芸ではなく、貼って崩れにくいもの。',
  eyebrow: 'Kawaii ASCII',
  h1: 'かわいいアスキーアート コピペ',
  hero: 'ここにあるのは、チャットに貼るための短い文字絵です。猫、兎、ハート、星。横幅はスマホの一行に収まりやすいものだけにして、5行を超える芸は置いていません。写真を文字にしたいときは、別のアスキーアート変換を使ってください。',
  toolLabel: 'かわいいアスキーアート',
  searchPlaceholder: '猫、兎、ハート、星、顔',
  draftPlaceholder: '作品をクリックすると、改行ごとここに入ります',
  composerHint: '貼った先のフォントで星の位置がずれたら、一行ものの顔に替えてください。',
  recentLabel: '最近コピーしたAA',
  categories: [
    { id: 'animal', label: '動物' },
    { id: 'mark', label: 'ハートと星' },
    { id: 'face', label: '一行の顔' }
  ],
  quickFilters: [
    { label: '猫', query: '猫' },
    { label: 'ハート', query: 'ハート' },
    { label: '星', query: '星' },
    { label: '兎', query: '兎' }
  ],
  itemGroups: [
    group('animal', '猫・兎・熊', ['かわいい', 'アスキーアート', '猫'], asciiPieces.filter((item) => /猫|兎|熊|犬/.test(item[1])).map(([value, label]) => pair(value, label, ['動物', 'かわいい'], { wide: true }))),
    group('mark', 'ハートと星', ['ハート', '星', 'アスキーアート'], asciiPieces.filter((item) => /ハート|星|雲|光/.test(item[1])).map(([value, label]) => pair(value, label, ['ハート', '星'], { wide: true }))),
    group('face', '一行で貼る顔', ['かわいい', '顔'], asciiPieces.filter((item) => /顔|笑顔|手|眠/.test(item[1]) && !/猫|兎|熊|犬|星/.test(item[1])).map(([value, label]) => pair(value, label, ['顔'], { wide: value.includes('\n') })))
  ],
  seo: {
    heading: '長いAAではなく、貼れる大きさ',
    paragraphs: [
      'アスキーアートコピペには、巨大な作品や掲示板の定型も混ざります。このページが集めているのは、LINEやプロフィールにそのまま置ける1〜5行です。猫の顔は三行、ハートはそれより少なく、横の空白を盛りすぎていません。',
      '等幅フォントでないと、星の点が横にずれます。ずれたときは、複数行の絵をやめて ʕ•ᴥ•ʔ のような一行にすると、ほぼ崩れません。写真やロゴを文字に変換する道具は、サイト内の別ページにあります。'
    ],
    sections: [
      {
        heading: '向き不向き',
        cards: [
          { title: 'チャット', body: '三行の猫まで。五行を超えると、相手の画面でスクロールが増えます。' },
          { title: 'ハートのAA', body: '♡ の記号で足りるなら、そちらのほうが小さいです。線でハートの形が欲しいときだけ、このページのハートを使います。' },
          { title: '変換ツール', body: '自分の写真を文字にしたい場合は、コピー集ではなく変換ツールです。' }
        ]
      }
    ],
    links: [
      { href: '/ascii-art-generator/', label: '画像からAA変換' },
      { href: '/special-characters/heart/', label: 'ハート記号' },
      { href: '/kaomoji/cat/', label: '猫の顔文字' }
    ]
  },
  faq: [
    { question: 'スマホで形が崩れます。', answer: '空白の幅がフォントで変わると崩れます。三行の絵がずれたら、一行の顔文字型に替えてください。このページの作品は、そもそも横幅を短くしてあります。' },
    { question: 'やる夫や長いコピペはありますか？', answer: '置いていません。かわいい動物とハートと星だけです。' },
    { question: '自分の絵をAAにできますか？', answer: 'このページは作品のコピーです。画像からの変換はアスキーアート変換のツールで行えます。' }
  ],
  related: [
    { href: '/ascii-art-generator/', title: 'AA変換', description: '画像や文字からアスキーアートを作る。' },
    { href: '/kaomoji/cat/', title: '猫顔文字', description: '三行より短い猫。' },
    { href: '/special-characters/dot/', title: 'ドット', description: 'マス目の星やリボン。' }
  ]
});

const xmas = [
  ['🎄⭐', 'ツリーと星', '短い'],
  ['🎄🎁', 'ツリーと包み', '短い'],
  ['❄️🎄❄️', '雪で挟む', '短い'],
  ['🎅🎄', '人とツリー', '短い'],
  ['🔔🎄', 'ベルとツリー', '短い'],
  ['⭐️🎄🎁', '上から下への並び', '短い'],
  ['🎄❤️', '赤を一つ', '短い'],
  ['🦌🎄', 'トナカイ', '短い'],
  ['🎄\n🎁🎁🎁', 'ツリーの下に三つ', '絵'],
  ['  ★\n ★★★\n  🎄', '星からツリー', '絵'],
  ['𓂃🎄𓈒𓏸', '余白の中のツリー', '余白'],
  ['❄️𓂃𓈒𓏸', '雪と象形文字', '余白'],
  ['𓃃𓈒🎄', '象形文字とツリー', '余白'],
  ['· · 🎄 · ·', 'ドットの中のツリー', 'ドット'],
  ['❄️ · ❄️ · ❄️', '雪のドット', 'ドット'],
  ['✦ 🎄 ✦', '星記号で挟む', 'ドット'],
  ['メリークリスマス 🎄', 'そのままの挨拶', '文'],
  ['Merry Christmas 🎄⭐', '英語の挨拶', '文'],
  ['今年も一緒にいられてよかった。メリークリスマス。🎄', '近い人へ', '文'],
  ['寒いから、あったかいもの飲んで。🎄', '友達へ', '文'],
  ['ツリーの電気、今日だけは消さないで。✨🎄', '夜の一言', '文'],
  ['プレゼントより先に、メリークリスマス。🎁', '渡す前', '文']
];

pages.push({
  ...base,
  slug: 'emoji-combinations-christmas',
  path: '/emoji-combinations/christmas/',
  family: 'emoji-combinations',
  priority: '0.84',
  title: 'クリスマス 絵文字 組み合わせ | ツリー・雪・一言 - MojiMoon',
  description: 'クリスマスの絵文字組み合わせを、短い並び、ドット、𓂃 を添えた形、そのまま送れる一言に分けてコピーできます。',
  ogTitle: 'クリスマス絵文字の組み合わせ',
  ogDescription: '🎄 を中心にした短い並びと、友達に送る一言。',
  eyebrow: 'Christmas Emoji',
  h1: 'クリスマス絵文字の組み合わせ',
  hero: 'クリスマスの絵文字は、ツリーを中心にすると散らかりません。雪と星は脇役です。ドットや 𓂃 を添えた静かな形と、友達に送る短い文も同じページに置いています。',
  toolLabel: 'クリスマスの組み合わせ',
  searchPlaceholder: 'クリスマス、ツリー、雪、ドット',
  draftPlaceholder: '組み合わせをクリックするとここに入ります',
  composerHint: '挨拶の文は、絵文字を足す前に名前を先頭へ。',
  recentLabel: '最近使ったクリスマスの組み合わせ',
  categories: [
    { id: 'short', label: '短い' },
    { id: 'picture', label: '縦に積む' },
    { id: 'quiet', label: '余白' },
    { id: 'dot', label: 'ドット' },
    { id: 'note', label: '一言' }
  ],
  quickFilters: [
    { label: 'ツリー', query: 'ツリー' },
    { label: '雪', query: '雪' },
    { label: 'ドット', query: 'ドット' },
    { label: 'メッセージ', query: 'クリスマス' }
  ],
  itemGroups: [
    group('short', '横に三つまで', ['クリスマス', '絵文字'], xmas.filter((item) => item[2] === '短い').map(([value, label]) => pair(value, label, ['クリスマス']))),
    group('picture', '改行して積む', ['クリスマス'], xmas.filter((item) => item[2] === '絵').map(([value, label]) => pair(value, label, ['クリスマス'], { wide: true }))),
    group('quiet', '𓂃 と一緒に', ['クリスマス', 'おしゃれ'], xmas.filter((item) => item[2] === '余白').map(([value, label]) => pair(value, label, ['𓂃', 'クリスマス']))),
    group('dot', 'ドットのクリスマス', ['ドット', 'クリスマス'], xmas.filter((item) => item[2] === 'ドット').map(([value, label]) => pair(value, label, ['ドット'], { beadHref: bead('dot-christmas') }))),
    group('note', '送れる一言', ['クリスマス', 'メッセージ'], xmas.filter((item) => item[2] === '文').map(([value, label]) => pair(value, label, ['メッセージ'])))
  ],
  seo: {
    heading: 'ツリーを真ん中に置く',
    paragraphs: [
      'クリスマス絵文字の組み合わせは、🎅🎁❄️⭐🔔 を全部入れるとポスターになります。チャットなら 🎄 を一つ決めて、雪か星かを片方だけ足してください。',
      '𓂃 を添えると、赤と緑の主張が少し落ちます。ドット版はシールやビーズの下絵にも使えます。店のセール文や業務の案内は、ここでは書いていません。'
    ],
    sections: [
      {
        heading: 'いつどれを',
        cards: [
          { title: '当日の朝', body: 'メリークリスマス 🎄 だけで足ります。ツリーを三つにすると、挨拶より飾りが長くなります。' },
          { title: 'ストーリー', body: '改行して積んだツリーは、写真の下に置くと絵として見えます。' },
          { title: '静かに', body: '𓂃🎄𓈒𓏸 は、赤を増やしたくないプロフィール向きです。' }
        ]
      }
    ],
    links: [
      { href: '/emoji-combinations/new-year/', label: 'お正月・あけおめ' },
      { href: '/special-characters/dot/', label: 'ドット記号' },
      { href: '/fancy-text-generator/cursive/', label: '筆記体の Merry Christmas' }
    ]
  },
  faq: [
    { question: 'クリスマスの絵文字は何を中心にしますか？', answer: '🎄 を一つ決めて、❄️ か ⭐ かを足すとまとまります。全部のモチーフを一行に入れないでください。' },
    { question: '英語の Merry Christmas はどこで筆記体にできますか？', answer: '筆記体の変換ページに、Merry Christmas の定型があります。ひらがなは筆記体にできません。' },
    { question: 'ドットのツリーはビーズにできますか？', answer: 'ドットの項目から図案作成を開けます。色を塗る作業はビーズのアプリ側です。' }
  ],
  related: [
    { href: '/emoji-combinations/new-year/', title: 'お正月', description: '年が明けたあとの挨拶。' },
    { href: '/fancy-text-generator/cursive/', title: '筆記体', description: 'Merry Christmas を英字の筆記体にする。' },
    { href: '/special-characters/hieroglyph/', title: '象形文字', description: '🎄 の脇に余白を足す。' }
  ]
});

const newYear = [
  ['🎍🌅', '門松と朝', '絵文字'],
  ['🧧✨', 'ご祝儀袋と光', '絵文字'],
  ['✨🎍✨', '光で門松を挟む', '絵文字'],
  ['🎍', '門松だけ。桜はまだ早い', '絵文字'],
  ['🌅🗻', '初日の出と山', '絵文字'],
  ['🎍🌅🎆', '朝と夜を欲張りすぎた例', '絵文字'],
  ['🎆🌃', '花火と夜', '絵文字'],
  ['🎍🤍', '白を足して静かに', '絵文字'],
  ['あけおめ 🎍', '短いあけおめ', 'LINE'],
  ['あけましておめでとう 🌅', '少しきちんと', 'LINE'],
  ['今年もよろしく。あけおめ。🎍', '友達', 'LINE'],
  ['去年いろいろありがとう。今年も隣でよろしく。🌅', '近い人', 'LINE'],
  ['寝正月する。あけおめ。🛌', '友達の本音', 'LINE'],
  ['初夢、なに見た？🎍', '質問で始める', 'LINE'],
  ['ことよろ。今年も変な話聞かせて。✨', 'くだけた友達', 'LINE'],
  ['新しい年、いい匂いのご飯が食べられますように。🎍', '家族', '年始'],
  ['体だけは壊さないで。今年もよろしく。🌅', '家族', '年始'],
  ['お正月くらい、通知をゆっくり返していいよ。🎍', '相手を休ませる', '年始'],
  ['今年の目標は、去年より少し早く寝ること。🌅', '自分の話から', '年始'],
  ['推し活も今年も続ける。あけおめ。🎤', '推し友', '年始']
];

pages.push({
  ...base,
  slug: 'emoji-combinations-new-year',
  path: '/emoji-combinations/new-year/',
  family: 'emoji-combinations',
  priority: '0.84',
  title: 'あけおめ 絵文字 | お正月の組み合わせとLINE一言 - MojiMoon',
  description: 'あけおめの絵文字と、お正月にLINEで送る短い一言です。門松や初日の出の組み合わせと、友達・家族向けの文を分けています。',
  ogTitle: 'あけおめ絵文字とお正月の一言',
  ogDescription: '🎍 を添えた短い年始の挨拶。年賀状の作文ではありません。',
  eyebrow: 'New Year Emoji',
  h1: 'お正月・あけおめの絵文字組み合わせ',
  hero: '年賀状に書く丁寧な文と、元日のLINEは別の文章です。ここでは後者だけを扱います。あけおめ、ことよろ、今年もよろしく。絵文字は 🎍 か 🌅 を一つ。書き初めで頑張る長文は置いていません。',
  toolLabel: 'あけおめの組み合わせ',
  searchPlaceholder: 'あけおめ、お正月、LINE、今年もよろしく',
  draftPlaceholder: '挨拶をクリックするとここに入ります',
  composerHint: '名前を先頭に足すと、グループの一斉送信に見えない文になります。',
  recentLabel: '最近使った年始の挨拶',
  categories: [
    { id: 'emoji', label: '絵文字' },
    { id: 'line', label: 'LINE' },
    { id: 'home', label: '家族・近い人' }
  ],
  quickFilters: [
    { label: 'あけおめ', query: 'あけおめ' },
    { label: 'LINE', query: 'LINE' },
    { label: 'お正月', query: '正月' },
    { label: '家族', query: '家族' }
  ],
  itemGroups: [
    group('emoji', '絵文字の並び', ['お正月', 'あけおめ', '絵文字'], newYear.filter((item) => item[2] === '絵文字').map(([value, label]) => pair(value, label, ['お正月', '絵文字']))),
    group('line', 'LINEの一言', ['あけおめ', 'LINE'], newYear.filter((item) => item[2] === 'LINE').map(([value, label]) => pair(value, label, ['あけおめ', 'LINE']))),
    group('home', '家族とかなり近い人', ['お正月', '一言'], newYear.filter((item) => item[2] === '年始').map(([value, label]) => pair(value, label, ['家族', '一言'])))
  ],
  seo: {
    heading: 'あけおめは短く、絵文字は一つ',
    paragraphs: [
      '元日のトークは通知が密集します。三行の年賀は読まれず、あけおめ 🎍 は読まれます。もう一行足すなら、去年の具体か、今年の小さな約束だけにしてください。',
      '「謹賀新年」「旧年中は」のような改まった年賀は、目上への文面には向きません。ここにあるのはチャットの短い挨拶です。'
    ],
    sections: [
      {
        heading: '絵文字の選び方',
        cards: [
          { title: '🎍', body: '正月とすぐ分かる定番です。一つで足ります。' },
          { title: '🌅', body: '初日の出に寄せたいとき。夜に送ると少し早いですが、元日の朝には合います。' },
          { title: '🌸', body: '春です。正月の文に入れると季節がずれます。三月の挨拶まで取っておきます。' }
        ]
      }
    ],
    links: [
      { href: '/emoji-combinations/christmas/', label: 'クリスマス' },
      { href: '/kaomoji/hello/', label: '挨拶の顔文字' },
      { href: '/emoji-copy/good-morning/', label: 'おはよう絵文字' }
    ]
  },
  faq: [
    { question: 'あけおめ絵文字は何が無難ですか？', answer: '🎍 が正月と最も素直に伝わります。🎆 は夜の花火、🌅 は朝に寄せたいときに替えてください。' },
    { question: 'LINEの一言はどのくらいですか？', answer: '「あけましておめでとう。今年もよろしく。」に絵文字一つ、が上限の目安です。友達なら「ことよろ」まで崩して構いません。' },
    { question: '年賀状の文面もありますか？', answer: '改まった年賀の作文は置いていません。元日にチャットへ送る短い挨拶だけです。' }
  ],
  related: [
    { href: '/emoji-combinations/christmas/', title: 'クリスマス', description: '年の瀬の組み合わせ。' },
    { href: '/kaomoji/hello/', title: '挨拶の顔文字', description: '絵文字ではなく顔で始める。' },
    { href: '/emoji-copy/congratulations/', title: 'おめでとう', description: '正月以外のお祝い。' }
  ]
});

const bySlug = new Map(source.pages.map((page) => [page.slug, page]));
const remove = new Set(['kawaii-copy-cute-divider', 'kaomoji-good-night']);
const nextPages = source.pages.filter((page) => !remove.has(page.slug));
for (const page of pages) {
  const index = nextPages.findIndex((item) => item.slug === page.slug);
  const merged = withLeftovers(bySlug.get(page.slug), page);
  if (index >= 0) nextPages[index] = merged;
  else nextPages.push(merged);
}
source.pages = nextPages;
await fs.writeFile(file, `${JSON.stringify(source, null, 2)}\n`);
console.log(`pages: ${source.pages.length}`);
console.log(`removed: ${[...remove].join(', ')}`);
console.log(`upserted: ${pages.map((page) => page.slug).join(', ')}`);
