// Data and styles for the Timeline and Certs sections of an exported portfolio.
// The Timeline merges Experience and Education into one list, newest first.
// (HTML for each theme is built in generatePortfolio.jsx so it can reuse its escaping.)

const yearsIn = (s) => (String(s || '').match(/\b(?:19|20)\d{2}\b/g) || []).map(Number);
const isOngoing = (s) => /\b(present|current|currently|now|ongoing|today)\b/i.test(String(s || ''));

// Returns [{ kind: 'experience' | 'education', title, org, date, desc }], newest first.
// Entries with no year in their date go last, in the order they were entered.
export function buildTimeline(data) {
  const rows = [
    ...(data.experience ?? []).map((e) => ({
      kind: 'experience', title: e.role, org: e.company, date: e.duration, desc: e.description || '',
    })),
    ...(data.education ?? []).map((e) => ({
      kind: 'education', title: e.degree, org: e.institution, date: e.years,
      desc: e.grade ? `Grade: ${e.grade}` : '',
    })),
  ].map((row, order) => {
    const ys = yearsIn(row.date);
    return {
      ...row,
      order,
      end: isOngoing(row.date) ? 9999 : ys.length ? Math.max(...ys) : null,
      start: ys.length ? Math.min(...ys) : null,
    };
  });

  rows.sort((a, b) => {
    if (a.end === null && b.end === null) return a.order - b.order;
    if (a.end === null) return 1;
    if (b.end === null) return -1;
    if (a.end !== b.end) return b.end - a.end;
    if (a.start !== b.start) return (b.start ?? 0) - (a.start ?? 0);
    return a.order - b.order;
  });

  return rows.map(({ kind, title, org, date, desc }) => ({ kind, title, org, date, desc }));
}

// Works on every theme: only uses CSS variables the themes already define, with fallbacks.
export const TIMELINE_CERTS_CSS = `
.tl-kind{display:inline-block;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;padding:.12rem .5rem;border-radius:999px;margin-right:.55rem;vertical-align:.12em;color:var(--accent,var(--green,#00ff88));background:color-mix(in srgb,var(--accent,var(--green,#00ff88)) 12%,transparent)}
.tl-kind.edu{color:var(--ink2,var(--muted));background:color-mix(in srgb,var(--ink,#888) 9%,transparent)}
.certs{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem}
.cert{display:flex;flex-direction:column;gap:.25rem;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius,14px);box-shadow:var(--shadow,none);padding:1.15rem 1.25rem}
.cert h3{font-size:1.02rem;margin:0}
.cert-meta{margin:0;color:var(--muted);font-size:.88rem}
.cert-year{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:.74rem;color:var(--accent,var(--green,#00ff88));letter-spacing:.06em}
.cert a.cert-link{margin-top:.55rem;font-size:.84rem;font-weight:500;color:var(--accent,var(--green,#00ff88));display:inline-flex;align-items:center;gap:.3rem}
`;
