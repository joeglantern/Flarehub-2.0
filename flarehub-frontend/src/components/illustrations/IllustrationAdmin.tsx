/**
 * Admin dashboard illustration — telescope + star field + upward trend.
 * Designed for a dark green (green-900) background.
 * Uses white, light-green, and terracotta so it reads on dark.
 */
export function IllustrationAdmin() {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">

      {/* ── Stars ─────────────────────────────────────────────────── */}
      <circle cx="28"  cy="22"  r="1.5" fill="white" opacity="0.6"/>
      <circle cx="60"  cy="10"  r="1"   fill="white" opacity="0.5"/>
      <circle cx="96"  cy="18"  r="1.5" fill="white" opacity="0.7"/>
      <circle cx="140" cy="8"   r="1"   fill="white" opacity="0.5"/>
      <circle cx="172" cy="22"  r="1.5" fill="white" opacity="0.6"/>
      <circle cx="200" cy="14"  r="1"   fill="white" opacity="0.4"/>
      <circle cx="48"  cy="44"  r="1"   fill="white" opacity="0.4"/>
      <circle cx="188" cy="42"  r="1.5" fill="white" opacity="0.5"/>
      <circle cx="116" cy="36"  r="1"   fill="white" opacity="0.45"/>

      {/* ── Telescope body ────────────────────────────────────────── */}
      {/* Main tube */}
      <rect x="70" y="68" width="90" height="18" rx="9"
        fill="white" opacity="0.15" transform="rotate(-28 70 68)"/>
      <rect x="72" y="70" width="86" height="14" rx="7"
        fill="white" opacity="0.2"  transform="rotate(-28 72 70)"/>

      {/* Eyepiece (right end) */}
      <ellipse cx="148" cy="60" rx="8" ry="6"
        fill="white" opacity="0.3" transform="rotate(-28 148 60)"/>
      <ellipse cx="148" cy="60" rx="5" ry="4"
        fill="#d0ecdb" opacity="0.5" transform="rotate(-28 148 60)"/>

      {/* Lens (left end) */}
      <ellipse cx="82"  cy="90" rx="12" ry="8"
        fill="white" opacity="0.25" transform="rotate(-28 82 90)"/>
      <circle  cx="82"  cy="92" r="5"
        fill="#1d6f42" opacity="0.8"/>

      {/* Tripod */}
      <line x1="110" y1="100" x2="90"  y2="140" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.25"/>
      <line x1="110" y1="100" x2="130" y2="140" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.25"/>
      <line x1="90"  y1="134" x2="130" y2="134" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>

      {/* ── Trend line (top-right area) ───────────────────────────── */}
      <polyline
        points="156,108 168,92 180,98 192,72 204,58"
        stroke="#c4522a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
        opacity="0.8"
      />
      {/* Data dots */}
      {[[156,108],[168,92],[180,98],[192,72],[204,58]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#c4522a" opacity="0.9"/>
      ))}

      {/* ── Horizon ground line ───────────────────────────────────── */}
      <path
        d="M0 148 Q40 136 80 144 Q120 152 160 140 Q190 132 220 142 L220 160 L0 160 Z"
        fill="white" opacity="0.05"
      />
    </svg>
  )
}
