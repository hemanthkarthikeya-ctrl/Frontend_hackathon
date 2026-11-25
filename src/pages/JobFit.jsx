import { useMemo, useState } from 'react';
import { analyzeFit, checkBullets } from '../utils/fitCheck';
import { extractTailorFromJD } from '../utils/goalAdapter';

const STATUS_LABEL = {
  met: 'Met',
  partial: 'Partly met',
  missing: 'Missing',
  unknown: 'Can’t check',
};

export default function JobFit({ data, onTailor, onResetTailor }) {
  const [jobTitle, setJobTitle] = useState(data.tailor?.title || '');
  const [draft, setDraft] = useState('');
  const [submitted, setSubmitted] = useState('');

  const result = useMemo(
    () => (submitted ? analyzeFit(data, submitted) : null),
    [data, submitted],
  );
  const bullets = useMemo(() => checkBullets(data), [data]);
  const strongCount = bullets.filter((b) => b.ok).length;

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(draft);
  };

  const nonSkillCriteria = result ? result.criteria.filter((c) => c.group !== 'skills') : [];

  return (
    <div className="section">
      <header className="section-head">
        <span className="eyebrow">Section 06</span>
        <h2>Job fit</h2>
        <p className="muted">
          Paste a job description to see how well your portfolio matches it. Required items count more than nice-to-have items, and anything the portfolio cannot show is left out of the score.
        </p>
      </header>

      <form className="card" onSubmit={onSubmit} style={{ marginBottom: '1.5rem' }}>
        <label className="field">
          <span className="field-label">Job description</span>
          <textarea
            rows={8}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste the full job posting here, including the requirements and preferred sections..."
          />
        </label>
        <label className="field" style={{ marginTop: '.85rem' }}>
          <span className="field-label">Target role label (optional, used when tailoring)</span>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Frontend Intern @ NovaStack"
          />
        </label>
        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
          <button className="btn" type="submit" disabled={!draft.trim()}>Check fit</button>
          {draft.trim() && onTailor && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => onTailor(extractTailorFromJD(data, draft, jobTitle))}
            >
              ✦ Tailor portfolio to this JD
            </button>
          )}
          {data.tailor && onResetTailor && (
            <button type="button" className="btn danger small" onClick={onResetTailor}>
              Reset tailoring ({data.tailor.title})
            </button>
          )}
        </div>
      </form>

      {result && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            {result.score === null ? (
              <p className="muted" style={{ margin: 0 }}>
                We could not find any tools or requirements in this text. Paste the full job description, including the requirements section.
              </p>
            ) : (
              <>
                <div className="fit-score">
                  <strong>{result.score}%</strong>
                  <span>overall match, weighted by how important each item is to the job</span>
                </div>
                <div className="fit-track">
                  <div className="fit-fill" style={{ width: `${result.score}%` }} />
                </div>

                {nonSkillCriteria.length > 0 && (
                  <div className="fit-group">
                    <h3>Qualifications</h3>
                    <ul className="criteria-list">
                      {nonSkillCriteria.map((c) => (
                        <li key={c.id} className={`criterion ${c.status}`}>
                          <div className="criterion-top">
                            <span className="criterion-label">
                              {c.label}
                              {c.weight < 1 && <span className="tag-soft">nice to have</span>}
                            </span>
                            <span className={`status-pill ${c.status}`}>{STATUS_LABEL[c.status]}</span>
                          </div>
                          <small>{c.note}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.listed.length > 0 && (
                  <div className="fit-group">
                    <h3>In your Skills list</h3>
                    <div className="chips">
                      {result.listed.map((t) => (
                        <span key={t.name} className="chip have">
                          {t.name}{!t.required && <span className="tag-soft">nice to have</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.mentioned.length > 0 && (
                  <div className="fit-group">
                    <h3>Mentioned in projects or experience</h3>
                    <div className="chips">
                      {result.mentioned.map((t) => (
                        <span key={t.name} className="chip evidence">
                          {t.name}{!t.required && <span className="tag-soft">nice to have</span>}
                        </span>
                      ))}
                    </div>
                    <p className="muted">Add these to your Skills list so recruiters see them at a glance.</p>
                  </div>
                )}

                {result.missing.length > 0 && (
                  <div className="fit-group">
                    <h3>Missing from your portfolio</h3>
                    <div className="chips">
                      {result.missing.map((t) => (
                        <span key={t.name} className="chip missing">
                          {t.name}{!t.required && <span className="tag-soft">nice to have</span>}
                        </span>
                      ))}
                    </div>
                    <p className="muted">
                      If you have used these, add them to Skills or mention them in a project. Only list what you can talk about in an interview.
                    </p>
                  </div>
                )}

                {result.notes.map((n) => (
                  <p key={n} className="fit-note">{n}</p>
                ))}
              </>
            )}
          </div>
        </>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--sans)', fontSize: '.95rem', marginBottom: '.25rem' }}>
          Bullet check
        </h3>
        <p className="muted small" style={{ margin: 0 }}>
          {bullets.length === 0
            ? 'Add experience or project descriptions to check them.'
            : `${strongCount} of ${bullets.length} bullets are strong. A strong bullet starts with an action verb and includes a result.`}
        </p>
      </div>

      {bullets.length > 0 && (
        <ul className="bullet-list">
          {bullets.map((b, i) => (
            <li key={i} className={`bullet-item ${b.ok ? 'ok' : 'fix'}`}>
              <p>{b.text}</p>
              {b.ok ? (
                <small>Strong bullet.</small>
              ) : (
                <small className="fix-note">{b.issues.join(' ')}</small>
              )}
              <small>From: {b.source}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
