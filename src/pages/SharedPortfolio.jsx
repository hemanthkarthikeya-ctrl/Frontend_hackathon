import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { readShareHash } from '../utils/shareLink';
import { generatePortfolioHTML } from '../utils/generatePortfolio';

export default function SharedPortfolio() {
  const [view, setView] = useState({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    readShareHash(window.location.hash).then((data) => {
      if (!alive) return;
      setView(data ? { status: 'ok', html: generatePortfolioHTML(data) } : { status: 'bad' });
    });
    return () => {
      alive = false;
    };
  }, []);

  if (view.status === 'loading') {
    return <div className="shared-msg muted">Loading portfolio…</div>;
  }

  if (view.status === 'bad') {
    return (
      <div className="shared-msg">
        <h1>This link is broken</h1>
        <p className="muted">It may have been cut off when it was copied. Ask for the link again.</p>
        <div>
          <Link className="btn" to="/">Make your own portfolio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shared">
      <div className="shared-bar">
        <span className="muted small">Shared with Portfolio Maker</span>
        <Link className="btn secondary small" to="/">Make your own →</Link>
      </div>
      <iframe
        title="Shared portfolio"
        className="shared-frame"
        srcDoc={view.html}
        onLoad={(e) => e.currentTarget.focus()}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
