(function () {
  const data = window.MojiMoonToolData;
  if (!data) return;

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
  const configuredCategory = document.body.dataset.defaultCategory;
  const pageSize = Number(data.pageSize || 48);
  let currentPage = 1;
  let activeCategory = data.categories.some((category) => category.id === configuredCategory)
    ? configuredCategory
    : data.categories[0]?.id || 'all';
  pagination.className = 'pagination';
  pagination.setAttribute('data-pagination', '');
  grid.after(pagination);

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function getRecent() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      return [];
    }
  }

  function setRecent(value) {
    localStorage.setItem(storageKey, JSON.stringify(value.slice(0, 20)));
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1400);
  }

  function draftCount() {
    return draft.value.trim().length;
  }

  function updateComposerState() {
    if (!composerSheetCount) return;
    const count = draftCount();
    composerSheetCount.textContent = count ? `${count}文字` : '空';
    composerSheetCount.classList.toggle('has-content', count > 0);
    composerSheetCopy.disabled = count === 0;
  }

  let composerSheetCount;
  let composerSheetCopy;
  let composerSheetAction;
  let composerSheetIcon;

  function setComposerOpen(open) {
    document.body.classList.toggle('composer-open', open);
    if (!composerSheetToggle) return;
    composerSheetToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    composerSheetToggle.setAttribute('aria-label', open ? 'コピー草稿を閉じる' : 'コピー草稿を開く');
    if (composerSheetAction) composerSheetAction.textContent = open ? '閉じる' : '開く';
    if (composerSheetIcon) composerSheetIcon.textContent = open ? '⌄' : '⌃';
  }

  let composerSheetToggle;

  function setupMobileComposer() {
    if (!draft || !copyDraft || !composer) return;
    document.body.classList.add('has-mobile-composer');

    const body = document.createElement('div');
    body.className = 'composer-body';
    while (composer.firstChild) body.appendChild(composer.firstChild);

    const bar = document.createElement('div');
    bar.className = 'composer-sheet-bar';
    bar.innerHTML = `
      <button class="composer-sheet-toggle" type="button" aria-expanded="false" aria-label="コピー草稿を開く">
        <span class="sheet-icon" aria-hidden="true">⌃</span>
        <span class="sheet-title">コピー草稿</span>
        <span class="sheet-count">空</span>
        <span class="sheet-action">開く</span>
      </button>
      <button class="sheet-copy-btn" type="button" disabled>コピー</button>
    `;

    composer.append(bar, body);
    composerSheetToggle = bar.querySelector('.composer-sheet-toggle');
    composerSheetCount = bar.querySelector('.sheet-count');
    composerSheetCopy = bar.querySelector('.sheet-copy-btn');
    composerSheetAction = bar.querySelector('.sheet-action');
    composerSheetIcon = bar.querySelector('.sheet-icon');

    composerSheetToggle.addEventListener('click', () => {
      setComposerOpen(!document.body.classList.contains('composer-open'));
    });
    composerSheetCopy.addEventListener('click', () => {
      copyText(draft.value.trim());
      if (draft.value.trim()) remember(draft.value.trim());
    });
    draft.addEventListener('focus', () => {
      if (mobileQuery.matches) setComposerOpen(true);
    });
    updateComposerState();
  }

  async function copyText(text) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('コピーしました');
    } catch (error) {
      draft.value = text;
      draft.focus();
      draft.select();
      document.execCommand('copy');
      showToast('コピーしました');
    }
  }

  function remember(text) {
    const recent = getRecent().filter((item) => item !== text);
    recent.unshift(text);
    setRecent(recent);
    renderRecent();
  }

  function appendToDraft(text) {
    const spacer = draft.value && !draft.value.endsWith(' ') ? ' ' : '';
    draft.value = `${draft.value}${spacer}${text}`.trimStart();
    draft.dispatchEvent(new Event('input'));
    if (mobileQuery.matches) {
      setComposerOpen(false);
    }
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
    return haystack.includes(query);
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
      <button class="page-btn" type="button" data-page-prev ${currentPage === 1 ? 'disabled' : ''}>前へ</button>
      ${pages.join('')}
      <button class="page-btn" type="button" data-page-next ${currentPage === totalPages ? 'disabled' : ''}>次へ</button>
      <span class="page-count">${totalItems}件中 ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalItems)}件</span>
    `;
  }

  function renderGrid() {
    const items = filteredItems();
    if (!items.length) {
      grid.innerHTML = '<div class="no-results">該当するアイテムがありません。別の言葉で検索してください。</div>';
      renderPagination(0);
      return;
    }
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const pageItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    grid.innerHTML = pageItems.map((item) => `
      <button class="copy-card" type="button" data-copy="${encodeURIComponent(item.value)}" data-label="${item.label || ''}">
        <span class="copy-value">${item.value}</span>
        <span class="copy-label">${item.label || 'クリックで追加'}</span>
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
    recentList.innerHTML = recent.map((item) => `
      <button class="recent-chip" type="button" data-recent-copy="${encodeURIComponent(item)}">${item}</button>
    `).join('');
  }

  tabList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;
    activeCategory = button.dataset.tab;
    currentPage = 1;
    renderTabs();
    renderGrid();
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
    appendToDraft(value);
    remember(value);
    showToast('草稿に追加しました');
  });

  recentList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-recent-copy]');
    if (!button) return;
    appendToDraft(decodeURIComponent(button.dataset.recentCopy));
  });

  searchInput.addEventListener('input', () => {
    currentPage = 1;
    renderGrid();
  });

  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.focus();
    renderGrid();
  });

  copyDraft.addEventListener('click', () => {
    copyText(draft.value.trim());
    if (draft.value.trim()) remember(draft.value.trim());
    updateComposerState();
  });

  clearDraft.addEventListener('click', () => {
    draft.value = '';
    draft.focus();
    updateComposerState();
  });

  draft.addEventListener('input', updateComposerState);

  setupMobileComposer();
  renderTabs();
  renderGrid();
  renderRecent();
})();
