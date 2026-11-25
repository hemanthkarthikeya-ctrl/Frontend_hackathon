import { defaultCustomTheme, emptyPortfolio } from './storage';

export const AUDIENCE_IDS = ['default', 'recruiter', 'client', 'professor'];

export const TEMPLATE_IDS = [
  'blueprint', 'terminal', 'workshop', 'editorial', 'minimal', 'noir', 'aurora',
  'drafting', 'industrial', 'techdraw', 'carbon', 'machinist', 'precision', 'custom',
];

const ALLOWED_FONTS = new Set(['Inter', 'Fraunces', 'Space Grotesk', 'JetBrains Mono']);
const HEX_RX = /^#[0-9a-f]{6}$/i;

export const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isObj = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const text = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const items = (v, mapFn, max) =>
  Array.isArray(v) ? v.filter(isObj).slice(0, max).map(mapFn) : [];

// Only allow links that start with http(s):// or mailto:, so a javascript: link can never be rendered.
export const safeHref = (value) => {
  const v = typeof value === 'string' ? value.trim() : '';
  return /^(https?:\/\/|mailto:)/i.test(v) ? v : null;
};

export function normalizeCustomTheme(input) {
  const d = defaultCustomTheme();
  if (!isObj(input)) return d;
  const hex = (v, fallback) => (typeof v === 'string' && HEX_RX.test(v.trim()) ? v.trim() : fallback);
  const font = (v, fallback) => (typeof v === 'string' && ALLOWED_FONTS.has(v.trim()) ? v.trim() : fallback);
  const r = Number(input.radius);
  return {
    mode: input.mode === 'light' ? 'light' : 'dark',
    bg: hex(input.bg, d.bg),
    surface: hex(input.surface, d.surface),
    ink: hex(input.ink, d.ink),
    accent: hex(input.accent, d.accent),
    headingFont: font(input.headingFont, d.headingFont),
    bodyFont: font(input.bodyFont, d.bodyFont),
    radius: Number.isFinite(r) ? Math.max(0, Math.min(24, Math.round(r))) : d.radius,
  };
}

// Takes untrusted portfolio data (imported JSON, shared links) and returns a clean,
// correctly-typed portfolio object, or null if the input is not an object at all.
export function normalizePortfolio(input, fallbackEmail = '') {
  if (!isObj(input)) return null;
  const base = emptyPortfolio('', fallbackEmail);

  return {
    ...base,
    name: text(input.name, 120),
    tagline: text(input.tagline, 200),
    bio: text(input.bio, 1200),
    location: text(input.location, 120),
    availability: text(input.availability, 120),
    avatarUrl: text(input.avatarUrl, 500),
    contactEmail: text(input.contactEmail, 200),
    github: text(input.github, 300),
    linkedin: text(input.linkedin, 300),
    website: text(input.website, 300),
    resumeUrl: text(input.resumeUrl, 300),
    skills: Array.isArray(input.skills)
      ? input.skills
          .filter((s) => typeof s === 'string')
          .map((s) => s.trim().slice(0, 60))
          .filter(Boolean)
          .slice(0, 60)
      : [],
    education: items(input.education, (e) => ({
      id: text(e.id, 60) || newId(),
      institution: text(e.institution, 160),
      degree: text(e.degree, 160),
      years: text(e.years, 60),
      grade: text(e.grade, 60),
    }), 20),
    experience: items(input.experience, (e) => ({
      id: text(e.id, 60) || newId(),
      role: text(e.role, 160),
      company: text(e.company, 160),
      duration: text(e.duration, 80),
      description: text(e.description, 1200),
    }), 30),
    projects: items(input.projects, (p) => ({
      id: text(p.id, 60) || newId(),
      title: text(p.title, 160),
      role: text(p.role, 80),
      techStack: text(p.techStack, 300),
      description: text(p.description, 1200),
      link: text(p.link, 300),
      repoUrl: text(p.repoUrl, 300),
    }), 50),
    certifications: items(input.certifications, (c) => ({
      id: text(c.id, 60) || newId(),
      name: text(c.name, 160),
      issuer: text(c.issuer, 160),
      year: text(c.year, 20),
      link: text(c.link, 300),
    }), 30),
    template: TEMPLATE_IDS.includes(input.template) ? input.template : 'workshop',
    customTheme: normalizeCustomTheme(input.customTheme),
    audienceMode: AUDIENCE_IDS.includes(input.audienceMode) ? input.audienceMode : 'default',
    tailor: isObj(input.tailor) && Array.isArray(input.tailor.terms)
      ? {
          title: text(input.tailor.title, 80) || 'Target Role',
          terms: input.tailor.terms.filter((t) => typeof t === 'string').map((t) => t.trim().slice(0, 60)).filter(Boolean).slice(0, 40),
        }
      : null,
  };
}
