// Job-fit check. Runs entirely in the browser with simple, explainable rules.
//
// What it does:
//  1. Finds tools and concepts in the job description (SKILL_CATALOG + JOB_TERMS).
//  2. Works out how important each one is from the wording around it:
//       "required", "must", "need" -> required (weight 1.0)
//       no clear wording           -> general  (weight 0.75)
//       "plus", "preferred", "bonus" -> nice to have (weight 0.4)
//     Lines under a "Requirements" or "Preferred" heading inherit that weight.
//  3. Checks qualifications: years of experience, degree, certifications,
//     projects and open source.
//  4. Scores only what it can actually check. A criterion the portfolio can't show
//     (for example, certifications, which the portfolio has no field for) is marked
//     "unknown" and is left out of the score, so the score is never penalised for
//     something the tool cannot see.

import { SKILL_CATALOG } from '../data/skillCatalog';
import { JOB_TERMS } from '../data/jobTerms';

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (s) => String(s || '').toLowerCase();

// One entry per canonical name. Aliases from both lists are merged.
const DICTIONARY = (() => {
  const byName = new Map();
  [...SKILL_CATALOG, ...JOB_TERMS].forEach((entry) => {
    const cur = byName.get(entry.name) || new Set([entry.name]);
    (entry.aliases || []).forEach((a) => cur.add(a));
    byName.set(entry.name, cur);
  });
  return [...byName.entries()].map(([name, aliases]) => ({
    name,
    rxs: [...aliases].map(
      (a) => new RegExp(`(?<![a-z0-9+#.])${escapeRx(norm(a))}(?![a-z0-9+#])`),
    ),
  }));
})();

function findTerms(input) {
  const found = new Set();
  const s = norm(input);
  DICTIONARY.forEach(({ name, rxs }) => {
    if (rxs.some((rx) => rx.test(s))) found.add(name);
  });
  return found;
}

const REQUIRED = 1;
const GENERAL = 0.75;
const PREFERRED = 0.4;

const PREFERRED_RX = /\b(preferred|preferably|prefer|plus|bonus|nice to have|good to have|desirable|an advantage|an asset|optional|would be nice)\b/i;
const REQUIRED_RX = /\b(required|requirements?|must|mandatory|essential|need|needs|needed|minimum|at least|should have|proficient|proficiency)\b/i;
const HEADING_REQUIRED_RX = /^(requirements?|qualifications?|minimum qualifications?|must[- ]have|what you('|’)ll need|what you bring|you have)\b/i;
const HEADING_PREFERRED_RX = /^(preferred( qualifications?)?|nice[- ]to[- ]have|good to have|bonus|desired)\b/i;
const HEADING_OTHER_RX = /^(responsibilities|about (the )?(role|company|us)|benefits|what you('|’)ll do)\b/i;

const weightFor = (text, context) => {
  if (PREFERRED_RX.test(text)) return PREFERRED;
  if (REQUIRED_RX.test(text)) return REQUIRED;
  if (context === 'required') return REQUIRED;
  if (context === 'preferred') return PREFERRED;
  return GENERAL;
};

// Splits the posting into sentences or bullets, each with a weight and a context
// (the heading it sits under).
function segment(jobText) {
  let context = null;
  const out = [];
  String(jobText || '')
    .split(/\r?\n/)
    .forEach((rawLine) => {
      let line = rawLine.trim();
      if (!line) return;
      // A heading can stand alone ("Requirements:") or start a line ("Nice to have: Docker, AWS").
      if (line.length < 120) {
        // Only a standalone heading or one followed by a colon counts. A sentence
        // that merely starts with "Plus" or "You have" keeps its own weight.
        const headingMatch = [
          [HEADING_REQUIRED_RX, 'required'],
          [HEADING_PREFERRED_RX, 'preferred'],
          [HEADING_OTHER_RX, null],
        ]
          .map(([rx, ctx]) => ({ m: rx.exec(line), ctx }))
          .find(({ m }) => m && (/^\s*:/.test(line.slice(m[0].length)) || line.slice(m[0].length).trim() === ''));
        if (headingMatch) {
          context = headingMatch.ctx;
          line = line.slice(headingMatch.m[0].length).replace(/^\s*:?\s*/, '').trim();
          if (!line) return;
        }
      }
      line
        .split(/(?<=[.!?;])\s+|\s*[•·]\s*/)
        .map((x) => x.trim())
        .filter((x) => x.length > 2)
        .forEach((text) => out.push({ text, weight: weightFor(text, context) }));
    });
  return out;
}

// Highest weight each term appears with in the posting.
function termWeights(segments) {
  const weights = new Map();
  segments.forEach(({ text, weight }) => {
    findTerms(text).forEach((term) => {
      weights.set(term, Math.max(weights.get(term) ?? 0, weight));
    });
  });
  return weights;
}

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

// Estimates months of work from an experience duration such as "May 2026 – Jul 2026"
// or "2025 – Present". Overlapping roles are counted twice, so this is an estimate.
export function monthsInDuration(text, now = new Date()) {
  const dates = [];
  const rx = /(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?((?:19|20)\d{2})/gi;
  let m;
  while ((m = rx.exec(String(text || '')))) {
    dates.push({ month: m[1] ? MONTHS[m[1].slice(0, 3).toLowerCase()] : 0, year: Number(m[2]) });
  }
  if (dates.length === 0) return 0;
  const start = dates[0];
  const isOngoing = /\b(present|current|now|till date|today)\b/i.test(text);
  const end = isOngoing
    ? { month: now.getMonth(), year: now.getFullYear() }
    : dates[1] || start;
  return Math.max(0, (end.year * 12 + end.month) - (start.year * 12 + start.month) + 1);
}

const DEGREE_LEVEL_RX = {
  masters: /\b(master'?s?|m\.?\s?tech|m\.?\s?sc|msc|ms)\b/i,
  bachelors: /\b(bachelor'?s?|b\.?\s?tech|b\.?\s?e\.?|b\.?\s?sc|bs)\b/i,
};
const CS_FIELD_RX = /\b(computer science|computer engineering|cse|software engineering|information technology|it)\b/i;

const CREDIT = { met: 1, partial: 0.5, missing: 0, unknown: null };

export function analyzeFit(data, jobText) {
  const segments = segment(jobText);
  const weights = termWeights(segments);
  const jdTerms = [...weights.keys()];

  const skillTerms = new Set();
  (data.skills || []).forEach((s) => findTerms(s).forEach((t) => skillTerms.add(t)));
  const projectText = (data.projects || []).map((p) =>
    [p.title, p.role, p.techStack, p.description].join(' '),
  );
  const experienceText = (data.experience || []).map((e) => [e.role, e.company, e.description].join(' '));
  const evidenceTerms = findTerms([...projectText, ...experienceText].join('\n'));

  const criteria = [];
  const notes = [];

  // ----- Skills: one criterion per term the posting mentions
  const skillLists = { listed: [], mentioned: [], missing: [] };
  jdTerms.forEach((term) => {
    const weight = weights.get(term);
    const required = weight >= REQUIRED;
    let status;
    let note;
    if (skillTerms.has(term)) {
      status = 'met';
      note = 'In your Skills list';
      skillLists.listed.push({ name: term, required });
    } else if (evidenceTerms.has(term)) {
      status = 'partial';
      note = 'Mentioned in a project or experience, but not in your Skills list';
      skillLists.mentioned.push({ name: term, required });
    } else {
      status = 'missing';
      note = 'Not found in your portfolio';
      skillLists.missing.push({ name: term, required });
    }
    criteria.push({ id: `skill:${term}`, group: 'skills', label: term, status, weight, note });
  });

  // ----- Experience (years)
  let minYears = null;
  let yearsWeight = 0;
  segment(jobText).forEach(({ text, weight }) => {
    const hit = text.match(/(\d+)\s*\+?\s*(?:-\s*\d+\s*)?(?:years?|yrs?)\b/i);
    const fresher = /\b(fresher|freshers|entry[- ]level|new grad|recent graduate)\b/i.test(text);
    if (hit && weight >= yearsWeight) {
      const years = Number(hit[1]);
      if (minYears === null || weight > yearsWeight || years > minYears) {
        minYears = years;
        yearsWeight = weight;
      }
    } else if (fresher && weight >= yearsWeight && minYears === null) {
      minYears = 0;
      yearsWeight = weight;
    }
  });
  if (minYears && minYears > 0) {
    const now = new Date();
    const months = (data.experience || []).reduce(
      (sum, e) => sum + monthsInDuration(e.duration, now),
      0,
    );
    const need = minYears * 12;
    let status = 'missing';
    if (months >= need) status = 'met';
    else if (months >= need / 2) status = 'partial';
    const have = months >= 12 ? `${(months / 12).toFixed(1)} years` : `${months} month${months === 1 ? '' : 's'}`;
    criteria.push({
      id: 'experience',
      group: 'experience',
      label: `${minYears}+ years of experience`,
      status,
      weight: yearsWeight,
      note: months > 0 ? `About ${have} in your experience section` : 'No dated experience in your portfolio yet',
    });
  }

  // ----- Degree
  const degreeSeg = segment(jobText).filter((s) => /\b(degree|bachelor'?s?|master'?s?|b\.?\s?tech|b\.?\s?sc|m\.?\s?tech|computer science)\b/i.test(s.text));
  if (degreeSeg.length) {
    const w = Math.max(...degreeSeg.map((s) => s.weight));
    const wantsMasters = degreeSeg.some((s) => DEGREE_LEVEL_RX.masters.test(s.text));
    const wantsCs = degreeSeg.some((s) => CS_FIELD_RX.test(s.text));
    const orEquivalent = degreeSeg.some((s) => /equivalent (experience|practical)/i.test(s.text));
    const degrees = (data.education || []).map((e) => [e.degree, e.institution].join(' '));
    const hasBachelors = degrees.some((d) => DEGREE_LEVEL_RX.bachelors.test(d) || DEGREE_LEVEL_RX.masters.test(d));
    const hasMasters = degrees.some((d) => DEGREE_LEVEL_RX.masters.test(d));
    const hasCs = degrees.some((d) => CS_FIELD_RX.test(d));
    let status;
    let note = 'No matching degree in your education section';
    if (degrees.length === 0) {
      status = orEquivalent ? 'unknown' : 'missing';
      note = orEquivalent ? 'Your portfolio has no education entries, but the posting accepts equivalent experience' : note;
    } else if ((wantsMasters && !hasMasters) || (!wantsMasters && !hasBachelors)) {
      status = orEquivalent ? 'unknown' : 'partial';
      note = wantsMasters ? 'The posting asks for a master’s degree' : 'Degree level differs from the posting';
    } else {
      status = 'met';
      note = 'Matches the degree in your education section';
    }
    if (status === 'met' && wantsCs && !hasCs) {
      status = 'partial';
      note = 'The degree level matches, but the field differs from the posting';
    }
    criteria.push({ id: 'degree', group: 'education', label: wantsMasters ? 'Master’s degree' : 'Bachelor’s degree' + (wantsCs ? ' in computer science' : ''), status, weight: w, note });
  }

  // ----- Certifications: the portfolio has no field for them, so this is usually "unknown"
  const certSeg = segment(jobText).filter((s) => /\b(certified|certification|certificate)\b/i.test(s.text));
  if (certSeg.length) {
    const w = Math.max(...certSeg.map((s) => s.weight));
    const mentionsCerts = [...(data.education || []), ...(data.experience || []), ...(data.projects || [])]
      .some((e) => /certif/i.test(JSON.stringify(e)));
    criteria.push({
      id: 'certification',
      group: 'other',
      label: 'Certification',
      status: mentionsCerts ? 'met' : 'unknown',
      weight: w,
      note: mentionsCerts
        ? 'Mentioned in your portfolio'
        : 'Your portfolio has no certifications section, so this cannot be checked. Add it to an education entry if you have one.',
    });
  }

  // ----- Projects and open source
  const projectSeg = segment(jobText).filter((s) => /\b(open[- ]source|personal projects?|side projects?|portfolio)\b/i.test(s.text));
  if (projectSeg.length) {
    const w = Math.max(...projectSeg.map((s) => s.weight));
    const wantsOss = projectSeg.some((s) => /open[- ]source/i.test(s.text));
    const projects = data.projects || [];
    const withRepo = projects.filter((p) => p.repoUrl && p.repoUrl.trim()).length;
    let status = 'missing';
    let note = 'No projects in your portfolio yet';
    if (wantsOss) {
      if (withRepo > 0) { status = 'met'; note = `${withRepo} project${withRepo === 1 ? '' : 's'} with a source link`; }
      else if (projects.length > 0) { status = 'partial'; note = 'Projects are listed, but none has a source link'; }
    } else if (projects.length > 0) {
      status = 'met';
      note = `${projects.length} project${projects.length === 1 ? '' : 's'} listed`;
    }
    criteria.push({ id: 'projects', group: 'other', label: wantsOss ? 'Open-source work' : 'Projects', status, weight: w, note });
  }

  // ----- Score: weighted credit over criteria we can check
  let earned = 0;
  let possible = 0;
  criteria.forEach((c) => {
    const credit = CREDIT[c.status];
    if (credit === null || credit === undefined) return;
    earned += c.weight * credit;
    possible += c.weight;
  });
  if (criteria.some((c) => c.status === 'unknown')) {
    notes.push('Some requirements cannot be checked from the portfolio, so they are not counted in the score.');
  }

  const total = jdTerms.length;
  return {
    total,
    score: possible ? Math.round((earned / possible) * 100) : null,
    listed: skillLists.listed,
    mentioned: skillLists.mentioned,
    missing: skillLists.missing,
    criteria,
    notes,
  };
}

// ----- Bullet checks (unchanged rules)

const STRONG_VERBS = new Set([
  'built', 'designed', 'developed', 'implemented', 'created', 'shipped', 'launched', 'led',
  'managed', 'mentored', 'organized', 'automated', 'reduced', 'improved', 'increased',
  'optimized', 'migrated', 'deployed', 'delivered', 'wrote', 'architected', 'scaled', 'cut',
  'boosted', 'collaborated', 'owned', 'maintained', 'analyzed', 'integrated', 'refactored',
  'tested', 'configured', 'established', 'coordinated', 'trained', 'presented', 'researched',
  'streamlined', 'saved', 'grew', 'generated', 'won', 'ranked', 'hosted', 'published',
  'secured', 'debugged', 'reviewed', 'documented', 'released', 'prototyped', 'accelerated',
]);

const WEAK_VERBS = new Set([
  'worked', 'helped', 'assisted', 'responsible', 'involved', 'participated', 'was', 'did',
  'used', 'made', 'tried',
]);

// A number followed by a unit or sign, e.g. "28%", "3x", "180 participants", "36-hour".
const METRIC =
  /\d+(?:\.\d+)?-?\s*(?:%|x\b|×|\+|k\b|ms\b|s\b|hours?\b|hrs?\b|minutes?\b|kb\b|mb\b|gb\b|users?\b|people\b|participants?\b|members?\b|teams?\b|requests?\b|projects?\b|customers?\b|students?\b|times\b|percent\b)|[%$₹]\s*\d/i;

const splitSentences = (t) =>
  String(t || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 3);

function judge(sentence) {
  const issues = [];
  const first = (sentence.match(/[a-z]+/i) || [''])[0].toLowerCase();
  if (WEAK_VERBS.has(first)) {
    issues.push('Starts with a weak verb. Lead with what you built or changed.');
  } else if (!STRONG_VERBS.has(first)) {
    issues.push('Start with a strong action verb, such as Built, Reduced, or Led.');
  }
  if (!METRIC.test(sentence)) {
    issues.push('No measurable result. Add a number, such as a percentage, count, or time saved.');
  }
  return { issues, ok: issues.length === 0 };
}

export function checkBullets(data) {
  const out = [];
  (data.experience || []).forEach((e) => {
    splitSentences(e.description).forEach((text) =>
      out.push({ text, source: e.role || 'Experience', ...judge(text) }),
    );
  });
  (data.projects || []).forEach((p) => {
    splitSentences(p.description).forEach((text) =>
      out.push({ text, source: p.title || 'Project', ...judge(text) }),
    );
  });
  return out;
}
