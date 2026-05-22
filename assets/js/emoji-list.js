(function () {
  const data = window.MojiMoonEmojiListData;
  if (!data) return;

  const tabs = document.querySelector('[data-emoji-tabs]');
  const grid = document.querySelector('[data-emoji-grid]');
  const search = document.querySelector('[data-emoji-search]');
  const clearSearch = document.querySelector('[data-emoji-clear]');
  const quickFilters = document.querySelector('[data-emoji-quick]');
  const toneList = document.querySelector('[data-tone-list]');
  const draft = document.querySelector('[data-emoji-draft]');
  const copyDraft = document.querySelector('[data-copy-draft]');
  const clearDraft = document.querySelector('[data-clear-draft]');
  const draftMeta = document.querySelector('[data-draft-meta]');
  const toast = document.querySelector('[data-toast]');
  const count = document.querySelector('[data-result-count]');
  const recentList = document.querySelector('[data-recent]');
  const draftPanel = document.querySelector('.draft-panel');
  const mobileQuery = window.matchMedia('(max-width: 860px)');
  const storageKey = `mojimoon:${data.slug}:recent`;
  const draftMaxLength = Number(draft?.getAttribute('maxlength') || data.draftMaxLength || 160);
  let mobileDraftSheet;

  let activeCategory = 'all';
  let activeTone = '';

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1300);
  }

  function codePoints(value) {
    return Array.from(value).map((char) => `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
  }

  function htmlCode(value) {
    return Array.from(value).map((char) => `&amp;#x${char.codePointAt(0).toString(16)};`).join('');
  }

  function withTone(value, tone) {
    if (!tone) return value;
    const chars = Array.from(value);
    const variationIndex = chars[1] === '️' ? 2 : 1;
    chars.splice(variationIndex, 0, tone);
    return chars.join('');
  }

  function displayValue(item) {
    return item.tone ? withTone(item.value, activeTone) : item.value;
  }

  function itemMatches(item, query) {
    if (!query) return true;
    const haystack = normalize([
      item.value,
      item.nameJa,
      item.nameEn,
      item.category,
      ...(item.tags || [])
    ].join(' '));
    return query.split(/\s+/).every((token) => haystack.includes(token));
  }

  function filteredItems() {
    const query = normalize(search?.value || '');
    return data.items.filter((item) => {
      const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
      return categoryMatch && itemMatches(item, query);
    });
  }

  async function copyText(text) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const fallback = document.createElement('textarea');
      fallback.value = text;
      fallback.style.position = 'fixed';
      fallback.style.left = '-999px';
      document.body.append(fallback);
      fallback.focus();
      fallback.select();
      document.execCommand('copy');
      fallback.remove();
    }
    showToast('コピーしました');
  }

  function copyDraftText(button) {
    const text = draft.value.trim();
    if (!text) {
      showToast('コピーする内容がありません');
      return;
    }
    copyText(text);
    remember(text);
    if (button) {
      const original = button.dataset.originalText || button.textContent;
      button.dataset.originalText = original;
      button.textContent = 'コピー済み';
      window.clearTimeout(button.copyTimer);
      button.copyTimer = window.setTimeout(() => {
        button.textContent = original;
      }, 1200);
    }
  }

  function remember(value) {
    try {
      const recent = JSON.parse(localStorage.getItem(storageKey) || '[]').filter((item) => item !== value);
      recent.unshift(value);
      localStorage.setItem(storageKey, JSON.stringify(recent.slice(0, 12)));
      renderRecent();
    } catch (error) {
      // localStorage may be unavailable in private browsing.
    }
  }

  function updateDraftState() {
    const hasContent = draft.value.trim().length > 0;
    if (copyDraft) copyDraft.disabled = !hasContent;
    mobileDraftSheet?.update();
  }

  function addToDraft(value) {
    const spacer = draft.value && !draft.value.endsWith(' ') ? ' ' : '';
    const nextValue = `${draft.value}${spacer}${value}`.trimStart();
    if (nextValue.length > draftMaxLength) {
      showToast(`${draftMaxLength}文字以内にしてください`);
      return;
    }
    draft.value = nextValue;
    draft.dispatchEvent(new Event('input'));
    remember(value);
    showToast('草稿に追加しました');
  }

  function getRecent() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]').slice(0, 12);
    } catch (error) {
      return [];
    }
  }

  function renderRecent() {
    if (!recentList) return;
    const recent = getRecent();
    if (!recent.length) {
      recentList.innerHTML = '';
      return;
    }
    recentList.innerHTML = `
      <div class="recent-list-head">
        <span>最近使ったもの</span>
        <button class="recent-clear" type="button" data-clear-recent>履歴を消去</button>
      </div>
      <div class="recent-chip-grid">
        ${recent.map((item) => `
          <button class="recent-chip" type="button" data-recent-add="${encodeURIComponent(item)}">${item}</button>
        `).join('')}
      </div>
    `;
  }

  function setupCollapsibleSeo() {
    const section = document.querySelector('.seo-section');
    if (!section || section.dataset.collapsibleReady === 'true') return;
    section.dataset.collapsibleReady = 'true';
    const firstHeading = section.querySelector('h2');
    const details = document.createElement('details');
    details.className = 'seo-details';
    const summary = document.createElement('summary');
    const title = document.createElement('span');
    title.textContent = firstHeading?.textContent?.trim() || '詳しい説明';
    const action = document.createElement('span');
    action.className = 'seo-summary-action';
    action.textContent = '詳しく見る';
    summary.append(title, action);
    const body = document.createElement('div');
    body.className = 'seo-details-body';
    while (section.firstChild) body.appendChild(section.firstChild);
    details.append(summary, body);
    section.appendChild(details);
  }

  function renderTabs() {
    if (!tabs) return;
    tabs.innerHTML = data.categoryLinks.map((item) => `
      <button class="emoji-list-tab${item.id === activeCategory ? ' active' : ''}" type="button" data-category="${item.id}"${item.id === activeCategory ? ' aria-current="page"' : ''}>${item.label}</button>
    `).join('');
  }

  function renderTones() {
    if (!toneList) return;
    toneList.innerHTML = data.toneOptions.map((item) => `
      <button class="tone-chip${item.value === activeTone ? ' active' : ''}" type="button" data-tone="${item.value}"${item.value === activeTone ? ' aria-current="true"' : ''}>${item.label}</button>
    `).join('');
  }

  function renderQuickFilters() {
    if (!quickFilters || !data.quickFilters?.length) return;
    quickFilters.innerHTML = data.quickFilters.map((item) => `
      <button class="quick-filter" type="button" data-query="${item.query}">${item.label}</button>
    `).join('');
  }

  function renderGrid() {
    const items = filteredItems();
    if (count) count.textContent = `${items.length}件`;
    if (!items.length) {
      grid.innerHTML = '<div class="emoji-empty">該当する絵文字がありません。別の言葉で検索してください。</div>';
      return;
    }
    grid.innerHTML = items.map((item) => {
      const value = displayValue(item);
      const codes = codePoints(value).join(' ');
      return `
        <article class="emoji-card">
          <button class="emoji-main" type="button" data-add="${encodeURIComponent(value)}" aria-label="${item.nameJa}を草稿に追加">
            <span class="emoji-glyph">${value}</span>
            <span class="emoji-names">
              <strong>${item.nameJa}</strong>
              <span>${item.nameEn}</span>
            </span>
          </button>
          <div class="emoji-meta">
            <span>${codes}</span>
            <span>${htmlCode(value)}</span>
          </div>
          <div class="emoji-actions">
            <button type="button" data-copy="${encodeURIComponent(value)}">コピー</button>
            <button type="button" data-add="${encodeURIComponent(value)}">草稿へ</button>
          </div>
        </article>
      `;
    }).join('');
  }

  tabs?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    renderTabs();
    renderGrid();
  });

  toneList?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tone]');
    if (!button) return;
    activeTone = button.dataset.tone;
    renderTones();
    renderGrid();
  });

  quickFilters?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-query]');
    if (!button) return;
    search.value = button.dataset.query;
    renderGrid();
  });

  search?.addEventListener('input', renderGrid);
  clearSearch?.addEventListener('click', () => {
    search.value = '';
    search.focus();
    renderGrid();
  });

  grid?.addEventListener('click', (event) => {
    const copyButton = event.target.closest('[data-copy]');
    const addButton = event.target.closest('[data-add]');
    if (copyButton) {
      const value = decodeURIComponent(copyButton.dataset.copy);
      copyText(value);
      remember(value);
      return;
    }
    if (addButton) addToDraft(decodeURIComponent(addButton.dataset.add));
  });

  copyDraft?.addEventListener('click', () => copyDraftText(copyDraft));
  clearDraft?.addEventListener('click', () => {
    draft.value = '';
    draft.focus();
    draft.dispatchEvent(new Event('input'));
  });
  draft?.addEventListener('input', updateDraftState);
  recentList?.addEventListener('click', (event) => {
    const clearRecent = event.target.closest('[data-clear-recent]');
    if (clearRecent) {
      localStorage.setItem(storageKey, '[]');
      renderRecent();
      showToast('履歴を消去しました');
      return;
    }
    const recentButton = event.target.closest('[data-recent-add]');
    if (recentButton) addToDraft(decodeURIComponent(recentButton.dataset.recentAdd));
  });

  mobileDraftSheet = window.MojiMoonMobileDraftSheet?.setup({
    root: draftPanel,
    draft,
    copyButton: copyDraft,
    draftMeta,
    actions: copyDraft?.closest('.draft-actions'),
    mobileQuery,
    maxLength: draftMaxLength,
    getCount: () => draft.value.trim().length,
    onCopy: copyDraftText
  });

  renderTabs();
  renderTones();
  renderQuickFilters();
  renderGrid();
  renderRecent();
  updateDraftState();
  setupCollapsibleSeo();
})();
