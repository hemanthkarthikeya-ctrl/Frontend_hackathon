import { useState } from 'react';
import { fetchGithubRepos, fetchRepoCaseStudy, repoToProject } from '../utils/githubImport';

export default function GithubImport({ existingUrls, onImport }) {
  const [username, setUsername] = useState('');
  const [repos, setRepos] = useState(null);
  const [picked, setPicked] = useState({});
  const [asCaseStudy, setAsCaseStudy] = useState(true);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState(null);

  const load = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const list = await fetchGithubRepos(username);
      setRepos(list);
      setPicked(
        Object.fromEntries(
          list.filter((r) => !existingUrls.includes(r.url)).map((r) => [r.url, true]),
        ),
      );
      if (list.length === 0) setStatus({ type: 'info', text: 'No public repos found for this user.' });
    } catch (err) {
      setRepos(null);
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const importPicked = async () => {
    const selected = (repos || []).filter((r) => picked[r.url]);
    if (!selected.length) return;
    setImporting(true);
    setStatus(null);
    try {
      const projects = [];
      for (const repo of selected) {
        if (asCaseStudy && repo.owner) {
          try {
            const cs = await fetchRepoCaseStudy(repo.owner, repo.name, repo.description);
            projects.push(repoToProject(repo, cs));
          } catch {
            projects.push(repoToProject(repo));
          }
        } else {
          projects.push(repoToProject(repo));
        }
      }
      onImport(projects);
      setRepos(null);
      setStatus({
        type: 'info',
        text: `Added ${projects.length} project${projects.length === 1 ? '' : 's'}${asCaseStudy ? ' as case studies' : ''}.`,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="card gh-card">
      <p className="field-label" style={{ margin: '0 0 .6rem' }}>Import from GitHub</p>
      <form className="inline-form" onSubmit={load}>
        <input
          aria-label="GitHub username"
          placeholder="GitHub username, e.g. octocat"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button className="btn small" type="submit" disabled={loading || !username.trim()}>
          {loading ? 'Loading…' : 'Fetch repos'}
        </button>
      </form>

      {status && <p className={`gh-status ${status.type}`}>{status.text}</p>}

      {repos && repos.length > 0 && (
        <>
          <label className="gh-case-opt">
            <input
              type="checkbox"
              checked={asCaseStudy}
              onChange={(e) => setAsCaseStudy(e.target.checked)}
            />
            <span>Auto-generate Problem / Stack / Result case study from README &amp; languages</span>
          </label>
          <div className="gh-list">
            {repos.map((r) => {
              const already = existingUrls.includes(r.url);
              return (
                <label key={r.url} className="gh-item">
                  <input
                    type="checkbox"
                    checked={Boolean(picked[r.url])}
                    disabled={already}
                    onChange={(e) => setPicked((p) => ({ ...p, [r.url]: e.target.checked }))}
                  />
                  <span>
                    <strong>{r.name}</strong>
                    {r.language ? ` · ${r.language}` : ''}
                    {r.stars ? ` · ★ ${r.stars}` : ''}
                    {already ? ' (already added)' : ''}
                    <br />
                    <span className="muted small">{r.description || 'No description'}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <button
            className="btn small"
            type="button"
            onClick={importPicked}
            disabled={importing || !Object.values(picked).some(Boolean)}
          >
            {importing ? 'Building case studies…' : 'Add selected to projects'}
          </button>
        </>
      )}
    </div>
  );
}
