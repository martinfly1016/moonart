(function () {
  const data = window.MojiMoonToolData;
  if (!data) return;

  const tabList = document.querySelector('[data-tabs]');
  const grid = document.querySelector('[data-grid]');
  const searchInput = document.querySelector('[data-search]');
  const clearSearch = document.querySelector('[data-clear-search]');
  const draft = document.querySelector('[data-draft]');
  const copyDraft = document.querySelector('[data-copy-draft]');
  const clearDraft = document.querySelector('[data-clear-draft]');
  const recentList = document.querySelector('[data-recent]');
  const toast = document.querySelector('[data-toast]');
  const storageKey = `mojimoon:${data.slug}:recent`;
  let activeCategory = data.categories[0]?.id || 'all';

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

  function renderGrid() {
    const query = normalize(searchInput.value);
    const items = data.items.filter((item) => categoryMatches(item) && itemMatches(item, query));
    if (!items.length) {
      grid.innerHTML = '<div class="no-results">該当するアイテムがありません。別の言葉で検索してください。</div>';
      return;
    }
    grid.innerHTML = items.map((item) => `
      <button class="copy-card" type="button" data-copy="${encodeURIComponent(item.value)}" data-label="${item.label || ''}">
        <span class="copy-value">${item.value}</span>
        <span class="copy-label">${item.label || 'クリックで追加'}</span>
      </button>
    `).join('');
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
    renderTabs();
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

  searchInput.addEventListener('input', renderGrid);

  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.focus();
    renderGrid();
  });

  copyDraft.addEventListener('click', () => {
    copyText(draft.value.trim());
    if (draft.value.trim()) remember(draft.value.trim());
  });

  clearDraft.addEventListener('click', () => {
    draft.value = '';
    draft.focus();
  });

  renderTabs();
  renderGrid();
  renderRecent();
})();
