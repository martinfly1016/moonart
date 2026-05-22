(function () {
  const data = window.MojiMoonToolData;
  if (!data) return;
  const ui = {
    copied: 'コピー済み',
    emptyDraft: 'コピーする内容がありません',
    openDraft: 'コピー草稿を開く',
    closeDraft: 'コピー草稿を閉じる',
    draftTitle: 'コピー草稿',
    emptyCount: '空',
    open: '開く',
    close: '閉じる',
    copy: 'コピー',
    copiedToast: 'コピーしました',
    draftLimit: (limit) => `${limit}文字まで追加できます`,
    noResults: '該当するアイテムがありません。別の言葉で検索してください。',
    fallbackLabel: 'クリックで追加',
    previous: '前へ',
    next: '次へ',
    pageCount: (total, start, end) => `${total}件中 ${start}-${end}件`,
    recentTitle: '最近使ったもの',
    clearRecent: '履歴を消去',
    clearRecentToast: '履歴を消去しました',
    addedToast: '草稿に追加しました',
    charCount: (count) => `${count}文字`,
    charLimitCount: (count, limit) => `${count}/${limit}文字`,
    ...(data.ui || {})
  };

  const tabList = document.querySelector('[data-tabs]');
  const grid = document.querySelector('[data-grid]');
  const searchInput = document.querySelector('[data-search]');
  const clearSearch = document.querySelector('[data-clear-search]');
  const draft = document.querySelector('[data-draft]');
  const composer = draft?.closest('.composer');
  const copyDraft = document.querySelector('[data-copy-draft]');
  const clearDraft = document.querySelector('[data-clear-draft]');
  const recentList = document.querySelector('[data-recent]');
  const toast = document.querySelector('[data-toast]');
  const pagination = document.createElement('div');
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  const storageKey = `mojimoon:${data.slug}:recent`;
  const recentLimit = Number(data.recentLimit || 12);
  const configuredCategory = document.body.dataset.defaultCategory;
  const configuredQuery = document.body.dataset.defaultQuery || '';
  const pageSize = Number(data.pageSize || 48);
  const draftMaxLength = Number(data.draftMaxLength || 0);
  let quickFilterWrap;
  let draftMeta;
  let mobileDraftSheet;
  let currentPage = 1;
  let activeCategory = data.categories.some((category) => category.id === configuredCategory)
    ? configuredCategory
    : data.categories[0]?.id || 'all';
  pagination.className = 'pagination';
  pagination.setAttribute('data-pagination', '');
  grid.after(pagination);
  if (draftMaxLength && draft) draft.maxLength = draftMaxLength;
  if (configuredQuery && searchInput) searchInput.value = configuredQuery;

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function getRecent() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]').slice(0, recentLimit);
    } catch (error) {
      return [];
    }
  }

  function setRecent(value) {
    localStorage.setItem(storageKey, JSON.stringify(value.slice(0, recentLimit)));
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1400);
  }

  function trackToolEvent(name, params = {}) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      tool_slug: data.slug,
      page_path: window.location.pathname,
      ...params
    });
  }

  function flashCopyButton(button) {
    if (!button || button.disabled) return;
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

  function copyDraftText(button) {
    const text = draft.value.trim();
    if (!text) {
      showToast(ui.emptyDraft);
      return;
    }
    copyText(text);
    remember(text);
    trackToolEvent('tool_copy', {
      draft_length: text.length,
      source: button?.classList.contains('sheet-copy-btn') ? 'mobile_sheet' : 'composer'
    });
    flashCopyButton(button);
  }

  function draftCount() {
    return draft.value.trim().length;
  }

  function updateComposerState() {
    const count = draftCount();
    if (draftMeta) {
      draftMeta.textContent = draftMaxLength ? ui.charLimitCount(count, draftMaxLength) : ui.charCount(count);
      draftMeta.classList.toggle('is-full', Boolean(draftMaxLength && count >= draftMaxLength));
    }
    mobileDraftSheet?.update();
  }

  function setupMobileComposer() {
    if (!draft || !copyDraft || !composer) return;
    mobileDraftSheet = window.MojiMoonMobileDraftSheet?.setup({
      root: composer,
      draft,
      copyButton: copyDraft,
      draftMeta,
      mobileQuery,
      maxLength: draftMaxLength,
      labels: ui,
      getCount: draftCount,
      onCopy: copyDraftText
    });
    if (mobileDraftSheet?.draftMeta) draftMeta = mobileDraftSheet.draftMeta;
    updateComposerState();
  }

  async function copyText(text) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast(ui.copiedToast);
    } catch (error) {
      draft.value = text;
      draft.focus();
      draft.select();
      document.execCommand('copy');
      showToast(ui.copiedToast);
    }
  }

  function remember(text) {
    const recent = getRecent().filter((item) => item !== text);
    recent.unshift(text);
    setRecent(recent);
    renderRecent();
  }

  function appendToDraft(text, options = {}) {
    const spacer = draft.value && !draft.value.endsWith(' ') ? ' ' : '';
    const nextValue = `${draft.value}${spacer}${text}`.trimStart();
    if (draftMaxLength && nextValue.length > draftMaxLength) {
      showToast(ui.draftLimit(draftMaxLength));
      return;
    }
    draft.value = nextValue;
    draft.dispatchEvent(new Event('input'));
    trackToolEvent('draft_add', {
      item_label: options.label || '',
      item_category: options.category || activeCategory,
      item_length: text.length,
      source: options.source || 'grid'
    });
  }

  function renderQuickFilters() {
    if (!data.quickFilters?.length || !searchInput) return;
    quickFilterWrap = document.createElement('div');
    quickFilterWrap.className = 'quick-filter-row';
    quickFilterWrap.innerHTML = data.quickFilters.map((item) => `
      <button class="quick-filter" type="button" data-quick-query="${item.query}">${item.label}</button>
    `).join('');
    searchInput.closest('.search-row')?.after(quickFilterWrap);
  }

  function renderTabs() {
    tabList.innerHTML = data.categories.map((category) => {
      const selected = category.id === activeCategory;
      return `<button class="tool-tab${selected ? ' active' : ''}" type="button" data-tab="${category.id}"${selected ? ' aria-current="page"' : ''}>${category.label}</button>`;
    }).join('');
  }

  function itemMatches(item, query) {
    if (!query) return true;
    const haystack = [item.value, item.label, ...(item.tags || [])].map(normalize).join(' ');
    return query.split(/\s+/).every((token) => haystack.includes(token));
  }

  function categoryMatches(item) {
    return activeCategory === 'all' || item.category === activeCategory || (item.tags || []).includes(activeCategory);
  }

  function filteredItems() {
    const query = normalize(searchInput.value);
    return data.items.filter((item) => categoryMatches(item) && itemMatches(item, query));
  }

  function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }
    const pages = [];
    for (let page = 1; page <= totalPages; page += 1) {
      pages.push(`<button class="page-btn${page === currentPage ? ' active' : ''}" type="button" data-page="${page}"${page === currentPage ? ' aria-current="page"' : ''}>${page}</button>`);
    }
    pagination.innerHTML = `
      <button class="page-btn" type="button" data-page-prev ${currentPage === 1 ? 'disabled' : ''}>${ui.previous}</button>
      ${pages.join('')}
      <button class="page-btn" type="button" data-page-next ${currentPage === totalPages ? 'disabled' : ''}>${ui.next}</button>
      <span class="page-count">${ui.pageCount(totalItems, (currentPage - 1) * pageSize + 1, Math.min(currentPage * pageSize, totalItems))}</span>
    `;
  }

  function renderGrid() {
    const items = filteredItems();
    if (!items.length) {
      grid.innerHTML = `<div class="no-results">${ui.noResults}</div>`;
      renderPagination(0);
      return;
    }
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const pageItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    grid.innerHTML = pageItems.map((item) => `
      <button class="copy-card" type="button" data-copy="${encodeURIComponent(item.value)}" data-label="${item.label || ''}">
        <span class="copy-value">${item.value}</span>
        <span class="copy-label">${item.label || ui.fallbackLabel}</span>
      </button>
    `).join('');
    renderPagination(items.length);
  }

  function renderRecent() {
    const recent = getRecent();
    if (!recent.length) {
      recentList.innerHTML = '';
      return;
    }
    recentList.innerHTML = `
      <div class="recent-list-head">
        <span>${ui.recentTitle}</span>
        <button class="recent-clear" type="button" data-clear-recent>${ui.clearRecent}</button>
      </div>
      <div class="recent-chip-grid">
        ${recent.map((item) => `
      <button class="recent-chip" type="button" data-recent-copy="${encodeURIComponent(item)}">${item}</button>
        `).join('')}
      </div>
    `;
  }

  function setupCollapsibleSeo() {
    const section = document.querySelector('.seo-section');
    if (!section || section.dataset.collapsibleReady === 'true') return;
    section.dataset.collapsibleReady = 'true';
    const firstHeading = section.querySelector('h2');
    const summaryText = firstHeading?.textContent?.trim() || 'このページの詳しい説明';
    const details = document.createElement('details');
    details.className = 'seo-details';
    const summary = document.createElement('summary');
    const title = document.createElement('span');
    title.textContent = summaryText;
    const action = document.createElement('span');
    action.className = 'seo-summary-action';
    action.textContent = data.ui?.seoToggleLabel || '詳しく見る';
    summary.append(title, action);
    const body = document.createElement('div');
    body.className = 'seo-details-body';
    while (section.firstChild) body.appendChild(section.firstChild);
    details.append(summary, body);
    section.appendChild(details);
  }

  tabList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;
    activeCategory = button.dataset.tab;
    currentPage = 1;
    renderTabs();
    renderGrid();
    trackToolEvent('category_select', {
      category: activeCategory
    });
  });

  pagination.addEventListener('click', (event) => {
    const prev = event.target.closest('[data-page-prev]');
    const next = event.target.closest('[data-page-next]');
    const pageButton = event.target.closest('[data-page]');
    const totalPages = Math.max(1, Math.ceil(filteredItems().length / pageSize));
    if (prev && currentPage > 1) currentPage -= 1;
    if (next && currentPage < totalPages) currentPage += 1;
    if (pageButton) currentPage = Number(pageButton.dataset.page);
    renderGrid();
  });

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    const value = decodeURIComponent(button.dataset.copy);
    appendToDraft(value, {
      label: button.dataset.label || '',
      category: activeCategory,
      source: 'grid'
    });
    remember(value);
    showToast(ui.addedToast);
  });

  recentList.addEventListener('click', (event) => {
    const clearRecent = event.target.closest('[data-clear-recent]');
    if (clearRecent) {
      setRecent([]);
      renderRecent();
      trackToolEvent('draft_clear_history');
      showToast(ui.clearRecentToast);
      return;
    }
    const button = event.target.closest('[data-recent-copy]');
    if (!button) return;
    appendToDraft(decodeURIComponent(button.dataset.recentCopy), {
      source: 'recent',
      category: activeCategory
    });
  });

  searchInput.addEventListener('input', () => {
    currentPage = 1;
    renderGrid();
    window.clearTimeout(searchInput.trackTimer);
    searchInput.trackTimer = window.setTimeout(() => {
      const query = searchInput.value.trim();
      if (query) {
        trackToolEvent('tool_search', {
          query_length: query.length,
          category: activeCategory
        });
      }
    }, 800);
  });

  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.focus();
    renderGrid();
  });

  copyDraft.addEventListener('click', () => {
    copyDraftText(copyDraft);
    updateComposerState();
  });

  clearDraft.addEventListener('click', () => {
    draft.value = '';
    draft.focus();
    updateComposerState();
    trackToolEvent('draft_clear');
  });

  draft.addEventListener('input', updateComposerState);

  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  setupMobileComposer();
  renderQuickFilters();
  quickFilterWrap?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-quick-query]');
    if (!button) return;
    searchInput.value = button.dataset.quickQuery;
    currentPage = 1;
    renderGrid();
    trackToolEvent('quick_filter_select', {
      query_length: searchInput.value.length,
      category: activeCategory
    });
  });
  renderTabs();
  renderGrid();
  renderRecent();
  setupCollapsibleSeo();
})();
