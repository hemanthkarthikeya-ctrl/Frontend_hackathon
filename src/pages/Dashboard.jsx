import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  defaultCustomTheme, emptyPortfolio, loadAllPortfolios, samplePortfolio, saveAllPortfolios,
} from '../utils/storage';
import { generatePortfolioHTML } from '../utils/generatePortfolio';
import { normalizePortfolio, newId, safeHref } from '../utils/normalize';
import { shareCurrentPortfolio } from '../utils/shareLink';
import { analyzeBioAndBullets, suggestBio, suggestBulletRewrite, suggestTagline } from '../utils/bioHelper';
import { AUDIENCE_MODES } from '../utils/goalAdapter';
import { generateResumeHTML } from '../utils/generateResume';
import { generateQrCardHTML } from '../utils/qrCard';
import { buildShareLink } from '../utils/shareLink';
import { computeSkillsProof } from '../utils/skillsProof';
import { fetchGithubRepos, fetchRepoCaseStudy, parseRepoUrl } from '../utils/githubImport';
import { checkBullets } from '../utils/fitCheck';
import GithubImport from '../components/GithubImport';
import JobFit from './JobFit';
import SkillIcon from '../components/SkillIcon';
import { SKILL_CATALOG, SKILL_CATEGORIES } from '../data/skillCatalog';
import { findSkill } from '../utils/skillIcons';

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'certs', label: 'Certs' },
  { id: 'theme', label: 'Theme Builder' },
  { id: 'fit', label: 'Job fit' },
];

const TEMPLATES = [
  { id: 'blueprint', label: 'Blueprint', desc: 'Dark bento', bg: '#07090e', ink: '#f1f5f9', accent: '#00ff88' },
  { id: 'terminal', label: 'Terminal OS', desc: 'Cyber dev', bg: '#080a0c', ink: '#f3efe6', accent: '#00ff88' },
  { id: 'workshop', label: 'Workshop', desc: 'Warm studio', bg: '#f6f5f1', ink: '#14130f', accent: '#1f3a5f' },
  { id: 'editorial', label: 'Editorial', desc: 'Serif print', bg: '#fbf8f1', ink: '#171717', accent: '#a8432a' },
  { id: 'minimal', label: 'Minimal', desc: 'Swiss grid', bg: '#ffffff', ink: '#111111', accent: '#111111' },
  { id: 'noir', label: 'Noir', desc: 'Dark & gold', bg: '#0b0b0d', ink: '#f5f1e8', accent: '#c9a84c' },
  { id: 'aurora', label: 'Aurora', desc: 'Soft glass', bg: '#eef2ff', ink: '#1e1b4b', accent: '#6366f1' },
  { id: 'drafting', label: 'Drafting Table', desc: 'Blueprint grid', bg: '#0a3d73', ink: '#e8f1ff', accent: '#7fd4ff' },
  { id: 'industrial', label: 'Industrial Steel', desc: 'Safety orange', bg: '#1b1d1f', ink: '#eceff1', accent: '#ff7a00' },
  { id: 'techdraw', label: 'Tech Drawing', desc: 'CAD title block', bg: '#f4f4ef', ink: '#1a1a1a', accent: '#c8102e' },
  { id: 'carbon', label: 'Carbon Fiber', desc: 'Motorsport dark', bg: '#0d0f12', ink: '#e9edf1', accent: '#00b4d8' },
  { id: 'machinist', label: 'Machinist', desc: 'Brushed steel', bg: '#e4e2dc', ink: '#22262b', accent: '#9a6b00' },
  { id: 'precision', label: 'Precision', desc: 'Engineering blue', bg: '#f2f4f6', ink: '#0f1720', accent: '#0057b8' },
  { id: 'custom', label: 'Custom', desc: 'Your colors', bg: '#0b0f17', ink: '#f1f5f9', accent: '#38bdf8' },
];

const EDUCATION_FIELDS = [
  { name: 'institution', label: 'Institution', required: true, placeholder: 'e.g. KL University' },
  { name: 'degree', label: 'Degree', required: true, placeholder: 'e.g. B.Tech in CSE' },
  { name: 'years', label: 'Years', required: true, placeholder: 'e.g. 2024 – 2028' },
  { name: 'grade', label: 'Grade (optional)', placeholder: 'e.g. 8.9 CGPA' },
];

const EXPERIENCE_FIELDS = [
  { name: 'role', label: 'Role', required: true, placeholder: 'e.g. Frontend Intern' },
  { name: 'company', label: 'Company / Club / Event', required: true, placeholder: 'e.g. NovaStack Labs' },
  { name: 'duration', label: 'Duration', required: true, placeholder: 'e.g. May 2026 – Jul 2026' },
  { name: 'description', label: 'Description', multiline: true, placeholder: 'Key impact, metrics, or responsibilities...' },
];

const PROJECT_FIELDS = [
  { name: 'title', label: 'Title', required: true, placeholder: 'e.g. PulseBoard Analytics' },
  { name: 'role', label: 'Role / Category (optional)', placeholder: 'e.g. Full-Stack' },
  { name: 'techStack', label: 'Tech stack (comma-separated)', placeholder: 'e.g. React, Node.js, PostgreSQL' },
  { name: 'link', label: 'Live Demo URL (optional)', placeholder: 'https://...' },
  { name: 'repoUrl', label: 'Source Code URL (optional)', placeholder: 'https://github.com/...' },
  { name: 'description', label: 'Description', multiline: true, placeholder: 'What problem does it solve?' },
];

const CERT_FIELDS = [
  { name: 'name', label: 'Certificate name', required: true, placeholder: 'e.g. Meta Front-End Developer' },
  { name: 'issuer', label: 'Issuer', required: true, placeholder: 'e.g. Coursera' },
  { name: 'year', label: 'Year', required: true, placeholder: 'e.g. 2026' },
  { name: 'link', label: 'Credential link (optional)', placeholder: 'https://...' },
];

const FONT_OPTIONS = ['Inter', 'Fraunces', 'Space Grotesk', 'JetBrains Mono'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState('profile');
  const [store, setStore] = useState(() => {
    const existing = loadAllPortfolios(user);
    if (existing) return existing;
    return {
      activeId: 'main',
      list: [{ id: 'main', label: 'Main Portfolio', updatedAt: Date.now(), data: emptyPortfolio('', user) }],
    };
  });
  const [renaming, setRenaming] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [toast, setToast] = useState('');
  const [toastLeaving, setToastLeaving] = useState(false);
  const [previewSwap, setPreviewSwap] = useState(false);
  const importRef = useRef(null);

  const activeEntry = useMemo(
    () => store.list.find((x) => x.id === store.activeId) || store.list[0],
    [store],
  );
  const data = activeEntry.data;

  useEffect(() => {
    saveAllPortfolios(user, store);
  }, [user, store]);

  useEffect(() => {
    if (!toast) return;
    setToastLeaving(false);
    const t1 = setTimeout(() => setToastLeaving(true), 2650);
    const t2 = setTimeout(() => setToast(''), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [toast]);

  // Cross-fade the live preview when audience mode / theme changes
  const firstSwap = useRef(true);
  useEffect(() => {
    if (firstSwap.current) { firstSwap.current = false; return; }
    setPreviewSwap(true);
    const t = setTimeout(() => setPreviewSwap(false), 260);
    return () => clearTimeout(t);
  }, [data.audienceMode, data.template, store.activeId]);

  // Animate an item/chip out, then run the real delete
  const animateRemove = (e, fn) => {
    const el = e?.currentTarget?.closest?.('.item-card, .chip');
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return fn();
    el.classList.add('leaving');
    setTimeout(fn, 220);
  };

  const update = (changes) =>
    setStore((prev) => ({
      ...prev,
      list: prev.list.map((item) =>
        item.id === prev.activeId
          ? { ...item, updatedAt: Date.now(), data: { ...item.data, ...changes } }
          : item,
      ),
    }));

  const switchPortfolio = (id) => {
    setRenaming(false);
    setStore((prev) => ({ ...prev, activeId: id }));
  };

  const createPortfolio = () => {
    const id = newId();
    const label = `Version ${store.list.length + 1}`;
    setStore((prev) => ({
      activeId: id,
      list: [...prev.list, { id, label, updatedAt: Date.now(), data: emptyPortfolio(data.name, user) }],
    }));
    setToast(`Created "${label}"`);
  };

  const duplicatePortfolio = () => {
    const id = newId();
    const label = `${activeEntry.label} (Copy)`;
    setStore((prev) => ({
      activeId: id,
      list: [...prev.list, { id, label, updatedAt: Date.now(), data: structuredClone(data) }],
    }));
    setToast(`Duplicated as "${label}"`);
  };

  const saveRename = (e) => {
    e.preventDefault();
    const clean = renameText.trim();
    if (!clean) return;
    setStore((prev) => ({
      ...prev,
      list: prev.list.map((x) => (x.id === prev.activeId ? { ...x, label: clean } : x)),
    }));
    setRenaming(false);
    setToast(`Renamed to "${clean}"`);
  };

  const deletePortfolio = () => {
    if (store.list.length <= 1) return;
    const remaining = store.list.filter((x) => x.id !== store.activeId);
    setStore({ activeId: remaining[0].id, list: remaining });
    setToast('Deleted portfolio version');
  };

  const completeness = useMemo(() => {
    const checks = [
      Boolean(data.name?.trim()),
      Boolean(data.tagline?.trim()),
      Boolean(data.bio?.trim()),
      Boolean(data.contactEmail?.trim() || data.github?.trim() || data.linkedin?.trim()),
      data.skills.length > 0,
      data.education.length > 0,
      data.experience.length > 0,
      data.projects.length > 0,
      data.certifications.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [data]);

  const previewHtml = useMemo(() => generatePortfolioHTML(data, { boot: false }), [data]);

  const generate = () => {
    try {
      const html = generatePortfolioHTML(data);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const slug = (data.name || 'my')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug || 'my'}-portfolio.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setToast(`Downloaded ${slug || 'my'}-portfolio.html`);
    } catch (err) {
      console.error('Portfolio generation failed:', err);
      setToast('Error: ' + err.message);
    }
  };


  const exportResume = () => {
    const html = generateResumeHTML(data);
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      setToast('Opened print-ready Resume');
    } else {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setToast('Downloaded resume.html');
    }
  };

  const openQrCard = async () => {
    let url = data.website?.trim() || '';
    if (!url) {
      try {
        url = await buildShareLink(data);
      } catch {
        url = window.location.origin;
      }
    }
    const html = generateQrCardHTML(data, url);
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      setToast('Opened printable QR Card');
    } else {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'qr-card.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      setToast('Downloaded qr-card.html');
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-backup.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setToast('Exported portfolio-backup.json');
  };

  const shareLink = async () => {
    try {
      setToast(await shareCurrentPortfolio(data));
    } catch (err) {
      setToast('Could not create share link: ' + err.message);
    }
  };

  const importJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const clean = normalizePortfolio(JSON.parse(String(reader.result)), user);
        if (!clean) throw new Error('Not a portfolio object');
        update(clean);
        setToast('Imported portfolio data');
      } catch {
        setToast('Invalid portfolio file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadSample = () => {
    update(samplePortfolio(data.name || 'Aarav Sharma', data.contactEmail || user));
    setToast('Loaded sample portfolio data');
  };

  const counts = {
    skills: data.skills.length,
    education: data.education.length,
    experience: data.experience.length,
    projects: data.projects.length,
    certs: data.certifications.length,
  };

  return (
    <div className={`dash ${showPreview ? 'with-preview' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="auth-mark">PM</div>
          <span>Portfolio Maker</span>
        </div>

        <div className="pf-switcher">
          <span className="field-label">Active Portfolio</span>
          {renaming ? (
            <form className="pf-rename-form" onSubmit={saveRename}>
              <input
                aria-label="Portfolio name"
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                autoFocus
              />
              <button className="btn small" type="submit">Save</button>
              <button className="btn secondary small" type="button" onClick={() => setRenaming(false)}>Cancel</button>
            </form>
          ) : (
            <>
              <select
                aria-label="Select portfolio version"
                value={store.activeId}
                onChange={(e) => switchPortfolio(e.target.value)}
              >
                {store.list.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <div className="pf-switcher-btns">
                <button type="button" className="util-link" onClick={createPortfolio}>+ New</button>
                <button type="button" className="util-link" onClick={duplicatePortfolio}>Duplicate</button>
                <button
                  type="button"
                  className="util-link"
                  onClick={() => { setRenameText(activeEntry.label); setRenaming(true); }}
                >
                  Rename
                </button>
                {store.list.length > 1 && (
                  <button type="button" className="util-link danger-link" onClick={deletePortfolio}>Delete</button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="completeness">
          <div className="completeness-row">
            <span>Completeness</span>
            <strong className="completeness-num" key={completeness}>{completeness}%</strong>
          </div>
          <div className="completeness-track">
            <div className="completeness-fill" style={{ width: `${completeness}%` }} />
          </div>
        </div>

        <nav>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`nav-btn ${active === s.id ? 'active' : ''}`}
              onClick={() => setActive(s.id)}
            >
              <span>{s.label}</span>
              {counts[s.id] !== undefined && (
                <span className="nav-count">{counts[s.id]}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <p className="muted small">{user}</p>
          <div className="sidebar-actions">
            <button className="btn block" onClick={generate}>Download HTML</button>
            <button className="btn secondary block" onClick={shareLink}>Copy share link</button>
            <button className="btn secondary block" onClick={exportResume}>Resume PDF</button>
            <button className="btn secondary block" onClick={openQrCard}>QR Card</button>
            <Link className="btn secondary block" to="/portfolio">Full-screen preview</Link>
            <button
              type="button"
              className="btn secondary block preview-toggle-btn"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? 'Hide live preview' : 'Show live preview'}
            </button>
          </div>
          <div className="sidebar-util">
            <button type="button" className="util-link" onClick={loadSample}>Load sample</button>
            <button type="button" className="util-link" onClick={exportJson}>Export JSON</button>
            <button type="button" className="util-link" onClick={() => importRef.current?.click()}>Import JSON</button>
            <input ref={importRef} type="file" accept="application/json" hidden onChange={importJson} />
          </div>
          <button className="btn danger small" onClick={logout}>Log out</button>
        </div>
      </aside>

      <main className="main" key={`${store.activeId}-${active}`}>
        {active === 'profile' && <ProfileSection data={data} update={update} setToast={setToast} />}
        {active === 'skills' && <SkillsSection data={data} update={update} setToast={setToast} />}
        {active === 'education' && <EducationSection data={data} update={update} />}
        {active === 'experience' && <ExperienceSection data={data} update={update} setToast={setToast} />}
        {active === 'projects' && <ProjectsSection data={data} update={update} setToast={setToast} />}
        {active === 'certs' && <CertsSection data={data} update={update} />}
        {active === 'theme' && <ThemeBuilderSection data={data} update={update} setToast={setToast} />}
        {active === 'fit' && (
          <JobFit
            data={data}
            onTailor={(tailor) => { update({ tailor }); setToast(`Tailored portfolio for ${tailor.title}`); }}
            onResetTailor={() => { update({ tailor: null }); setToast('Reset portfolio tailoring'); }}
          />
        )}
      </main>

      {showPreview && (
        <aside className="preview-pane" aria-label="Live portfolio preview">
          <div className="preview-bar">
            <div className="preview-dots" aria-hidden="true">
              <span /><span /><span />
            </div>
            <span className="preview-label">
              Live Preview · {TEMPLATES.find((t) => t.id === data.template)?.label || 'Workshop'}
            </span>
            <Link className="preview-open" to="/portfolio">Expand ↗</Link>
          </div>
          <iframe
            className={`preview-frame ${previewSwap ? 'swapping' : ''}`}
            title="Live portfolio preview"
            srcDoc={previewHtml}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          />
        </aside>
      )}

      {toast && (
        <div
          key={toast}
          className={`toast ${toastLeaving ? 'leaving' : ''} ${/^(error|could not|invalid|add a valid|add your)/i.test(toast) ? 'error' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className="toast-icon" aria-hidden="true">
            {/^(error|could not|invalid|add a valid|add your)/i.test(toast) ? '!' : '✓'}
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------- Shared pieces ---------- */

function Section({ title, sub, children }) {
  const num = String(SECTIONS.findIndex((s) => s.label === title) + 1).padStart(2, '0');
  return (
    <div className="section">
      <header className="section-head">
        <span className="eyebrow">Section {num}</span>
        <h2>{title}</h2>
        {sub && <p className="muted">{sub}</p>}
      </header>
      {children}
    </div>
  );
}

function Field({ label, multiline, ...props }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {multiline ? <textarea rows={3} {...props} /> : <input {...props} />}
    </label>
  );
}

function ItemForm({ fields, onSubmitItem, buttonText, initialValues, onCancel }) {
  const blank = () => Object.fromEntries(fields.map((f) => [f.name, initialValues?.[f.name] ?? '']));
  const [form, setForm] = useState(blank);

  const set = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmitItem(form);
    if (!initialValues) setForm(blank());
  };

  return (
    <form className="card item-form" onSubmit={submit}>
      {fields.map((f) => (
        <Field
          key={f.name}
          label={f.required ? `${f.label} *` : f.label}
          multiline={f.multiline}
          placeholder={f.placeholder}
          required={f.required}
          value={form[f.name]}
          onChange={set(f.name)}
        />
      ))}
      <div className="form-actions">
        <button className="btn" type="submit">{buttonText}</button>
        {onCancel && (
          <button className="btn secondary" type="button" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}

/* ---------- Sections ---------- */

function ProfileSection({ data, update, setToast }) {
  const set = (key) => (e) => update({ [key]: e.target.value });
  const analysis = useMemo(() => analyzeBioAndBullets(data), [data]);

  return (
    <Section title="Profile" sub="Identity, theme, and contact links.">
      
      <div className="tpl-picker-wrap">
        <span className="field-label">Audience Mode (reorders sections &amp; adapts tone)</span>
        <div className="tpl-grid">
          {AUDIENCE_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`tpl-card ${(data.audienceMode || 'default') === m.id ? 'active' : ''}`}
              onClick={() => { update({ audienceMode: m.id }); setToast(`Audience mode: ${m.label}`); }}
            >
              <span className="tpl-name">{m.label}</span>
              <span className="tpl-desc">{m.desc}</span>
            </button>
          ))}
        </div>
        {data.tailor && (
          <p className="muted small" style={{ marginTop: '.5rem' }}>
            Tailored for <strong>{data.tailor.title}</strong> ({data.tailor.terms.length} matched skills/terms).{' '}
            <button type="button" className="util-link" onClick={() => update({ tailor: null })}>Reset</button>
          </p>
        )}
      </div>

      <div className="tpl-picker-wrap">
        <span className="field-label">Visual Theme</span>
        <div className="tpl-grid">
          {TEMPLATES.map((t) => {
            const swatchBg = t.id === 'custom' ? (data.customTheme?.bg || t.bg) : t.bg;
            const swatchInk = t.id === 'custom' ? (data.customTheme?.ink || t.ink) : t.ink;
            const swatchAccent = t.id === 'custom' ? (data.customTheme?.accent || t.accent) : t.accent;
            return (
              <button
                key={t.id}
                type="button"
                className={`tpl-card ${data.template === t.id ? 'active' : ''}`}
                onClick={() => update({ template: t.id })}
              >
                <span className="tpl-swatch" style={{ background: swatchBg, borderColor: swatchInk }}>
                  <span className="tpl-swatch-dot" style={{ background: swatchAccent }} />
                  <span className="tpl-swatch-bar" style={{ background: swatchInk }} />
                </span>
                <span className="tpl-name">{t.label}</span>
                <span className="tpl-desc">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card form-grid">
        <Field label="Full name" value={data.name} onChange={set('name')} placeholder="e.g. Aarav Sharma" />
        <Field
          label="Tagline"
          value={data.tagline}
          onChange={set('tagline')}
          placeholder="e.g. Full-Stack Engineer crafting fast web apps"
        />
        <Field label="Location" value={data.location} onChange={set('location')} placeholder="e.g. Hyderabad, India" />
        <Field label="Availability badge" value={data.availability} onChange={set('availability')} placeholder="e.g. Open to Internships" />
        <Field label="Bio" multiline value={data.bio} onChange={set('bio')} placeholder="Brief 2–3 sentence summary of your focus and impact..." />
        <Field label="Contact email" type="email" value={data.contactEmail} onChange={set('contactEmail')} />
        <Field label="GitHub URL" value={data.github} onChange={set('github')} placeholder="https://github.com/username" />
        <Field label="LinkedIn URL" value={data.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/in/username" />
        <Field label="Personal website (optional)" value={data.website} onChange={set('website')} placeholder="https://..." />
        <Field label="Resume / CV URL (optional)" value={data.resumeUrl} onChange={set('resumeUrl')} placeholder="https://..." />
        <Field label="Avatar image URL (optional)" value={data.avatarUrl} onChange={set('avatarUrl')} placeholder="https://... (uses initials if blank)" />
      </div>

      <div className="card helper-card">
        <div className="helper-head">
          <h3>Bio &amp; Tagline Helper</h3>
          <span className="item-badge">Rule-based</span>
        </div>
        {analysis.taglineIssues.map((msg, i) => <p key={i} className="helper-warn">{msg}</p>)}
        {analysis.bioIssues.map((msg, i) => <p key={i} className="helper-warn">{msg}</p>)}
        <div className="helper-suggestions">
          <div className="helper-row">
            <div>
              <span className="field-label">Suggested Tagline</span>
              <p className="item-desc">{analysis.suggestedTagline}</p>
            </div>
            <button
              type="button"
              className="btn secondary small"
              onClick={() => { update({ tagline: analysis.suggestedTagline }); setToast('Applied tagline'); }}
            >
              Use tagline
            </button>
          </div>
          <div className="helper-row">
            <div>
              <span className="field-label">Suggested Bio</span>
              <p className="item-desc">{analysis.suggestedBio}</p>
            </div>
            <button
              type="button"
              className="btn secondary small"
              onClick={() => { update({ bio: analysis.suggestedBio }); setToast('Applied bio'); }}
            >
              Use bio
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function SkillsSection({ data, update, setToast }) {
  const [tab, setTab] = useState('all');
  const [custom, setCustom] = useState('');
  const [ghRepos, setGhRepos] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const selectedKeys = new Set(data.skills.map((s) => s.trim().toLowerCase()));
  const isOn = (name) => selectedKeys.has(name.toLowerCase());

  const addSkill = (name) => {
    const clean = name.trim();
    if (!clean || isOn(clean)) return;
    update({ skills: [...data.skills, clean] });
  };
  const removeSkill = (name) =>
    update({ skills: data.skills.filter((s) => s.toLowerCase() !== name.toLowerCase()) });
  const toggle = (name) => (isOn(name) ? removeSkill(name) : addSkill(name));

  const addCustom = (e) => {
    e.preventDefault();
    addSkill(custom);
    setCustom('');
  };

  const syncGithubStats = async () => {
    if (!data.github?.trim()) {
      setToast('Add your GitHub URL in Profile first');
      return;
    }
    setSyncing(true);
    try {
      const repos = await fetchGithubRepos(data.github);
      setGhRepos(repos);
      setToast(`Synced ${repos.length} GitHub repos for skill proof`);
    } catch (err) {
      setToast(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const categoryOf = (skill) => findSkill(skill)?.category ?? null;
  const countFor = (id) =>
    id === 'all' ? data.skills.length : data.skills.filter((s) => categoryOf(s) === id).length;

  const tiles = tab === 'all' ? SKILL_CATALOG : SKILL_CATALOG.filter((s) => s.category === tab);
  const shownSkills = tab === 'all' ? data.skills : data.skills.filter((s) => categoryOf(s) === tab);
  const proofs = useMemo(() => computeSkillsProof(data, ghRepos), [data, ghRepos]);
  const proofMap = useMemo(() => new Map(proofs.map((p) => [p.skill.toLowerCase(), p])), [proofs]);

  return (
    <Section title="Skills" sub="Pick a skill to add its icon, or type your own below.">
      <div className="skill-tabs" role="tablist">
        {[{ id: 'all', label: 'All skills' }, ...SKILL_CATEGORIES].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`skill-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label} <span className="skill-tab-count">{countFor(t.id)}</span>
          </button>
        ))}
      </div>

      <div className="skill-grid">
        {tiles.map((s) => {
          const on = isOn(s.name);
          return (
            <button
              key={s.name}
              type="button"
              aria-pressed={on}
              className={`skill-tile ${on ? 'on' : ''}`}
              onClick={() => toggle(s.name)}
            >
              <SkillIcon name={s.name} size={22} />
              <span>{s.name}</span>
            </button>
          );
        })}
      </div>

      <form className="card inline-form skill-custom" onSubmit={addCustom}>
        <input
          aria-label="Custom skill"
          placeholder="Not in the list? Type it here, e.g. Hadoop"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button className="btn" type="submit" disabled={!custom.trim()}>Add</button>
      </form>

      <div className="proof-head">
        <h3 className="skill-yours" style={{ margin: 0 }}>Your skills &amp; proof</h3>
        <button type="button" className="btn secondary small" onClick={syncGithubStats} disabled={syncing}>
          {syncing ? 'Syncing…' : 'Sync GitHub stats'}
        </button>
      </div>

      <div className="chips" style={{ marginTop: '.75rem' }}>
        {shownSkills.map((s) => {
          const pr = proofMap.get(s.toLowerCase());
          const evCount = pr ? pr.projects.length + pr.experience.length + pr.certs.length + pr.repoCount : 0;
          return (
            <span key={s} className="chip" title={pr?.projects.join(', ') || 'No linked projects yet'}>
              <SkillIcon name={s} />
              {s}
              <span className={`proof-pill ${evCount > 0 ? 'ok' : ''}`}>
                {evCount > 0 ? `${evCount} proof` : 'unverified'}
              </span>
              <button type="button" onClick={(ev) => animateRemove(ev, () => removeSkill(s))} aria-label={`Remove ${s}`}>×</button>
            </span>
          );
        })}
        {shownSkills.length === 0 && (
          <p className="muted">
            {tab === 'all' ? 'No skills yet. Pick some above.' : 'No skills in this category yet.'}
          </p>
        )}
      </div>

      {proofs.length > 0 && (
        <div className="card proof-card">
          <p className="field-label" style={{ margin: '0 0 .75rem' }}>Evidence breakdown</p>
          <div className="proof-list">
            {proofs.map((pr) => (
              <div key={pr.skill} className="proof-row">
                <strong>{pr.skill}</strong>
                <span className="muted small">
                  {pr.verified
                    ? [
                        pr.projects.length ? `Projects: ${pr.projects.join(', ')}` : '',
                        pr.experience.length ? `Exp: ${pr.experience.join(', ')}` : '',
                        pr.certs.length ? `Certs: ${pr.certs.join(', ')}` : '',
                        pr.repoCount ? `GitHub: ${pr.repoCount} repo(s)${pr.stars ? ` · ★ ${pr.stars}` : ''}` : '',
                      ].filter(Boolean).join(' | ')
                    : 'Not yet mentioned in any project, experience, or cert'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

function EducationSection({ data, update }) {
  const [editing, setEditing] = useState(null);

  const saveItem = (item) => {
    if (editing) {
      update({ education: data.education.map((x) => (x.id === editing.id ? { ...x, ...item } : x)) });
      setEditing(null);
    } else {
      update({ education: [...data.education, { id: newId(), ...item }] });
    }
  };

  const remove = (id) => {
    if (editing?.id === id) setEditing(null);
    update({ education: data.education.filter((x) => x.id !== id) });
  };

  return (
    <Section title="Education" sub="Schools, degrees, and academic honors.">
      <ItemForm
        key={editing?.id ?? 'new'}
        fields={EDUCATION_FIELDS}
        onSubmitItem={saveItem}
        buttonText={editing ? 'Save changes' : 'Add education'}
        initialValues={editing}
        onCancel={editing ? () => setEditing(null) : null}
      />

      <div className="item-list">
        {data.education.map((e) => (
          <div className="item-card" key={e.id}>
            <div className="grow">
              <h3>{e.degree}</h3>
              <p className="item-meta">
                {e.institution} · {e.years}{e.grade ? ` · ${e.grade}` : ''}
              </p>
            </div>
            <div className="card-actions">
              <button className="btn secondary small" onClick={() => setEditing(e)}>Edit</button>
              <button className="btn danger small" onClick={(ev) => animateRemove(ev, () => remove(e.id))}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ExperienceSection({ data, update, setToast }) {
  const [editing, setEditing] = useState(null);

  const saveItem = (item) => {
    if (editing) {
      update({ experience: data.experience.map((x) => (x.id === editing.id ? { ...x, ...item } : x)) });
      setEditing(null);
    } else {
      update({ experience: [...data.experience, { id: newId(), ...item }] });
    }
  };

  const remove = (id) => {
    if (editing?.id === id) setEditing(null);
    update({ experience: data.experience.filter((x) => x.id !== id) });
  };

  const improveBullet = (exp) => {
    const improved = suggestBulletRewrite(exp.description);
    if (!improved) return;
    update({ experience: data.experience.map((x) => (x.id === exp.id ? { ...x, description: improved } : x)) });
    setToast('Rewrote bullet — replace [metric]/[X] with your real numbers');
  };

  return (
    <Section title="Experience" sub="Internships, leadership roles, and hackathons.">
      <ItemForm
        key={editing?.id ?? 'new'}
        fields={EXPERIENCE_FIELDS}
        onSubmitItem={saveItem}
        buttonText={editing ? 'Save changes' : 'Add experience'}
        initialValues={editing}
        onCancel={editing ? () => setEditing(null) : null}
      />

      <div className="item-list">
        {data.experience.map((e) => {
          const weak = e.description ? checkBullets({ experience: [e], projects: [] }).some((b) => !b.ok) : false;
          return (
            <div className="item-card" key={e.id}>
              <div className="grow">
                <h3>{e.role}</h3>
                <p className="item-meta">{e.company} · {e.duration}</p>
                {e.description && <p className="item-desc">{e.description}</p>}
                {weak && (
                  <button type="button" className="util-link" style={{ marginTop: '.4rem' }} onClick={() => improveBullet(e)}>
                    ✦ Strengthen bullet (verb + metric)
                  </button>
                )}
              </div>
              <div className="card-actions">
                <button className="btn secondary small" onClick={() => setEditing(e)}>Edit</button>
                <button className="btn danger small" onClick={(ev) => animateRemove(ev, () => remove(e.id))}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function CertsSection({ data, update }) {
  const [editing, setEditing] = useState(null);

  const saveItem = (item) => {
    if (editing) {
      update({ certifications: data.certifications.map((x) => (x.id === editing.id ? { ...x, ...item } : x)) });
      setEditing(null);
    } else {
      update({ certifications: [...data.certifications, { id: newId(), ...item }] });
    }
  };

  const remove = (id) => {
    if (editing?.id === id) setEditing(null);
    update({ certifications: data.certifications.filter((x) => x.id !== id) });
  };

  return (
    <Section title="Certs" sub="Courses and certificates, with a credential link if you have one.">
      <ItemForm
        key={editing?.id ?? 'new'}
        fields={CERT_FIELDS}
        onSubmitItem={saveItem}
        buttonText={editing ? 'Save changes' : 'Add certificate'}
        initialValues={editing}
        onCancel={editing ? () => setEditing(null) : null}
      />

      <div className="item-list">
        {data.certifications.map((c) => (
          <div className="item-card" key={c.id}>
            <div className="grow">
              <h3>{c.name}</h3>
              <p className="item-meta">{c.issuer} · {c.year}</p>
              {safeHref(c.link) && <p className="item-desc">{c.link}</p>}
            </div>
            <div className="card-actions">
              <button className="btn secondary small" onClick={() => setEditing(c)}>Edit</button>
              <button className="btn danger small" onClick={(ev) => animateRemove(ev, () => remove(c.id))}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ProjectsSection({ data, update, setToast }) {
  const [dragFrom, setDragFrom] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const projects = data.projects;

  const saveItem = (item) => {
    if (editing) {
      update({ projects: projects.map((x) => (x.id === editing.id ? { ...x, ...item } : x)) });
      setEditing(null);
    } else {
      update({ projects: [...projects, { id: newId(), ...item }] });
    }
  };

  const remove = (id) => {
    if (editing?.id === id) setEditing(null);
    update({ projects: projects.filter((x) => x.id !== id) });
  };

  const move = (from, to) => {
    if (from === null || from === to) return;
    const list = [...projects];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    update({ projects: list });
  };

  const enrichCaseStudy = async (p) => {
    const parsed = parseRepoUrl(p.repoUrl);
    if (!parsed) {
      setToast('Add a valid GitHub repo URL to generate a case study');
      return;
    }
    setBusyId(p.id);
    try {
      const cs = await fetchRepoCaseStudy(parsed.owner, parsed.repo, p.description);
      update({
        projects: projects.map((x) =>
          x.id === p.id ? { ...x, techStack: cs.techStack || x.techStack, description: cs.description } : x,
        ),
      });
      setToast(`Generated case study for ${p.title}`);
    } catch (err) {
      setToast(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Section title="Projects" sub="Drag the ⋮⋮ handle to reorder, import from GitHub, or generate case studies.">
      <GithubImport
        existingUrls={projects.map((p) => p.repoUrl).filter(Boolean)}
        onImport={(list) => update({ projects: [...projects, ...list] })}
      />
      <ItemForm
        key={editing?.id ?? 'new'}
        fields={PROJECT_FIELDS}
        onSubmitItem={saveItem}
        buttonText={editing ? 'Save changes' : 'Add project'}
        initialValues={editing}
        onCancel={editing ? () => setEditing(null) : null}
      />

      <div className="item-list">
        {projects.map((p, i) => {
          const classes = [
            'item-card',
            'project-card',
            dragFrom === i ? 'dragging' : '',
            overIdx === i && dragFrom !== null && dragFrom !== i ? 'drag-over' : '',
          ].join(' ');
          const hasGhRepo = Boolean(parseRepoUrl(p.repoUrl));
          const weakProj = p.description ? checkBullets({ experience: [], projects: [p] }).some((b) => !b.ok) : false;

          return (
            <div
              key={p.id}
              className={classes}
              draggable
              onDragStart={(e) => {
                setDragFrom(i);
                e.dataTransfer.setData('text/plain', '');
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIdx(i);
              }}
              onDragLeave={() => setOverIdx(null)}
              onDrop={(e) => {
                e.preventDefault();
                move(dragFrom, i);
                setDragFrom(null);
                setOverIdx(null);
              }}
              onDragEnd={() => {
                setDragFrom(null);
                setOverIdx(null);
              }}
            >
              <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
              <div className="grow">
                <h3>{p.title}{p.role ? <span className="item-badge">{p.role}</span> : null}</h3>
                {p.description && <p className="item-desc">{p.description}</p>}
                {weakProj && (
                  <button
                    type="button"
                    className="util-link"
                    style={{ marginTop: '.35rem' }}
                    onClick={() => {
                      const improved = suggestBulletRewrite(p.description);
                      update({ projects: projects.map((x) => (x.id === p.id ? { ...x, description: improved } : x)) });
                      setToast('Strengthened project bullet — replace [metric]/[X] with your numbers');
                    }}
                  >
                    ✦ Strengthen bullet (verb + metric)
                  </button>
                )}
                {p.techStack && <p className="item-meta">{p.techStack}</p>}
                <div className="item-links-row">
                  {safeHref(p.link) && <a href={safeHref(p.link)} target="_blank" rel="noreferrer">Live Demo</a>}
                  {safeHref(p.repoUrl) && <a href={safeHref(p.repoUrl)} target="_blank" rel="noreferrer">Source</a>}
                  {hasGhRepo && (
                    <button
                      type="button"
                      className="util-link"
                      disabled={busyId === p.id}
                      onClick={() => enrichCaseStudy(p)}
                    >
                      {busyId === p.id ? 'Generating…' : '✦ Build case study'}
                    </button>
                  )}
                </div>
              </div>
              <div className="card-actions">
                <button className="btn secondary small" onClick={() => setEditing(p)}>Edit</button>
                <button className="btn danger small" onClick={(ev) => animateRemove(ev, () => remove(p.id))}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ThemeBuilderSection({ data, update, setToast }) {
  const ct = { ...defaultCustomTheme(), ...(data.customTheme || {}) };

  const setThemeField = (changes) => {
    update({
      template: 'custom',
      customTheme: { ...ct, ...changes },
    });
  };

  return (
    <Section title="Theme Builder" sub="Design your 14th custom theme with your own colors, fonts, and card radius.">
      <div className="card form-grid">
        <label className="field">
          <span className="field-label">Base Mode</span>
          <select value={ct.mode} onChange={(e) => setThemeField({ mode: e.target.value })}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>

        <label className="field">
          <span className="field-label">Card Radius ({ct.radius}px)</span>
          <input
            type="range"
            min="0"
            max="24"
            value={ct.radius}
            onChange={(e) => setThemeField({ radius: Number(e.target.value) })}
          />
        </label>

        <label className="field">
          <span className="field-label">Background Color</span>
          <input type="color" className="color-inp" value={ct.bg} onChange={(e) => setThemeField({ bg: e.target.value })} />
        </label>

        <label className="field">
          <span className="field-label">Surface / Card Color</span>
          <input type="color" className="color-inp" value={ct.surface} onChange={(e) => setThemeField({ surface: e.target.value })} />
        </label>

        <label className="field">
          <span className="field-label">Text Color</span>
          <input type="color" className="color-inp" value={ct.ink} onChange={(e) => setThemeField({ ink: e.target.value })} />
        </label>

        <label className="field">
          <span className="field-label">Accent Color</span>
          <input type="color" className="color-inp" value={ct.accent} onChange={(e) => setThemeField({ accent: e.target.value })} />
        </label>

        <label className="field">
          <span className="field-label">Heading Font</span>
          <select value={ct.headingFont} onChange={(e) => setThemeField({ headingFont: e.target.value })}>
            {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Body Font</span>
          <select value={ct.bodyFont} onChange={(e) => setThemeField({ bodyFont: e.target.value })}>
            {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>

        <div className="form-actions">
          <button
            type="button"
            className="btn"
            onClick={() => { update({ template: 'custom' }); setToast('Custom theme active'); }}
          >
            {data.template === 'custom' ? 'Custom theme active ✓' : 'Activate custom theme'}
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => { update({ customTheme: defaultCustomTheme(), template: 'custom' }); setToast('Reset custom theme'); }}
          >
            Reset defaults
          </button>
        </div>
      </div>
    </Section>
  );
}

function HealthSection({ data, update, health, onJump, setToast }) {
  const autoFixItem = (id) => {
    if (id === 'tagline') {
      update({ tagline: suggestTagline(data) });
      setToast('Applied suggested tagline');
    } else if (id === 'bio') {
      update({ bio: suggestBio(data) });
      setToast('Applied suggested bio');
    } else if (id === 'bullets') {
      update({
        experience: (data.experience || []).map((e) => {
          const weak = e.description && checkBullets({ experience: [e], projects: [] }).some((b) => !b.ok);
          return weak ? { ...e, description: suggestBulletRewrite(e.description) } : e;
        }),
        projects: (data.projects || []).map((p) => {
          const weak = p.description && checkBullets({ experience: [], projects: [p] }).some((b) => !b.ok);
          return weak ? { ...p, description: suggestBulletRewrite(p.description) } : p;
        }),
      });
      setToast('Strengthened weak bullets — replace [metric]/[X] with real numbers');
    }
  };

  return (
    <Section title="Health Score" sub="Checks completeness, bullet strength, link safety, and accessibility.">
      <div className="card health-banner">
        <div>
          <span className="eyebrow" style={{ marginBottom: '.2rem' }}>Overall Health</span>
          <h3 style={{ fontSize: '2rem', margin: 0 }}>{health.score}% · {health.grade}</h3>
          <p className="muted small" style={{ margin: '.25rem 0 0' }}>
            {health.passed} of {health.total} checks passed
          </p>
        </div>
      </div>

      <div className="item-list" style={{ marginTop: '1.25rem' }}>
        {health.checks.map((c) => (
          <div key={c.id} className={`item-card health-item ${c.ok ? 'pass' : 'fail'}`}>
            <span className={`health-dot ${c.ok ? 'ok' : 'warn'}`} aria-hidden="true">
              {c.ok ? '✓' : '!'}
            </span>
            <div className="grow">
              <h3>{c.label} <span className="item-badge">{c.category}</span></h3>
              {!c.ok && <p className="item-desc">{c.fixHint}</p>}
            </div>
            {!c.ok && (
              <div className="card-actions">
                {c.autoFix && (
                  <button type="button" className="btn small" onClick={() => autoFixItem(c.id)}>
                    ✦ Auto-fix
                  </button>
                )}
                <button type="button" className="btn secondary small" onClick={() => onJump(c.fixSection)}>
                  Open →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}