#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.normalize(path.join(fileURLToPath(import.meta.url), '..', '..'));
const contentFile = path.join(rootDir, '_content', 'ja-copy-pages.json');
const sitemapFile = path.join(rootDir, 'sitemap.xml');
const generatedDataDir = path.join(rootDir, 'assets', 'data', 'generated');
const baseUrl = 'https://mojimoon.com';
const checkOnly = process.argv.includes('--check');
const force = process.argv.includes('--force');
const htmlMarker = '<!-- mojimoon:generated-page';
const dataMarker = '// mojimoon:generated-data';
const sitemapStart = '  <!-- mojimoon:generated-pages:start -->';
const sitemapEnd = '  <!-- mojimoon:generated-pages:end -->';

const navTargets = {
  kaomoji: '/kaomoji/',
  'emoji-combinations': '/emoji-combinations/',
  'special-characters': '/special-characters/',
  'emoji-copy': '/emoji-copy/',
  'kawaii-copy': '/kawaii-copy/'
};

async function main() {
  const source = await readJson(contentFile);
  const pages = normalizePages(source);
  const sitemapPages = pages.filter(shouldIncludeInSitemap);
  await validateUniqueTargets(pages);

  const outputs = pages.flatMap((page) => [
    {
      kind: 'html',
      file: page.htmlFile,
      content: renderPage(page)
    },
    {
      kind: 'data',
      file: page.dataFile,
      content: renderDataFile(page)
    }
  ]);
  outputs.push({
    kind: 'sitemap',
    file: sitemapFile,
    content: await renderUpdatedSitemap(sitemapPages)
  });

  const stale = [];
  for (const output of outputs) {
    const changed = await writeGeneratedFile(output, checkOnly);
    if (changed) stale.push(path.relative(rootDir, output.file));
  }

  if (checkOnly && stale.length) {
    throw new Error(`Generated content is out of date:\n${stale.map((file) => `- ${file}`).join('\n')}`);
  }

  const handwritten = await syncHandwrittenGrids(checkOnly);
  if (checkOnly && handwritten.length) {
    throw new Error(`Generated content is out of date:\n${handwritten.map((file) => `- ${file}`).join('\n')}`);
  }

  console.log(`${checkOnly ? 'Checked' : 'Generated'} ${pages.length} content page(s).`);
  console.log(`Data files: ${pages.length}`);
  console.log(`Sitemap URLs managed: ${sitemapPages.length}`);
  console.log(`Handwritten grids: ${handwrittenTargets.length}`);
}

const handwrittenTargets = [
  { html: 'special-characters/index.html', data: 'assets/data/special-characters.js', headings: false },
  { html: 'special-characters/heart/index.html', data: 'assets/data/pages/heart.js', headings: true },
  { html: 'special-characters/star/index.html', data: 'assets/data/pages/star.js', headings: true },
  { html: 'emoji-copy/sparkle/index.html', data: 'assets/data/pages/sparkle.js', headings: true },
  { html: 'kaomoji/sad/index.html', data: 'assets/data/pages/crying.js', headings: true },
  { html: 'kaomoji/angry/index.html', data: 'assets/data/pages/angry.js', headings: true }
];

async function loadToolData(file) {
  const source = await fs.readFile(file, 'utf8');
  const sandbox = {};
  const runner = new Function('window', `${source}\nreturn window.MojiMoonToolData;`);
  return runner(sandbox);
}

function toolDataToPage(data, headings) {
  const categories = data.categories || [{ id: 'all', label: 'すべて' }];
  const items = (data.items || []).map((item) => ({
    ...item,
    tags: item.tags || [],
    wide: Boolean(item.wide || String(item.value).includes('\n')),
    beadHref: item.beadHref || ''
  }));
  const groups = categories
    .filter((category) => category.id !== 'all')
    .map((category) => ({
      category: category.id,
      heading: category.heading || category.label,
      items: items.filter((item) => item.category === category.id)
    }))
    .filter((group) => group.items.length);
  const used = new Set(groups.flatMap((group) => group.items.map((item) => item.value)));
  const rest = items.filter((item) => !used.has(item.value));
  if (rest.length) groups.push({ category: rest[0].category || 'all', heading: 'そのほか', items: rest });
  return {
    showGroupHeadings: Boolean(headings) && groups.length > 1,
    categories,
    itemGroups: groups.length ? groups : [{ category: 'all', heading: 'すべて', items }],
    items
  };
}

async function syncHandwrittenGrids(checkOnly) {
  const stale = [];
  for (const target of handwrittenTargets) {
    const htmlFile = path.join(rootDir, target.html);
    const dataFile = path.join(rootDir, target.data);
    const grid = renderItemGrid(toolDataToPage(await loadToolData(dataFile), target.headings));
    const block = `<!-- mojimoon:static-grid:start -->\n${grid}\n<!-- mojimoon:static-grid:end -->`;
    const html = await fs.readFile(htmlFile, 'utf8');
    const marker = '<!-- mojimoon:static-grid:start -->';
    let next = html;
    if (html.includes(marker)) {
      next = html.replace(/<!-- mojimoon:static-grid:start -->[\s\S]*?<!-- mojimoon:static-grid:end -->/u, block);
    } else if (html.includes('<div class="item-grid" data-grid></div>')) {
      next = html.replace('<div class="item-grid" data-grid></div>', block);
    } else {
      throw new Error(`No item grid placeholder in ${target.html}`);
    }
    if (next === html) continue;
    stale.push(target.html);
    if (!checkOnly) await fs.writeFile(htmlFile, next);
  }
  return stale;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function normalizePages(source) {
  if (source.schemaVersion !== 1) {
    throw new Error(`Unsupported schemaVersion: ${source.schemaVersion}`);
  }
  if (!Array.isArray(source.pages)) {
    throw new Error('Expected pages to be an array.');
  }
  const defaults = {
    draftMaxLength: 220,
    pageSize: 48,
    changefreq: 'weekly',
    priority: '0.75',
    ...(source.defaults || {})
  };
  return source.pages.map((page) => normalizePage(page, defaults, source.updated));
}

function normalizePage(page, defaults, updated) {
  requireString(page, 'slug');
  requireString(page, 'path');
  requireString(page, 'family');
  requireString(page, 'title');
  requireString(page, 'description');
  requireString(page, 'h1');
  requireString(page, 'hero');
  requireString(page, 'toolLabel');

  if (!/^[a-z0-9-]+$/.test(page.slug)) {
    throw new Error(`Invalid slug "${page.slug}". Use lowercase letters, numbers, and hyphens.`);
  }
  const pagePath = normalizeUrlPath(page.path);
  const navCurrent = page.navCurrent || page.family;
  const indexing = page.indexing || 'standard';
  if (!['priority', 'standard', 'internal'].includes(indexing)) {
    throw new Error(`Unsupported indexing "${indexing}" for ${page.slug}.`);
  }
  if (!navTargets[navCurrent]) {
    throw new Error(`Unsupported navCurrent "${navCurrent}" for ${page.slug}.`);
  }

  const categories = normalizeCategories(page.categories || []);
  const categoryIds = new Set(categories.map((category) => category.id));
  const items = normalizeItems(page, categoryIds);

  return {
    ...page,
    path: pagePath,
    canonical: `${baseUrl}${pagePath}`,
    navCurrent,
    indexing,
    updated: page.lastmod || updated || today(),
    changefreq: page.changefreq || defaults.changefreq,
    priority: String(page.priority || (indexing === 'priority' ? '0.85' : defaults.priority)),
    draftMaxLength: Number(page.draftMaxLength || defaults.draftMaxLength),
    pageSize: Number(page.pageSize || defaults.pageSize),
    categories,
    quickFilters: page.quickFilters || [],
    items,
    dataUrl: `/assets/data/generated/${page.slug}.js`,
    htmlFile: path.join(rootDir, pagePath.slice(1), 'index.html'),
    dataFile: path.join(generatedDataDir, `${page.slug}.js`)
  };
}

function shouldIncludeInSitemap(page) {
  return page.indexing !== 'internal' && page.sitemap !== false;
}

function requireString(object, key) {
  if (!object[key] || typeof object[key] !== 'string') {
    throw new Error(`Missing required string field: ${key}`);
  }
}

function normalizeUrlPath(value) {
  if (!value.startsWith('/') || !value.endsWith('/')) {
    throw new Error(`Path must start and end with "/": ${value}`);
  }
  if (value.includes('..') || value.includes('//')) {
    throw new Error(`Unsafe path: ${value}`);
  }
  return value;
}

function normalizeCategories(categories) {
  const normalized = categories.map((category) => {
    if (!category.id || !category.label) throw new Error('Each category needs id and label.');
    if (!/^[a-z0-9-]+$/.test(category.id)) throw new Error(`Invalid category id: ${category.id}`);
    return { id: category.id, label: category.label };
  });
  if (!normalized.some((category) => category.id === 'all')) {
    normalized.unshift({ id: 'all', label: 'すべて' });
  }
  return normalized;
}

function normalizeItems(page, categoryIds) {
  if (!Array.isArray(page.itemGroups) || !page.itemGroups.length) {
    throw new Error(`${page.slug} needs at least one itemGroup.`);
  }
  const seen = new Set();
  const items = [];
  for (const group of page.itemGroups) {
    if (!group.category || !categoryIds.has(group.category)) {
      throw new Error(`${page.slug} itemGroup has unknown category: ${group.category}`);
    }
    if (!Array.isArray(group.items) || !group.items.length) {
      throw new Error(`${page.slug} itemGroup "${group.category}" has no items.`);
    }
    for (const entry of group.items) {
      const item = typeof entry === 'string' ? { value: entry } : entry;
      if (!item.value || typeof item.value !== 'string') {
        throw new Error(`${page.slug} has an item without value.`);
      }
      if (seen.has(item.value)) continue;
      seen.add(item.value);
      items.push({
        value: item.value,
        label: item.label || group.label || page.h1,
        category: item.category || group.category,
        tags: unique([
          ...(page.tags || []),
          ...(group.tags || []),
          ...(item.tags || [])
        ]),
        wide: Boolean(item.wide || String(item.value).includes('\n')),
        beadHref: item.beadHref || group.beadHref || ''
      });
    }
  }
  if (!items.length) throw new Error(`${page.slug} has no unique items.`);
  return items;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function validateUniqueTargets(pages) {
  const slugs = new Set();
  const paths = new Set();
  for (const page of pages) {
    if (slugs.has(page.slug)) throw new Error(`Duplicate slug: ${page.slug}`);
    if (paths.has(page.path)) throw new Error(`Duplicate path: ${page.path}`);
    slugs.add(page.slug);
    paths.add(page.path);
  }
}

function renderPage(page) {
  const faqSchema = [renderFaqSchema(page), renderBreadcrumbSchema(page), renderItemListSchema(page)].filter(Boolean).map((node) => `
  <script type="application/ld+json">
  ${escapeScriptJson(JSON.stringify(node, null, 2))}
  </script>`).join('');
  const hreflang = (page.hreflang || []).map((link) => `  <link rel="alternate" hreflang="${escapeAttr(link.lang)}" href="${escapeAttr(link.href)}">`).join('\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeAttr(page.description)}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${escapeAttr(page.canonical)}">
${hreflang ? `${hreflang}\n` : ''}  <link rel="icon" href="/favicon.ico" type="image/x-icon">
  <link rel="apple-touch-icon" href="/moon_icon.png">
  <meta property="og:title" content="${escapeAttr(page.ogTitle || page.title)}">
  <meta property="og:description" content="${escapeAttr(page.ogDescription || page.description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeAttr(page.canonical)}">
  <meta property="og:image" content="https://mojimoon.com/moon_icon.png">${faqSchema}
  <script src="/assets/js/analytics.js" defer></script>
  <link rel="stylesheet" href="/assets/css/text-tools.css">
  <link rel="stylesheet" href="/assets/css/site-navigation.css">
  <script src="/assets/js/site-navigation.js" defer></script>
</head>
<body data-default-category="all">
  ${htmlMarker} slug="${escapeAttr(page.slug)}" source="_content/ja-copy-pages.json" -->
  <div class="tool-shell">
    ${renderHeader(page)}
    <section class="hero"><div class="hero-inner"><p class="eyebrow">${escapeHtml(page.eyebrow || 'MojiMoon Copy Tool')}</p><h1>${escapeHtml(page.h1)}</h1><p class="hero-copy">${escapeHtml(page.hero)}</p></div></section>
    <main class="tool-wrap"><div class="tool-app"><section class="workspace" aria-label="${escapeAttr(page.toolLabel)}"><div class="tool-tabs" data-tabs></div><div class="search-row"><input class="search-input" type="search" data-search placeholder="${escapeAttr(page.searchPlaceholder || 'キーワードで検索')}"><button class="clear-search" type="button" data-clear-search>クリア</button></div>${renderItemGrid(page)}</section><aside class="composer" aria-label="コピー草稿"><h2>コピー草稿</h2><textarea class="draft-input" data-draft placeholder="${escapeAttr(page.draftPlaceholder || 'クリックするとここに追加されます')}"></textarea><div class="button-row"><button class="primary-btn" type="button" data-copy-draft>コピー</button><button class="secondary-btn" type="button" data-clear-draft>消去</button></div><p class="hint">${escapeHtml(page.composerHint || 'クリックした素材を草稿で組み合わせてコピーできます。')}</p><div class="recent-list" data-recent aria-label="${escapeAttr(page.recentLabel || '最近使ったもの')}"></div></aside></div></main>
    ${renderSeoSection(page)}
    ${renderRelated(page)}
    <footer class="site-footer"><p>MojiMoon - 文字と絵文字を楽しく使うための無料ツール集。</p></footer>
  </div>
  <div class="toast" data-toast></div><script src="${escapeAttr(page.dataUrl)}"></script><script src="/assets/js/mobile-draft-sheet.js"></script>
  <script src="/assets/js/text-tools.js"></script>
</body>
</html>
`;
}

function renderHeader(page) {
  return `<header class="site-header"><div class="site-header-inner"><div class="brand-group"><a class="brand" href="/"><span class="brand-mark">🌙</span><span>MojiMoon</span></a></div><nav class="site-nav" aria-label="文字ツール">
<a href="/">月文字</a>
<a href="/fancy-text-generator/">おしゃれ文字</a>
<a href="/fancy-text-generator/cursive/">筆記体</a>
<a href="/gyaru-moji/">ギャル文字</a>
<a href="/zenkaku-hankaku-converter/">全角半角変換</a>
<details class="nav-menu nav-menu-wide">
<summary aria-current="page">コピペ</summary>
<div class="nav-menu-panel">
<a href="/kawaii-copy/"${current(page, 'kawaii-copy')}>かわいいコピペ</a>
<a href="/emoji-copy/"${current(page, 'emoji-copy')}>絵文字コピペ</a>
<a href="/emoji-list/">絵文字一覧</a>
<a href="/kaomoji/"${current(page, 'kaomoji')}>顔文字</a>
<a href="/special-characters/"${current(page, 'special-characters')}>特殊文字</a>
<a href="/emoji-combinations/"${current(page, 'emoji-combinations')}>絵文字組み合わせ</a>
</div>
</details>
<a href="/slack-emoji-generator/">Slack</a>
</nav></div></header>`;
}

function current(page, key) {
  return page.navCurrent === key ? ' aria-current="page"' : '';
}

function renderSeoSection(page) {
  const seo = page.seo || {};
  const paragraphs = (seo.paragraphs || []).map((text) => `<p>${escapeHtml(text)}</p>`).join('');
  const sections = (seo.sections || []).map(renderSeoSubsection).join('');
  const links = seo.links?.length ? `<div class="category-links">${seo.links.map((link) => `<a href="${escapeAttr(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div>` : '';
  const enrichment = page.skipGeneratedEnrichment ? '' : renderGeneratedEnrichment(page);
  const faq = page.faq?.length ? `<h2>FAQ</h2>${page.faq.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join('')}` : '';
  return `<section class="seo-section"><h2>${escapeHtml(seo.heading || `${page.h1}の使い方`)}</h2>${paragraphs}${sections}${enrichment}${links}${faq}</section>`;
}

function renderFaqSchema(page) {
  if (!page.faq?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}

function renderBreadcrumbSchema(page) {
  const family = familyCrumb(page.family);
  if (!family) return null;
  const crumbs = [
    { name: 'ホーム', item: `${baseUrl}/` },
    { name: family[0], item: `${baseUrl}${family[1]}` },
    { name: page.h1, item: page.canonical }
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item
    }))
  };
}

function renderItemListSchema(page) {
  const elements = page.items.slice(0, 20).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: placeholderLabel(item.label) ? item.value : item.label,
    description: item.value
  }));
  if (!elements.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: page.h1,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: page.items.length,
    itemListElement: elements
  };
}

function familyCrumb(family) {
  return {
    kaomoji: ['顔文字', '/kaomoji/'],
    'emoji-copy': ['絵文字コピペ', '/emoji-copy/'],
    'emoji-combinations': ['絵文字組み合わせ', '/emoji-combinations/'],
    'special-characters': ['特殊文字', '/special-characters/'],
    'kawaii-copy': ['かわいいコピペ', '/kawaii-copy/']
  }[family] || null;
}

function placeholderLabel(label) {
  return /^\S.{0,24}\s+\d+$/.test(String(label || '').trim());
}

function renderItemGrid(page) {
  const seen = new Set();
  const blocks = [];
  for (const group of page.itemGroups) {
    const cards = [];
    for (const entry of group.items) {
      const value = typeof entry === 'string' ? entry : entry.value;
      if (!value || seen.has(value)) continue;
      seen.add(value);
      const item = page.items.find((candidate) => candidate.value === value);
      if (!item) continue;
      cards.push(renderCopyCard(item));
    }
    if (cards.length) blocks.push({ group, cards });
  }
  const headings = Boolean(page.showGroupHeadings) && blocks.length > 1;
  if (!headings) {
    return `<div class="item-grid" data-grid data-static-items>${blocks.flatMap((block) => block.cards).join('')}</div>`;
  }
  return `<div class="item-grid has-groups" data-grid data-static-items>${blocks.map(({ group, cards }) => {
    const category = page.categories.find((item) => item.id === group.category);
    const heading = group.heading || category?.label || group.category;
    return `<section class="grid-group" data-grid-group="${escapeAttr(group.category)}"><h2 class="grid-group-title">${escapeHtml(heading)}</h2><div class="grid-group-cards">${cards.join('')}</div></section>`;
  }).join('')}</div>`;
}

function renderCopyCard(item) {
  const label = item.label && !placeholderLabel(item.label) && item.label !== item.value ? item.label : '';
  const classes = ['copy-card'];
  if (item.wide) classes.push('copy-card-wide');
  const valueClass = item.wide ? 'copy-value copy-value-pre' : 'copy-value';
  const labelHtml = label ? `<span class="copy-label">${escapeHtml(label)}</span>` : '';
  const beadHtml = item.beadHref ? `<a class="bead-cta" href="${escapeAttr(item.beadHref)}" target="_blank" rel="noopener">アイロンビーズ図案にする</a>` : '';
  const card = `<button class="${classes.join(' ')}" type="button" data-copy="${escapeAttr(encodeURIComponent(item.value))}" data-label="${escapeAttr(label)}" data-category="${escapeAttr(item.category)}" data-tags="${escapeAttr((item.tags || []).join(','))}"><span class="${valueClass}">${escapeHtml(item.value)}</span>${labelHtml}</button>`;
  if (!beadHtml) return card;
  return `<div class="copy-stack${item.wide ? ' copy-card-wide' : ''}">${card}${beadHtml}</div>`;
}

function renderSeoSubsection(section) {
  const paragraphs = (section.paragraphs || []).map((text) => `<p>${escapeHtml(text)}</p>`).join('');
  const cards = section.cards?.length ? `<div class="seo-grid">${section.cards.map((card) => `<div class="seo-card"><strong>${escapeHtml(card.title)}</strong><p>${escapeHtml(card.body)}</p></div>`).join('')}</div>` : '';
  return `<h2>${escapeHtml(section.heading)}</h2>${paragraphs}${cards}`;
}

function renderGeneratedEnrichment(page) {
  return `${renderContentInventory(page)}${renderSearchGuide(page)}${renderRelatedGuide(page)}`;
}

function renderContentInventory(page) {
  const groups = page.itemGroups
    .map((group) => {
      const category = page.categories.find((item) => item.id === group.category);
      const title = category?.label || group.label || group.category;
      const examples = group.items
        .slice(0, 4)
        .map((item) => (typeof item === 'string' ? item : item.value))
        .filter(Boolean);
      if (!examples.length) return null;
      return {
        title,
        body: `${examples.join('、')} など。${inventoryBody(page, title)}`
      };
    })
    .filter(Boolean)
    .slice(0, 4);

  if (!groups.length) return '';
  return `<h2>${escapeHtml(page.h1)}で探せる素材</h2><div class="seo-grid">${groups.map((card) => `<div class="seo-card"><strong>${escapeHtml(card.title)}</strong><p>${escapeHtml(card.body)}</p></div>`).join('')}</div>`;
}

function inventoryBody(page, title) {
  const unit = familyUnit(page.family);
  if (page.family === 'emoji-combinations') {
    return `${title}の雰囲気をそろえた${unit}を、プロフィールや投稿文にそのまま足せます。`;
  }
  if (page.family === 'special-characters') {
    return `${title}の見た目に近い${unit}を、名前デコや区切り線に使いやすい形でまとめています。`;
  }
  if (page.family === 'kawaii-copy') {
    return `${title}向けの${unit}を、自己紹介や推し活プロフィールに貼りやすい短さで選べます。`;
  }
  return `${title}の気分に近い${unit}を、LINE返信やSNS投稿の文末に合わせて選べます。`;
}

function renderSearchGuide(page) {
  const filters = (page.quickFilters || []).slice(0, 5);
  if (!filters.length) return '';
  const filterText = filters.map((filter) => filter.label).join('、');
  const examples = filters.slice(0, 3).map((filter) => ({
    title: filter.label,
    body: `検索欄に「${filter.query || filter.label}」と入れると、${searchBody(page, filter.label)}に近い素材へ絞り込めます。`
  }));
  return `<h2>検索するときのコツ</h2><p>${escapeHtml(page.h1)}は、${escapeHtml(filterText)}などの言葉で絞り込めます。最初は広い言葉で探し、気に入った素材をコピー草稿に入れてから、短い言葉や別の${escapeHtml(familyUnit(page.family))}を足すと整えやすくなります。</p><div class="seo-grid">${examples.map((card) => `<div class="seo-card"><strong>${escapeHtml(card.title)}</strong><p>${escapeHtml(card.body)}</p></div>`).join('')}</div>`;
}

function searchBody(page, label) {
  if (page.family === 'kaomoji') return `${label}の表情や返信の温度感`;
  if (page.family === 'emoji-copy') return `${label}の場面で使いやすい単体絵文字`;
  if (page.family === 'emoji-combinations') return `${label}の雰囲気を作る短い組み合わせ`;
  if (page.family === 'special-characters') return `${label}に合う記号や装飾文字`;
  return `${label}に合わせたプロフィール用コピペ`;
}

function renderRelatedGuide(page) {
  const related = (page.related || []).slice(0, 3);
  if (!related.length) return '';
  return `<h2>似た素材との使い分け</h2><div class="seo-grid">${related.map((item) => `<div class="seo-card"><strong><a href="${escapeAttr(item.href)}">${escapeHtml(item.title)}</a></strong><p>${escapeHtml(relatedBody(page, item))}</p></div>`).join('')}</div>`;
}

function relatedBody(page, item) {
  const currentUnit = familyUnit(page.family);
  const description = item.description ? `${item.description} ` : '';
  return `${description}${page.h1}で合う${currentUnit}が見つからない時や、少し違う雰囲気に寄せたい時に使えます。`;
}

function familyUnit(family) {
  return {
    kaomoji: '顔文字',
    'emoji-copy': '絵文字',
    'emoji-combinations': '絵文字組み合わせ',
    'special-characters': '特殊文字',
    'kawaii-copy': 'コピペ素材'
  }[family] || '素材';
}

function renderRelated(page) {
  const related = page.related || [];
  if (!related.length) return '';
  return `<section class="related-tools"><h2>関連ツール</h2><div class="related-grid">${related.map((item) => `<a class="related-card" href="${escapeAttr(item.href)}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description || '')}</span></a>`).join('')}</div></section>`;
}

function renderDataFile(page) {
  const payload = {
    slug: page.slug,
    draftMaxLength: page.draftMaxLength,
    quickFilters: page.quickFilters,
    categories: page.categories,
    pageSize: page.pageSize,
    items: page.items
  };
  return `${dataMarker} slug="${page.slug}" source="_content/ja-copy-pages.json"\nwindow.MojiMoonToolData = ${JSON.stringify(payload, null, 2)};\n`;
}

async function renderUpdatedSitemap(pages) {
  const sitemap = await fs.readFile(sitemapFile, 'utf8');
  const section = renderSitemapSection(pages);
  const startIndex = sitemap.indexOf(sitemapStart);
  const endIndex = sitemap.indexOf(sitemapEnd);
  let withoutSection = sitemap;
  if (startIndex >= 0 || endIndex >= 0) {
    if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
      throw new Error('Malformed generated sitemap marker block.');
    }
    withoutSection = `${sitemap.slice(0, startIndex)}${sitemap.slice(endIndex + sitemapEnd.length)}`;
  }
  for (const page of pages) {
    const loc = `<loc>${page.canonical}</loc>`;
    if (withoutSection.includes(loc)) {
      throw new Error(`Generated URL already exists outside generated sitemap block: ${page.canonical}`);
    }
  }
  if (startIndex >= 0) {
    return `${sitemap.slice(0, startIndex)}${section}${sitemap.slice(endIndex + sitemapEnd.length).replace(/^\s+/u, '')}`;
  }
  return sitemap.replace(/<\/urlset>\s*$/u, `${section}</urlset>\n`);
}

function renderSitemapSection(pages) {
  const urls = pages.map((page) => `  <url>
    <loc>${escapeHtml(page.canonical)}</loc>
    <lastmod>${escapeHtml(page.updated)}</lastmod>
    <changefreq>${escapeHtml(page.changefreq)}</changefreq>
    <priority>${escapeHtml(page.priority)}</priority>
  </url>`).join('\n');
  return `${sitemapStart}
${urls}
${sitemapEnd}
`;
}

async function writeGeneratedFile(output, dryRun) {
  let existing = null;
  try {
    existing = await fs.readFile(output.file, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  if (existing !== null) {
    const marker = output.kind === 'html' ? htmlMarker : output.kind === 'data' ? dataMarker : null;
    if (marker && !existing.includes(marker) && !force) {
      throw new Error(`Refusing to overwrite non-generated ${output.kind}: ${path.relative(rootDir, output.file)}`);
    }
  }

  if (existing === output.content) return false;
  if (!dryRun) {
    await fs.mkdir(path.dirname(output.file), { recursive: true });
    await fs.writeFile(output.file, output.content);
  }
  return true;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function escapeScriptJson(value) {
  return value.replace(/</g, '\\u003c');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
