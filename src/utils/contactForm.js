// Contact form for exported portfolios. There is no server, so submitting it opens the
// visitor's email app with a draft addressed to the portfolio owner (a mailto: link).
// The form is left out when the portfolio has no contact email.

const esc = (v = '') =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const looksLikeEmail = (v) => /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(String(v || '').trim());

export function contactFormHTML(data) {
  const to = String(data.contactEmail || '').trim();
  if (!looksLikeEmail(to)) return '';
  return `
<form class="pm-form" id="pmContact" data-to="${esc(to)}">
  <div class="pm-form-row">
    <label>Your name<input name="n" type="text" required maxlength="80" autocomplete="name"></label>
    <label>Your email (optional)<input name="e" type="email" maxlength="120" autocomplete="email"></label>
  </div>
  <label>Subject<input name="s" type="text" maxlength="120" placeholder="Hello!"></label>
  <label>Message<textarea name="m" rows="5" required maxlength="1500"></textarea></label>
  <div class="pm-form-foot">
    <button type="submit" class="pm-send">Open email draft ↗</button>
    <span class="pm-form-note" id="pmFormNote" role="status">Opens your email app with the message filled in.</span>
  </div>
</form>`;
}

export const CONTACT_CSS = `
.pm-form{display:grid;gap:.9rem;max-width:640px}
.pm-form-row{display:grid;grid-template-columns:1fr 1fr;gap:.9rem}
.pm-form label{display:grid;gap:.3rem;font-size:.8rem;font-weight:500;color:var(--muted)}
.pm-form-foot{display:flex;flex-wrap:wrap;align-items:center;gap:.9rem}
.pm-form-note{font-size:.8rem;color:var(--muted)}
@media(max-width:560px){.pm-form-row{grid-template-columns:1fr}}
`;

export const CONTACT_SCRIPT = String.raw`
(function () {
  var form = document.getElementById('pmContact');
  if (!form) return;
  var note = document.getElementById('pmFormNote');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.reportValidity && !form.reportValidity()) return;
    var f = form.elements;
    var name = f.n.value.trim(), mail = f.e.value.trim();
    var subject = f.s.value.trim() || ('Hello from ' + name);
    var body = f.m.value.trim() + '\n\n- ' + name + (mail ? ' (' + mail + ')' : '');
    var to = form.getAttribute('data-to');
    var href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    var a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noreferrer';
    document.body.appendChild(a); a.click(); a.remove();
    if (note) note.textContent = 'Draft opened. If nothing happened, email ' + to + ' directly.';
  });
})();
`;
