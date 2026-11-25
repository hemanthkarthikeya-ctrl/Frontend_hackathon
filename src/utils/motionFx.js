// Motion & micro-interaction layer for exported portfolios:
//   1. Top scroll progress bar
//   2. Post-boot hero stagger
//   3. IntersectionObserver scroll-reveal for sections & staggered cards
//   4. Card hover glow + ↗ arrow nudge + magnetic/ripple press on CTAs & chips
// Respects prefers-reduced-motion.

export const MOTION_MARKUP = `<div class="pm-scroll-prog" id="pmScrollProg" aria-hidden="true"></div>`;

export const MOTION_CSS = `
.pm-scroll-prog{position:fixed;top:0;left:0;width:100%;height:3px;z-index:2147482600;background:var(--accent,var(--green,#00ff88));transform-origin:0 50%;transform:scaleX(0);pointer-events:none;transition:transform .08s linear}
@media print{.pm-scroll-prog{display:none!important}}

@media (prefers-reduced-motion: no-preference){
  html.pm-motion .hero .hero-top,
  html.pm-motion .hero h1,
  html.pm-motion .hero .tagline,
  html.pm-motion .hero .loc,
  html.pm-motion .hero .bio,
  html.pm-motion .hero .links,
  html.pm-motion .hero > div > *,
  html.pm-motion .hero .term{
    opacity:0;
    transform:translateY(12px);
    transition:opacity .42s cubic-bezier(.22,1,.36,1),transform .42s cubic-bezier(.22,1,.36,1);
  }
  html.pm-motion.pm-hero-in .hero .hero-top,
  html.pm-motion.pm-hero-in .hero > div > :nth-child(1){opacity:1;transform:none;transition-delay:0ms}
  html.pm-motion.pm-hero-in .hero h1,
  html.pm-motion.pm-hero-in .hero > div > :nth-child(2){opacity:1;transform:none;transition-delay:65ms}
  html.pm-motion.pm-hero-in .hero .tagline,
  html.pm-motion.pm-hero-in .hero > div > :nth-child(3){opacity:1;transform:none;transition-delay:130ms}
  html.pm-motion.pm-hero-in .hero .loc,
  html.pm-motion.pm-hero-in .hero > div > :nth-child(4){opacity:1;transform:none;transition-delay:185ms}
  html.pm-motion.pm-hero-in .hero .bio{opacity:1;transform:none;transition-delay:240ms}
  html.pm-motion.pm-hero-in .hero .links,
  html.pm-motion.pm-hero-in .hero .term{opacity:1;transform:none;transition-delay:295ms}

  html.pm-motion main section[id],
  html.pm-motion .pm-rev{
    opacity:0;
    transform:translateY(14px);
    transition:opacity .46s cubic-bezier(.22,1,.36,1),transform .46s cubic-bezier(.22,1,.36,1);
  }
  html.pm-motion main section[id].pm-in,
  html.pm-motion .pm-rev.pm-in{
    opacity:1;
    transform:none;
  }
}

.project,.cert{transition:transform .24s cubic-bezier(.22,1,.36,1),border-color .24s,box-shadow .24s}
.project:hover,.cert:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--accent,var(--green,#00ff88)) 55%,var(--line,rgba(128,128,128,.3)));box-shadow:0 14px 32px -12px color-mix(in srgb,var(--accent,var(--green,#00ff88)) 24%,transparent)}
.proj-links a svg,.cert a.cert-link svg{transition:transform .2s cubic-bezier(.22,1,.36,1)}
.proj-links a:hover svg,.cert a.cert-link:hover svg{transform:translate(2px,-2px)}

.nav-cta,.pm-send,.pm-fab,.link-pill,.chip,.cta-primary,.cta-sec{position:relative;overflow:hidden;transition:transform .18s cubic-bezier(.22,1,.36,1),border-color .2s,color .2s,box-shadow .2s,opacity .2s}
.nav-cta:active,.pm-send:active,.pm-fab:active,.link-pill:active,.chip:active,.cta-primary:active,.cta-sec:active{transform:scale(.96)!important}
.pm-ripple{position:absolute;border-radius:50%;background:currentColor;opacity:.22;transform:scale(0);pointer-events:none;animation:pmRip .52s ease-out forwards}
@keyframes pmRip{to{transform:scale(2.6);opacity:0}}
`;

export const MOTION_SCRIPT = String.raw`
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Scroll progress bar
  var prog = document.getElementById('pmScrollProg');
  if (prog) {
    var ptick = false;
    function updateProg() {
      ptick = false;
      var max = root.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
      prog.style.transform = 'scaleX(' + pct.toFixed(4) + ')';
    }
    function qProg() { if (!ptick) { ptick = true; requestAnimationFrame(updateProg); } }
    window.addEventListener('scroll', qProg, { passive: true });
    window.addEventListener('resize', qProg);
    updateProg();
  }

  if (reduced) return;
  root.classList.add('pm-motion');

  // 2. Post-boot hero stagger
  function showHero() {
    requestAnimationFrame(function () { root.classList.add('pm-hero-in'); });
  }
  if (root.classList.contains('pm-boot-pending') && document.getElementById('pmBoot')) {
    document.addEventListener('pm-boot-done', showHero, { once: true });
  } else {
    showHero();
  }

  // 3. Scroll-reveal sections & staggered cards
  var secs = [].slice.call(document.querySelectorAll('main section[id]'));
  secs.forEach(function (sec) {
    var cards = [].slice.call(sec.querySelectorAll('.project, .cert, .timeline li, .tl-item, .stack-card'));
    cards.forEach(function (c, idx) {
      c.classList.add('pm-rev');
      c.style.transitionDelay = Math.min(idx * 60, 360) + 'ms';
    });
  });
  var targets = secs.concat([].slice.call(document.querySelectorAll('.pm-rev')));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('pm-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('pm-in'); });
  }

  // 4. Magnetic hover + click ripple on CTAs & chips
  if (!window.matchMedia('(hover: none)').matches) {
    [].slice.call(document.querySelectorAll('.nav-cta, .pm-send, .cta-primary, .link-pill')).forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = ((e.clientX - r.left) / r.width - 0.5) * 7;
        var dy = ((e.clientY - r.top) / r.height - 0.5) * 5;
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest && e.target.closest('.nav-cta, .pm-send, .pm-fab, .link-pill, .chip, .cta-primary, .cta-sec');
    if (!btn) return;
    var r = btn.getBoundingClientRect();
    var size = Math.max(r.width, r.height);
    var rip = document.createElement('span');
    rip.className = 'pm-ripple';
    rip.style.width = rip.style.height = size + 'px';
    rip.style.left = (e.clientX - r.left - size / 2) + 'px';
    rip.style.top = (e.clientY - r.top - size / 2) + 'px';
    btn.appendChild(rip);
    setTimeout(function () { if (rip.parentNode) rip.parentNode.removeChild(rip); }, 550);
  });
})();
`;
