// Keeps an editor preview pinned while the controls scroll, and lets it go
// when a text field or the on-screen keyboard needs the visible viewport.

export function keyboardLikelyOpen(win) {
  const height = win.visualViewport?.height;
  const inner = win.innerHeight;
  if (!height || !inner) return false;
  return height < inner * 0.75;
}

export function syncStickyPreview(element, { top = 0, stickyTop = 0, editing = false, suppressed = false } = {}) {
  if (suppressed || editing) {
    element.classList.remove('is-pinned');
    element.classList.toggle('is-editing', Boolean(!suppressed && editing));
    return { pinned: false, editing: Boolean(!suppressed && editing) };
  }
  const pinned = top <= stickyTop + 1;
  element.classList.toggle('is-pinned', pinned);
  element.classList.remove('is-editing');
  return { pinned, editing: false };
}

function textFieldFocused(doc, controls) {
  const active = doc.activeElement;
  if (!active || !controls?.contains(active)) return false;
  if (active.matches('textarea, select')) return true;
  if (!active.matches('input')) return false;
  const type = (active.getAttribute('type') || 'text').toLowerCase();
  return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'hidden'].includes(type);
}

export function bindStickyPreview(element, options = {}) {
  const win = options.win || window;
  const doc = options.doc || document;
  let last = '';

  function sync() {
    const style = win.getComputedStyle?.(element);
    const stickyTop = parseFloat(style?.top) || 0;
    const top = element.getBoundingClientRect?.().top ?? 0;
    const editing = textFieldFocused(doc, options.controls) || keyboardLikelyOpen(win);
    const next = syncStickyPreview(element, {
      top,
      stickyTop,
      editing,
      suppressed: Boolean(options.isSuppressed?.())
    });
    const key = `${next.pinned}:${next.editing}`;
    if (key === last) return next;
    const startedEditing = next.editing && last.endsWith(':false');
    last = key;
    options.onChange?.(next);
    if (startedEditing) {
      const active = doc.activeElement;
      win.setTimeout?.(() => {
        active?.scrollIntoView?.({ block: 'center', inline: 'nearest' });
      }, 300);
    }
    return next;
  }

  const listen = () => sync();
  win.addEventListener('scroll', listen, { passive: true });
  win.addEventListener('resize', listen);
  win.addEventListener('orientationchange', listen);
  doc.addEventListener('focusin', listen);
  doc.addEventListener('focusout', listen);
  win.visualViewport?.addEventListener('resize', listen);
  win.visualViewport?.addEventListener('scroll', listen);
  sync();
  return { sync };
}
