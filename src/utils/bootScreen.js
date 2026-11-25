// OS-style boot screen shown before an exported portfolio. The lines are built from the
// portfolio data (name, skills). Any key, click or tap skips it. It is skipped for people
// who prefer reduced motion, and it is left out of the editor's live preview.

const skillSlug = (s) =>
  String(s || '').toLowerCase().replace(/[^a-z0-9.+#]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);

const EMPTY = { head: '', css: '', markup: '', script: '' };

const BOOT_CSS = `
.pm-boot{display:none;position:fixed;inset:0;z-index:2147483000;background:#080a0e;color:#c9d1d9;font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace;font-size:clamp(.72rem,1.6vw,.9rem);line-height:1.8;padding:clamp(1.25rem,4vw,2.75rem);overflow:hidden;transition:opacity .45s ease}
.pm-boot-pending .pm-boot{display:block}
.pm-boot.done{opacity:0;pointer-events:none}
.pm-boot-pending,.pm-boot-pending body{overflow:hidden}
.pm-boot .l{white-space:pre-wrap;word-break:break-word}
.pm-boot .ts{color:#6b7280}
.pm-boot .ok{color:#00ff88;font-weight:600}
.pm-boot .hi{color:#00ff88}
.pm-boot .title{color:#e6edf3;font-weight:600;margin-bottom:.9rem}
.pm-boot .gap{height:.9rem}
.pm-boot .start{color:#2f9e6e}
.pm-boot .skip{position:absolute;left:clamp(1.25rem,4vw,2.75rem);bottom:clamp(1.25rem,4vw,2.5rem);font-size:.68rem;letter-spacing:.14em;color:#4b5563}
`;

const BOOT_SCRIPT = `
(function () {
  var root = document.documentElement;
  var el = document.getElementById('pmBoot');
  if (!el) return;
  if (!root.classList.contains('pm-boot-pending')) { el.parentNode.removeChild(el); return; }
  var log = document.getElementById('pmBootLog');
  var lines = JSON.parse(document.getElementById('pmBootData').textContent);
  var skip = document.getElementById('pmBootSkip');
  if (window.matchMedia('(hover: none)').matches) skip.textContent = 'TAP TO SKIP';
  var i = 0, timer = null, done = false;

  function span(cls, text) {
    var s = document.createElement('span');
    if (cls) s.className = cls;
    s.textContent = text;
    return s;
  }
  function add(item) {
    var row = document.createElement('div');
    row.className = 'l';
    if (item.k === 'title') {
      row.className = 'l title';
      row.appendChild(span('', item.os + ' '));
      row.appendChild(span('hi', item.ver));
      row.appendChild(span('', '  \\u00b7  tty1'));
    } else if (item.k === 'ts') {
      row.appendChild(span('ts', '[' + ('            ' + item.ts).slice(-12) + '] '));
      row.appendChild(span('', item.text));
    } else if (item.k === 'ok') {
      row.appendChild(span('ts', '[ '));
      row.appendChild(span('ok', ' OK '));
      row.appendChild(span('ts', ' ] '));
      row.appendChild(span('', item.text));
    } else if (item.k === 'gap') {
      row.className = 'gap';
    } else if (item.k === 'start') {
      row.className = 'l start';
      row.textContent = item.text;
    } else {
      row.textContent = item.text;
    }
    log.appendChild(row);
  }
  function finish() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    ['keydown', 'pointerdown', 'touchstart'].forEach(function (t) { window.removeEventListener(t, finish); });
    el.classList.add('done');
    root.classList.remove('pm-boot-pending');
    try { document.dispatchEvent(new CustomEvent('pm-boot-done')); } catch (e) {}
    window.scrollTo(0, 0);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
  }
  function next() {
    if (i >= lines.length) { timer = setTimeout(finish, 700); return; }
    var item = lines[i++];
    add(item);
    timer = setTimeout(next, item.k === 'gap' ? 220 : item.k === 'ts' ? 170 : 120);
  }
  ['keydown', 'pointerdown', 'touchstart'].forEach(function (t) { window.addEventListener(t, finish); });
  timer = setTimeout(next, 150);
})();
`;

export function buildBoot(data, enabled = true) {
  if (!enabled) return EMPTY;

  const parts = String(data.name || '').trim().split(/\s+/).filter(Boolean);
  const login = (parts[0] || 'guest').toLowerCase().replace(/[^a-z0-9]/g, '') || 'guest';
  const initials =
    (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || 'pm').slice(0, 2))
      .toLowerCase().replace(/[^a-z0-9]/g, '') || 'pm';
  const os = `${initials}-os`;
  const now = new Date();
  const ver = `${String(now.getFullYear()).slice(2)}.${String(now.getMonth() + 1).padStart(2, '0')} LTS`;

  const modules = (data.skills ?? [])
    .map(skillSlug)
    .filter(Boolean)
    .slice(0, 4)
    .map((s) => ({ k: 'ok', text: `Loaded module ${s}` }));

  const lines = [
    { k: 'title', os, ver },
    { k: 'ts', ts: '0.000000', text: `booting ${os} \u2026 cold start` },
    { k: 'ts', ts: '0.214887', text: 'probing hardware \u2014 cpu, gpu, entropy' },
    { k: 'ok', text: 'Mounted /dev/portfolio' },
    { k: 'ok', text: 'Reached target Local File Systems' },
    { k: 'ok', text: 'Started Hardware RNG \u2014 entropy gathered' },
    ...modules,
    { k: 'ok', text: 'Started GPU compositor  (motion-blur: on)' },
    { k: 'ok', text: 'Started cursor daemon' },
    { k: 'ok', text: `Mounted /home/${login}` },
    { k: 'ok', text: 'Reached target Graphical Interface' },
    { k: 'gap' },
    { k: 'plain', text: `${initials} login: ${login}` },
    { k: 'start', text: 'starting portfolio session' },
  ];

  const json = JSON.stringify(lines).replace(/</g, '\\u003c');

  return {
    // Runs in <head>, before the page paints, so there is no flash of the portfolio.
    head: `<script>if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('pm-boot-pending');</script>`,
    css: BOOT_CSS,
    markup: `<div class="pm-boot" id="pmBoot" aria-hidden="true"><div id="pmBootLog"></div><div class="skip" id="pmBootSkip">PRESS ANY KEY TO SKIP</div></div>\n<script type="application/json" id="pmBootData">${json}</script>`,
    script: BOOT_SCRIPT,
  };
}
