// Dot + ring cursor shared by the app and every exported portfolio.
//
// One ring only. A page inside an iframe (live preview, share view) asks its parent
// to draw the ring and forwards its mouse position; the parent draws a single ring
// that never stops at the iframe border. A page opened on its own draws its own ring.
// Text cursors stay on text fields. Touch devices keep the normal cursor.

export const CURSOR_MARKUP =
  '<div class="fx-cursor-dot" id="fxDot"></div><div class="fx-cursor-ring" id="fxRing"></div>';

export const CURSOR_CSS = `
.fx-cursor-dot,.fx-cursor-ring{position:fixed;top:0;left:0;pointer-events:none;z-index:2147483647;border-radius:50%;opacity:0;will-change:transform}
.fx-cursor-dot{width:7px;height:7px;margin:-3.5px 0 0 -3.5px;background:var(--fx,#00ff88);box-shadow:0 0 12px var(--fx,#00ff88)}
.fx-cursor-ring{width:30px;height:30px;margin:-15px 0 0 -15px;border:1.5px solid var(--fx,#00ff88);background:color-mix(in srgb,var(--fx,#00ff88) 6%,transparent);transition:width .18s,height .18s,margin .18s,background .18s,opacity .18s}
.fx-cursor-dot.on{opacity:1}
.fx-cursor-ring.on{opacity:.7}
.fx-cursor-ring.on.hover{opacity:1;width:42px;height:42px;margin:-21px 0 0 -21px;background:color-mix(in srgb,var(--fx,#00ff88) 14%,transparent)}
html.fx-on,html.fx-on *{cursor:none!important}
html.fx-on input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=file]):not([type=range]),html.fx-on textarea{cursor:text!important}
@media (hover:none){.fx-cursor-dot,.fx-cursor-ring{display:none}}
`;

export const CURSOR_SCRIPT = `
(function () {
  if (window.__pmFx) return;
  window.__pmFx = true;
  if (window.matchMedia('(hover: none)').matches) return;
  var root = document.documentElement;
  var dot = document.getElementById('fxDot');
  var ring = document.getElementById('fxRing');
  if (!dot || !ring) return;

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var inFrame = false;
  try { inFrame = window.parent !== window; } catch (e) { inFrame = true; }
  var forwarding = false, seen = false, overridden = false;
  var mx = 0, my = 0, rx = 0, ry = 0;
  var HOVER = 'a,button,input,textarea,select,summary,label,[role="button"]';

  function accent() {
    var cs = getComputedStyle(root);
    var v = (cs.getPropertyValue('--accent') || cs.getPropertyValue('--green') || '').trim();
    return (v.charAt(0) === '#' && v.length <= 9) || v.indexOf('rgb') === 0 ? v : '';
  }
  var base = accent();
  function setColor(c) {
    if (c) { root.style.setProperty('--fx', c); overridden = true; }
    else if (base) { root.style.setProperty('--fx', base); overridden = false; }
    else { root.style.removeProperty('--fx'); overridden = false; }
  }
  setColor('');
  // The theme toggle fires this after the visitor picks a new accent colour.
  document.addEventListener('pm-accent', function () { base = accent(); setColor(''); });

  function show(x, y, hover) {
    mx = x; my = y;
    if (!seen) {
      seen = true; rx = x; ry = y;
      root.classList.add('fx-on');
      dot.classList.add('on');
      ring.classList.add('on');
    }
    dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    if (hover) ring.classList.add('hover'); else ring.classList.remove('hover');
  }

  (function loop() {
    var k = still ? 1 : 0.2;
    if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) {
      rx += (mx - rx) * k; ry += (my - ry) * k;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
    }
    requestAnimationFrame(loop);
  })();

  function frameFor(src) {
    var list = document.getElementsByTagName('iframe');
    for (var i = 0; i < list.length; i++) if (list[i].contentWindow === src) return list[i];
    return null;
  }

  window.addEventListener('mousemove', function (e) {
    var t = e.target;
    var hover = !!(t && t.closest && t.closest(HOVER));
    if (forwarding) {
      root.classList.add('fx-on');
      try { window.parent.postMessage({ pmfx: 'mv', x: e.clientX, y: e.clientY, h: hover, c: base }, '*'); } catch (err) {}
      return;
    }
    if (overridden) setColor('');
    show(e.clientX, e.clientY, hover);
  }, { passive: true });

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || typeof d !== 'object' || typeof d.pmfx !== 'string') return;
    if (d.pmfx === 'ping') {
      if (e.source && e.source !== window) e.source.postMessage({ pmfx: 'pong' }, '*');
    } else if (d.pmfx === 'pong') {
      if (inFrame && e.source === window.parent) {
        forwarding = true;
        dot.style.display = 'none';
        ring.style.display = 'none';
      }
    } else if (d.pmfx === 'mv') {
      var f = frameFor(e.source);
      if (!f || typeof d.x !== 'number' || typeof d.y !== 'number') return;
      var r = f.getBoundingClientRect();
      setColor(typeof d.c === 'string' && d.c.length < 40 ? d.c : '');
      show(r.left + f.clientLeft + d.x, r.top + f.clientTop + d.y, !!d.h);
    }
  });

  if (inFrame) {
    try { window.parent.postMessage({ pmfx: 'ping' }, '*'); } catch (err) {}
  }
})();
`;

// Adds the cursor to the app itself (the editor pages).
export function installCursor() {
  if (document.getElementById('fxDot')) return;
  const style = document.createElement('style');
  style.textContent = CURSOR_CSS;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML('beforeend', CURSOR_MARKUP);
  const script = document.createElement('script');
  script.textContent = CURSOR_SCRIPT;
  document.body.appendChild(script);
}
