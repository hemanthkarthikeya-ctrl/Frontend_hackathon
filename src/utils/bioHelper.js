// Rule-based bio, tagline, and bullet helper (offline, no external API).
// Reuses checkBullets from fitCheck.js so bullet rules live in one place.

import { checkBullets } from './fitCheck';

const FILLER_RX = /\b(just|really|very|basically|actually|passionate about|hardworking|detail-oriented|team player)\b/gi;

const WEAK_REWRITES = [
  [/^worked on\s+/i, 'Built '],
  [/^helped (?:with|to|in)\s+/i, 'Implemented '],
  [/^assisted (?:with|in)\s+/i, 'Contributed to '],
  [/^was responsible for\s+/i, 'Owned '],
  [/^involved in\s+/i, 'Delivered '],
  [/^participated in\s+/i, 'Collaborated on '],
  [/^used\s+/i, 'Engineered with '],
  [/^made\s+/i, 'Created '],
];

export function suggestTagline(data) {
  const skills = (data.skills || []).slice(0, 3).join(', ');
  const degree = data.education?.[0]?.degree || '';
  const role = data.experience?.[0]?.role || '';
  const focus = role || (degree ? `${degree} student` : 'Software Developer');
  if (skills) return `${focus} building fast, reliable products with ${skills}`;
  return `${focus} focused on clean architecture and user-friendly web apps`;
}

export function suggestBio(data) {
  const raw = String(data.bio || '').trim();
  const topSkills = (data.skills || []).slice(0, 4).join(', ');
  const projCount = (data.projects || []).length;
  const role = data.experience?.[0]?.role;
  const company = data.experience?.[0]?.company;

  if (!raw) {
    const expPart = role && company ? `Previously ${role} at ${company}. ` : '';
    const skillPart = topSkills ? `Core stack includes ${topSkills}. ` : '';
    const projPart = projCount > 0 ? `Shipped ${projCount} project${projCount === 1 ? '' : 's'} focused on measurable performance and clean UX.` : 'Focused on building practical, well-tested software.';
    return `${expPart}${skillPart}${projPart}`.trim();
  }

  // Tighten existing bio: strip filler phrases and clean spacing.
  const tightened = raw
    .replace(FILLER_RX, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;!?])/g, '$1')
    .trim();

  if (tightened !== raw && tightened.length >= 25) return tightened;

  // If already clean, offer a structured version with stack + project count.
  if (topSkills && !raw.toLowerCase().includes(topSkills.split(',')[0].trim().toLowerCase())) {
    return `${raw.replace(/\.$/, '')}. Core stack: ${topSkills}.`;
  }
  return raw;
}

function rewriteOneSentence(sentence) {
  let out = String(sentence || '').trim();
  if (!out) return '';
  for (const [rx, rep] of WEAK_REWRITES) {
    if (rx.test(out)) {
      out = out.replace(rx, rep);
      break;
    }
  }
  out = out.charAt(0).toUpperCase() + out.slice(1);
  // Ensure it starts with a strong verb if still unrecognised
  const first = (out.match(/[a-z]+/i) || [''])[0].toLowerCase();
  const res = checkBullets({ experience: [{ role: '', description: out }], projects: [] })[0];
  if (res && res.issues.some((m) => m.includes('strong action verb'))) {
    out = `Built ${out.charAt(0).toLowerCase()}${out.slice(1)}`;
  }
  if (!/\d/.test(out)) {
    out = `${out.replace(/\.$/, '')}, improving efficiency by 25%.`;
  }
  return out;
}

export function suggestBulletRewrite(text) {
  const parts = String(text || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';
  return parts.map(rewriteOneSentence).join(' ');
}

export function analyzeBioAndBullets(data) {
  const tagline = String(data.tagline || '').trim();
  const bio = String(data.bio || '').trim();
  const taglineIssues = [];
  if (!tagline) taglineIssues.push('Missing a tagline. Add a one-line value proposition.');
  else if (tagline.length < 20) taglineIssues.push('Tagline is very short. Mention your role and main stack.');
  else if (tagline.length > 120) taglineIssues.push('Tagline is long. Keep it under 120 characters for a clean hero.');

  const bioIssues = [];
  if (!bio) bioIssues.push('Missing bio. Add 2–3 sentences about your focus and shipped work.');
  else if (bio.length < 60) bioIssues.push('Bio is brief. Mention your core stack or a concrete achievement.');
  else if (FILLER_RX.test(bio)) bioIssues.push('Contains filler words (e.g. "passionate about", "very"). Tighten for impact.');

  const bullets = checkBullets(data).map((b) => ({
    ...b,
    suggestion: b.ok ? null : suggestBulletRewrite(b.text),
  }));

  return {
    taglineIssues,
    suggestedTagline: suggestTagline(data),
    bioIssues,
    suggestedBio: suggestBio(data),
    bullets,
  };
}
