const USERS_KEY = 'pf_users';
const SESSION_KEY = 'pf_currentUser';
const dataKey = (email) => `pf_data_${email}`;
const listKey = (email) => `pf_portfolios_${email}`;

const read = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
};

export const getUsers = () => read(USERS_KEY, []);
export const saveUsers = (users) => write(USERS_KEY, users);

export const getSession = () => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};
export const setSession = (email) => {
  try {
    localStorage.setItem(SESSION_KEY, email);
  } catch {
    // Ignore storage errors
  }
};
export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
};

export const defaultCustomTheme = () => ({
  mode: 'dark',
  bg: '#0b0f17',
  surface: '#121826',
  ink: '#f1f5f9',
  accent: '#38bdf8',
  headingFont: 'Space Grotesk',
  bodyFont: 'Inter',
  radius: 14,
});

export const emptyPortfolio = (name = '', email = '') => ({
  name,
  tagline: '',
  bio: '',
  location: '',
  availability: '',
  avatarUrl: '',
  skills: [],
  education: [],      // { id, institution, degree, years, grade }
  experience: [],     // { id, role, company, duration, description }
  projects: [],       // { id, title, role, techStack, description, link, repoUrl }
  certifications: [], // { id, name, issuer, year, link }
  contactEmail: email,
  github: '',
  linkedin: '',
  website: '',
  resumeUrl: '',
  template: 'workshop',
  customTheme: defaultCustomTheme(),
  audienceMode: 'default',
  tailor: null,
});

export const samplePortfolio = (name = 'Aarav Sharma', email = 'aarav@example.com') => ({
  name: name || 'Aarav Sharma',
  tagline: 'Full-Stack Engineer crafting fast, accessible web products',
  bio: 'Computer Science undergraduate passionate about design systems, distributed backends, and developer tooling. I enjoy turning complex workflows into clean, reliable software.',
  location: 'Hyderabad, India',
  availability: 'Open to Software Engineering Internships',
  avatarUrl: '',
  skills: [
    'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Python',
    'Tailwind CSS', 'Docker', 'REST APIs', 'Git', 'Figma',
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'KL University',
      degree: 'B.Tech in Computer Science & Engineering',
      years: '2024 – 2028',
      grade: '9.1 CGPA',
    },
  ],
  experience: [
    {
      id: 'exp-1',
      role: 'Frontend Engineering Intern',
      company: 'NovaStack Labs',
      duration: 'May 2026 – Jul 2026',
      description: 'Built reusable accessible UI components in React, reduced bundle size by 28%, and collaborated with product designers on a real-time analytics dashboard.',
    },
    {
      id: 'exp-2',
      role: 'Technical Lead',
      company: 'University Developer Club',
      duration: '2025 – Present',
      description: 'Mentored 40+ peers in modern web development and organized a 36-hour campus hackathon with 180 participants.',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'PulseBoard Analytics',
      role: 'Full-Stack',
      techStack: 'React, Node.js, PostgreSQL',
      description: 'Built a real-time event telemetry dashboard with custom funnel queries, CSV export, and sub-100ms chart filtering.',
      link: 'https://github.com',
      repoUrl: 'https://github.com',
    },
    {
      id: 'proj-2',
      title: 'LedgerFlow',
      role: 'Frontend & UI',
      techStack: 'TypeScript, Vite, Chart.js',
      description: 'Shipped a personal expense and split-bill tracker featuring recurring budget rules, category insights, and offline-first storage.',
      link: 'https://github.com',
      repoUrl: 'https://github.com',
    },
    {
      id: 'proj-3',
      title: 'DocuBrief CLI',
      role: 'Backend',
      techStack: 'Python, FastAPI, Docker',
      description: 'Created a command-line tool that indexes local Markdown documentation and generates searchable static knowledge bases.',
      link: 'https://github.com',
      repoUrl: 'https://github.com',
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'Responsive Web Design',
      issuer: 'freeCodeCamp',
      year: '2025',
      link: 'https://www.freecodecamp.org',
    },
    {
      id: 'cert-2',
      name: 'Meta Front-End Developer',
      issuer: 'Coursera',
      year: '2026',
      link: '',
    },
  ],
  contactEmail: email || 'aarav@example.com',
  github: 'https://github.com',
  linkedin: 'https://linkedin.com',
  website: 'https://example.com',
  resumeUrl: '',
  template: 'workshop',
  customTheme: defaultCustomTheme(),
  audienceMode: 'default',
  tailor: null,
});

const mergePortfolio = (saved, email) => {
  const base = emptyPortfolio(saved?.name ?? '', email);
  return {
    ...base,
    ...saved,
    customTheme: { ...defaultCustomTheme(), ...(saved?.customTheme || {}) },
  };
};

// Loads the multi-portfolio store for an account, migrating legacy single-portfolio accounts seamlessly.
export const loadAllPortfolios = (email) => {
  if (!email) return null;
  const stored = read(listKey(email), null);
  if (stored && Array.isArray(stored.list) && stored.list.length > 0) {
    const list = stored.list.map((item) => ({
      id: item.id || 'main',
      label: item.label || 'Main Portfolio',
      updatedAt: item.updatedAt || Date.now(),
      data: mergePortfolio(item.data, email),
    }));
    const activeId = list.some((x) => x.id === stored.activeId) ? stored.activeId : list[0].id;
    return { activeId, list };
  }

  // Legacy migration from pf_data_<email>
  const legacy = read(dataKey(email), null);
  if (legacy) {
    const migrated = {
      activeId: 'main',
      list: [{ id: 'main', label: 'Main Portfolio', updatedAt: Date.now(), data: mergePortfolio(legacy, email) }],
    };
    write(listKey(email), migrated);
    return migrated;
  }

  return null;
};

export const saveAllPortfolios = (email, state) => {
  if (!email || !state || !Array.isArray(state.list) || state.list.length === 0) return;
  write(listKey(email), state);
  const active = state.list.find((x) => x.id === state.activeId) || state.list[0];
  if (active) write(dataKey(email), active.data);
};

// Backward-compatible helpers used by Portfolio.jsx and AuthContext.jsx
export const loadPortfolio = (email) => {
  const all = loadAllPortfolios(email);
  if (!all) return null;
  const active = all.list.find((x) => x.id === all.activeId) || all.list[0];
  return active ? active.data : null;
};

export const savePortfolio = (email, data) => {
  if (!email) return;
  const all = loadAllPortfolios(email);
  if (!all) {
    saveAllPortfolios(email, {
      activeId: 'main',
      list: [{ id: 'main', label: 'Main Portfolio', updatedAt: Date.now(), data: mergePortfolio(data, email) }],
    });
    return;
  }
  const nextList = all.list.map((item) =>
    item.id === all.activeId ? { ...item, updatedAt: Date.now(), data: mergePortfolio(data, email) } : item,
  );
  saveAllPortfolios(email, { ...all, list: nextList });
};