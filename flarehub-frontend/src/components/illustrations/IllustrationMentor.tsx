/**
 * Mentor dashboard illustration — two figures on a path with a compass.
 * Designed for a warm amber/terra-50 background.
 */
export function IllustrationMentor() {
  return (
    <svg viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">

      {/* ── Path / road ───────────────────────────────────────────── */}
      <path
        d="M30 160 Q80 140 110 148 Q150 158 190 138 L220 132 L220 180 L0 180 Z"
        fill="#d0ecdb" opacity="0.5"
      />
      <path
        d="M40 168 Q90 154 120 160 Q158 168 200 152"
        stroke="#1d6f42" strokeWidth="1.5" strokeDasharray="6 4" strokeLinecap="round"
        fill="none" opacity="0.4"
      />

      {/* ── Mentor figure (taller, left) ─────────────────────────── */}
      {/* Head */}
      <circle cx="82" cy="82" r="14" fill="#1d6f42"/>
      <circle cx="82" cy="78" r="9"  fill="#185e38"/>
      {/* Body */}
      <path d="M68 112 Q68 96 82 94 Q96 96 96 112 L96 140 Q96 148 82 148 Q68 148 68 140 Z"
        fill="#1d6f42"/>
      {/* Arms */}
      <path d="M68 108 Q58 116 62 128" stroke="#1d6f42" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Right arm reaching toward mentee */}
      <path d="M96 108 Q110 104 118 112" stroke="#1d6f42" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Legs */}
      <path d="M74 148 L70 168" stroke="#1d6f42" strokeWidth="5" strokeLinecap="round"/>
      <path d="M90 148 L92 168" stroke="#1d6f42" strokeWidth="5" strokeLinecap="round"/>

      {/* ── Mentee figure (shorter, right) ───────────────────────── */}
      {/* Head */}
      <circle cx="136" cy="96" r="11" fill="#c4522a" opacity="0.85"/>
      <circle cx="136" cy="93" r="7"  fill="#a8441f" opacity="0.7"/>
      {/* Body */}
      <path d="M125 120 Q125 108 136 106 Q147 108 147 120 L147 144 Q147 150 136 150 Q125 150 125 144 Z"
        fill="#c4522a" opacity="0.8"/>
      {/* Arms */}
      <path d="M125 122 Q118 112 118 112" stroke="#c4522a" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M147 120 Q155 126 158 132" stroke="#c4522a" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8"/>
      {/* Legs */}
      <path d="M130 150 L128 168" stroke="#c4522a" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
      <path d="M142 150 L144 168" stroke="#c4522a" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>

      {/* ── Compass (top right) ───────────────────────────────────── */}
      <circle cx="182" cy="52" r="26" fill="white" opacity="0.5"/>
      <circle cx="182" cy="52" r="22" fill="white" opacity="0.4"/>
      <circle cx="182" cy="52" r="18" fill="white" opacity="0.3"/>
      {/* Cardinal marks */}
      <text x="182" y="40"  textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1d6f42" opacity="0.7">N</text>
      <text x="182" y="67"  textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1d6f42" opacity="0.5">S</text>
      <text x="170" y="55"  textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1d6f42" opacity="0.5">W</text>
      <text x="194" y="55"  textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1d6f42" opacity="0.7">E</text>
      {/* Needle */}
      <path d="M182 52 L182 38" stroke="#c4522a" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <path d="M182 52 L182 62" stroke="#1d6f42" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <circle cx="182" cy="52" r="3" fill="#1d6f42"/>

      {/* ── Sparkles ──────────────────────────────────────────────── */}
      <circle cx="26"  cy="80"  r="4"   fill="#c4522a" opacity="0.3"/>
      <circle cx="216" cy="96"  r="3"   fill="#1d6f42" opacity="0.3"/>
      <circle cx="54"  cy="48"  r="2.5" fill="#d0ecdb" opacity="0.8"/>
      <circle cx="164" cy="28"  r="2"   fill="#c4522a" opacity="0.4"/>
    </svg>
  )
}
