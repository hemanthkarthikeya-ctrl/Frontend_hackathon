import {
  siC, siCplusplus, siOpenjdk, siPython, siJavascript, siTypescript, siGo, siRust,
  siKotlin, siPhp, siSwift, siRuby, siDart, siGnubash,
  siHtml5, siCss, siReact, siNextdotjs, siVuedotjs, siAngular, siSvelte, siTailwindcss,
  siBootstrap, siRedux, siFigma,
  siNodedotjs, siExpress, siFastapi, siDjango, siFlask, siSpringboot, siGraphql,
  siPostgresql, siMysql, siMongodb, siRedis, siFirebase, siSocketdotio, siApachekafka, siPrisma,
  siGooglecloud, siVercel, siNetlify, siCloudflare, siDocker, siKubernetes, siTerraform,
  siLinux, siJenkins, siGithubactions, siSupabase,
  siGit, siGithub, siNpm, siPostman, siJira, siJest, siPytest, siVite, siChartdotjs,
  siPandas, siNumpy, siTensorflow, siPytorch, siDotnet,
} from 'simple-icons';
import { SKILL_CATALOG } from '../data/skillCatalog';

// Keys match the `icon` field in skillCatalog.js.
export const ICON_BY_KEY = {
  siC, siCplusplus, siOpenjdk, siPython, siJavascript, siTypescript, siGo, siRust,
  siKotlin, siPhp, siSwift, siRuby, siDart, siGnubash,
  siHtml5, siCss, siReact, siNextdotjs, siVuedotjs, siAngular, siSvelte, siTailwindcss,
  siBootstrap, siRedux, siFigma,
  siNodedotjs, siExpress, siFastapi, siDjango, siFlask, siSpringboot, siGraphql,
  siPostgresql, siMysql, siMongodb, siRedis, siFirebase, siSocketdotio, siApachekafka, siPrisma,
  siGooglecloud, siVercel, siNetlify, siCloudflare, siDocker, siKubernetes, siTerraform,
  siLinux, siJenkins, siGithubactions, siSupabase,
  siGit, siGithub, siNpm, siPostman, siJira, siJest, siPytest, siVite, siChartdotjs,
  siPandas, siNumpy, siTensorflow, siPytorch, siDotnet,
};

const norm = (s) => String(s || '').trim().toLowerCase();

const LOOKUP = new Map();
SKILL_CATALOG.forEach((entry) => {
  [entry.name, ...(entry.aliases || [])].forEach((key) => LOOKUP.set(norm(key), entry));
});

// Finds the catalog entry for a skill name, ignoring case and known aliases. Returns null for custom skills.
export const findSkill = (name) => LOOKUP.get(norm(name)) || null;

export const iconFor = (name) => {
  const entry = findSkill(name);
  return entry && entry.icon ? ICON_BY_KEY[entry.icon] || null : null;
};

const relativeLuminance = (hex) => {
  const n = parseInt(hex, 16);
  const channel = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};

// Brand colour on light backgrounds. Near-black brands (GitHub, Express) use the
// current text colour instead, so they stay visible on dark themes.
export const fillFor = (hex) => (relativeLuminance(hex) < 0.12 ? 'currentColor' : `#${hex}`);

const escapeXml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Markup string for the exported portfolio pages.
export function skillIconSvg(name, size = 16) {
  const icon = iconFor(name);
  if (icon) {
    return `<svg class="skill-ico" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="${icon.path}" fill="${fillFor(icon.hex)}"/></svg>`;
  }
  const entry = findSkill(name);
  const abbr = escapeXml(entry?.abbr || String(name || '').slice(0, 3).toUpperCase());
  const fontSize = abbr.length > 2 ? 7.5 : 9;
  return `<svg class="skill-ico" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="12" y="15.5" text-anchor="middle" font-size="${fontSize}" font-family="monospace" font-weight="700" fill="currentColor">${abbr}</text></svg>`;
}
