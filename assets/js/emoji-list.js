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
  const toast = document.querySelector('[data-toast]');
  const count = document.querySelector('[data-result-count]');
  const mobileCopy = document.querySelector('[data-mobile-copy]');
  const mobileCount = document.querySelector('[data-mobile-count]');
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobileBar = document.querySelector('.mobile-draft-bar');
  const draftPanel = document.querySelector('.draft-panel');
  const storageKey = `mojimoon:${data.slug}:recent`;

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

  function remember(value) {
    try {
      const recent = JSON.parse(localStorage.getItem(storageKey) || '[]').filter((item) => item !== value);
      recent.unshift(value);
      localStorage.setItem(storageKey, JSON.stringify(recent.slice(0, 20)));
    } catch (error) {
      // localStorage may be unavailable in private browsing.
    }
  }

  function updateDraftState() {
    const length = draft.value.trim().length;
    if (mobileCount) mobileCount.textContent = length ? `${length}文字` : '空';
    if (mobileCopy) mobileCopy.disabled = length === 0;
  }

  function addToDraft(value) {
    const spacer = draft.value && !draft.value.endsWith(' ') ? ' ' : '';
    draft.value = `${draft.value}${spacer}${value}`.trimStart();
    draft.dispatchEvent(new Event('input'));
    remember(value);
    showToast('草稿に追加しました');
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

  copyDraft?.addEventListener('click', () => copyText(draft.value.trim()));
  mobileCopy?.addEventListener('click', () => copyText(draft.value.trim()));
  clearDraft?.addEventListener('click', () => {
    draft.value = '';
    draft.focus();
    updateDraftState();
  });
  draft?.addEventListener('input', updateDraftState);
  mobileToggle?.addEventListener('click', () => {
    document.body.classList.toggle('draft-open');
  });

  document.body.classList.add('has-emoji-draft');
  if (draftPanel && mobileBar) draftPanel.prepend(mobileBar);

  renderTabs();
  renderTones();
  renderQuickFilters();
  renderGrid();
  updateDraftState();
})();
