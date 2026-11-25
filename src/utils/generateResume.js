// ATS-friendly single-page Resume HTML generator (separate from the web portfolio).
// Uses goalAdapter so tailored skills/projects carry into the exported resume too.

import { adaptPortfolioForView } from './goalAdapter';

const esc = (v = '') =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function generateResumeHTML(rawData) {
  const { adapted: data } = adaptPortfolioForView(rawData);
  const name = esc(data.name || 'Your Name');
  const contactParts = [
    data.location && esc(data.location),
    data.contactEmail && `<a href="mailto:${esc(data.contactEmail)}">${esc(data.contactEmail)}</a>`,
    data.github && `<a href="${esc(data.github)}" target="_blank" rel="noreferrer">GitHub</a>`,
    data.linkedin && `<a href="${esc(data.linkedin)}" target="_blank" rel="noreferrer">LinkedIn</a>`,
    data.website && `<a href="${esc(data.website)}" target="_blank" rel="noreferrer">Website</a>`,
  ].filter(Boolean);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${name} — Resume</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#eef0f3;color:#111827;font-family:Inter,system-ui,-apple-system,sans-serif;font-size:13.5px;line-height:1.5;-webkit-font-smoothing:antialiased}
  .toolbar{position:sticky;top:0;z-index:10;background:#111827;color:#fff;padding:.65rem 1.25rem;display:flex;align-items:center;justify-content:space-between;font-size:13px}
  .toolbar button{padding:.45rem 1rem;border-radius:999px;border:0;background:#38bdf8;color:#04101a;font-weight:600;cursor:pointer}
  .page{max-width:800px;margin:1.75rem auto;background:#fff;padding:2.5rem 2.75rem;box-shadow:0 10px 30px rgba(0,0,0,.08)}
  h1{font-size:24px;margin:0 0 4px;letter-spacing:-.02em}
  .tagline{font-size:14px;color:#374151;margin:0 0 6px;font-weight:500}
  .contact{font-size:12.5px;color:#4b5563;display:flex;flex-wrap:wrap;gap:6px 14px;margin-bottom:14px}
  .contact a{color:#1f3a5f;text-decoration:none}
  .summary{margin:0 0 16px;color:#374151}
  h2{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#1f3a5f;border-bottom:1.5px solid #e5e7eb;padding-bottom:4px;margin:18px 0 10px}
  .entry{margin-bottom:11px}
  .entry-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
  .entry-title{font-weight:600;color:#111827}
  .entry-sub{color:#4b5563;font-size:12.5px}
  .entry-date{font-size:12px;color:#6b7280;white-space:nowrap}
  .entry p{margin:3px 0 0;color:#374151}
  .skills{margin:0;color:#1f2937}
  @media print{
    body{background:#fff}
    .toolbar{display:none}
    .page{margin:0;padding:0;box-shadow:none;max-width:none}
  }
</style>
</head>
<body>
<div class="toolbar">
  <span>ATS Resume Preview — ${name}</span>
  <button type="button" onclick="window.print()">Print / Save as PDF</button>
</div>
<main class="page">
  <header>
    <h1>${name}</h1>
    ${data.tagline ? `<p class="tagline">${esc(data.tagline)}</p>` : ''}
    ${contactParts.length ? `<div class="contact">${contactParts.join('<span>·</span>')}</div>` : ''}
    ${data.bio ? `<p class="summary">${esc(data.bio)}</p>` : ''}
  </header>

  ${(data.skills || []).length ? `<section><h2>Technical Skills</h2><p class="skills">${data.skills.map(esc).join(' · ')}</p></section>` : ''}

  ${(data.experience || []).length ? `<section><h2>Experience</h2>${data.experience.map((e) => `
    <div class="entry">
      <div class="entry-head">
        <div><span class="entry-title">${esc(e.role)}</span> <span class="entry-sub">· ${esc(e.company)}</span></div>
        <span class="entry-date">${esc(e.duration)}</span>
      </div>
      ${e.description ? `<p>${esc(e.description)}</p>` : ''}
    </div>`).join('')}</section>` : ''}

  ${(data.projects || []).length ? `<section><h2>Projects</h2>${data.projects.map((p) => `
    <div class="entry">
      <div class="entry-head">
        <div><span class="entry-title">${esc(p.title)}</span>${p.techStack ? ` <span class="entry-sub">(${esc(p.techStack)})</span>` : ''}</div>
        ${p.role ? `<span class="entry-date">${esc(p.role)}</span>` : ''}
      </div>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
    </div>`).join('')}</section>` : ''}

  ${(data.education || []).length ? `<section><h2>Education</h2>${data.education.map((e) => `
    <div class="entry">
      <div class="entry-head">
        <div><span class="entry-title">${esc(e.degree)}</span> <span class="entry-sub">· ${esc(e.institution)}${e.grade ? ` · ${esc(e.grade)}` : ''}</span></div>
        <span class="entry-date">${esc(e.years)}</span>
      </div>
    </div>`).join('')}</section>` : ''}

  ${(data.certifications || []).length ? `<section><h2>Certifications</h2>${data.certifications.map((c) => `
    <div class="entry">
      <div class="entry-head">
        <div><span class="entry-title">${esc(c.name)}</span> <span class="entry-sub">· ${esc(c.issuer)}</span></div>
        <span class="entry-date">${esc(c.year)}</span>
      </div>
    </div>`).join('')}</section>` : ''}
</main>
</body>
</html>`;
}
