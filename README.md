# Portfolio Maker

Build, preview, and export a personal portfolio in the browser. No backend needed.

## Features

- **13 visual themes** with a live preview while you edit.
- **Export** as a single HTML file, or as a JSON backup you can import later.
- **Share links.** "Copy share link" puts the whole portfolio in the URL after `#`, so the
  link works without a server. Anyone with the link can open the portfolio at `/s`.
  Accounts and passwords are never included.
- **Job fit check.** Paste a job description to see which tools you already have, which
  are missing, and which bullet points need a result or a stronger opening verb.
- **Boot screen.** Every exported portfolio opens with an OS-style boot sequence built from your name and skills. Press any key (or tap) to skip it. It is not shown in the editor's live preview.
- **One cursor ring.** A dot + ring cursor follows the mouse in the app, in downloaded files and in share links. Inside the live preview the app draws the only ring.
- **Nav highlight.** The navigation highlights the section you are reading as you scroll.
- **Import from GitHub.** Enter a username to pick public repos and add them as projects.

## Run it

```bash
npm install
npm run dev      # development server
npm run build    # production build in dist/
npm run lint
```

## Notes

- Accounts are stored in the browser's localStorage in plain text. This is fine for
  learning and demos, but a real product needs a backend with hashed passwords.
- Share links get longer as the portfolio grows. Very long links can be cut off by some
  chat apps. The app warns you when a link is over 6,000 characters.
- The GitHub import uses GitHub's public API, which allows 60 requests per hour per IP.

## Phase 1 additions (inside every exported portfolio, all 13 themes)

- **Dark / light toggle + accent picker** (`themeToggle.js`): remembered in the visitor's browser.
- **Timeline** (Education + Experience merged, newest first) and **Certs** (`timelineCerts.js`).
- **Ctrl+K command palette** (`cmdPalette.js`) and **Ask my portfolio** (`askPortfolio.js`, offline keyword rules, no AI model).
- **Contact form** (`contactForm.js`): opens a mailto draft; hidden when no contact email is set.
- `portfolioWidgets.js` bundles the dock, palette, Ask panel and theme panel for `generatePortfolio.jsx`.
- Dashboard has a new **Certs** editor; data field `certifications` (`{ id, name, issuer, year, link }`).
