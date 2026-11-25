// Highlights the nav link of the section that is on screen. Runs inside exported pages.
// A section counts as current once its top passes 35% of the window height, and the
// last link is current when the page is scrolled to the bottom.
export const NAV_SPY_SCRIPT = `
(function () {
  var links = [].slice.call(document.querySelectorAll('nav a[href^="#"]')).filter(function (a) {
    var h = a.getAttribute('href');
    return h.length > 1 && document.getElementById(h.slice(1));
  });
  if (!links.length) return;
  var secs = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var ticking = false, cur = -2;
  function update() {
    ticking = false;
    var probe = window.innerHeight * 0.35, idx = -1;
    for (var i = 0; i < secs.length; i++) {
      if (secs[i].getBoundingClientRect().top <= probe) idx = i;
    }
    var doc = document.documentElement;
    if (window.innerHeight + window.pageYOffset >= doc.scrollHeight - 4) idx = secs.length - 1;
    if (idx === cur) return;
    cur = idx;
    links.forEach(function (a, i) {
      if (i === idx) { a.classList.add('active'); a.setAttribute('aria-current', 'true'); }
      else { a.classList.remove('active'); a.removeAttribute('aria-current'); }
    });
  }
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  window.addEventListener('load', queue);
  update();
})();
`;

export const NAV_SPY_CSS = `
.nav-links a.active:not(.nav-cta){color:var(--ink);text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:7px;text-decoration-color:var(--accent,currentColor)}
.pill-nav a.active{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:6px}
`;
