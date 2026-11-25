// Ctrl+K (or Cmd+K) command palette for exported portfolios.
// Jump to a section, open a link, switch dark/light, or hand a question to "Ask my portfolio".
// Sections are discovered from the page itself, so it works on every theme.

export const PALETTE_MARKUP = `
<div class="pm-pal-ov" id="pmPal" hidden>
  <div class="pm-pal" role="dialog" aria-modal="true" aria-label="Command palette">
    <input id="pmPalInput" type="text" placeholder="Type a section, link or question…" aria-label="Search commands" autocomplete="off" spellcheck="false">
    <div class="pm-pal-list" id="pmPalList" role="listbox"></div>
    <div class="pm-pal-foot"><span>↑↓ move</span><span>↵ select</span><span>esc close</span></div>
  </div>
</div>`;

export const PALETTE_CSS = `
.pm-pal-ov{position:fixed;inset:0;z-index:2147482500;display:flex;align-items:flex-start;justify-content:center;padding:14vh 1rem 1rem;background:rgba(0,0,0,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .2s cubic-bezier(.22,1,.36,1)}
.pm-pal-ov.pm-open{opacity:1}
.pm-pal-ov[hidden]{display:none}
.pm-pal{width:min(560px,100%);background:var(--bg,#fff);color:var(--ink,#111);border:1px solid var(--line-2,rgba(128,128,128,.4));border-radius:var(--radius,14px);box-shadow:0 30px 80px rgba(0,0,0,.45);overflow:hidden;font-family:var(--body,var(--sans,system-ui,sans-serif));opacity:0;transform:translateY(-8px) scale(.96);transition:opacity .2s cubic-bezier(.22,1,.36,1),transform .2s cubic-bezier(.22,1,.36,1)}
.pm-pal-ov.pm-open .pm-pal{opacity:1;transform:translateY(0) scale(1)}
.pm-pal input{width:100%;border:0;border-bottom:1px solid var(--line,rgba(128,128,128,.3));background:transparent;color:inherit;font:inherit;font-size:1rem;padding:1rem 1.1rem;outline:0;border-radius:0}
.pm-pal-list{max-height:min(50vh,380px);overflow:auto;padding:.4rem}
.pm-pal-grp{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#888);padding:.6rem .7rem .25rem}
.pm-it{display:flex;align-items:center;justify-content:space-between;gap:1rem;width:100%;text-align:left;border:0;background:transparent;color:inherit;font:inherit;font-size:.92rem;padding:.55rem .7rem;border-radius:8px;cursor:pointer}
.pm-it small{color:var(--muted,#888);font-size:.76rem;white-space:nowrap}
.pm-it.sel{background:color-mix(in srgb,var(--pm-ac,#6366f1) 16%,transparent)}
.pm-pal-foot{display:flex;gap:1rem;padding:.55rem 1rem;border-top:1px solid var(--line,rgba(128,128,128,.3));font-size:.72rem;color:var(--muted,#888)}
`;

export const PALETTE_SCRIPT = String.raw`
(function () {
  var ov = document.getElementById('pmPal');
  var dataEl = document.getElementById('pmData');
  if (!ov || !dataEl) return;
  var D;
  try { D = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var input = document.getElementById('pmPalInput');
  var listEl = document.getElementById('pmPalList');
  var items = [], sel = 0, lastFocus = null;

  function sectionItems() {
    var out = [];
    [].slice.call(document.querySelectorAll('section[id]')).forEach(function (s) {
      var a = document.querySelector('nav a[href="#' + s.id + '"]');
      var h = s.querySelector('h2');
      var label = (a && a.textContent.trim()) || (h && h.textContent.trim()) || '';
      if (!label || s.id === 'pmTheme') return;
      out.push({ g: 'Go to', label: label, hint: 'section', kw: s.id, run: function () { s.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    });
    out.unshift({ g: 'Go to', label: 'Top', hint: 'section', kw: 'home top start', run: function () { window.scrollTo({ top: 0, behavior: 'smooth' }); } });
    return out;
  }
  function openUrl(u) {
    var a = document.createElement('a');
    a.href = u; a.target = '_blank'; a.rel = 'noreferrer';
    document.body.appendChild(a); a.click(); a.remove();
  }
  function linkItems() {
    var L = [['Email', D.email ? 'mailto:' + D.email : '', 'send an email'], ['GitHub', D.github, 'open'], ['LinkedIn', D.linkedin, 'open'], ['Website', D.website, 'open'], ['Resume', D.resume, 'open']];
    return L.filter(function (x) { return x[1]; }).map(function (x) {
      return { g: 'Links', label: x[0], hint: x[2], kw: 'link ' + x[0], run: function () { openUrl(x[1]); } };
    });
  }
  function actionItems() {
    var out = [{ g: 'Actions', label: 'Ask my portfolio', hint: 'questions', kw: 'ask question chat help', run: function () { window.__pmOpen('pmAsk'); } }];
    out.push({ g: 'Actions', label: 'Switch dark / light mode', hint: 'appearance', kw: 'theme dark light mode toggle', run: function () { if (window.__pmTheme) window.__pmTheme.toggleMode(); } });
    out.push({ g: 'Actions', label: 'Change accent colour', hint: 'appearance', kw: 'accent colour color theme', run: function () { window.__pmOpen('pmTheme'); } });
    return out;
  }
  var all = null;
  function build() { all = sectionItems().concat(linkItems(), actionItems()); }

  function filter(q) {
    q = q.toLowerCase().trim();
    var toks = q.split(/\s+/).filter(Boolean);
    var res = !toks.length ? all.slice() : all.filter(function (it) {
      var hay = (it.label + ' ' + it.kw + ' ' + it.g).toLowerCase();
      return toks.every(function (t) { return hay.indexOf(t) >= 0; });
    });
    if (q.length > 1) {
      res.push({ g: 'Ask', label: 'Ask: ' + q.slice(0, 80), hint: 'answer from this portfolio', kw: '', run: function () { window.__pmOpen('pmAsk'); if (window.__pmAsk) window.__pmAsk.ask(q); } });
    }
    return res;
  }

  function render() {
    listEl.textContent = '';
    var lastG = '';
    items.forEach(function (it, i) {
      if (it.g !== lastG) {
        lastG = it.g;
        var g = document.createElement('div'); g.className = 'pm-pal-grp'; g.textContent = it.g; listEl.appendChild(g);
      }
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pm-it' + (i === sel ? ' sel' : ''); b.setAttribute('role', 'option');
      var l = document.createElement('span'); l.textContent = it.label;
      var h = document.createElement('small'); h.textContent = it.hint;
      b.appendChild(l); b.appendChild(h);
      b.addEventListener('mousemove', function () { if (sel !== i) { sel = i; mark(); } });
      b.addEventListener('click', function () { choose(i); });
      listEl.appendChild(b);
    });
    var cur = listEl.querySelector('.sel');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
  }
  function mark() {
    var els = listEl.querySelectorAll('.pm-it');
    for (var i = 0; i < els.length; i++) els[i].classList.toggle('sel', i === sel);
  }
  function choose(i) {
    var it = items[i];
    if (!it) return;
    close();
    setTimeout(it.run, 30);
  }
  function refresh() { items = filter(input.value); sel = 0; render(); }

  function open() {
    if (!ov.hidden && ov.classList.contains('pm-open')) return;
    if (window.__pmCloseAll) window.__pmCloseAll();
    lastFocus = document.activeElement;
    build(); input.value = ''; refresh();
    ov.hidden = false;
    requestAnimationFrame(function () { ov.classList.add('pm-open'); });
    input.focus();
  }
  function close() {
    if (ov.hidden) return;
    ov.classList.remove('pm-open');
    setTimeout(function () { if (!ov.classList.contains('pm-open')) ov.hidden = true; }, 200);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  input.addEventListener('input', refresh);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); mark(); var c = listEl.querySelector('.sel'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); var d = listEl.querySelector('.sel'); if (d && d.scrollIntoView) d.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
  });
  ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && String(e.key).toLowerCase() === 'k') {
      e.preventDefault();
      if (ov.hidden) open(); else close();
    } else if (e.key === 'Escape' && !ov.hidden) { close(); }
  });
  window.__pmPalette = { open: open, close: close };
})();
`;
