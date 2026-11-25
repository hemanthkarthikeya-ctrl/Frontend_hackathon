import { normalizePortfolio } from './normalize';

// Share links put the whole portfolio in the URL fragment (after #).
// Browsers never send the fragment to a server, so no backend is needed.
// Format: /s#v1.<z|r>.<base64url payload>
//   z = deflate-raw compressed JSON (smaller links)
//   r = plain JSON (fallback for browsers without CompressionStream)

const canCompress =
  typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

const toBase64Url = (bytes) => {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (str) => {
  const binary = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};

const transform = async (bytes, stream) =>
  new Uint8Array(
    await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer(),
  );

export async function buildShareLink(data) {
  // Only the portfolio fields are serialized. Accounts and passwords are never included.
  const json = JSON.stringify(normalizePortfolio(data));
  let bytes = new TextEncoder().encode(json);
  let tag = 'r';
  if (canCompress) {
    bytes = await transform(bytes, new CompressionStream('deflate-raw'));
    tag = 'z';
  }
  const url = new URL(`${import.meta.env.BASE_URL}s`, window.location.origin);
  url.hash = `v1.${tag}.${toBase64Url(bytes)}`;
  return url.toString();
}

// Returns a normalized portfolio, or null if the fragment is missing, broken, or too large.
export async function readShareHash(hash) {
  const match = /^#v1\.([zr])\.([A-Za-z0-9_-]+)$/.exec(hash || '');
  if (!match || match[2].length > 300000) return null;
  try {
    let bytes = fromBase64Url(match[2]);
    if (match[1] === 'z') {
      bytes = await transform(bytes, new DecompressionStream('deflate-raw'));
    }
    return normalizePortfolio(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

// Builds the link, copies it, and returns a message for the user.
export async function shareCurrentPortfolio(data) {
  const link = await buildShareLink(data);
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    window.prompt('Copy your share link:', link);
    return 'Share link ready';
  }
  return link.length > 6000
    ? `Link copied (${link.length} characters). Some apps cut off very long links.`
    : 'Share link copied';
}
