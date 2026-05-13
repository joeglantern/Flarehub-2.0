/** Step 2 — business / idea / stage */
export function IllustrationBusiness() {
  return (
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="120" cy="120" r="100" fill="#fdf2ed"/>

      {/* Rocket body */}
      <path d="M120 52 C100 72 92 96 92 120 L148 120 C148 96 140 72 120 52 Z" fill="#1d6f42"/>
      <path d="M120 52 C112 72 108 96 108 120 L120 120 L120 52 Z" fill="#185e38"/>

      {/* Window */}
      <circle cx="120" cy="98" r="12" fill="white" opacity="0.9"/>
      <circle cx="120" cy="98" r="7"  fill="#d0ecdb"/>

      {/* Fins */}
      <path d="M92 120 L76 140 L92 136 Z" fill="#c4522a"/>
      <path d="M148 120 L164 140 L148 136 Z" fill="#c4522a"/>

      {/* Exhaust flame */}
      <ellipse cx="120" cy="128" rx="12" ry="8"  fill="#f9ddd1"/>
      <ellipse cx="120" cy="133" rx="7"  ry="10" fill="#c4522a" opacity="0.7"/>
      <ellipse cx="120" cy="138" rx="4"  ry="7"  fill="white"   opacity="0.6"/>

      {/* Stars */}
      <circle cx="72"  cy="76"  r="4" fill="#c4522a" opacity="0.6"/>
      <circle cx="168" cy="68"  r="3" fill="#1d6f42" opacity="0.5"/>
      <circle cx="164" cy="168" r="5" fill="#c4522a" opacity="0.4"/>
      <circle cx="70"  cy="160" r="3" fill="#1d6f42" opacity="0.4"/>
      <circle cx="88"  cy="56"  r="2.5" fill="#d0ecdb"/>
      <circle cx="155" cy="96"  r="2.5" fill="#f9ddd1"/>

      {/* Ground dots (launch pad) */}
      <rect x="96" y="160" width="48" height="6" rx="3" fill="#1d6f42" opacity="0.15"/>
      <rect x="104" y="170" width="32" height="4" rx="2" fill="#1d6f42" opacity="0.1"/>
    </svg>
  )
}
