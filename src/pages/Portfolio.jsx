import { useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadPortfolio } from '../utils/storage';
import { generatePortfolioHTML } from '../utils/generatePortfolio';
import { shareCurrentPortfolio } from '../utils/shareLink';

// Full-screen preview. It shows the exact page that "Download HTML" produces,
// including the boot screen, cursor and nav highlight.
export default function Portfolio() {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const frameRef = useRef(null);
  const data = useMemo(() => loadPortfolio(user), [user]);
  const html = useMemo(() => (data ? generatePortfolioHTML(data) : ''), [data]);

  if (!data) return <Navigate to="/dashboard" replace />;

  const downloadHtml = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const slug = (data.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug || 'my'}-portfolio.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const share = async () => {
    try {
      setNote(await shareCurrentPortfolio(data));
    } catch (err) {
      setNote('Could not create share link: ' + err.message);
    }
    setTimeout(() => setNote(''), 3500);
  };

  const printPage = () => frameRef.current?.contentWindow?.print();

  return (
    <div className="shared">
      <div className="shared-bar">
        <Link className="btn secondary small" to="/dashboard">← Back to editor</Link>
        <div className="portfolio-bar-actions">
          {note && <span className="bar-note">{note}</span>}
          <button type="button" className="btn secondary small" onClick={share}>Copy share link</button>
          <button type="button" className="btn secondary small" onClick={printPage}>Print / PDF</button>
          <button type="button" className="btn small" onClick={downloadHtml}>Download HTML</button>
        </div>
      </div>
      <iframe
        ref={frameRef}
        title="Portfolio preview"
        className="shared-frame"
        srcDoc={html}
        onLoad={(e) => e.currentTarget.focus()}
        sandbox="allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
