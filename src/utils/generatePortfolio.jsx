import { skillIconSvg } from './skillIcons';
import { parseUsername } from './githubImport';
import { CURSOR_CSS, CURSOR_MARKUP, CURSOR_SCRIPT } from './cursorFx';
import { NAV_SPY_CSS, NAV_SPY_SCRIPT } from './navSpy';
import { buildBoot } from './bootScreen';
import { buildTimeline, TIMELINE_CERTS_CSS } from './timelineCerts';
import { buildWidgets } from './portfolioWidgets';
import { contactFormHTML, CONTACT_CSS, CONTACT_SCRIPT } from './contactForm';
import { normalizeCustomTheme } from './normalize';
import { adaptPortfolioForView } from './goalAdapter';
import { MOTION_MARKUP, MOTION_CSS, MOTION_SCRIPT } from './motionFx';

const esc = (value = '') =>
  String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);

const safeUrl = (value = '') => {
  const v = value.trim();
  return /^(https?:\/\/|mailto:)/i.test(v) ? esc(v) : '#';
};

export const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const FONTS = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Silkscreen:wght@400;700&display=swap" rel="stylesheet">`;

const ICONS = {
  mail: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  github: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`,
  linkedin: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`,
  globe: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  file: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`,
  pin: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  arrow: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>`,
};


// Extra styles for skill icons and the GitHub activity heatmap (used by all templates).
const EXTRA_CSS = `
${CURSOR_CSS}
${NAV_SPY_CSS}
${TIMELINE_CERTS_CSS}
${CONTACT_CSS}
.chip{display:inline-flex;align-items:center;gap:.45rem}
.match-badge{font-family:'JetBrains Mono',monospace;font-size:.66rem;padding:.12rem .45rem;border-radius:999px;background:rgba(16,185,129,.16);color:#10b981;border:1px solid rgba(16,185,129,.35);margin-left:.35rem}
.chip.matched{border-color:#10b981}
.skill-ico{flex-shrink:0;display:inline-block;vertical-align:middle}
.stack-card svg{display:block;margin:0 auto .55rem}
.term-pill .skill-ico{vertical-align:-2px;margin-right:.3rem}
.gha-card{--gha:var(--accent,#00ff88);background:var(--surface);border:1px solid var(--line);border-radius:var(--radius,14px);padding:1.25rem 1.35rem;overflow-x:auto}
.gha-pill{display:inline-flex;align-items:center;gap:.5rem;padding:.35rem .8rem;border-radius:999px;border:1px solid var(--line);font-size:.82rem;font-weight:500;color:var(--ink2,var(--ink));margin-bottom:1rem}
.gha-dot{width:8px;height:8px;border-radius:50%;background:var(--gha);box-shadow:0 0 8px var(--gha)}
.gha-board{display:grid;column-gap:3px;row-gap:3px;grid-template-rows:14px repeat(7,11px);width:max-content}
.gha-m{font-size:.7rem;color:var(--muted);white-space:nowrap}
.gha-d{font-size:.68rem;color:var(--muted);text-align:right;padding-right:.35rem;align-self:center;line-height:11px}
.gha-cell{width:11px;height:11px;border-radius:2px;background:var(--gha);opacity:.2}
.gha-cell.l0{background:var(--line-2);opacity:.6}
.gha-cell.l1{opacity:.35}.gha-cell.l2{opacity:.55}.gha-cell.l3{opacity:.8}.gha-cell.l4{opacity:1}
.gha-msg{margin:0;color:var(--muted);font-size:.9rem}
`;

// Runs in the exported page. It fetches the contribution data when the page is opened,
// then builds the heatmap. Every value is checked before it goes into the HTML.
const ACTIVITY_SCRIPT = `
(function () {
  var box = document.querySelector('[data-gha]');
  if (!box) return;
  var user = box.getAttribute('data-gha') || '';
  if (!/^[a-z0-9](?:[a-z0-9-]{0,38})$/i.test(user)) return;
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var ROWS = { 1: 'Mon', 3: 'Wed', 5: 'Fri' };
  function fail() { box.innerHTML = '<p class="gha-msg">GitHub activity is unavailable right now.</p>'; }
  fetch('https://github-contributions-api.jogruber.de/v4/' + encodeURIComponent(user) + '?y=last')
    .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
    .then(function (json) {
      var days = (json.contributions || []).filter(function (d) {
        return d && /^\\d{4}-\\d{2}-\\d{2}$/.test(d.date) && typeof d.count === 'number' && isFinite(d.count);
      });
      if (!days.length) throw new Error('no data');
      var total = json.total && typeof json.total.lastYear === 'number'
        ? json.total.lastYear
        : days.reduce(function (a, d) { return a + d.count; }, 0);
      var first = new Date(days[0].date + 'T00:00:00');
      var cells = [];
      for (var i = 0; i < first.getDay(); i++) cells.push(null);
      days.forEach(function (d) { cells.push(d); });
      while (cells.length % 7) cells.push(null);
      var weeks = [];
      for (var w = 0; w < cells.length; w += 7) weeks.push(cells.slice(w, w + 7));
      var months = [], last = -1;
      weeks.forEach(function (week, col) {
        var day = week.filter(Boolean).find(function (c) { return Number(c.date.slice(8, 10)) <= 7; });
        if (!day) return;
        var m = Number(day.date.slice(5, 7)) - 1;
        if (m !== last) { months.push({ col: col, text: MONTHS[m] }); last = m; }
      });
      var html = '<span class="gha-pill"><span class="gha-dot"></span>' + total + ' contributions in the last year</span>';
      html += '<div class="gha-scroll"><div class="gha-board" style="grid-template-columns:30px repeat(' + weeks.length + ',11px)">';
      months.forEach(function (m) {
        html += '<span class="gha-m" style="grid-column:' + (m.col + 2) + ';grid-row:1">' + m.text + '</span>';
      });
      Object.keys(ROWS).forEach(function (r) {
        html += '<span class="gha-d" style="grid-column:1;grid-row:' + (Number(r) + 2) + '">' + ROWS[r] + '</span>';
      });
      weeks.forEach(function (week, col) {
        week.forEach(function (c, row) {
          if (!c) return;
          var level = Number(c.level);
          if (!(level >= 0 && level <= 4 && Math.floor(level) === level)) level = 0;
          html += '<span class="gha-cell l' + level + '" title="' + c.count + ' contribution' + (c.count === 1 ? '' : 's') + ' on ' + c.date + '" style="grid-column:' + (col + 2) + ';grid-row:' + (row + 2) + '"></span>';
        });
      });
      html += '</div></div>';
      box.innerHTML = html;
    })
    .catch(fail);
})();
`;

// Returns a valid GitHub username from a profile URL, or '' if there is none.
const GH_USER_RX = /^[a-z0-9](?:[a-z0-9-]{0,38})$/i;
const githubUser = (url) => {
  const u = parseUsername(url || '');
  return GH_USER_RX.test(u) ? u : '';
};

// Certificate cards, shared by every theme (styles are in TIMELINE_CERTS_CSS).
const certCardsHTML = (certs) =>
  `<div class="certs">${certs.map((c) => `
    <article class="cert">
      ${c.year ? `<span class="cert-year">${esc(c.year)}</span>` : ''}
      <h3>${esc(c.name)}</h3>
      <p class="cert-meta">${esc(c.issuer)}</p>
      ${safeUrl(c.link || '') !== '#' ? `<a class="cert-link" href="${safeUrl(c.link)}" target="_blank" rel="noreferrer">View credential ${ICONS.arrow}</a>` : ''}
    </article>`).join('')}</div>`;

function generateTerminalOSHTML(data, boot, mode = { id: 'default', eyebrow: 'Portfolio', cta: 'Get in touch', order: ['skills', 'projects', 'timeline', 'certs'] }) {
  const rawName = data.name || 'Your Name';
  const username = githubUser(data.github);
  const name = esc(rawName);
  const slug = rawName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'dev';
  const degree = data.education?.[0]?.degree ? esc(data.education[0].degree) : 'Software Engineering';
  const school = data.education?.[0]?.institution ? esc(data.education[0].institution) : '';
  const skills = data.skills ?? [];
  const projects = data.projects ?? [];
  const timeline = buildTimeline(data);
  const certs = data.certifications ?? [];
  const widgets = buildWidgets(data);
  const contactForm = contactFormHTML(data);
  let secNo = 0;
  const num = () => String(++secNo).padStart(2, '0');

  const projectsJson = JSON.stringify(
    projects.map((p, idx) => ({
      num: String(idx + 1).padStart(2, '0'),
      title: p.title || 'Untitled Project',
      role: p.role || 'Project',
      desc: p.description || '',
      tags: String(p.techStack || '').split(',').map((x) => x.trim()).filter(Boolean),
      link: p.link ? safeUrl(p.link) : '',
      repoUrl: p.repoUrl ? safeUrl(p.repoUrl) : '',
    }))
  ).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${boot.head}
<title>${name} — Portfolio</title>
${FONTS}
<style>
:root{
  --bg:#080a0c;--surface:#0e1217;--surface-2:#131920;
  --ink:#f3efe6;--muted:#8b949e;--line:rgba(255,255,255,.09);--line-2:rgba(255,255,255,.16);
  --green:#00ff88;--cyan:#00ff88;--accent:#00ff88;--accent-rgb:0,255,136;
  --sans:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;--pixel:'Silkscreen',monospace;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.65;
  background-color:var(--bg);
  background-image:
    radial-gradient(600px 400px at 80% 10%, rgba(var(--accent-rgb),.07), transparent 65%),
    radial-gradient(500px 400px at 10% 70%, rgba(var(--accent-rgb),.05), transparent 65%),
    linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
  background-size:100% 100%,100% 100%,44px 44px,44px 44px;
  -webkit-font-smoothing:antialiased;
}
a{color:inherit;text-decoration:none}

/* Floating Glassmorphic Pill Nav */
.pill-nav{
  position:sticky;top:1rem;z-index:40;max-width:fit-content;margin:1rem auto 0;
  display:flex;align-items:center;gap:.35rem;padding:.4rem .65rem;
  background:rgba(14,18,23,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid var(--line-2);border-radius:999px;box-shadow:0 12px 30px rgba(0,0,0,.45);
}
.pill-nav a{
  font-family:var(--mono);font-size:.76rem;color:var(--muted);
  padding:.35rem .78rem;border-radius:999px;transition:color .2s,background .2s;
}
.pill-nav a:hover,.pill-nav a.active{color:var(--green);background:rgba(var(--accent-rgb),.08)}

.wrap{max-width:1060px;margin:0 auto;padding:3rem 1.5rem 5rem}

/* Hero */
.hero{
  display:grid;grid-template-columns:1.1fr .95fr;gap:2.5rem;align-items:center;
  min-height:76vh;padding:2rem 0 4rem;
}
.hero-tag{
  display:inline-flex;align-items:center;gap:.5rem;font-family:var(--mono);font-size:.76rem;
  color:var(--green);margin-bottom:1.25rem;padding:.3rem .75rem;border-radius:999px;
  background:rgba(var(--accent-rgb),.07);border:1px solid rgba(var(--accent-rgb),.22);
}
.dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 10px var(--green)}
.hero h1{font-size:clamp(2.4rem,4.6vw,3.9rem);line-height:1.08;letter-spacing:-.03em;margin:0 0 1rem;font-weight:700}
.hero h1 .hl{color:var(--green);text-shadow:0 0 28px rgba(var(--accent-rgb),.28)}
.cursor{display:inline-block;width:.55ch;height:.95em;background:var(--green);vertical-align:-.12em;margin-left:.15rem;animation:blink 1s steps(2,start) infinite}
@keyframes blink{to{visibility:hidden}}
.hero-sub{font-size:1.08rem;color:var(--muted);max-width:52ch;margin:0 0 1.75rem}
.hero-ctas{display:flex;flex-wrap:wrap;gap:.75rem}
.cta-primary{
  font-family:var(--mono);font-size:.82rem;font-weight:600;
  padding:.75rem 1.35rem;border-radius:999px;background:var(--green);color:#06110a;
  transition:transform .2s,box-shadow .2s;
}
.cta-primary:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(var(--accent-rgb),.25)}
.cta-sec{
  font-family:var(--mono);font-size:.82rem;padding:.75rem 1.35rem;border-radius:999px;
  border:1px solid var(--line-2);color:var(--ink);background:rgba(255,255,255,.03);
}
.cta-sec:hover{border-color:var(--green);color:var(--green)}

/* Simulated Terminal */
.term{
  background:var(--surface);border:1px solid var(--line-2);border-radius:16px;
  box-shadow:0 24px 60px rgba(0,0,0,.55);overflow:hidden;font-family:var(--mono);font-size:.8rem;
}
.term-bar{
  display:flex;align-items:center;justify-content:space-between;padding:.65rem 1rem;
  background:#0b0e12;border-bottom:1px solid var(--line);color:var(--muted);font-size:.73rem;
}
.term-dots{display:flex;gap:.42rem}
.term-dots span{width:10px;height:10px;border-radius:50%}
.term-dots span:nth-child(1){background:#ff5f56}
.term-dots span:nth-child(2){background:#ffbd2e}
.term-dots span:nth-child(3){background:#27c93f}
.term-body{padding:1.15rem 1.25rem;display:grid;gap:.85rem}
.cmd{color:var(--green)}
.cmd::before{content:"$ ";color:var(--muted)}
.out{color:var(--ink);margin:.2rem 0 0;padding-left:.2rem}
.out.muted{color:var(--muted)}
.term-pills{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.35rem}
.term-pill{
  font-size:.72rem;padding:.2rem .55rem;border-radius:6px;
  border:1px solid rgba(var(--accent-rgb),.25);background:rgba(var(--accent-rgb),.06);color:var(--green);
}

/* Sections */
section{padding:4rem 0 1.5rem;scroll-margin-top:5rem}
.sec-label{font-family:var(--mono);font-size:.76rem;letter-spacing:.14em;color:var(--green);text-transform:uppercase;margin-bottom:.65rem;display:block}
.sec-title{font-size:clamp(1.7rem,3vw,2.35rem);font-weight:700;letter-spacing:-.025em;margin:0 0 2rem}
.pixel{font-family:var(--pixel);color:var(--green);font-weight:400;text-shadow:0 0 18px rgba(var(--accent-rgb),.3)}

/* 01 About */
.about-grid{display:grid;grid-template-columns:.9fr 1.2fr;gap:1.5rem;align-items:start}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:1.5rem}
.compiling-head{font-family:var(--pixel);font-size:.82rem;color:var(--green);letter-spacing:.06em;margin:0 0 1.1rem}
.kv-list{display:grid;gap:.7rem;font-family:var(--mono);font-size:.8rem;margin-bottom:1.35rem}
.kv{display:flex;justify-content:space-between;gap:1rem;border-bottom:1px dashed var(--line);padding-bottom:.45rem}
.kv span:first-child{color:var(--muted)}
.btn-cream{
  display:inline-flex;align-items:center;justify-content:center;gap:.45rem;width:100%;
  padding:.68rem 1rem;border-radius:999px;background:var(--ink);color:var(--bg);
  font-family:var(--mono);font-size:.78rem;font-weight:600;
}
.metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:1.25rem}
.metric{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:1rem 1.15rem}
.metric strong{display:block;font-family:var(--mono);font-size:1.55rem;color:var(--green)}
.metric span{font-family:var(--mono);font-size:.72rem;color:var(--muted);letter-spacing:.08em}

/* 02 Selected Projects */
.proj-shell{display:grid;grid-template-columns:.85fr 1.25fr;gap:1.25rem}
.proj-list{display:grid;gap:.55rem;align-content:start}
.proj-item{
  width:100%;text-align:left;padding:.85rem 1rem;border-radius:12px;cursor:pointer;
  background:var(--surface);border:1px solid var(--line);color:var(--ink);
  display:flex;align-items:center;gap:.8rem;font-family:var(--sans);transition:border-color .2s,background .2s;
}
.proj-item:hover{border-color:var(--line-2)}
.proj-item.active{border-color:var(--green);background:rgba(var(--accent-rgb),.06)}
.proj-num{font-family:var(--mono);font-size:.75rem;color:var(--green)}
.proj-detail{display:flex;flex-direction:column;justify-content:space-between;min-height:290px}
.proj-tags{display:flex;flex-wrap:wrap;gap:.4rem;margin:1rem 0 1.25rem}
.proj-tag{font-family:var(--mono);font-size:.74rem;padding:.24rem .6rem;border-radius:6px;background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--ink)}
.proj-links{display:flex;flex-wrap:wrap;gap:.75rem}

/* 03 Stack */
.stack-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));gap:.8rem}
.stack-card{
  background:var(--surface);border:1px solid var(--line);border-radius:14px;
  padding:1.1rem .95rem;text-align:center;font-family:var(--mono);font-size:.82rem;
  transition:border-color .2s,transform .2s;
}
.stack-card:hover{border-color:var(--green);transform:translateY(-2px);color:var(--green)}

/* 04 Timeline */
.tl{position:relative;display:grid;gap:1.25rem;padding-left:1.75rem;border-left:1px solid var(--line-2)}
.tl-item{position:relative}
.tl-item::before{
  content:"";position:absolute;left:calc(-1.75rem - 5px);top:1.2rem;width:10px;height:10px;border-radius:50%;
  background:var(--green);box-shadow:0 0 12px var(--green),0 0 0 4px var(--bg);
}
.tl-item.edu::before{background:var(--cyan);box-shadow:0 0 12px var(--cyan),0 0 0 4px var(--bg)}
.tl-meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem;font-family:var(--mono);font-size:.74rem;color:var(--green);margin-bottom:.35rem}
.tl-item.edu .tl-meta{color:var(--cyan)}

/* 05 Contact */
.contact-card{
  display:grid;grid-template-columns:1.2fr .8fr;gap:2rem;align-items:center;
  background:var(--surface);border:1px solid var(--line-2);border-radius:20px;padding:2.25rem;
}
.contact-btns{display:grid;gap:.65rem}
.contact-pill{
  display:flex;align-items:center;justify-content:space-between;padding:.72rem 1.15rem;border-radius:999px;
  border:1px solid var(--line-2);background:var(--surface-2);font-family:var(--mono);font-size:.82rem;
  transition:border-color .2s,color .2s;
}
.contact-pill:hover{border-color:var(--green);color:var(--green)}
.contact-pill.primary{background:var(--ink);color:var(--bg);border-color:var(--ink);font-weight:600}

.foot-pill{
  max-width:fit-content;margin:3.5rem auto 0;padding:.6rem 1.25rem;border-radius:999px;
  background:var(--surface);border:1px solid var(--line);
  display:flex;align-items:center;gap:.85rem;font-family:var(--mono);font-size:.76rem;color:var(--muted);
}

@media(max-width:840px){
  .hero,.about-grid,.proj-shell,.contact-card{grid-template-columns:1fr}
  .hero{min-height:auto}
}
${EXTRA_CSS}
${widgets.css}
${MOTION_CSS}
${boot.css}
</style>
</head>
<body>
${MOTION_MARKUP}
${boot.markup}
<nav class="pill-nav" aria-label="Primary">
  <a href="#about">About</a>
  ${projects.length ? '<a href="#projects">Projects</a>' : ''}
  ${skills.length ? '<a href="#stack">Stack</a>' : ''}
  ${timeline.length ? '<a href="#timeline">Timeline</a>' : ''}
  ${certs.length ? '<a href="#certs">Certs</a>' : ''}
  ${username ? '<a href="#activity">Activity</a>' : ''}
  <a href="#contact">Contact</a>
</nav>

<main class="wrap">
  <header class="hero">
    <div>
      ${data.availability ? `<div class="hero-tag"><span class="dot"></span><span>${esc(data.availability)}</span></div>` : `<div class="hero-tag"><span class="dot"></span><span>system ready · tty1</span></div>`}
      <h1>Hello There!<br>I'm <span class="hl">${name}</span><span class="cursor"></span></h1>
      <p class="hero-sub">${esc(data.tagline || data.bio || 'Building fast, thoughtful software and web experiences.')}</p>
      <div class="hero-ctas">
        ${projects.length ? '<a class="cta-primary" href="#projects">explore projects -&gt;</a>' : ''}
        <a class="cta-sec" href="#about">introduction</a>
      </div>
    </div>

    <div class="term" aria-label="Simulated terminal">
      <div class="term-bar">
        <div class="term-dots"><span></span><span></span><span></span></div>
        <span>terminal://${esc(slug)}</span>
        <span>86x24</span>
      </div>
      <div class="term-body">
        <div>
          <div class="cmd">whoami</div>
          <div class="out">${name}${data.location ? ` · ${esc(data.location)}` : ''}</div>
        </div>
        <div>
          <div class="cmd">cat role.txt</div>
          <div class="out muted">${esc(data.tagline || degree)}</div>
        </div>
        ${skills.length ? `<div>
          <div class="cmd">ls ~/skills</div>
          <div class="term-pills">${skills.slice(0, 8).map((s) => `<span class="term-pill">${skillIconSvg(s, 12)}${esc(s)}</span>`).join('')}</div>
        </div>` : ''}
        <div>
          <div class="cmd">./now --status</div>
          <div class="out">${esc(data.availability || 'Building & shipping projects')}</div>
        </div>
      </div>
    </div>
  </header>

  <section id="about">
    <span class="sec-label">${num()} / ABOUT</span>
    <h2 class="sec-title">About <span class="pixel">ME</span></h2>
    <div class="about-grid">
      <div class="card">
        <h3 class="compiling-head">CURRENTLY COMPILING.</h3>
        <div class="kv-list">
          ${data.location ? `<div class="kv"><span>location</span><span>${esc(data.location)}</span></div>` : ''}
          <div class="kv"><span>focus</span><span>${degree}</span></div>
          ${school ? `<div class="kv"><span>institution</span><span>${school}</span></div>` : ''}
          <div class="kv"><span>status</span><span style="color:var(--green)">${esc(data.availability || 'Active')}</span></div>
        </div>
        ${data.resumeUrl
          ? `<a class="btn-cream" href="${safeUrl(data.resumeUrl)}" target="_blank" rel="noreferrer">download resume ↗</a>`
          : data.contactEmail
            ? `<a class="btn-cream" href="mailto:${esc(data.contactEmail)}">email me ↗</a>`
            : ''}
      </div>
      <div>
        <p style="color:var(--muted);margin-top:0;font-size:1.02rem">${esc(data.bio || data.tagline || 'Passionate developer focused on clean architecture, intuitive user interfaces, and reliable systems.')}</p>
        <div class="metrics">
          <div class="metric"><strong>${projects.length}</strong><span>SHIPPED PROJECTS</span></div>
          <div class="metric"><strong>${skills.length}+</strong><span>CORE TECHNOLOGIES</span></div>
        </div>
      </div>
    </div>
  </section>

  ${projects.length ? `<section id="projects">
    <span class="sec-label">${num()} / SELECTED PROJECTS</span>
    <h2 class="sec-title">Things I've <span class="pixel">built</span></h2>
    <div class="proj-shell">
      <div class="proj-list" id="projList"></div>
      <div class="card proj-detail" id="projDetail"></div>
    </div>
  </section>` : ''}

  ${skills.length ? `<section id="stack">
    <span class="sec-label">${num()} / STACK</span>
    <h2 class="sec-title">Tools &amp; <span class="pixel">tech</span></h2>
    <div class="stack-grid">${skills.map((s) => `<div class="stack-card">${skillIconSvg(s, 28)}<div>${esc(s)}</div></div>`).join('')}</div>
  </section>` : ''}

  ${timeline.length ? `<section id="timeline">
    <span class="sec-label">${num()} / TIMELINE</span>
    <h2 class="sec-title">Experience &amp; <span class="pixel">growth</span></h2>
    <div class="tl">
      ${timeline.map((item) => `<article class="card tl-item ${item.kind === 'education' ? 'edu' : ''}">
        <div class="tl-meta"><span>${item.kind.toUpperCase()}</span><span>${esc(item.date)}</span></div>
        <h3 style="margin:0 0 .2rem;font-size:1.12rem">${esc(item.title)}</h3>
        <p style="margin:0;color:var(--muted);font-size:.9rem">${esc(item.org)}</p>
        ${item.desc ? `<p style="margin:.5rem 0 0;color:var(--ink);opacity:.85;font-size:.92rem">${esc(item.desc)}</p>` : ''}
      </article>`).join('')}
    </div>
  </section>` : ''}

  ${certs.length ? `<section id="certs">
    <span class="sec-label">${num()} / CERTS</span>
    <h2 class="sec-title">Proof of <span class="pixel">learning</span></h2>
    ${certCardsHTML(certs)}
  </section>` : ''}

  ${username ? `<section id="activity">
    <span class="sec-label">${num()} / ACTIVITY</span>
    <h2 class="sec-title">GitHub <span class="pixel">activity</span></h2>
    <div class="gha-card" data-gha="${esc(username)}"><p class="gha-msg">Loading GitHub activity…</p></div>
  </section>` : ''}

  <section id="contact">
    <span class="sec-label">${num()} / CONTACT</span>
    <div class="contact-card">
      <div>
        <h2 style="font-size:clamp(1.8rem,3vw,2.5rem);margin:0 0 .6rem">let's <span class="pixel">build</span> something together.</h2>
        <p style="font-family:var(--mono);font-size:.82rem;color:var(--muted);margin:0">// response time: usually within 24 hours</p>
      </div>
      <div class="contact-btns">
        ${data.contactEmail ? `<a class="contact-pill primary" href="mailto:${esc(data.contactEmail)}"><span>email</span><span>→</span></a>` : ''}
        ${data.github ? `<a class="contact-pill" href="${safeUrl(data.github)}" target="_blank" rel="noreferrer"><span>github</span><span>↗</span></a>` : ''}
        ${data.linkedin ? `<a class="contact-pill" href="${safeUrl(data.linkedin)}" target="_blank" rel="noreferrer"><span>linkedin</span><span>↗</span></a>` : ''}
        ${data.website ? `<a class="contact-pill" href="${safeUrl(data.website)}" target="_blank" rel="noreferrer"><span>website</span><span>↗</span></a>` : ''}
        ${data.resumeUrl ? `<a class="contact-pill" href="${safeUrl(data.resumeUrl)}" target="_blank" rel="noreferrer"><span>resume</span><span>↗</span></a>` : ''}
      </div>
    </div>
    ${contactForm ? `<div class="card" style="margin-top:1.25rem">
      <h3 style="margin:0 0 1rem;font-family:var(--mono);font-size:.82rem;color:var(--green)">$ send --message</h3>
      ${contactForm}
    </div>` : ''}
  </section>

  <footer class="foot-pill">
    <span class="dot"></span>
    <span>© ${new Date().getFullYear()} ${name}</span>
  </footer>
</main>

<script>
(function(){
  const projects = ${projectsJson};
  if (!projects.length) return;
  let idx = 0;
  const listEl = document.getElementById('projList');
  const detailEl = document.getElementById('projDetail');
  const escH = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render() {
    listEl.innerHTML = projects.map((p, i) =>
      '<button type="button" class="proj-item ' + (i === idx ? 'active' : '') + '" data-i="' + i + '">' +
        '<span class="proj-num">' + p.num + '</span>' +
        '<span>' + escH(p.title) + '</span>' +
      '</button>'
    ).join('');
    const p = projects[idx];
    detailEl.innerHTML =
      '<div>' +
        '<div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:.74rem;color:var(--green);margin-bottom:.6rem">' +
          '<span>// ARCHIVE ' + p.num + ' / ' + String(projects.length).padStart(2, '0') + '</span>' +
          '<span>' + escH(p.role) + '</span>' +
        '</div>' +
        '<h3 style="font-size:1.5rem;margin:0 0 .65rem">' + escH(p.title) + '</h3>' +
        '<p style="color:var(--muted);margin:0">' + escH(p.desc || 'Project details and implementation.') + '</p>' +
        (p.tags.length ? '<div class="proj-tags">' + p.tags.map(t => '<span class="proj-tag">' + escH(t) + '</span>').join('') + '</div>' : '') +
      '</div>' +
      '<div class="proj-links">' +
        (p.link ? '<a class="cta-primary" href="' + p.link + '" target="_blank" rel="noreferrer">Live Demo ↗</a>' : '') +
        (p.repoUrl ? '<a class="cta-sec" href="' + p.repoUrl + '" target="_blank" rel="noreferrer">GitHub ↗</a>' : '') +
      '</div>';
    listEl.querySelectorAll('.proj-item').forEach(btn => {
      btn.addEventListener('click', () => { idx = Number(btn.dataset.i); render(); });
    });
  }
  render();
})();
</script>
${username ? `<script>${ACTIVITY_SCRIPT}</script>` : ''}
${widgets.markup}
${CURSOR_MARKUP}
<script>${NAV_SPY_SCRIPT}</script>
<script>${MOTION_SCRIPT}</script>
<script>${widgets.script}</script>
<script>${CONTACT_SCRIPT}</script>
<script>${CURSOR_SCRIPT}</script>
${boot.markup ? `<script>${boot.script}</script>` : ''}
</body>
</html>`;
}

const BASE_CSS = `
*{box-sizing:border-box}
html{scroll-behavior:smooth}
html,body{margin:0}
body{background:var(--bg);background-image:var(--bg-image,none);background-attachment:fixed;color:var(--ink);font-family:var(--body);font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased;min-height:100vh}
.topbar{position:sticky;top:0;z-index:20;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);background:var(--nav-bg,rgba(246,245,241,.82));border-bottom:1px solid var(--line)}
.topbar-in{max-width:920px;margin:0 auto;padding:.85rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.brand-id{display:inline-flex;align-items:center;gap:.6rem;font-family:var(--heading);font-weight:600;font-size:1rem;color:var(--ink);text-decoration:none}
.brand-dot{width:8px;height:8px;border-radius:50%;background:var(--accent)}
.nav-links{display:flex;flex-wrap:wrap;align-items:center;gap:1.2rem;font-size:.86rem;font-weight:500}
.nav-links a{color:var(--muted);text-decoration:none;transition:color .2s}
.nav-links a:hover{color:var(--ink)}
.nav-cta{padding:.42rem .95rem;border-radius:999px;background:var(--accent);color:#fff !important;font-size:.82rem;font-weight:500}
.nav-cta:hover{opacity:.92}
.wrap{max-width:920px;margin:0 auto;padding:4rem 1.5rem 6rem}
h1,h2,h3{font-family:var(--heading);font-weight:500;letter-spacing:-.02em;line-height:1.15;margin:0 0 .4em;color:var(--ink)}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.hero{padding-bottom:3.25rem;margin-bottom:3.5rem;border-bottom:1px solid var(--line)}
.hero-top{display:flex;align-items:center;gap:1.25rem;margin-bottom:1.5rem;flex-wrap:wrap}
.avatar{width:68px;height:68px;border-radius:18px;object-fit:cover;border:1px solid var(--line);box-shadow:var(--shadow)}
.monogram{width:68px;height:68px;border-radius:18px;display:grid;place-items:center;background:var(--accent);color:#fff;font-family:var(--heading);font-weight:600;font-size:1.35rem;letter-spacing:.03em;box-shadow:var(--shadow);flex-shrink:0}
.status-pill{display:inline-flex;align-items:center;gap:.45rem;padding:.32rem .8rem;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-size:.78rem;font-weight:500;color:var(--ink2)}
.status-dot{width:7px;height:7px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.18)}
.hero h1{font-size:var(--hero-size,3.4rem);margin-bottom:.55rem}
.tagline{font-size:1.22rem;color:var(--ink2);margin:0 0 .85rem;font-weight:400;max-width:56ch}
.loc{display:inline-flex;align-items:center;gap:.35rem;color:var(--muted);font-size:.88rem;margin:0 0 1rem}
.bio{color:var(--muted);max-width:62ch;margin:0 0 1.75rem;font-size:1rem}
.links{display:flex;flex-wrap:wrap;gap:.65rem}
.link-pill{display:inline-flex;align-items:center;gap:.45rem;padding:.5rem .95rem;border-radius:999px;background:var(--surface);border:1px solid var(--line);color:var(--ink2);font-size:.86rem;font-weight:500;box-shadow:var(--shadow-sm,none);transition:transform .2s,border-color .2s,color .2s}
.link-pill:hover{transform:translateY(-1px);border-color:var(--accent);color:var(--accent);text-decoration:none}
section{margin-bottom:3.75rem;scroll-margin-top:5rem}
.sec-head{display:flex;align-items:baseline;justify-content:space-between;gap:1rem;margin-bottom:1.5rem}
.sec-head h2{font-size:1.55rem;margin:0}
.sec-num{font-family:'JetBrains Mono',monospace;font-size:.75rem;color:var(--muted);letter-spacing:.08em}
.chips{display:flex;flex-wrap:wrap;gap:.55rem}
.chip{padding:.44rem .95rem;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--ink2);font-size:.86rem;font-weight:500}
.timeline{list-style:none;margin:0;padding:0 0 0 1.75rem;border-left:1px solid var(--line-2);display:grid;gap:2rem}
.timeline li{position:relative}
.timeline li::before{content:"";position:absolute;left:calc(-1.75rem - 5px);top:.55rem;width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px var(--bg)}
.tl-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.4rem 1rem;margin-bottom:.2rem}
.timeline h3{font-size:1.15rem;margin:0}
.tl-date{font-family:'JetBrains Mono',monospace;font-size:.78rem;color:var(--muted)}
.meta{margin:0;color:var(--ink2);font-size:.92rem;font-weight:500}
.desc{margin:.5rem 0 0;color:var(--muted);font-size:.94rem;line-height:1.6}
.projects{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:1.15rem}
.project{display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:1.5rem;transition:transform .22s,border-color .22s,box-shadow .22s}
.project:hover{transform:translateY(-3px);border-color:var(--line-2)}
.proj-top{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-bottom:.4rem}
.proj-role{font-family:'JetBrains Mono',monospace;font-size:.72rem;color:var(--accent);text-transform:uppercase;letter-spacing:.08em}
.project h3{font-size:1.18rem;margin:0 0 .35rem}
.project .desc{margin:0 0 1rem;flex:1}
.proj-tags{display:flex;flex-wrap:wrap;gap:.38rem;margin-bottom:1.1rem}
.proj-tag{font-family:'JetBrains Mono',monospace;font-size:.72rem;padding:.2rem .55rem;border-radius:6px;background:var(--tag-bg,rgba(20,19,15,.045));color:var(--ink2)}
.proj-links{display:flex;flex-wrap:wrap;gap:1rem;padding-top:.85rem;border-top:1px solid var(--line);font-size:.85rem;font-weight:500}
.proj-links a{display:inline-flex;align-items:center;gap:.3rem}
.foot{margin-top:4.5rem;padding-top:1.75rem;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;color:var(--muted);font-size:.84rem}
@media(max-width:640px){.wrap{padding:2.5rem 1.15rem 4rem}.hero h1{font-size:2.4rem}.nav-links{gap:.8rem}}
@media print{.topbar{display:none}body{background:#fff;color:#111}.wrap{padding:1.5rem 0}}
`;

const TEMPLATES = {
  blueprint: {
    vars: `--bg:#07090e;--nav-bg:rgba(7,9,14,.85);--surface:#0d111a;--ink:#f1f5f9;--ink2:#cbd5e1;--muted:#94a3b8;--line:rgba(148,163,184,.14);--line-2:rgba(148,163,184,.24);--accent:#00ff88;--tag-bg:rgba(0,255,136,.1);--radius:16px;--shadow:0 16px 36px -16px rgba(0,255,136,.22);--heading:'Space Grotesk','Inter',system-ui,sans-serif;--body:'Inter',system-ui,sans-serif;--hero-size:3.6rem;--bg-image:radial-gradient(800px 450px at 85% 0%,rgba(0,255,136,.10),transparent 60%),linear-gradient(rgba(148,163,184,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.035) 1px,transparent 1px);`,
    extra: `
      body{background-size:100% 100%,48px 48px,48px 48px}
      .monogram{background:linear-gradient(135deg,#00ff88,#16a34a);color:#04101a}
      .nav-cta{color:#04101a !important}`,
  },
  workshop: {
    vars: `--bg:#f6f5f1;--nav-bg:rgba(246,245,241,.85);--surface:#ffffff;--ink:#14130f;--ink2:#3d3b35;--muted:#7a776d;--line:#e7e5de;--line-2:#d9d6cc;--accent:#1f3a5f;--tag-bg:#f1efe9;--radius:16px;--shadow:0 1px 2px rgba(20,19,15,.04),0 14px 36px -14px rgba(20,19,15,.12);--heading:'Fraunces',Georgia,serif;--body:'Inter',system-ui,sans-serif;--hero-size:3.5rem;`,
    extra: ``,
  },
  editorial: {
    vars: `--bg:#fbf8f1;--nav-bg:rgba(251,248,241,.9);--surface:#fbf8f1;--ink:#171717;--ink2:#2b2b2b;--muted:#6f6a60;--line:#171717;--line-2:#171717;--accent:#a8432a;--tag-bg:rgba(23,23,23,.06);--radius:0;--shadow:none;--heading:'Fraunces',Georgia,serif;--body:'Inter',system-ui,sans-serif;--hero-size:4.4rem;`,
    extra: `
      .hero h1{font-style:italic;font-weight:400}
      .chip,.project,.link-pill,.monogram{border-radius:0;box-shadow:none}
      .chip,.link-pill{background:transparent;border-color:var(--ink)}
      .sec-head{border-bottom:1px solid var(--ink);padding-bottom:.6rem}`,
  },
  minimal: {
    vars: `--bg:#ffffff;--nav-bg:rgba(255,255,255,.9);--surface:#ffffff;--ink:#111111;--ink2:#444444;--muted:#767676;--line:#ebebeb;--line-2:#dcdcdc;--accent:#111111;--tag-bg:#f4f4f5;--radius:8px;--shadow:none;--heading:'Inter',system-ui,sans-serif;--body:'Inter',system-ui,sans-serif;--hero-size:2.85rem;`,
    extra: `
      h1,h2,h3{font-weight:600;letter-spacing:-.03em}
      .chip{background:transparent;border-radius:6px}`,
  },
  noir: {
    vars: `--bg:#0b0b0d;--nav-bg:rgba(11,11,13,.85);--surface:#141418;--ink:#f5f1e8;--ink2:#d8d3c8;--muted:#8e8982;--line:#26262c;--line-2:#36363f;--accent:#c9a84c;--tag-bg:rgba(201,168,76,.12);--radius:14px;--shadow:0 16px 40px -20px rgba(0,0,0,.8);--heading:'Fraunces',Georgia,serif;--body:'Inter',system-ui,sans-serif;--hero-size:4.4rem;`,
    extra: `
      .hero h1{font-weight:400}
      .sec-head h2{color:var(--accent)}
      .monogram{background:linear-gradient(135deg,#c9a84c,#8f7225);color:#0b0b0d}
      .nav-cta{color:#0b0b0d !important}
      .chip{background:transparent}`,
  },
  aurora: {
    vars: `--bg:#f5f4ff;--nav-bg:rgba(245,244,255,.82);--surface:rgba(255,255,255,.78);--ink:#1e1b4b;--ink2:#3730a3;--muted:#6b6896;--line:#e4e2f5;--line-2:#cfcbea;--accent:#6366f1;--tag-bg:rgba(99,102,241,.1);--radius:20px;--shadow:0 12px 32px -12px rgba(99,102,241,.22);--heading:'Fraunces',Georgia,serif;--body:'Inter',system-ui,sans-serif;--hero-size:3.75rem;--bg-image:radial-gradient(700px 500px at 0% 0%,#e0e7ff 0%,transparent 60%),radial-gradient(600px 500px at 100% 20%,#fce7f3 0%,transparent 60%),radial-gradient(700px 500px at 60% 100%,#cffafe 0%,transparent 60%);`,
    extra: `
      .hero h1{background:linear-gradient(90deg,#4f46e5,#db2777);-webkit-background-clip:text;background-clip:text;color:transparent}
      .project,.chip,.link-pill{backdrop-filter:blur(8px)}
      .monogram{background:linear-gradient(135deg,#4f46e5,#db2777)}`,
  },
  drafting: {
    vars: `--bg:#0a3d73;--nav-bg:rgba(10,61,115,.9);--surface:rgba(255,255,255,.05);--ink:#e8f1ff;--ink2:#c3d9f5;--muted:#8fb3dc;--line:rgba(255,255,255,.28);--line-2:rgba(255,255,255,.5);--accent:#7fd4ff;--tag-bg:rgba(127,212,255,.14);--radius:2px;--shadow:none;--heading:'Barlow Condensed','Inter',sans-serif;--body:'Barlow','Inter',sans-serif;--hero-size:4.2rem;--bg-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px);`,
    extra: `
      body{background-size:24px 24px,24px 24px,120px 120px,120px 120px}
      h1,h2,h3{text-transform:uppercase;letter-spacing:.02em;font-weight:600}
      .chip,.link-pill,.status-pill,.monogram,.avatar{border-radius:2px;box-shadow:none;border-style:dashed}
      .monogram{background:transparent;color:var(--accent);border:2px solid var(--accent)}
      .nav-cta{color:#06284d !important;border-radius:2px}`,
  },
  industrial: {
    vars: `--bg:#1b1d1f;--nav-bg:rgba(27,29,31,.92);--surface:#25282b;--ink:#eceff1;--ink2:#c9ced2;--muted:#8d949a;--line:#3a3f44;--line-2:#565c62;--accent:#ff7a00;--tag-bg:rgba(255,122,0,.14);--radius:2px;--shadow:none;--heading:'Barlow Condensed','Inter',sans-serif;--body:'Barlow','Inter',sans-serif;--hero-size:4.2rem;`,
    extra: `
      h1,h2,h3{text-transform:uppercase;letter-spacing:.02em;font-weight:600}
      .hero{position:relative;padding-bottom:3rem}
      .hero::after{content:'';position:absolute;left:0;right:0;bottom:0;height:10px;background:repeating-linear-gradient(-45deg,#ff7a00 0 14px,#1b1d1f 14px 28px)}
      .chip,.link-pill,.status-pill,.monogram,.avatar{border-radius:2px;box-shadow:none}
      .project{border-left:4px solid var(--accent)}
      .sec-head h2{color:var(--accent)}
      .monogram{background:var(--accent);color:#1b1d1f}
      .nav-cta{color:#1b1d1f !important;border-radius:2px}`,
  },
  techdraw: {
    vars: `--bg:#f4f4ef;--nav-bg:rgba(244,244,239,.94);--surface:#f4f4ef;--ink:#1a1a1a;--ink2:#333333;--muted:#666666;--line:#1a1a1a;--line-2:#1a1a1a;--accent:#c8102e;--tag-bg:transparent;--radius:0;--shadow:none;--heading:'Barlow Condensed','Inter',sans-serif;--body:'Barlow','Inter',sans-serif;--hero-size:4.2rem;`,
    extra: `
      h1,h2,h3{text-transform:uppercase;letter-spacing:.02em;font-weight:600}
      .hero{border-bottom:3px double var(--ink)}
      .chip,.link-pill,.status-pill,.monogram,.avatar{border-radius:0;box-shadow:none;border-color:var(--ink)}
      .project{border:1.5px solid var(--ink);background:transparent}
      .proj-tag{border:1px solid var(--ink);border-radius:0;background:transparent}
      .sec-head{border-bottom:1.5px solid var(--ink);padding-bottom:.35rem}
      .sec-num{color:var(--accent)}
      .monogram{background:transparent;color:var(--ink);border:2px solid var(--ink)}
      .nav-cta{border-radius:0}`,
  },
  carbon: {
    vars: `--bg:#0d0f12;--nav-bg:rgba(13,15,18,.9);--surface:#151a20;--ink:#e9edf1;--ink2:#c3cad2;--muted:#8591a0;--line:#232b34;--line-2:#36414d;--accent:#00b4d8;--tag-bg:rgba(0,180,216,.12);--radius:4px;--shadow:none;--heading:'Barlow Condensed','Inter',sans-serif;--body:'Barlow','Inter',sans-serif;--hero-size:4.2rem;--bg-image:linear-gradient(45deg,rgba(255,255,255,.025) 25%,transparent 25%,transparent 75%,rgba(255,255,255,.025) 75%),linear-gradient(45deg,rgba(255,255,255,.025) 25%,transparent 25%,transparent 75%,rgba(255,255,255,.025) 75%);`,
    extra: `
      body{background-size:8px 8px,8px 8px;background-position:0 0,4px 4px}
      h1,h2,h3{text-transform:uppercase;letter-spacing:.02em;font-weight:600}
      .hero h1{font-style:italic}
      .chip,.link-pill,.status-pill,.monogram,.avatar{border-radius:4px;box-shadow:none}
      .project{border-top:2px solid var(--accent)}
      .sec-head h2{color:var(--accent)}
      .monogram{background:linear-gradient(135deg,#00b4d8,#0077b6);color:#031219}
      .nav-cta{color:#031219 !important;border-radius:4px}`,
  },
  machinist: {
    vars: `--bg:#e4e2dc;--nav-bg:rgba(228,226,220,.92);--surface:#f1f0ec;--ink:#22262b;--ink2:#3b4148;--muted:#6a7078;--line:#bdbab1;--line-2:#9d9a90;--accent:#9a6b00;--tag-bg:rgba(154,107,0,.12);--radius:3px;--shadow:inset 0 1px 0 rgba(255,255,255,.7),0 1px 2px rgba(0,0,0,.12);--heading:'Barlow Condensed','Inter',sans-serif;--body:'Barlow','Inter',sans-serif;--hero-size:4.2rem;--bg-image:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 1px,rgba(0,0,0,.025) 1px 3px);`,
    extra: `
      h1,h2,h3{text-transform:uppercase;letter-spacing:.02em;font-weight:600}
      .chip,.link-pill,.status-pill,.monogram,.avatar{border-radius:3px}
      .monogram{background:linear-gradient(135deg,#c9a24a,#8a6200);color:#fff}
      .sec-head{border-bottom:2px solid var(--ink);padding-bottom:.35rem}
      .nav-cta{background:var(--ink);border-radius:3px}`,
  },
  precision: {
    vars: `--bg:#f2f4f6;--nav-bg:rgba(242,244,246,.92);--surface:#ffffff;--ink:#0f1720;--ink2:#2c3a48;--muted:#66727f;--line:#d5dbe1;--line-2:#b8c1ca;--accent:#0057b8;--tag-bg:rgba(0,87,184,.08);--radius:4px;--shadow:none;--heading:'Barlow Condensed','Inter',sans-serif;--body:'Barlow','Inter',sans-serif;--hero-size:4.2rem;`,
    extra: `
      h1,h2,h3{text-transform:uppercase;letter-spacing:.02em;font-weight:600}
      .chip,.link-pill,.status-pill,.monogram,.avatar{border-radius:4px;box-shadow:none}
      .project{border-top:3px solid var(--accent)}
      .sec-head h2{color:var(--accent)}
      .nav-cta{border-radius:4px}`,
  },
};

function buildCustomTemplate(rawTheme) {
  const ct = normalizeCustomTheme(rawTheme);
  const dark = ct.mode === 'dark';
  const line = dark ? 'rgba(255,255,255,.12)' : 'rgba(20,19,15,.12)';
  const line2 = dark ? 'rgba(255,255,255,.22)' : 'rgba(20,19,15,.22)';
  const muted = dark ? '#94a3b8' : '#64748b';
  const ink2 = dark ? '#cbd5e1' : '#334155';
  const tagBg = dark ? 'rgba(255,255,255,.07)' : 'rgba(15,23,42,.06)';
  const navBg = dark ? 'rgba(10,12,18,.82)' : 'rgba(255,255,255,.85)';
  return {
    vars: `--bg:${ct.bg};--nav-bg:${navBg};--surface:${ct.surface};--surface-2:${ct.surface};--ink:${ct.ink};--ink2:${ink2};--muted:${muted};--line:${line};--line-2:${line2};--accent:${ct.accent};--tag-bg:${tagBg};--radius:${ct.radius}px;--shadow:0 12px 32px -14px rgba(0,0,0,.22);--heading:'${ct.headingFont}',system-ui,sans-serif;--body:'${ct.bodyFont}',system-ui,sans-serif;--hero-size:3.5rem;`,
    extra: `.chip,.link-pill,.monogram,.avatar{border-radius:${Math.min(ct.radius, 18)}px}`,
  };
}

export function generatePortfolioHTML(rawData, { boot: withBoot = true } = {}) {
  const { adapted: data, mode, matchedSkills, matchedProjectIds } = adaptPortfolioForView(rawData);
  const boot = buildBoot(data, withBoot);
  if (data.template === 'terminal') {
    return generateTerminalOSHTML(data, boot, mode);
  }

  const t = data.template === 'custom' ? buildCustomTemplate(data.customTheme) : (TEMPLATES[data.template] ?? TEMPLATES.workshop);
  const name = esc(data.name || 'Your Name');
  const initials = esc(getInitials(data.name));
  const username = githubUser(data.github);

  const links = [
    data.contactEmail && `<a class="link-pill" href="mailto:${esc(data.contactEmail)}">${ICONS.mail}<span>Email</span></a>`,
    data.github && `<a class="link-pill" href="${safeUrl(data.github)}" target="_blank" rel="noreferrer">${ICONS.github}<span>GitHub</span></a>`,
    data.linkedin && `<a class="link-pill" href="${safeUrl(data.linkedin)}" target="_blank" rel="noreferrer">${ICONS.linkedin}<span>LinkedIn</span></a>`,
    data.website && `<a class="link-pill" href="${safeUrl(data.website)}" target="_blank" rel="noreferrer">${ICONS.globe}<span>Website</span></a>`,
    data.resumeUrl && `<a class="link-pill" href="${safeUrl(data.resumeUrl)}" target="_blank" rel="noreferrer">${ICONS.file}<span>Resume</span></a>`,
  ].filter(Boolean).join('');

  let secIdx = 1;
  const nextNum = () => String(secIdx++).padStart(2, '0');

  const timeline = buildTimeline(data);
  const certs = data.certifications ?? [];
  const widgets = buildWidgets(data);
  const contactForm = contactFormHTML(data);

  const navLabels = { skills: 'Skills', projects: 'Projects', timeline: 'Timeline', certs: 'Certs' };
  const hasSec = {
    skills: (data.skills ?? []).length > 0,
    projects: (data.projects ?? []).length > 0,
    timeline: timeline.length > 0,
    certs: certs.length > 0,
  };
  const navItems = [
    ...mode.order.filter((k) => hasSec[k]).map((k) => `<a href="#${k}">${navLabels[k]}</a>`),
    contactForm
      ? `<a class="nav-cta" href="#contact">${esc(mode.cta)}</a>`
      : data.contactEmail ? `<a class="nav-cta" href="mailto:${esc(data.contactEmail)}">${esc(mode.cta)}</a>` : '',
  ].filter(Boolean).join('');

  const sectionBuilders = {
    skills: () => (data.skills ?? []).length
      ? `<section id="skills"><div class="sec-head"><h2>Skills &amp; Stack</h2><span class="sec-num">${nextNum()}</span></div><div class="chips">${data.skills
          .map((s) => `<span class="chip ${matchedSkills.has(s) ? 'matched' : ''}">${skillIconSvg(s)}${esc(s)}${matchedSkills.has(s) ? '<span class="match-badge">match</span>' : ''}</span>`).join('')}</div></section>`
      : '',
    projects: () => (data.projects ?? []).length
      ? `<section id="projects"><div class="sec-head"><h2>Selected Projects</h2><span class="sec-num">${nextNum()}</span></div><div class="projects">${data.projects.map((p) => {
          const tags = String(p.techStack || '').split(',').map((x) => x.trim()).filter(Boolean);
          return `
        <article class="project">
          ${p.role ? `<div class="proj-top"><span class="proj-role">${esc(p.role)}</span></div>` : ''}
          <h3>${esc(p.title)}${matchedProjectIds.has(p.id) ? '<span class="match-badge">JD match</span>' : ''}</h3>
          ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ''}
          ${tags.length ? `<div class="proj-tags">${tags.map((tag) => `<span class="proj-tag">${esc(tag)}</span>`).join('')}</div>` : ''}
          ${(p.link || p.repoUrl) ? `<div class="proj-links">
            ${p.link ? `<a href="${safeUrl(p.link)}" target="_blank" rel="noreferrer">Live Demo ${ICONS.arrow}</a>` : ''}
            ${p.repoUrl ? `<a href="${safeUrl(p.repoUrl)}" target="_blank" rel="noreferrer">Source ${ICONS.arrow}</a>` : ''}
          </div>` : ''}
        </article>`;
        }).join('')}</div></section>`
      : '',
    timeline: () => timeline.length
      ? `<section id="timeline"><div class="sec-head"><h2>Timeline</h2><span class="sec-num">${nextNum()}</span></div><ol class="timeline">${timeline.map((e) => `
        <li>
          <div class="tl-head">
            <h3><span class="tl-kind ${e.kind === 'education' ? 'edu' : ''}">${e.kind === 'education' ? 'Education' : 'Work'}</span>${esc(e.title)}</h3>
            <span class="tl-date">${esc(e.date)}</span>
          </div>
          <p class="meta">${esc(e.org)}</p>
          ${e.desc ? `<p class="desc">${esc(e.desc)}</p>` : ''}
        </li>`).join('')}</ol></section>`
      : '',
    certs: () => certs.length
      ? `<section id="certs"><div class="sec-head"><h2>Certifications</h2><span class="sec-num">${nextNum()}</span></div>${certCardsHTML(certs)}</section>`
      : '',
  };
  const orderedSections = mode.order.map((k) => sectionBuilders[k]?.() || '').filter(Boolean).join('\n  ');

  const activity = username
    ? `<section id="activity"><div class="sec-head"><h2>GitHub Activity</h2><span class="sec-num">${nextNum()}</span></div><div class="gha-card" data-gha="${esc(username)}"><p class="gha-msg">Loading GitHub activity…</p></div></section>`
    : '';

  const contactSec = contactForm
    ? `<section id="contact"><div class="sec-head"><h2>Contact</h2><span class="sec-num">${nextNum()}</span></div><p class="desc" style="margin:0 0 1.25rem">Send me a message. It opens a draft in your email app.</p>${contactForm}</section>`
    : '';

  const avatar = data.avatarUrl && /^https?:\/\//i.test(data.avatarUrl.trim())
    ? `<img class="avatar" src="${esc(data.avatarUrl.trim())}" alt="${name}" />`
    : `<div class="monogram" aria-hidden="true">${initials}</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${boot.head}
<title>${name} · Portfolio</title>
${FONTS}
<style>
:root{${t.vars}}
${BASE_CSS}
${EXTRA_CSS}
${t.extra}
${widgets.css}
${MOTION_CSS}
${boot.css}
</style>
</head>
<body>
${MOTION_MARKUP}
${boot.markup}
<nav class="topbar" aria-label="Portfolio navigation">
  <div class="topbar-in">
    <a class="brand-id" href="#"><span class="brand-dot"></span><span>${name}</span></a>
    <div class="nav-links">${navItems}</div>
  </div>
</nav>
<main class="wrap">
  <header class="hero">
    <div class="hero-top">
      ${avatar}
      ${data.availability ? `<span class="status-pill"><span class="status-dot"></span>${esc(data.availability)}</span>` : ''}
      ${mode.id !== 'default' ? `<span class="status-pill">${esc(mode.eyebrow)}</span>` : ''}
    </div>
    <h1>${name}</h1>
    ${data.tagline ? `<p class="tagline">${esc(data.tagline)}</p>` : ''}
    ${data.location ? `<p class="loc">${ICONS.pin}<span>${esc(data.location)}</span></p>` : ''}
    ${data.bio ? `<p class="bio">${esc(data.bio)}</p>` : ''}
    ${links ? `<div class="links">${links}</div>` : ''}
  </header>
  ${orderedSections}
  ${activity}
  ${contactSec}
  <footer class="foot">
    <span>© ${new Date().getFullYear()} ${name}</span>
    <span>Built with Portfolio Maker</span>
  </footer>
</main>
${username ? `<script>${ACTIVITY_SCRIPT}</script>` : ''}
${widgets.markup}
${CURSOR_MARKUP}
<script>${NAV_SPY_SCRIPT}</script>
<script>${MOTION_SCRIPT}</script>
<script>${widgets.script}</script>
<script>${CONTACT_SCRIPT}</script>
<script>${CURSOR_SCRIPT}</script>
${boot.markup ? `<script>${boot.script}</script>` : ''}
</body>
</html>`;
}