(function () {
  function setup(options) {
    const root = options.root;
    const draft = options.draft;
    const copyButton = options.copyButton;
    if (!root || !draft || !copyButton) return null;

    const labels = {
      openDraft: 'コピー草稿を開く',
      closeDraft: 'コピー草稿を閉じる',
      draftTitle: 'コピー草稿',
      emptyCount: '空',
      open: '開く',
      close: '閉じる',
      copy: 'コピー',
      charCount: (count) => `${count}文字`,
      charLimitCount: (count, limit) => `${count}/${limit}文字`,
      ...(options.labels || {})
    };
    const bodyClass = options.bodyClass || 'has-mobile-composer';
    const openClass = options.openClass || 'composer-open';
    const barClass = options.barClass || 'composer-sheet-bar';
    const toggleClass = options.toggleClass || 'composer-sheet-toggle';
    const copyClass = options.copyClass || 'sheet-copy-btn';
    const actions = options.actions || copyButton.closest('.button-row, .draft-actions');
    let draftMeta = options.draftMeta;

    document.body.classList.add(bodyClass);
    if (!draftMeta) {
      draftMeta = document.createElement('div');
      draftMeta.className = 'draft-meta';
      draft.after(draftMeta);
    }

    const body = document.createElement('div');
    body.className = 'composer-body';
    while (root.firstChild) body.appendChild(root.firstChild);

    if (actions) {
      const editor = document.createElement('div');
      editor.className = 'draft-editor';
      body.insertBefore(editor, draft);
      editor.append(draft, draftMeta, actions);
    }

    const bar = options.bar || document.createElement('div');
    bar.className = barClass;
    bar.innerHTML = `
      <button class="${toggleClass}" type="button" aria-expanded="false" aria-label="${labels.openDraft}">
        <span class="sheet-icon" aria-hidden="true">⌃</span>
        <span class="sheet-title">${labels.draftTitle}</span>
        <span class="sheet-count">${labels.emptyCount}</span>
        <span class="sheet-action">${labels.open}</span>
      </button>
      <button class="${copyClass}" type="button" disabled>${labels.copy}</button>
    `;
    root.append(bar, body);

    const toggle = bar.querySelector(`.${toggleClass}`);
    const sheetCount = bar.querySelector('.sheet-count');
    const sheetCopy = bar.querySelector(`.${copyClass}`);
    const sheetAction = bar.querySelector('.sheet-action');
    const sheetIcon = bar.querySelector('.sheet-icon');
    const getCount = options.getCount || (() => draft.value.trim().length);

    function setOpen(open) {
      document.body.classList.toggle(openClass, open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? labels.closeDraft : labels.openDraft);
      sheetAction.textContent = open ? labels.close : labels.open;
      sheetIcon.textContent = open ? '⌄' : '⌃';
    }

    function update() {
      const count = getCount();
      if (draftMeta) {
        draftMeta.textContent = options.maxLength
          ? labels.charLimitCount(count, options.maxLength)
          : labels.charCount(count);
        draftMeta.classList.toggle('is-full', Boolean(options.maxLength && count >= options.maxLength));
      }
      sheetCount.textContent = count ? labels.charCount(count) : labels.emptyCount;
      sheetCount.classList.toggle('has-content', count > 0);
      sheetCopy.disabled = count === 0;
      copyButton.disabled = count === 0;
    }

    toggle.addEventListener('click', () => {
      setOpen(!document.body.classList.contains(openClass));
    });
    sheetCopy.addEventListener('click', () => {
      options.onCopy?.(sheetCopy);
    });
    draft.addEventListener('focus', () => {
      if (!options.mobileQuery || options.mobileQuery.matches) setOpen(true);
    });

    update();
    return {
      bar,
      body,
      draftMeta,
      sheetCopy,
      setOpen,
      update
    };
  }

  window.MojiMoonMobileDraftSheet = { setup };
})();
