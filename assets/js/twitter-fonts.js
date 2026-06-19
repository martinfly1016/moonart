(function () {
  const config = window.MojiMoonTwitterFontsConfig || {};
  const lang = config.lang || 'en';
  const root = document.querySelector('[data-twitter-fonts-app]');
  if (!root) return;

  const ui = {
    copied: 'Copied',
    copiedToast: 'Copied',
    copy: 'Copy',
    useName: 'Use as name',
    addBio: 'Add to bio',
    nameApplied: 'Added to display name',
    bioAdded: 'Added to bio',
    insert: 'Insert',
    apply: 'Use template',
    chars: (value, limit) => `${value}/${limit}`,
    over: (value, limit) => `${value - limit} over`,
    styles: 'styles',
    ...(config.ui || {})
  };

  const nameInput = root.querySelector('[data-tf-name]');
  const handleInput = root.querySelector('[data-tf-handle]');
  const bioInput = root.querySelector('[data-tf-bio]');
  const counterInput = root.querySelector('[data-tf-counter]');
  const counterModeButtons = Array.from(root.querySelectorAll('[data-tf-counter-mode]'));
  const workTabs = Array.from(root.querySelectorAll('[data-tf-work-tab]'));
  const workPanels = Array.from(root.querySelectorAll('[data-tf-work-panel]'));
  const editFields = Array.from(root.querySelectorAll('[data-tf-edit-field]'));
  const editSources = Array.from(root.querySelectorAll('[data-tf-edit-source]'));
  const contextKicker = root.querySelector('[data-tf-context-kicker]');
  const contextTitle = root.querySelector('[data-tf-context-title]');
  const contextHelp = root.querySelector('[data-tf-context-help]');
  const insertHelp = root.querySelector('[data-tf-insert-help]');
  const tabsWrap = root.querySelector('[data-tf-tabs]');
  const resultsWrap = root.querySelector('[data-tf-results]');
  const insertsWrap = root.querySelector('[data-tf-inserts]');
  const templatesWrap = root.querySelector('[data-tf-templates]');
  const namePreview = root.querySelector('[data-tf-preview-name]');
  const handlePreview = root.querySelector('[data-tf-preview-handle]');
  const bioPreview = root.querySelector('[data-tf-preview-bio]');
  const bioCount = root.querySelector('[data-tf-bio-count]');
  const weightedCount = root.querySelector('[data-tf-weighted-count]');
  const counterWeightedLabel = root.querySelector('[data-tf-counter-weighted]');
  const counterStatusLabel = root.querySelector('[data-tf-counter-status]');
  const counterWeightValue = root.querySelector('[data-tf-counter-weight]');
  const counterPlainValue = root.querySelector('[data-tf-counter-plain]');
  const counterRemainingValue = root.querySelector('[data-tf-counter-remaining]');
  const counterUrlValue = root.querySelector('[data-tf-counter-urls]');
  const counterMeter = root.querySelector('[data-tf-counter-meter]');
  const counterNote = root.querySelector('[data-tf-counter-note]');
  const toast = document.querySelector('[data-tf-toast]');
  let activeField = 'name';
  let activeTab = 'name';
  let counterMode = 'post';
  const inputTrackTimers = {};
  const counterConfig = {
    postLimit: 280,
    bioLimit: 160,
    ok: 'Within limit',
    near: 'Almost full',
    over: 'Over limit',
    note: 'URLs count as 23 characters each; emoji and CJK text are estimated with heavier weight.',
    loadedBio: 'Loaded bio into the counter',
    ...(config.counter || {})
  };

  const tabs = config.tabs || [
    { id: 'popular', label: 'Popular' },
    { id: 'name', label: 'Names' },
    { id: 'bio', label: 'Bios' },
    { id: 'cute', label: 'Cute' },
    { id: 'bold', label: 'Bold' }
  ];

  const inserts = config.inserts || [];
  const templates = config.templates || [];
  const fieldContextBase = {
    name: {
      kicker: 'Editing display name',
      title: 'Twitter fonts for your display name',
      help: 'The styles below are generated from the active display-name field.',
      apply: ui.useName,
      applied: ui.nameApplied,
      secondary: ui.addBio,
      insertHelp: 'Click to add to display name'
    },
    bio: {
      kicker: 'Editing bio',
      title: 'Decorations for your bio',
      help: 'The styles below are generated from the active bio field.',
      apply: 'Replace bio',
      applied: 'Bio replaced',
      secondary: ui.addBio,
      insertHelp: 'Click to add to bio'
    },
    counter: {
      kicker: 'Character counter',
      title: 'X bio and post character counter',
      help: 'Check a 160-character bio or 280-character post before you copy.',
      apply: 'Copy text',
      applied: ui.counterCopied || 'Copied text',
      secondary: '',
      insertHelp: ''
    }
  };
  const fieldContextOverrides = config.fieldContext || {};
  const fieldContext = {
    name: { ...fieldContextBase.name, ...(fieldContextOverrides.name || {}) },
    bio: { ...fieldContextBase.bio, ...(fieldContextOverrides.bio || {}) }
  };

  const superscriptMap = {
    A: 'ᴬ', B: 'ᴮ', C: 'ᶜ', D: 'ᴰ', E: 'ᴱ', F: 'ᶠ', G: 'ᴳ', H: 'ᴴ', I: 'ᴵ', J: 'ᴶ', K: 'ᴷ', L: 'ᴸ', M: 'ᴹ',
    N: 'ᴺ', O: 'ᴼ', P: 'ᴾ', R: 'ᴿ', S: 'ˢ', T: 'ᵀ', U: 'ᵁ', V: 'ⱽ', W: 'ᵂ', X: 'ˣ', Y: 'ʸ', Z: 'ᶻ',
    a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ',
    n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
    0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹'
  };

  const smallCapsMap = {
    A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ꜰ', G: 'ɢ', H: 'ʜ', I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ',
    N: 'ɴ', O: 'ᴏ', P: 'ᴘ', Q: 'ǫ', R: 'ʀ', S: 'ꜱ', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'x', Y: 'ʏ', Z: 'ᴢ',
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ',
    n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
  };

  const styles = [
    { id: 'fullwidth', tabs: ['popular', 'name', 'bio'], label: 'Fullwidth', note: 'Wide profile text', transform: fullwidth },
    { id: 'small-caps', tabs: ['popular', 'name'], label: 'Small caps', note: 'Compact display name style', transform: (text) => mapByTable(text, smallCapsMap) },
    { id: 'superscript', tabs: ['popular', 'name', 'cute'], label: 'Small text', note: 'Tiny raised Unicode letters', transform: (text) => mapByTable(text, superscriptMap) },
    { id: 'bold', tabs: ['popular', 'bold'], label: 'Bold', note: 'Strong Twitter font style', transform: (text) => mapRanges(text, 0x1d400, 0x1d41a, 0x1d7ce) },
    { id: 'italic', tabs: ['bold'], label: 'Italic', note: 'Soft slanted text', transform: (text) => mapRanges(text, 0x1d434, 0x1d44e, null, { h: 'ℎ' }) },
    { id: 'bold-italic', tabs: ['bold'], label: 'Bold italic', note: 'High-contrast profile text', transform: (text) => mapRanges(text, 0x1d468, 0x1d482) },
    { id: 'script', tabs: ['popular', 'cute'], label: 'Script', note: 'Elegant Unicode script', transform: (text) => mapRanges(text, 0x1d4d0, 0x1d4ea) },
    { id: 'bubble', tabs: ['popular', 'cute', 'name'], label: 'Bubble', note: 'Circled letters for names', transform: circled },
    { id: 'mono', tabs: ['bio'], label: 'Monospace', note: 'Clean coded profile style', transform: (text) => mapRanges(text, 0x1d670, 0x1d68a, 0x1d7f6) },
    { id: 'spaced', tabs: ['popular', 'bio'], label: 'Spaced', note: 'Airy aesthetic spacing', transform: (text) => Array.from(text).join(' ') },
    { id: 'hearts', tabs: ['cute', 'bio'], label: 'Heart frame', note: 'Bio-ready soft wrapper', transform: (text) => `♡ ${text} ♡`, allowSame: true },
    { id: 'ribbon', tabs: ['cute', 'name'], label: 'Ribbon frame', note: 'Fandom and cute profiles', transform: (text) => `୨୧ ${text} ୨୧`, allowSame: true },
    { id: 'sparkle', tabs: ['popular', 'bio'], label: 'Sparkle frame', note: 'Short bio highlight', transform: (text) => `✦ ${text} ✦`, allowSame: true },
    { id: 'moon', tabs: ['cute', 'bio'], label: 'Moon frame', note: 'MojiMoon profile mood', transform: (text) => `☾ ${text} ☽`, allowSame: true }
  ];

  function mapRanges(text, upperBase, lowerBase, digitBase, exceptions = {}) {
    let changed = false;
    const value = Array.from(text).map((char) => {
      if (Object.prototype.hasOwnProperty.call(exceptions, char)) {
        changed = true;
        return exceptions[char];
      }
      const code = char.charCodeAt(0);
      if (upperBase && code >= 65 && code <= 90) {
        changed = true;
        return String.fromCodePoint(upperBase + code - 65);
      }
      if (lowerBase && code >= 97 && code <= 122) {
        changed = true;
        return String.fromCodePoint(lowerBase + code - 97);
      }
      if (digitBase && code >= 48 && code <= 57) {
        changed = true;
        return String.fromCodePoint(digitBase + code - 48);
      }
      return char;
    }).join('');
    return changed ? value : text;
  }

  function mapByTable(text, table) {
    let changed = false;
    const value = Array.from(text).map((char) => {
      if (!Object.prototype.hasOwnProperty.call(table, char)) return char;
      changed = true;
      return table[char];
    }).join('');
    return changed ? value : text;
  }

  function fullwidth(text) {
    let changed = false;
    const value = Array.from(text).map((char) => {
      const code = char.charCodeAt(0);
      if (code === 32) {
        changed = true;
        return '　';
      }
      if (code >= 33 && code <= 126) {
        changed = true;
        return String.fromCharCode(code + 0xfee0);
      }
      return char;
    }).join('');
    return changed ? value : text;
  }

  function circled(text) {
    const digits = { 0: '⓪', 1: '①', 2: '②', 3: '③', 4: '④', 5: '⑤', 6: '⑥', 7: '⑦', 8: '⑧', 9: '⑨' };
    let changed = false;
    const value = Array.from(text).map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        changed = true;
        return String.fromCodePoint(0x24b6 + code - 65);
      }
      if (code >= 97 && code <= 122) {
        changed = true;
        return String.fromCodePoint(0x24d0 + code - 97);
      }
      if (Object.prototype.hasOwnProperty.call(digits, char)) {
        changed = true;
        return digits[char];
      }
      return char;
    }).join('');
    return changed ? value : text;
  }

  const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/giu;
  const urlWeight = 23;
  const graphemeSegmenter = typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

  function splitGraphemes(text) {
    if (!graphemeSegmenter) return Array.from(text);
    return Array.from(graphemeSegmenter.segment(text), (item) => item.segment);
  }

  function weightedLength(text) {
    return analyzeXText(text).weighted;
  }

  function analyzeXText(text) {
    const urls = Array.from(text.matchAll(urlPattern));
    if (!urls.length) {
      return {
        weighted: countWeightedSegment(text),
        plain: Array.from(text).length,
        urls: 0
      };
    }

    let weighted = 0;
    let cursor = 0;
    urls.forEach((match) => {
      weighted += countWeightedSegment(text.slice(cursor, match.index));
      weighted += urlWeight;
      cursor = match.index + match[0].length;
    });
    weighted += countWeightedSegment(text.slice(cursor));
    return {
      weighted,
      plain: Array.from(text).length,
      urls: urls.length
    };
  }

  function countWeightedSegment(text) {
    return splitGraphemes(text).reduce((total, cluster) => total + clusterWeight(cluster), 0);
  }

  function clusterWeight(cluster) {
    if (!cluster) return 0;
    if (isEmojiCluster(cluster)) return 2;
    return Array.from(cluster).reduce((sum, char) => {
      const code = char.codePointAt(0);
      if (isZeroWeightMark(code)) return sum;
      return sum + (isLightTwitterCodePoint(code) ? 1 : 2);
    }, 0);
  }

  function isEmojiCluster(cluster) {
    return /\p{Extended_Pictographic}/u.test(cluster);
  }

  function isZeroWeightMark(code) {
    return code === 0xfe0e || code === 0xfe0f || code === 0x200d;
  }

  function isLightTwitterCodePoint(code) {
    return code <= 0x10ff
      || (code >= 0x2000 && code <= 0x200d)
      || (code >= 0x2010 && code <= 0x201f)
      || (code >= 0x2032 && code <= 0x2037);
  }

  async function copyText(text, button) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const fallback = document.createElement('textarea');
      fallback.value = text;
      fallback.setAttribute('readonly', '');
      fallback.style.position = 'fixed';
      fallback.style.left = '-9999px';
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand('copy');
      fallback.remove();
    }
    flash(button);
    showToast(ui.copiedToast);
    track('twitter_fonts_copy', {
      copy_type: button?.dataset.copyType || 'unknown',
      output_length: Array.from(text).length
    });
  }

  function flash(button, temporaryText = ui.copied) {
    if (!button) return;
    const original = button.dataset.originalText || button.textContent;
    button.dataset.originalText = original;
    button.textContent = temporaryText;
    button.classList.add('copied');
    window.clearTimeout(button.copyTimer);
    button.copyTimer = window.setTimeout(() => {
      button.textContent = original;
      button.classList.remove('copied');
    }, 1100);
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1300);
  }

  function track(name, params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    );
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('event', name, {
      event_category: 'twitter_fonts',
      tool_slug: config.slug || 'twitter-fonts',
      page_path: window.location.pathname,
      ...cleanParams
    });
  }

  function trackInput(field) {
    const input = field === 'counter'
      ? counterInput
      : field === 'bio'
        ? bioInput
        : field === 'handle'
          ? handleInput
          : nameInput;
    if (!input) return;
    window.clearTimeout(inputTrackTimers[field]);
    inputTrackTimers[field] = window.setTimeout(() => {
      track(field === 'handle' ? 'twitter_fonts_handle_edit' : 'twitter_fonts_input', {
        field,
        input_length: Array.from(input.value.trim()).length,
        bio_weighted_length: field === 'bio' ? weightedLength(input.value.trim()) : undefined,
        counter_weighted_length: field === 'counter' ? weightedLength(input.value.trim()) : undefined,
        counter_mode: field === 'counter' ? counterMode : undefined
      });
    }, 900);
  }

  function renderTabs() {
    if (activeField === 'counter') {
      tabsWrap.innerHTML = '';
      return;
    }
    tabsWrap.innerHTML = '';
    tabs
      .filter((tab) => tab.id !== (activeField === 'bio' ? 'name' : 'bio'))
      .forEach((tab) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `tf-tab${tab.id === activeTab ? ' active' : ''}`;
      button.dataset.tab = tab.id;
      button.textContent = tab.label;
      if (tab.id === activeTab) button.setAttribute('aria-current', 'page');
      tabsWrap.appendChild(button);
    });
  }

  function activeInput() {
    if (activeField === 'counter') return counterInput;
    return activeField === 'bio' ? bioInput : nameInput;
  }

  function fieldDefaultText() {
    if (activeField === 'counter') return counterInput?.value || '';
    return activeField === 'bio'
      ? (config.defaultBio || 'soft fonts')
      : (config.defaultName || config.fallbackText || 'Moon girl');
  }

  function setActiveField(field, options = {}) {
    activeField = field === 'counter' ? 'counter' : field === 'bio' ? 'bio' : 'name';
    if (!options.keepTab) activeTab = activeField;
    root.classList.add('tools-open');
    root.classList.toggle('is-editing-name', activeField === 'name');
    root.classList.toggle('is-editing-bio', activeField === 'bio');
    root.classList.toggle('is-editing-counter', activeField === 'counter');
    workTabs.forEach((tab) => {
      const isActive = tab.dataset.tfWorkTab === activeField;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
    workPanels.forEach((panel) => {
      const isActive = panel.dataset.tfWorkPanel === activeField;
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
    });
    editFields.forEach((item) => {
      item.classList.toggle('is-active', item.dataset.tfEditField === activeField);
    });
    updateContext();
    renderTabs();
    renderResults();
    updateCounter();
  }

  function updateContext() {
    const context = fieldContext[activeField] || fieldContext.name;
    if (contextKicker) contextKicker.textContent = context.kicker;
    if (contextTitle) contextTitle.textContent = context.title;
    if (contextHelp) contextHelp.textContent = context.help;
    if (insertHelp) insertHelp.textContent = context.insertHelp || context.secondary || '';
  }

  function renderResults() {
    if (!activeField || activeField === 'counter') {
      resultsWrap.innerHTML = '';
      return;
    }
    const source = activeInput().value.trim() || fieldDefaultText();
    const context = fieldContext[activeField] || fieldContext.name;
    const seen = new Set();
    const rows = styles
      .filter((style) => style.tabs.includes(activeTab))
      .map((style) => ({ style, value: style.transform(source) }))
      .filter(({ style, value }) => {
        if (!style.allowSame && value === source) return false;
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });

    resultsWrap.innerHTML = '';
    rows.forEach(({ style, value }) => {
      const row = document.createElement('article');
      row.className = 'tf-result';

      const main = document.createElement('div');
      const output = document.createElement('div');
      output.className = 'tf-result-output';
      output.textContent = value;
      const meta = document.createElement('div');
      meta.className = 'tf-result-meta';
      meta.textContent = `${style.label} · ${style.note}`;
      main.append(output, meta);

      const actionGroup = document.createElement('div');
      actionGroup.className = 'tf-result-actions';

      const useName = document.createElement('button');
      useName.type = 'button';
      useName.className = 'tf-btn primary';
      useName.dataset.copyType = `apply_${activeField}`;
      useName.textContent = context.apply;
      useName.addEventListener('click', () => {
        applyToActiveField(value);
        flash(useName, context.applied);
        showToast(context.applied);
        track('twitter_fonts_apply_style', {
          style_id: style.id,
          field: activeField,
          style_tab: activeTab,
          source_length: Array.from(source).length,
          output_length: Array.from(value).length
        });
      });

      actionGroup.append(useName);

      row.append(main, actionGroup);
      resultsWrap.appendChild(row);
    });
  }

  function renderInserts() {
    insertsWrap.innerHTML = '';
    inserts.forEach((group) => {
      const block = document.createElement('div');
      block.className = 'tf-chip-row';
      group.items.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tf-chip';
        button.textContent = item;
        button.addEventListener('click', () => insertIntoField(activeField, item, { insertGroup: group.label || 'unknown' }));
        block.appendChild(button);
      });
      insertsWrap.appendChild(block);
    });
  }

  function renderTemplates() {
    templatesWrap.innerHTML = '';
    templates.forEach((template) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tf-template';
      button.innerHTML = `<strong>${template.name}</strong><span>${template.bio}</span>`;
      button.addEventListener('click', () => {
        nameInput.value = template.displayName || nameInput.value;
        bioInput.value = template.bio;
        setActiveField('bio');
        updateAll();
        track('twitter_fonts_template', {
          template: template.id || template.name,
          name_length: Array.from(nameInput.value.trim()).length,
          bio_weighted_length: weightedLength(bioInput.value.trim())
        });
      });
      templatesWrap.appendChild(button);
    });
  }

  function applyToActiveField(value) {
    if (activeField === 'bio') {
      bioInput.value = value;
    } else {
      nameInput.value = value;
    }
    updatePreview();
  }

  function insertIntoField(field, value, options = {}) {
    const input = field === 'counter' ? counterInput : field === 'bio' ? bioInput : nameInput;
    if (!input) return;
    const start = input.selectionStart || input.value.length;
    const end = input.selectionEnd || input.value.length;
    const prefix = input.value.slice(0, start);
    const suffix = input.value.slice(end);
    const spacer = prefix && !prefix.endsWith(' ') ? ' ' : '';
    const tailSpacer = suffix && !suffix.startsWith(' ') ? ' ' : '';
    input.value = `${prefix}${spacer}${value}${tailSpacer}${suffix}`;
    if (!options.silentFocus) input.focus();
    const next = prefix.length + spacer.length + value.length;
    try {
      input.setSelectionRange(next, next);
    } catch (error) {
      // Some mobile browsers do not allow selection changes unless focused.
    }
    updatePreview();
    updateCounter();
    track('twitter_fonts_insert', {
      field,
      insert_group: options.insertGroup || 'unknown',
      insert_value: value,
      input_length: Array.from(input.value.trim()).length
    });
  }

  function updatePreview() {
    const name = nameInput.value.trim() || config.defaultName || 'MojiMoon';
    const handle = handleInput.value.trim() || config.defaultHandle || '@mojimoon';
    const bio = bioInput.value.trim() || config.defaultBio || '';
    namePreview.textContent = name;
    handlePreview.textContent = handle.startsWith('@') ? handle : `@${handle}`;
    bioPreview.textContent = bio;
    const bioAnalysis = analyzeXText(bio);
    const count = bioAnalysis.weighted;
    weightedCount.textContent = ui.chars(count, counterConfig.bioLimit);
    bioCount.textContent = count > counterConfig.bioLimit ? ui.over(count, counterConfig.bioLimit) : config.countOk || 'OK for X bio';
    weightedCount.classList.toggle('over', count > counterConfig.bioLimit);
    bioCount.classList.toggle('over', count > counterConfig.bioLimit);
  }

  function updateAll() {
    renderResults();
    updatePreview();
    updateCounter();
  }

  function counterLimit() {
    return counterMode === 'bio' ? counterConfig.bioLimit : counterConfig.postLimit;
  }

  function updateCounter() {
    if (!counterInput) return;
    const text = counterInput.value.trim();
    const limit = counterLimit();
    const analysis = analyzeXText(text);
    const remaining = limit - analysis.weighted;
    const ratio = limit ? Math.min(Math.max(analysis.weighted / limit, 0), 1) : 0;
    const status = remaining < 0
      ? counterConfig.over
      : remaining <= Math.ceil(limit * 0.12)
        ? counterConfig.near
        : counterConfig.ok;

    counterModeButtons.forEach((button) => {
      const isActive = button.dataset.tfCounterMode === counterMode;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    if (counterWeightedLabel) counterWeightedLabel.textContent = ui.chars(analysis.weighted, limit);
    if (counterStatusLabel) {
      counterStatusLabel.textContent = remaining < 0 ? ui.over(analysis.weighted, limit) : status;
      counterStatusLabel.classList.toggle('over', remaining < 0);
      counterStatusLabel.classList.toggle('near', remaining >= 0 && status === counterConfig.near);
    }
    if (counterWeightValue) counterWeightValue.textContent = analysis.weighted;
    if (counterPlainValue) counterPlainValue.textContent = analysis.plain;
    if (counterRemainingValue) {
      counterRemainingValue.textContent = remaining >= 0 ? remaining : `-${Math.abs(remaining)}`;
      counterRemainingValue.classList.toggle('over', remaining < 0);
    }
    if (counterUrlValue) counterUrlValue.textContent = analysis.urls;
    if (counterMeter) {
      counterMeter.style.width = `${Math.round(ratio * 100)}%`;
      counterMeter.classList.toggle('over', remaining < 0);
      counterMeter.classList.toggle('near', remaining >= 0 && status === counterConfig.near);
    }
    if (counterNote) counterNote.textContent = counterConfig.note;
  }

  root.addEventListener('click', (event) => {
    const tabButton = event.target.closest('[data-tab]');
    if (tabButton) {
      activeTab = tabButton.dataset.tab;
      setActiveField(activeField, { keepTab: true });
      track('twitter_fonts_style_category_select', {
        field: activeField,
        style_tab: activeTab
      });
    }
    const workButton = event.target.closest('[data-tf-work-tab]');
    if (workButton) {
      setActiveField(workButton.dataset.tfWorkTab);
      activeInput().focus();
      track('twitter_fonts_workspace_select', { field: activeField });
    }
    const counterModeButton = event.target.closest('[data-tf-counter-mode]');
    if (counterModeButton) {
      counterMode = counterModeButton.dataset.tfCounterMode === 'bio' ? 'bio' : 'post';
      updateCounter();
      track('twitter_fonts_counter_mode_select', { counter_mode: counterMode });
    }
    const loadBioButton = event.target.closest('[data-counter-load-bio]');
    if (loadBioButton && counterInput) {
      counterInput.value = bioInput.value.trim() || config.defaultBio || '';
      counterMode = 'bio';
      setActiveField('counter');
      updateCounter();
      flash(loadBioButton, counterConfig.loadedBio);
      showToast(counterConfig.loadedBio);
      track('twitter_fonts_counter_load_bio', {
        counter_weighted_length: weightedLength(counterInput.value.trim())
      });
    }
    const copyButton = event.target.closest('[data-copy-action]');
    if (copyButton) {
      const action = copyButton.dataset.copyAction;
      const text = action === 'name'
        ? nameInput.value
        : action === 'bio'
          ? bioInput.value
          : action === 'counter'
            ? counterInput?.value || ''
            : `${nameInput.value}\n${bioInput.value}`;
      copyButton.dataset.copyType = action;
      copyText(text.trim(), copyButton);
    }
  });

  editSources.forEach((input) => {
    input.addEventListener('focus', () => setActiveField(input.dataset.tfEditSource));
  });

  nameInput.addEventListener('input', () => {
    updateAll();
    trackInput('name');
  });

  bioInput.addEventListener('input', () => {
    updateAll();
    trackInput('bio');
  });

  if (counterInput) {
    counterInput.addEventListener('input', () => {
      updateCounter();
      trackInput('counter');
    });
  }

  handleInput.addEventListener('input', () => {
    updateAll();
    trackInput('handle');
  });

  renderInserts();
  renderTemplates();
  setActiveField(activeField);
  updatePreview();
})();
