(function () {
  var measurementId = 'G-WD9XP5ERGX';

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  // Hash links carry text the visitor typed. Keep that out of page_location.
  var pagePath = window.location.pathname + window.location.search;
  window.gtag('config', measurementId, {
    page_location: window.location.origin + pagePath,
    page_path: pagePath
  });

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
  document.head.appendChild(script);
}());
