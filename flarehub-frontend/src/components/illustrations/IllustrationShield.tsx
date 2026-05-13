/** Admin dashboard — shield with a small spark inside, platform oversight theme */
export function IllustrationShield() {
  return (
    <svg viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">

      {/* ── Back glow ─────────────────────────────────────────────── */}
      <ellipse cx="110" cy="100" rx="72" ry="68" fill="#d0ecdb" opacity="0.35"/>

      {/* ── Shield body ───────────────────────────────────────────── */}
      <path
        d="M110 30 L158 52 L158 100 C158 130 134 152 110 160 C86 152 62 130 62 100 L62 52 Z"
        fill="#1d6f42"
      />
      {/* Shield inner */}
      <path
        d="M110 42 L148 60 L148 100 C148 124 130 142 110 150 C90 142 72 124 72 100 L72 60 Z"
        fill="#185e38"
      />
      {/* Shield sheen */}
      <path
        d="M110 42 L148 60 L148 80 C138 68 124 58 110 55 Z"
        fill="white" opacity="0.08"
      />

      {/* ── Check mark inside shield ───────────────────────────────── */}
      <path
        d="M94 100 L104 112 L126 84"
        stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
      />

      {/* ── Small star sparkles ────────────────────────────────────── */}
      <circle cx="50"  cy="44"  r="4"   fill="#c4522a" opacity="0.45"/>
      <circle cx="174" cy="50"  r="3"   fill="#1d6f42" opacity="0.35"/>
      <circle cx="178" cy="130" r="4"   fill="#c4522a" opacity="0.35"/>
      <circle cx="44"  cy="136" r="3"   fill="#d0ecdb" opacity="0.8"/>
      <circle cx="168" cy="28"  r="2.5" fill="#d0ecdb"/>
      <circle cx="46"  cy="88"  r="2"   fill="#c4522a" opacity="0.3"/>

      {/* ── Rolling ground wave ────────────────────────────────────── */}
      <path
        d="M0 158 Q28 146 60 154 Q92 162 122 150 Q152 138 184 150 Q202 156 220 150 L220 180 L0 180 Z"
        fill="#1d6f42" opacity="0.12"
      />
    </svg>
  )
}
