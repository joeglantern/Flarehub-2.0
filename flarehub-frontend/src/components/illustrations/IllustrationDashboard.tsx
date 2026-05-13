/**
 * Dashboard welcome banner illustration.
 * A plant growing up from rolling wave-hills with a sunrise arc behind it.
 * Designed to sit on a green-50 background — no circle backdrop.
 */
export function IllustrationDashboard() {
  return (
    <svg viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">

      {/* ── Sunrise arc ───────────────────────────────────────────── */}
      <circle cx="110" cy="160" r="72" fill="#f9ddd1" opacity="0.35"/>
      <circle cx="110" cy="160" r="52" fill="#c4522a"  opacity="0.12"/>

      {/* Sun glow rays — thin dashed-ish lines radiating up */}
      {[-60,-40,-20,0,20,40,60].map((deg, i) => {
        const rad = ((deg - 90) * Math.PI) / 180
        const x1  = 110 + 56 * Math.cos(rad)
        const y1  = 160 + 56 * Math.sin(rad)
        const x2  = 110 + 76 * Math.cos(rad)
        const y2  = 160 + 76 * Math.sin(rad)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#c4522a" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
        )
      })}

      {/* ── Back rolling hill ─────────────────────────────────────── */}
      <path
        d="M0 130 Q30 108 60 122 Q90 136 120 116 Q150 96 180 114 Q200 126 220 118 L220 180 L0 180 Z"
        fill="#d0ecdb"
        opacity="0.7"
      />

      {/* ── Front wave / ground ───────────────────────────────────── */}
      <path
        d="M0 148 Q28 132 58 144 Q88 156 118 140 Q148 124 178 142 Q200 154 220 146 L220 180 L0 180 Z"
        fill="#1d6f42"
        opacity="0.55"
      />

      {/* Foam dots on front wave */}
      <circle cx="42"  cy="143" r="2.5" fill="white" opacity="0.75"/>
      <circle cx="100" cy="138" r="2"   fill="white" opacity="0.65"/>
      <circle cx="162" cy="142" r="2.5" fill="white" opacity="0.6"/>

      {/* ── Pot ───────────────────────────────────────────────────── */}
      <path d="M92 148 L98 165 L122 165 L128 148 Z" fill="#c4522a" opacity="0.75"/>
      <rect x="88" y="142" width="44" height="9" rx="4.5" fill="#c4522a" opacity="0.85"/>
      {/* Soil */}
      <ellipse cx="110" cy="142" rx="19" ry="4.5" fill="#185e38"/>

      {/* ── Stem ──────────────────────────────────────────────────── */}
      <path d="M110 142 L110 70" stroke="#185e38" strokeWidth="3.5" strokeLinecap="round"/>

      {/* ── Left leaf ─────────────────────────────────────────────── */}
      <path
        d="M110 110 C96 98 78 103 76 116 C88 113 100 112 110 110 Z"
        fill="#1d6f42"
      />
      <path d="M110 110 C96 110 82 113 76 116"
        stroke="#185e38" strokeWidth="1" fill="none" opacity="0.4"/>

      {/* ── Right leaf ────────────────────────────────────────────── */}
      <path
        d="M110 95 C124 82 143 86 144 100 C132 96 120 94 110 95 Z"
        fill="#1d6f42"
      />
      <path d="M110 95 C124 93 136 96 144 100"
        stroke="#185e38" strokeWidth="1" fill="none" opacity="0.4"/>

      {/* ── Top sprout leaves ─────────────────────────────────────── */}
      <path
        d="M110 70 C106 58 97 54 93 60 C100 62 106 64 110 70 Z"
        fill="#d0ecdb"
      />
      <path
        d="M110 70 C114 58 123 54 127 60 C120 62 114 64 110 70 Z"
        fill="#d0ecdb"
      />

      {/* ── Floating sparkles ─────────────────────────────────────── */}
      <circle cx="26"  cy="98"  r="4"   fill="#c4522a"  opacity="0.45"/>
      <circle cx="196" cy="90"  r="3"   fill="#1d6f42"  opacity="0.4"/>
      <circle cx="186" cy="60"  r="2.5" fill="#c4522a"  opacity="0.35"/>
      <circle cx="32"  cy="62"  r="2"   fill="#d0ecdb"  opacity="0.8"/>
      <circle cx="170" cy="108" r="2"   fill="white"    opacity="0.7"/>
    </svg>
  )
}
