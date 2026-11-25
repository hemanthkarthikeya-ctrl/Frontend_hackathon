import { fillFor, findSkill, iconFor } from '../utils/skillIcons';

// Shows the brand icon for a known skill, or a labelled badge for custom skills.
export default function SkillIcon({ name, size = 16 }) {
  const icon = iconFor(name);
  if (icon) {
    return (
      <svg className="skill-ico" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path d={icon.path} fill={fillFor(icon.hex)} />
      </svg>
    );
  }
  const entry = findSkill(name);
  const abbr = (entry?.abbr || String(name || '').slice(0, 3)).toUpperCase();
  return (
    <svg className="skill-ico" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="12" y="15.5" textAnchor="middle" fontSize={abbr.length > 2 ? 7.5 : 9} fontFamily="monospace" fontWeight="700" fill="currentColor">
        {abbr}
      </text>
    </svg>
  );
}
