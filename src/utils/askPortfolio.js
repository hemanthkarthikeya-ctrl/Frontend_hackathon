// "Ask my portfolio": a small panel where a visitor types a question and gets an answer
// built from the portfolio data. It works offline with plain keyword rules (no AI model, no API).
// Runs inside exported pages and reads the data from the #pmData JSON block.

export const ASK_PANEL = `
<div class="pm-panel pm-ask" id="pmAsk" role="dialog" aria-label="Ask my portfolio" hidden>
  <div class="pm-ph"><strong>Ask my portfolio</strong><button type="button" class="pm-x" data-pm-close aria-label="Close">×</button></div>
  <div class="pm-log" id="pmAskLog" aria-live="polite"></div>
  <div class="pm-chips" id="pmAskChips"></div>
  <form class="pm-askform" id="pmAskForm" autocomplete="off">
    <input id="pmAskInput" type="text" maxlength="200" placeholder="e.g. what React projects have you built?" aria-label="Your question">
    <button type="submit" class="pm-send" aria-label="Ask">Ask</button>
  </form>
</div>`;

export const ASK_CSS = `
.pm-log{flex:1;overflow:auto;padding:.9rem 1rem;display:flex;flex-direction:column;gap:.7rem;min-height:130px}
.pm-msg{max-width:92%;padding:.6rem .85rem;border-radius:12px;font-size:.88rem;line-height:1.5;word-break:break-word}
.pm-msg.q{align-self:flex-end;background:var(--pm-ac);color:var(--on-accent,#fff)}
.pm-msg.a{align-self:flex-start;background:var(--surface,rgba(128,128,128,.12));border:1px solid var(--line,rgba(128,128,128,.25))}
.pm-msg p{margin:0}
.pm-msg ul{margin:.45rem 0 0;padding:0;list-style:none;display:grid;gap:.4rem}
.pm-msg li{padding:.4rem .55rem;border-radius:8px;background:color-mix(in srgb,var(--ink,#888) 6%,transparent)}
.pm-msg li b{display:block;font-weight:600}
.pm-msg li span{display:block;color:var(--muted);font-size:.8rem}
.pm-msg a,.pm-msg button.pm-jump{color:var(--pm-ac);font-weight:600;background:none;border:0;padding:0;font:inherit;font-weight:600;cursor:pointer;text-decoration:underline}
.pm-chips{display:flex;flex-wrap:wrap;gap:.4rem;padding:0 1rem .7rem}
.pm-chips button{font:inherit;font-size:.76rem;padding:.3rem .65rem;border-radius:999px;border:1px solid var(--line-2,rgba(128,128,128,.4));background:transparent;color:var(--ink2,var(--ink));cursor:pointer}
.pm-chips button:hover{border-color:var(--pm-ac);color:var(--pm-ac)}
.pm-askform{display:flex;gap:.5rem;padding:.7rem 1rem 1rem;border-top:1px solid var(--line,rgba(128,128,128,.25))}
.pm-askform input{flex:1;min-width:0}
`;

export const ASK_SCRIPT = String.raw`
(function () {
  var panel = document.getElementById('pmAsk');
  var dataEl = document.getElementById('pmData');
  if (!panel || !dataEl) return;
  var D;
  try { D = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var log = document.getElementById('pmAskLog');
  var chips = document.getElementById('pmAskChips');
  var form = document.getElementById('pmAskForm');
  var input = document.getElementById('pmAskInput');

  var first = String(D.name || '').trim().split(/\s+/)[0] || 'This person';
  var STOP = {};
  'a an the is are was were be been do does did has have had can could will would of in on at to for from with by and or but not no yes what which who whom whose where when why how any all some me my your you he she they them their his her him it its this that these those about tell please show list give there here also just'.split(' ')
    .forEach(function (w) { STOP[w] = 1; });

  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function squash(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9+#]/g, ''); }
  function stem(w) { return w.length > 3 ? w.replace(/(ing|ed|es|s)$/, '') : w; }
  function words(s) { return norm(s).split(' ').filter(function (w) { return w && !STOP[w]; }).map(stem); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function list(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  // Technology names the visitor may mention: skills plus every project tag.
  var tech = {};
  function addTech(t) {
    var key = squash(t);
    if (key.length < 1) return;
    tech[key] = t;
    var bare = key.replace(/js$/, '');
    if (bare.length > 2 && bare !== key) tech[bare] = t;
  }
  (D.skills || []).forEach(addTech);
  (D.projects || []).forEach(function (p) { (p.tags || []).forEach(addTech); });

  function techIn(q) {
    var toks = norm(q).split(' ').filter(Boolean);
    var keys = {};
    toks.forEach(function (t, i) {
      keys[squash(t)] = 1;
      if (toks[i + 1]) keys[squash(t + toks[i + 1])] = 1;
      if (toks[i + 2]) keys[squash(t + toks[i + 1] + toks[i + 2])] = 1;
    });
    var found = [];
    Object.keys(tech).forEach(function (k) {
      if (keys[k] && found.indexOf(tech[k]) < 0) found.push(tech[k]);
    });
    return found;
  }
  function mentions(text, t) {
    var k = squash(t), bare = k.replace(/js$/, '');
    var toks = norm(text).split(' ').filter(Boolean), set = {};
    toks.forEach(function (w, i) {
      set[squash(w)] = 1;
      if (toks[i + 1]) set[squash(w + toks[i + 1])] = 1;
    });
    return !!set[k] || (bare.length > 2 && !!set[bare]);
  }
  function projectHas(p, t) {
    return (p.tags || []).some(function (x) { return squash(x) === squash(t) || squash(x).replace(/js$/, '') === squash(t).replace(/js$/, ''); }) ||
      mentions(p.title + ' ' + p.desc, t);
  }

  var INTENTS = [
    ['projects', /\b(projects?|built|build|made|apps?|applications?|created|developed|shipped|portfolio work)\b/g],
    ['skills', /\b(skills?|stack|tech|technologies|languages?|tools?|know|knows|familiar|proficient|expert|frameworks?)\b/g],
    ['experience', /\b(experience|intern|internships?|jobs?|work|worked|working|role|roles|company|companies|employment|club)\b/g],
    ['education', /\b(education|study|studies|studying|college|university|degree|cgpa|gpa|grades?|school|graduat\w*|student)\b/g],
    ['certs', /\b(certs?|certificates?|certified|certifications?|credentials?|courses?)\b/g],
    ['contact', /\b(contact|email|mail|reach|hire|hiring|linkedin|github|resume|cv|website|connect|message)\b/g],
    ['location', /\b(where|location|located|based|live|lives|city|country|from)\b/g],
    ['availability', /\b(available|availability|open to|looking for|hireable|opportunit\w*)\b/g],
    ['about', /\b(who|about|bio|introduce|yourself|summary)\b/g]
  ];
  function intentOf(q) {
    var s = norm(q), best = null, top = 0;
    if (/\b(open to|available|availability|looking for|hireable)\b/.test(s)) return 'availability';
    INTENTS.forEach(function (it) {
      var m = s.match(it[1]);
      if (m && m.length > top) { top = m.length; best = it[0]; }
    });
    return best;
  }

  function sectionId(cands) {
    for (var i = 0; i < cands.length; i++) if (document.getElementById(cands[i])) return cands[i];
    return '';
  }

  function chunks() {
    var out = [];
    if (D.bio) out.push({ title: 'About ' + first, sub: D.bio, text: D.bio + ' ' + (D.tagline || ''), sec: ['about', 'top'] });
    (D.projects || []).forEach(function (p) {
      out.push({ title: p.title, sub: (p.role ? p.role + ' · ' : '') + (p.tags || []).join(', '), text: [p.title, p.role, (p.tags || []).join(' '), p.desc].join(' '), sec: ['projects'] });
    });
    (D.experience || []).forEach(function (e) {
      out.push({ title: e.title, sub: [e.org, e.date].filter(Boolean).join(' · '), text: [e.title, e.org, e.desc].join(' '), sec: ['timeline', 'experience'] });
    });
    (D.education || []).forEach(function (e) {
      out.push({ title: e.title, sub: [e.org, e.date].filter(Boolean).join(' · '), text: [e.title, e.org, e.desc].join(' '), sec: ['timeline', 'education'] });
    });
    (D.certs || []).forEach(function (c) {
      out.push({ title: c.name, sub: [c.issuer, c.year].filter(Boolean).join(' · '), text: [c.name, c.issuer].join(' '), sec: ['certs'] });
    });
    return out;
  }

  function answer(q) {
    var intent = intentOf(q);
    var t = techIn(q);
    var r = { text: '', items: [], jump: '', links: [] };

    if (intent === 'projects' || (!intent && t.length && (D.projects || []).length)) {
      var ps = (D.projects || []).filter(function (p) { return !t.length || t.some(function (x) { return projectHas(p, x); }); });
      if (!(D.projects || []).length) { r.text = first + ' has not added any projects yet.'; return r; }
      if (!ps.length) {
        r.text = 'I did not find a project that uses ' + list(t) + '.';
        r.jump = sectionId(['projects']);
        return r;
      }
      r.text = first + ' has ' + (t.length ? plural(ps.length, 'project') + ' with ' + list(t) : 'built ' + plural(ps.length, 'project')) + ':';
      r.items = ps.slice(0, 8).map(function (p) { return { title: p.title, sub: (p.role ? p.role + ' · ' : '') + (p.tags || []).join(', '), href: p.link || p.repo }; });
      r.jump = sectionId(['projects']);
      return r;
    }
    if (intent === 'skills') {
      if (t.length) {
        var lines = t.map(function (x) {
          var has = (D.skills || []).some(function (s) { return squash(s) === squash(x); });
          var used = (D.projects || []).filter(function (p) { return projectHas(p, x); });
          if (has && used.length) return x + ': listed as a skill and used in ' + plural(used.length, 'project') + ' (' + used.slice(0, 3).map(function (p) { return p.title; }).join(', ') + ').';
          if (has) return x + ': listed as a skill.';
          if (used.length) return x + ': used in ' + used.map(function (p) { return p.title; }).join(', ') + '.';
          return x + ': not listed.';
        });
        r.text = lines.join(' ');
        r.jump = sectionId(['stack', 'skills']);
        return r;
      }
      if (!(D.skills || []).length) { r.text = first + ' has not added skills yet.'; return r; }
      r.text = first + ' works with ' + list(D.skills) + '.';
      r.jump = sectionId(['stack', 'skills']);
      return r;
    }
    if (intent === 'experience') {
      var ex = D.experience || [];
      if (!ex.length) { r.text = 'No work experience is listed yet.'; return r; }
      r.text = plural(ex.length, 'role') + ' listed:';
      r.items = ex.slice(0, 8).map(function (e) { return { title: e.title, sub: [e.org, e.date].filter(Boolean).join(' · ') }; });
      r.jump = sectionId(['timeline', 'experience']);
      return r;
    }
    if (intent === 'education') {
      var ed = D.education || [];
      if (!ed.length) { r.text = 'No education is listed yet.'; return r; }
      r.text = 'Education:';
      r.items = ed.slice(0, 6).map(function (e) { return { title: e.title, sub: [e.org, e.date, e.desc].filter(Boolean).join(' · ') }; });
      r.jump = sectionId(['timeline', 'education']);
      return r;
    }
    if (intent === 'certs') {
      var cs = D.certs || [];
      if (!cs.length) { r.text = 'No certificates are listed yet.'; return r; }
      r.text = plural(cs.length, 'certificate') + ':';
      r.items = cs.slice(0, 8).map(function (c) { return { title: c.name, sub: [c.issuer, c.year].filter(Boolean).join(' · '), href: c.link }; });
      r.jump = sectionId(['certs']);
      return r;
    }
    if (intent === 'contact') {
      var L = [['Email', D.email ? 'mailto:' + D.email : ''], ['GitHub', D.github], ['LinkedIn', D.linkedin], ['Website', D.website], ['Resume', D.resume]]
        .filter(function (x) { return x[1]; });
      if (!L.length) { r.text = 'No contact links are listed.'; return r; }
      r.text = 'You can reach ' + first + ' here:';
      r.links = L;
      r.jump = sectionId(['contact']);
      return r;
    }
    if (intent === 'location') {
      r.text = D.location ? first + ' is based in ' + D.location + '.' : 'No location is listed.';
      return r;
    }
    if (intent === 'availability') {
      r.text = D.availability ? D.availability + '.' : 'No availability is listed.';
      if (D.email) r.links = [['Email', 'mailto:' + D.email]];
      return r;
    }
    if (intent === 'about') {
      r.text = [D.name, D.tagline, D.bio].filter(Boolean).join(' - ') || 'Nothing about this person has been added yet.';
      return r;
    }

    // No clear topic: score every piece of the portfolio by shared words.
    var qw = words(q);
    if (qw.length) {
      var scored = chunks().map(function (c) {
        var cw = words(c.text);
        var s = 0;
        qw.forEach(function (w) { if (cw.indexOf(w) >= 0) s++; });
        return { c: c, s: s };
      }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3);
      if (scored.length) {
        r.text = 'Closest matches:';
        r.items = scored.map(function (x) { return { title: x.c.title, sub: x.c.sub, jump: sectionId(x.c.sec) }; });
        return r;
      }
    }
    r.text = 'I could not find that in this portfolio. Try asking about projects, skills, experience, education, certificates or how to get in touch.';
    return r;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function jumpTo(id) {
    var s = document.getElementById(id);
    if (!s) return;
    if (window.__pmClose) window.__pmClose();
    s.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function link(label, href) {
    var a = el('a', '', label);
    a.href = href; a.target = '_blank'; a.rel = 'noreferrer';
    return a;
  }

  function addQ(text) { log.appendChild(el('div', 'pm-msg q', text)); }
  function addA(r) {
    var box = el('div', 'pm-msg a');
    box.appendChild(el('p', '', r.text));
    if (r.items.length) {
      var ul = el('ul');
      r.items.forEach(function (it) {
        var li = el('li');
        var b = el('b'); b.textContent = it.title; li.appendChild(b);
        if (it.sub) li.appendChild(el('span', '', it.sub));
        if (it.href && /^(https?:\/\/|mailto:)/i.test(it.href)) { var a = link('Open link', it.href); li.appendChild(a); }
        else if (it.jump) {
          var j = el('button', 'pm-jump', 'Go to section'); j.type = 'button';
          j.addEventListener('click', function () { jumpTo(it.jump); });
          li.appendChild(j);
        }
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    if (r.links.length) {
      var p = el('p'); p.style.marginTop = '.45rem';
      r.links.forEach(function (l, i) { if (i) p.appendChild(document.createTextNode(' · ')); p.appendChild(link(l[0], l[1])); });
      box.appendChild(p);
    }
    if (r.jump) {
      var p2 = el('p'); p2.style.marginTop = '.45rem';
      var jb = el('button', 'pm-jump', 'Go to section'); jb.type = 'button';
      jb.addEventListener('click', function () { jumpTo(r.jump); });
      p2.appendChild(jb); box.appendChild(p2);
    }
    log.appendChild(box);
    log.scrollTop = log.scrollHeight;
  }

  function ask(q) {
    q = String(q || '').trim().slice(0, 200);
    if (!q) return;
    addQ(q);
    addA(answer(q));
    input.value = '';
  }

  var suggestions = [];
  if ((D.projects || []).length) suggestions.push('What projects has ' + first + ' built?');
  if ((D.skills || []).length) suggestions.push('Does ' + first + ' know ' + D.skills[0] + '?');
  if ((D.experience || []).length) suggestions.push('What experience does ' + first + ' have?');
  if (D.email || D.linkedin || D.github) suggestions.push('How can I contact ' + first + '?');
  suggestions.slice(0, 4).forEach(function (s) {
    var b = el('button', '', s); b.type = 'button';
    b.addEventListener('click', function () { ask(s); });
    chips.appendChild(b);
  });

  addA({ text: 'Hi! Ask me anything about ' + first + "'s work. I answer from what is on this page.", items: [], links: [], jump: '' });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  window.__pmAsk = { ask: ask };
})();
`;
