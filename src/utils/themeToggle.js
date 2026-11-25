// Dark / light toggle + accent colour picker for exported portfolios.
// The visitor's choice is remembered in their browser. Inside a sandboxed frame (editor
// preview, share view) browser storage is blocked, so it is kept in memory instead.
// Every theme is driven by CSS variables, so a mode is a set of variable overrides that
// is only applied when it differs from the theme's own mode.

export const ACCENTS = [
  ['Indigo', '#6366f1'], ['Sky', '#0ea5e9'], ['Teal', '#14b8a6'], ['Emerald', '#10b981'],
  ['Amber', '#f59e0b'], ['Orange', '#f97316'], ['Rose', '#f43f5e'], ['Violet', '#8b5cf6'],
];

export const THEME_PANEL = `
<div class="pm-panel" id="pmTheme" role="dialog" aria-label="Appearance" hidden>
  <div class="pm-ph"><strong>Appearance</strong><button type="button" class="pm-x" data-pm-close aria-label="Close">×</button></div>
  <div class="pm-pb">
    <p class="pm-lab">Mode</p>
    <div class="pm-seg" role="group" aria-label="Mode">
      <button type="button" data-pm-mode="light" aria-pressed="false">Light</button>
      <button type="button" data-pm-mode="dark" aria-pressed="false">Dark</button>
    </div>
    <p class="pm-lab">Accent</p>
    <div class="pm-sw" role="group" aria-label="Accent colour">
      ${ACCENTS.map(([n, c]) => `<button type="button" data-pm-accent="${c}" style="background:${c}" aria-label="${n}" title="${n}" aria-pressed="false"></button>`).join('')}
    </div>
    <button type="button" class="pm-reset" data-pm-reset>Reset to theme default</button>
  </div>
</div>`;

export const THEME_CSS = `
html[data-pm-mode="dark"]{color-scheme:dark;--bg:#0b0d12;--nav-bg:rgba(11,13,18,.88);--surface:#141821;--surface-2:#1a1f2a;--ink:#eef1f6;--ink2:#cbd2dc;--muted:#8a93a2;--line:rgba(255,255,255,.12);--line-2:rgba(255,255,255,.22);--bg-image:none;--shadow:none}
html[data-pm-mode="light"]{color-scheme:light;--bg:#f7f7f4;--nav-bg:rgba(247,247,244,.9);--surface:#ffffff;--surface-2:#f0f0ec;--ink:#14161a;--ink2:#3a3f47;--muted:#6b717b;--line:#e3e3de;--line-2:#cfcfc8;--bg-image:none;--shadow:none}
html[data-pm-mode] body{background-image:var(--bg-image,none)}
html[data-pm-mode] .pill-nav{background:var(--nav-bg)}
html[data-pm-mode="light"] .pill-nav,html[data-pm-mode="light"] .term{box-shadow:0 10px 26px rgba(0,0,0,.12)}
html[data-pm-mode="light"] .term-bar{background:var(--surface-2)}
html[data-pm-accent] .nav-cta,html[data-pm-accent] .monogram,html[data-pm-accent] .cta-primary{color:var(--on-accent)!important}
html[data-pm-accent] .cta-primary:hover{box-shadow:0 10px 25px color-mix(in srgb,var(--accent) 30%,transparent)}
`;

export const THEME_SCRIPT = String.raw`
(function () {
  var root = document.documentElement;
  var panel = document.getElementById('pmTheme');
  if (!panel) return;
  var KEY = 'pmTheme:' + document.title;
  var mem = null;
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY)); if (v) return v; } catch (e) {} return mem || {}; }
  function save(v) { mem = v; try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  function rgbOf(c) {
    c = String(c || '').trim();
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
    if (m) {
      var h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    m = /^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i.exec(c);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }
  function lum(rgb) {
    var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  }
  function onAccent(hex) { var r = rgbOf(hex); return r && lum(r) > 0.4 ? '#0b0d10' : '#ffffff'; }

  var bodyRgb = rgbOf(getComputedStyle(document.body).backgroundColor) || [255, 255, 255];
  var native = lum(bodyRgb) < 0.3 ? 'dark' : 'light';
  var themeAccent = (function () {
    var cs = getComputedStyle(root);
    return (cs.getPropertyValue('--accent') || cs.getPropertyValue('--green') || '#6366f1').trim();
  })();
  root.style.setProperty('--on-accent', onAccent(themeAccent));

  var state = load();
  var modeBtns = [].slice.call(panel.querySelectorAll('[data-pm-mode]'));
  var swBtns = [].slice.call(panel.querySelectorAll('[data-pm-accent]'));

  function currentMode() { return root.getAttribute('data-pm-mode') || native; }

  function apply() {
    var mode = state.mode === 'dark' || state.mode === 'light' ? state.mode : native;
    if (mode === native) root.removeAttribute('data-pm-mode'); else root.setAttribute('data-pm-mode', mode);
    var rgb = state.accent ? rgbOf(state.accent) : null;
    var names = ['--accent', '--green', '--cyan', '--tag-bg'];
    if (rgb) {
      var c = state.accent;
      root.setAttribute('data-pm-accent', '1');
      root.style.setProperty('--accent', c);
      root.style.setProperty('--green', c);
      root.style.setProperty('--cyan', c);
      root.style.setProperty('--accent-rgb', rgb.join(','));
      root.style.setProperty('--tag-bg', 'rgba(' + rgb.join(',') + ',.12)');
      root.style.setProperty('--on-accent', onAccent(c));
    } else {
      root.removeAttribute('data-pm-accent');
      names.concat(['--accent-rgb']).forEach(function (n) { root.style.removeProperty(n); });
      root.style.setProperty('--on-accent', onAccent(themeAccent));
    }
    var cur = currentMode();
    modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-pm-mode') === cur ? 'true' : 'false'); });
    swBtns.forEach(function (b) { b.setAttribute('aria-pressed', state.accent && b.getAttribute('data-pm-accent') === state.accent ? 'true' : 'false'); });
    var fab = document.getElementById('pmThemeBtn');
    if (fab) fab.setAttribute('data-mode', cur);
    try { document.dispatchEvent(new CustomEvent('pm-accent')); } catch (e) {}
  }

  function setMode(m) { state = { mode: m, accent: state.accent }; save(state); apply(); }
  function setAccent(c) { state = { mode: state.mode, accent: c }; save(state); apply(); }

  modeBtns.forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-pm-mode')); }); });
  swBtns.forEach(function (b) { b.addEventListener('click', function () { setAccent(b.getAttribute('data-pm-accent')); }); });
  panel.querySelector('[data-pm-reset]').addEventListener('click', function () { state = {}; save(state); apply(); });

  // Used by the command palette and the dock button.
  window.__pmTheme = {
    toggleMode: function () { setMode(currentMode() === 'dark' ? 'light' : 'dark'); },
    mode: currentMode
  };
  apply();
})();
`;
