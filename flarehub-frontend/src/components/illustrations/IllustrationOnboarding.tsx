/** Step 1 — personal details / identity */
export function IllustrationOnboarding() {
  return (
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="120" cy="120" r="100" fill="#edf7f1"/>

      {/* Profile card */}
      <rect x="52" y="72" width="136" height="100" rx="14" fill="white" stroke="#e2ddd7" strokeWidth="1.5"/>

      {/* Avatar circle */}
      <circle cx="88" cy="108" r="22" fill="#d0ecdb"/>
      <circle cx="88" cy="101" r="10" fill="#1d6f42"/>
      <ellipse cx="88" cy="122" rx="14" ry="8" fill="#1d6f42"/>

      {/* Name lines */}
      <rect x="122" y="96" width="48" height="6" rx="3" fill="#1d6f42" opacity="0.7"/>
      <rect x="122" y="108" width="36" height="5" rx="2.5" fill="#d0ecdb"/>
      <rect x="122" y="119" width="42" height="5" rx="2.5" fill="#d0ecdb"/>

      {/* Tags */}
      <rect x="122" y="131" width="24" height="14" rx="7" fill="#c4522a" opacity="0.15"/>
      <rect x="150" y="131" width="20" height="14" rx="7" fill="#1d6f42" opacity="0.15"/>

      {/* Check badge */}
      <circle cx="168" cy="76" r="16" fill="#1d6f42"/>
      <path d="M160 76 L165 82 L176 68" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Sparkles */}
      <circle cx="56"  cy="78"  r="5" fill="#c4522a" opacity="0.5"/>
      <circle cx="192" cy="88"  r="4" fill="#1d6f42" opacity="0.35"/>
      <circle cx="60"  cy="176" r="4" fill="#c4522a" opacity="0.35"/>
      <circle cx="188" cy="172" r="5" fill="#d0ecdb"/>
    </svg>
  )
}
