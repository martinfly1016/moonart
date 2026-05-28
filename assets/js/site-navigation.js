(function () {
  function getMenus() {
    return Array.from(document.querySelectorAll('.site-nav .nav-menu'));
  }

  function closeMenus(except) {
    getMenus().forEach((menu) => {
      if (menu !== except) menu.removeAttribute('open');
    });
  }

  function setupMenu(menu) {
    if (menu.dataset.navReady === 'true') return;
    menu.dataset.navReady = 'true';
    menu.addEventListener('toggle', () => {
      if (menu.open) closeMenus(menu);
    });
  }

  function setupNavigation() {
    getMenus().forEach(setupMenu);
  }

  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.site-nav .nav-menu')) closeMenus();
  });

  document.addEventListener('focusin', (event) => {
    if (!event.target.closest('.site-nav .nav-menu')) closeMenus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeMenus();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNavigation);
  } else {
    setupNavigation();
  }
}());
