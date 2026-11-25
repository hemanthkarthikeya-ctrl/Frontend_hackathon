// Portfolio Health Score: audits completeness, bullet quality, link safety, and accessibility.

import { checkBullets } from './fitCheck';
import { safeHref } from './normalize';

export function computeHealthScore(data) {
  const checks = [];

  const add = (id, category, ok, label, fixSection, fixHint, autoFix = false) => {
    checks.push({ id, category, ok, label, fixSection, fixHint, autoFix });
  };

  // 1. Completeness
  add('name', 'Completeness', Boolean(data.name?.trim()), 'Full name is set', 'profile', 'Add your full name in Profile.');
  add('tagline', 'Completeness', (data.tagline || '').trim().length >= 15, 'Clear tagline (15+ chars)', 'profile', 'Write a concise one-line tagline.', true);
  add('bio', 'Completeness', (data.bio || '').trim().length >= 50, 'Substantive bio (50+ chars)', 'profile', 'Add a 2–3 sentence bio or use the Bio Helper.', true);
  add('skills', 'Completeness', (data.skills || []).length >= 4, 'At least 4 skills listed', 'skills', 'Add your core languages and frameworks.');
  add('projects', 'Completeness', (data.projects || []).length >= 2, 'At least 2 projects showcased', 'projects', 'Add projects manually or import from GitHub.');
  add('experience', 'Completeness', (data.experience || []).length >= 1, 'Experience or leadership entry', 'experience', 'Add an internship, club role, or hackathon.');
  add('education', 'Completeness', (data.education || []).length >= 1, 'Education entry listed', 'education', 'Add your degree and institution.');
  add('certs', 'Completeness', (data.certifications || []).length >= 1, 'At least 1 certification', 'certs', 'Add a course or certification in Certs.');

  // 2. Content & Bullet Quality (reuses fitCheck.js)
  const expWeak = checkBullets({ experience: data.experience || [], projects: [] }).filter((b) => !b.ok);
  const projWeak = checkBullets({ experience: [], projects: data.projects || [] }).filter((b) => !b.ok);
  const bullets = checkBullets(data);
  const weakBullets = [...expWeak, ...projWeak];
  add(
    'bullets',
    'Content',
    bullets.length > 0 && weakBullets.length === 0,
    bullets.length === 0
      ? 'No experience/project descriptions to audit'
      : weakBullets.length === 0
        ? 'All bullets use strong verbs & metrics'
        : `${weakBullets.length} bullet${weakBullets.length === 1 ? '' : 's'} need stronger verbs or metrics (${weakBullets.map((b) => b.source).slice(0, 2).join(', ')})`,
    expWeak.length > 0 ? 'experience' : 'projects',
    'Start bullets with action verbs (Built, Reduced, Led) and include a number, or click Auto-fix.',
    weakBullets.length > 0,
  );

  // 3. Links & Safety
  const urlFields = [
    ['GitHub', data.github, 'profile'],
    ['LinkedIn', data.linkedin, 'profile'],
    ['Website', data.website, 'profile'],
    ['Resume', data.resumeUrl, 'profile'],
    ...(data.projects || []).map((p, i) => [`Project #${i + 1} Demo`, p.link, 'projects']),
    ...(data.projects || []).map((p, i) => [`Project #${i + 1} Repo`, p.repoUrl, 'projects']),
    ...(data.certifications || []).map((c, i) => [`Cert #${i + 1} Link`, c.link, 'certs']),
  ];
  const invalidUrls = urlFields.filter(([, val]) => val && val.trim() && !safeHref(val));
  add(
    'urls',
    'Links',
    invalidUrls.length === 0,
    invalidUrls.length === 0
      ? 'All provided URLs use safe https:// or mailto: links'
      : `${invalidUrls.length} invalid URL (${invalidUrls.map(([n]) => n).join(', ')})`,
    invalidUrls[0]?.[2] || 'profile',
    'Ensure every URL starts with https:// or http://.',
  );

  const hasContact = Boolean(data.contactEmail?.trim() || safeHref(data.github) || safeHref(data.linkedin));
  add('contact', 'Links', hasContact, 'At least one contact or social link', 'profile', 'Add an email, GitHub, or LinkedIn URL.');

  // 4. Accessibility & Polish
  const projectsWithoutDesc = (data.projects || []).filter((p) => !(p.description || '').trim()).length;
  add(
    'proj-desc',
    'Polish',
    (data.projects || []).length > 0 && projectsWithoutDesc === 0,
    projectsWithoutDesc === 0 ? 'Every project has a description' : `${projectsWithoutDesc} project(s) missing a description`,
    'projects',
    'Add a short description explaining what each project does.',
  );

  const avatarOk = !data.avatarUrl?.trim() || Boolean(safeHref(data.avatarUrl));
  add('avatar', 'Polish', avatarOk, 'Avatar URL is valid (or using initials monogram)', 'profile', 'Use a valid https:// image URL or leave blank.');

  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);
  const grade = score >= 85 ? 'Strong' : score >= 60 ? 'Good' : 'Needs work';

  return { score, grade, passed, total: checks.length, checks };
}
