// The interactive extras added to every exported portfolio (all 13 themes):
//   - a small dock with three buttons: command palette, "Ask my portfolio", appearance
//   - Ctrl+K command palette, "Ask my portfolio" panel, dark/light + accent picker
// buildWidgets(data) returns { css, markup, script } for the generator to place in the page.
// The contact form is separate (contactForm.js) because each theme places it in its own section.

import { safeHref } from './normalize';
import { buildTimeline } from './timelineCerts';
import { ASK_CSS, ASK_PANEL, ASK_SCRIPT } from './askPortfolio';
import { PALETTE_CSS, PALETTE_MARKUP, PALETTE_SCRIPT } from './cmdPalette';
import { THEME_CSS, THEME_PANEL, THEME_SCRIPT } from './themeToggle';

const looksLikeEmail = (v) => /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(String(v || '').trim());

// The portfolio data the page scripts read. Only safe links are included.
function widgetData(data) {
  const tags = (p) => String(p.techStack || '').split(',').map((x) => x.trim()).filter(Boolean);
  return {
    name: data.name || '',
    tagline: data.tagline || '',
    bio: data.bio || '',
    location: data.location || '',
    availability: data.availability || '',
    email: looksLikeEmail(data.contactEmail) ? data.contactEmail.trim() : '',
    github: safeHref(data.github) || '',
    linkedin: safeHref(data.linkedin) || '',
    website: safeHref(data.website) || '',
    resume: safeHref(data.resumeUrl) || '',
    skills: data.skills ?? [],
    projects: (data.projects ?? []).map((p) => ({
      title: p.title || '',
      role: p.role || '',
      tags: tags(p),
      desc: p.description || '',
      link: safeHref(p.link) || '',
      repo: safeHref(p.repoUrl) || '',
    })),
    experience: buildTimeline(data).filter((t) => t.kind === 'experience'),
    education: buildTimeline(data).filter((t) => t.kind === 'education'),
    certs: (data.certifications ?? []).map((c) => ({
      name: c.name || '', issuer: c.issuer || '', year: c.year || '', link: safeHref(c.link) || '',
    })),
  };
}

const ICON = (d) =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

const DOCK = `
<div class="pm-dock" id="pmDock">
  <button type="button" class="pm-fab" id="pmPalBtn" aria-label="Open command palette">${ICON('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>')}<span class="t"><kbd id="pmKbd">Ctrl K</kbd></span></button>
  <button type="button" class="pm-fab" data-pm-open="pmAsk" aria-haspopup="dialog">${ICON('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')}<span class="t">Ask</span></button>
  <button type="button" class="pm-fab" id="pmThemeBtn" data-pm-open="pmTheme" aria-haspopup="dialog" aria-label="Appearance">${ICON('<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>')}</button>
</div>`;

const WIDGET_CSS = `
.pm-dock,.pm-panel,.pm-pal-ov,.pm-form{--pm-ac:var(--accent,var(--green,#00ff88))}
.pm-dock{position:fixed;right:1rem;bottom:1rem;z-index:2147482000;display:flex;gap:.5rem;align-items:center}
.pm-fab{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;height:42px;min-width:42px;padding:0 .85rem;border-radius:999px;border:1px solid var(--line-2,rgba(128,128,128,.4));background:var(--nav-bg,var(--surface,#fff));color:var(--ink,#111);font-family:var(--body,var(--sans,system-ui,sans-serif));font-size:.8rem;font-weight:600;cursor:pointer;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:0 8px 22px rgba(0,0,0,.18);transition:border-color .2s,transform .2s}
.pm-fab:hover{border-color:var(--pm-ac);transform:translateY(-1px)}
.pm-fab kbd{font:inherit;font-size:.72rem;color:var(--muted,#888)}
.pm-panel{position:fixed;right:1rem;bottom:4.6rem;z-index:2147482100;width:min(380px,calc(100vw - 2rem));max-height:min(560px,calc(100vh - 6rem));display:flex;flex-direction:column;background:var(--bg,#fff);color:var(--ink,#111);border:1px solid var(--line-2,rgba(128,128,128,.4));border-radius:var(--radius,14px);box-shadow:0 24px 60px rgba(0,0,0,.35);overflow:hidden;font-family:var(--body,var(--sans,system-ui,sans-serif));opacity:0;transform:translateY(10px) scale(.96);transform-origin:bottom right;transition:opacity .22s cubic-bezier(.22,1,.36,1),transform .22s cubic-bezier(.22,1,.36,1)}
.pm-panel.pm-open{opacity:1;transform:translateY(0) scale(1)}
.pm-panel[hidden]{display:none}
.pm-ph{display:flex;align-items:center;justify-content:space-between;padding:.8rem 1rem;border-bottom:1px solid var(--line,rgba(128,128,128,.3));font-size:.92rem}
.pm-x{border:0;background:transparent;color:var(--muted,#888);font-size:1.3rem;line-height:1;cursor:pointer;padding:0 .2rem}
.pm-x:hover{color:var(--ink,#111)}
.pm-pb{padding:.9rem 1rem 1rem}
.pm-lab{margin:.2rem 0 .45rem;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#888)}
.pm-seg{display:inline-flex;border:1px solid var(--line-2,rgba(128,128,128,.4));border-radius:999px;overflow:hidden;margin-bottom:1rem}
.pm-seg button{border:0;background:transparent;color:var(--ink2,var(--ink,#111));font:inherit;font-size:.82rem;font-weight:600;padding:.45rem 1.1rem;cursor:pointer}
.pm-seg button[aria-pressed="true"]{background:var(--pm-ac);color:var(--on-accent,#fff)}
.pm-sw{display:flex;flex-wrap:wrap;gap:.55rem;margin-bottom:1rem}
.pm-sw button{width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}
.pm-sw button[aria-pressed="true"]{outline:2px solid var(--ink,#111);outline-offset:2px}
.pm-reset{border:1px solid var(--line-2,rgba(128,128,128,.4));background:transparent;color:var(--ink2,var(--ink,#111));font:inherit;font-size:.8rem;padding:.4rem .8rem;border-radius:999px;cursor:pointer}
.pm-reset:hover{border-color:var(--pm-ac)}
.pm-panel input,.pm-form input,.pm-form textarea{font:inherit;font-size:.9rem;color:var(--ink,#111);background:var(--surface,#fff);border:1px solid var(--line-2,rgba(128,128,128,.4));border-radius:var(--radius,10px);padding:.6rem .75rem;width:100%}
.pm-panel input{border-radius:999px}
.pm-panel input:focus,.pm-form input:focus,.pm-form textarea:focus{outline:2px solid var(--pm-ac);outline-offset:1px}
.pm-form textarea{resize:vertical;min-height:110px}
.pm-send{border:0;background:var(--pm-ac);color:var(--on-accent,#fff);font:inherit;font-size:.86rem;font-weight:600;padding:.6rem 1.15rem;border-radius:999px;cursor:pointer;white-space:nowrap;width:auto}
.pm-send:hover{filter:brightness(1.08)}
@media(max-width:560px){.pm-fab .t{display:none}.pm-dock{right:.6rem;bottom:.6rem}.pm-panel{right:.6rem;bottom:4rem;width:calc(100vw - 1.2rem)}}
@media print{.pm-dock,.pm-panel,.pm-pal-ov{display:none!important}}
`;

const MANAGER_SCRIPT = String.raw`
(function () {
  var ids = ['pmAsk', 'pmTheme'];
  function hidePanel(p) {
    p.classList.remove('pm-open');
    setTimeout(function () { if (!p.classList.contains('pm-open')) p.hidden = true; }, 220);
  }
  function closeAll(except) {
    ids.forEach(function (id) {
      var p = document.getElementById(id);
      if (p && !p.hidden && id !== except) hidePanel(p);
    });
  }
  window.__pmCloseAll = function () { closeAll(); };
  window.__pmClose = function () { closeAll(); };
  window.__pmOpen = function (id) {
    var p = document.getElementById(id);
    if (!p) return;
    if (window.__pmPalette) window.__pmPalette.close();
    closeAll(id);
    p.hidden = false;
    requestAnimationFrame(function () { p.classList.add('pm-open'); });
    var f = p.querySelector('input') || p.querySelector('button[aria-pressed="true"]') || p.querySelector('button');
    if (f && f.focus) f.focus();
  };
  [].slice.call(document.querySelectorAll('[data-pm-open]')).forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-pm-open');
      var p = document.getElementById(id);
      if (p && !p.hidden) closeAll(); else window.__pmOpen(id);
    });
  });
  [].slice.call(document.querySelectorAll('[data-pm-close]')).forEach(function (b) {
    b.addEventListener('click', function () { closeAll(); });
  });
  var pb = document.getElementById('pmPalBtn');
  if (pb) pb.addEventListener('click', function () { if (window.__pmPalette) window.__pmPalette.open(); });
  var kbd = document.getElementById('pmKbd');
  if (kbd && /Mac|iPhone|iPad/.test(navigator.platform || '')) kbd.textContent = '⌘K';
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
})();
`;

export function buildWidgets(data) {
  const json = JSON.stringify(widgetData(data)).replace(/</g, '\\u003c');
  return {
    css: [WIDGET_CSS, PALETTE_CSS, ASK_CSS, THEME_CSS].join('\n'),
    markup: `${DOCK}\n${ASK_PANEL}\n${THEME_PANEL}\n${PALETTE_MARKUP}\n<script type="application/json" id="pmData">${json}</script>`,
    script: [MANAGER_SCRIPT, THEME_SCRIPT, ASK_SCRIPT, PALETTE_SCRIPT].join('\n'),
  };
}
