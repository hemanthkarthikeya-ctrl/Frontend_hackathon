import { newId, safeHref } from './normalize';

// Accepts "octocat", "@octocat", or "https://github.com/octocat/anything".
export function parseUsername(input) {
  return String(input || '')
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '');
}

// Parses "https://github.com/owner/repo" into { owner, repo } or null.
export function parseRepoUrl(url) {
  const m = String(url || '').trim().match(/^https?:\/\/(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/i, '') };
}

// Uses GitHub's public API. No token is needed, but unauthenticated requests
// are limited to 60 per hour per IP address.
export async function fetchGithubRepos(input) {
  const username = parseUsername(input);
  if (!/^[a-z0-9](?:[a-z0-9-]{0,38})$/i.test(username)) {
    throw new Error('Enter a valid GitHub username.');
  }

  const res = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=owner`,
    { headers: { Accept: 'application/vnd.github+json' } },
  );
  if (res.status === 404) throw new Error(`No GitHub user named "${username}".`);
  if (res.status === 403 || res.status === 429) {
    throw new Error('GitHub rate limit reached. Try again in about an hour.');
  }
  if (!res.ok) throw new Error(`GitHub returned an error (${res.status}).`);

  const raw = await res.json();
  return raw
    .filter((r) => !r.fork)
    .map((r) => {
      const hp = typeof r.homepage === 'string' ? r.homepage.trim() : '';
      // Add https:// only to values that look like a domain (e.g. "pulse.dev").
      const looksLikeDomain = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(hp);
      const homepage = /^https?:\/\//i.test(hp) || !looksLikeDomain ? hp : `https://${hp}`;
      return {
        name: r.name,
        owner: r.owner?.login || username,
        url: r.html_url,
        description: (r.description || '').slice(0, 300),
        language: r.language || '',
        stars: r.stargazers_count || 0,
        topics: Array.isArray(r.topics) ? r.topics : [],
        homepage: safeHref(homepage) || '',
      };
    });
}

// Fetches languages + README from a GitHub repo and builds a Problem / Stack / Result case study.
export async function fetchRepoCaseStudy(owner, repo, fallbackDesc = '') {
  const [langRes, readmeRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`, {
      headers: { Accept: 'application/vnd.github+json' },
    }),
    fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`, {
      headers: { Accept: 'application/vnd.github.raw+json' },
    }),
  ]);

  if (langRes.status === 403 || langRes.status === 429 || readmeRes.status === 403 || readmeRes.status === 429) {
    throw new Error('GitHub rate limit reached (60 req/hr). Try again in about an hour.');
  }

  let languages = [];
  if (langRes.ok) {
    const langObj = await langRes.json();
    languages = Object.keys(langObj).slice(0, 5);
  }

  let readmeText = '';
  if (readmeRes.ok) {
    readmeText = await readmeRes.text();
  }

  // Strip Markdown formatting to extract clean summary sentences
  const cleanLines = readmeText
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .split(/\r?\n/)
    .map((l) => l.replace(/^#+\s*/, '').replace(/^[-*>\s]+/, '').trim())
    .filter((l) => l.length > 24 && !/^https?:\/\//i.test(l) && !/badge|shield\.io|license/i.test(l));

  const problem = fallbackDesc || cleanLines[0] || `Built ${repo} to solve a practical workflow challenge.`;
  const stack = languages.length ? languages.join(', ') : 'Modern Web Stack';
  const result = cleanLines[1]
    ? cleanLines[1].slice(0, 220)
    : `Delivered a documented ${languages[0] || 'software'} repository with modular architecture.`;

  return {
    techStack: stack,
    description: `Problem: ${problem} Stack: ${stack}. Result: ${result}`.slice(0, 1100),
  };
}

export function repoToProject(repo, caseStudy = null) {
  const techStack = caseStudy?.techStack || [repo.language, ...repo.topics].filter(Boolean).slice(0, 6).join(', ');
  return {
    id: newId(),
    title: repo.name,
    role: repo.language || 'Project',
    techStack,
    description: caseStudy?.description || repo.description,
    link: repo.homepage,
    repoUrl: repo.url,
  };
}
