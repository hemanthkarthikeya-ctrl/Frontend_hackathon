// Offline QR Card generator: builds a printable HTML networking card with a QR code.
// Note: long #fragment share links produce dense QR codes; Phase 4 short links make them compact.

const esc = (v = '') =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Minimal pure-JS QR matrix generator (Byte mode, ECC Level L, Versions 1..10 up to ~271 bytes)
// For longer URLs (>271 bytes), we fall back to a clean visual warning + origin URL or short note.
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]);

function rsGenPoly(deg) {
  let p = [1];
  for (let i = 0; i < deg; i++) {
    const next = new Array(p.length + 1).fill(0);
    for (let j = 0; j < p.length; j++) {
      next[j] ^= p[j];
      next[j + 1] ^= gfMul(p[j], GF_EXP[i]);
    }
    p = next;
  }
  return p;
}

function rsRemainder(data, ecLen) {
  const gen = rsGenPoly(ecLen);
  const res = new Array(data.length + ecLen).fill(0);
  for (let i = 0; i < data.length; i++) res[i] = data[i];
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) res[i + j] ^= gfMul(gen[j], coef);
    }
  }
  return res.slice(data.length);
}

// Version 1..10 (ECC-L): [totalDataBytes, ecBytesPerBlock, blocks]
const VER_SPEC = [
  null,
  [19, 7, 1], [34, 10, 1], [55, 15, 1], [80, 20, 1], [108, 26, 1],
  [136, 18, 2], [156, 20, 2], [194, 24, 2], [232, 30, 2], [274, 18, 4],
];

const ALIGN_POS = [
  [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
];

function encodeQRBytes(text) {
  const bytes = new TextEncoder().encode(text);
  let ver = 1;
  while (ver <= 10 && bytes.length + (ver < 10 ? 2 : 3) > VER_SPEC[ver][0]) ver++;
  if (ver > 10) return null;

  const [dataCap, ecPerBlock, blocks] = VER_SPEC[ver];
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, ver < 10 ? 8 : 16);
  for (const b of bytes) pushBits(b, 8);
  for (let i = 0; i < 4 && bits.length < dataCap * 8; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    dataBytes.push(v);
  }
  const pad = [0xec, 0x11];
  for (let i = 0; dataBytes.length < dataCap; i++) dataBytes.push(pad[i % 2]);

  const baseLen = Math.floor(dataCap / blocks);
  const extra = dataCap % blocks;
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let b = 0; b < blocks; b++) {
    const len = baseLen + (b >= blocks - extra ? 1 : 0);
    const slice = dataBytes.slice(offset, offset + len);
    offset += len;
    dataBlocks.push(slice);
    ecBlocks.push(rsRemainder(slice, ecPerBlock));
  }

  const finalBytes = [];
  const maxD = baseLen + (extra > 0 ? 1 : 0);
  for (let i = 0; i < maxD; i++) {
    for (let b = 0; b < blocks; b++) if (i < dataBlocks[b].length) finalBytes.push(dataBlocks[b][i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < blocks; b++) finalBytes.push(ecBlocks[b][i]);
  }

  const size = ver * 4 + 17;
  const mat = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  const setMod = (r, c, val, res = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      mat[r][c] = val;
      if (res) reserved[r][c] = true;
    }
  };

  const drawFinder = (r0, c0) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const in7 = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const on = in7 && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        setMod(r0 + r, c0 + c, on ? 1 : 0, true);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    setMod(6, i, i % 2 === 0 ? 1 : 0, true);
    setMod(i, 6, i % 2 === 0 ? 1 : 0, true);
  }
  setMod(size - 8, 8, 1, true);

  const ap = ALIGN_POS[ver];
  for (const r of ap) {
    for (const c of ap) {
      if (reserved[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const on = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          setMod(r + dr, c + dc, on ? 1 : 0, true);
        }
      }
    }
  }

  // Reserve format info
  for (let i = 0; i < 9; i++) {
    if (i !== 6) { reserved[8][i] = true; reserved[i][8] = true; }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  // Place data bits (mask 0: (r + c) % 2 === 0)
  const bitStream = [];
  for (const byte of finalBytes) for (let i = 7; i >= 0; i--) bitStream.push((byte >> i) & 1);
  let bi = 0;
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let step = 0; step < size; step++) {
      const r = up ? size - 1 - step : step;
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (reserved[r][c]) continue;
        const bit = bi < bitStream.length ? bitStream[bi++] : 0;
        mat[r][c] = bit ^ ((r + c) % 2 === 0 ? 1 : 0);
      }
    }
    up = !up;
  }

  // Format info for ECC-L (01) + Mask 0 (000) -> 15-bit BCH: 111011111000100
  const fmt = '111011111000100';
  for (let i = 0; i < 6; i++) setMod(8, i, Number(fmt[i]), true);
  setMod(8, 7, Number(fmt[6]), true);
  setMod(8, 8, Number(fmt[7]), true);
  setMod(7, 8, Number(fmt[8]), true);
  for (let i = 9; i < 15; i++) setMod(14 - i, 8, Number(fmt[i]), true);
  for (let i = 0; i < 8; i++) setMod(8, size - 1 - i, Number(fmt[14 - i]), true);
  for (let i = 0; i < 7; i++) setMod(size - 1 - i, 8, Number(fmt[i]), true);

  return mat;
}

export function buildQrSvg(url) {
  const mat = encodeQRBytes(url);
  if (!mat) return null;
  const n = mat.length;
  const pad = 2;
  const total = n + pad * 2;
  let rects = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (mat[r][c]) rects += `<rect x="${c + pad}" y="${r + pad}" width="1" height="1"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="180" height="180" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#ffffff"/><g fill="#111827">${rects}</g></svg>`;
}

export function generateQrCardHTML(data, url) {
  const targetUrl = url || data.website || data.github || 'https://example.com';
  const svg = buildQrSvg(targetUrl);
  const name = esc(data.name || 'Your Name');
  const tagline = esc(data.tagline || 'Portfolio');
  const mode = esc(data.audienceMode && data.audienceMode !== 'default' ? `${data.audienceMode.toUpperCase()} VIEW` : 'PORTFOLIO');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${name} — QR Card</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f17;font-family:Inter,system-ui,sans-serif;padding:1.5rem}
  .card{width:340px;background:#fff;color:#111827;border-radius:20px;padding:1.75rem;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.4)}
  .badge{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.12em;padding:4px 10px;border-radius:999px;background:#eff6ff;color:#1d4ed8;margin-bottom:12px}
  h1{font-size:22px;margin:0 0 6px}
  p{font-size:13px;color:#4b5563;margin:0 0 16px}
  .qr-box{display:inline-block;padding:12px;border:1px solid #e5e7eb;border-radius:14px;background:#fff}
  .warn{font-size:12px;color:#92400e;background:#fef3c7;padding:10px;border-radius:10px;margin:0}
  .url{font-size:11px;color:#6b7280;word-break:break-all;margin-top:12px}
  .btn{margin-top:16px;padding:8px 18px;border-radius:999px;border:0;background:#111827;color:#fff;font-size:12px;font-weight:600;cursor:pointer}
  @media print{.btn{display:none}body{background:#fff}}
</style>
</head>
<body>
  <div class="card">
    <span class="badge">${mode}</span>
    <h1>${name}</h1>
    <p>${tagline}</p>
    ${svg
      ? `<div class="qr-box">${svg}</div>`
      : `<p class="warn">Share link is ${targetUrl.length} characters—too long for a scannable QR code without Phase 4 short links. Enter a short hosted URL (e.g. your Vercel/GitHub Pages link) to generate a crisp QR code.</p>`}
    <div class="url">${esc(targetUrl.slice(0, 120))}${targetUrl.length > 120 ? '…' : ''}</div>
    <button class="btn" onclick="window.print()">Print QR Card</button>
  </div>
</body>
</html>`;
}
