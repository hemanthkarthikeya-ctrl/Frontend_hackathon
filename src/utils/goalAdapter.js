// Goal-driven portfolio adapter:
// 1. Tailor to a job description (reuses analyzeFit from fitCheck.js)
// 2. Audience modes: Recruiter, Client, Professor (reorders sections & adapts wording)

import { analyzeFit } from './fitCheck';

export const AUDIENCE_MODES = [
  {
    id: 'default',
    label: 'Default',
    desc: 'Standard portfolio layout',
    eyebrow: 'Portfolio',
    cta: 'Get in touch',
    order: ['skills', 'projects', 'timeline', 'certs'],
  },
  {
    id: 'recruiter',
    label: 'Recruiter',
    desc: 'Skills & impact projects first',
    eyebrow: 'Engineering Candidate',
    cta: 'Schedule interview',
    order: ['skills', 'projects', 'timeline', 'certs'],
  },
  {
    id: 'client',
    label: 'Client',
    desc: 'Shipped work & contact first',
    eyebrow: 'Freelance & Consulting',
    cta: 'Start a project',
    order: ['projects', 'skills', 'timeline', 'certs'],
  },
  {
    id: 'professor',
    label: 'Professor',
    desc: 'Education, research & certs first',
    eyebrow: 'Academic Portfolio',
    cta: 'Academic inquiry',
    order: ['timeline', 'projects', 'certs', 'skills'],
  },
];

export function extractTailorFromJD(data, jobText, title = '') {
  const fit = analyzeFit(data, jobText);
  const terms = [...fit.listed, ...fit.mentioned].map((x) => x.name);
  return {
    title: String(title || '').trim().slice(0, 80) || 'Target Role',
    terms: [...new Set(terms)].slice(0, 40),
  };
}

export function adaptPortfolioForView(data) {
  const mode = AUDIENCE_MODES.find((m) => m.id === data.audienceMode) || AUDIENCE_MODES[0];
  const terms = (data.tailor?.terms || []).map((t) => String(t).toLowerCase()).filter(Boolean);

  if (!terms.length) {
    return {
      adapted: data,
      mode,
      matchedSkills: new Set(),
      matchedProjectIds: new Set(),
    };
  }

  const matchesTerm = (text, term) => String(text || '').toLowerCase().includes(term);

  // Sort skills: matched first, preserving relative order
  const matchedSkills = new Set();
  const scoredSkills = (data.skills || []).map((s, idx) => {
    const hit = terms.some((t) => matchesTerm(s, t) || matchesTerm(t, s));
    if (hit) matchedSkills.add(s);
    return { s, hit, idx };
  });
  scoredSkills.sort((a, b) => (b.hit ? 1 : 0) - (a.hit ? 1 : 0) || a.idx - b.idx);

  // Sort projects by number of matched JD terms
  const matchedProjectIds = new Set();
  const scoredProjects = (data.projects || []).map((p, idx) => {
    const blob = [p.title, p.role, p.techStack, p.description].join(' ').toLowerCase();
    const hits = terms.filter((t) => blob.includes(t)).length;
    if (hits > 0 && p.id) matchedProjectIds.add(p.id);
    return { p, hits, idx };
  });
  scoredProjects.sort((a, b) => b.hits - a.hits || a.idx - b.idx);

  return {
    adapted: {
      ...data,
      skills: scoredSkills.map((x) => x.s),
      projects: scoredProjects.map((x) => x.p),
    },
    mode,
    matchedSkills,
    matchedProjectIds,
  };
}
