/** Application submitted success */
export function IllustrationSuccess() {
  return (
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="120" cy="120" r="100" fill="#edf7f1"/>

      {/* Envelope body */}
      <rect x="52" y="88" width="136" height="88" rx="12" fill="white" stroke="#e2ddd7" strokeWidth="1.5"/>

      {/* Envelope flap (open) */}
      <path d="M52 100 L120 138 L188 100" stroke="#d0ecdb" strokeWidth="1.5" fill="none"/>

      {/* Letter lines inside */}
      <rect x="80" y="116" width="80" height="5" rx="2.5" fill="#d0ecdb"/>
      <rect x="80" y="127" width="64" height="5" rx="2.5" fill="#d0ecdb"/>
      <rect x="80" y="138" width="48" height="5" rx="2.5" fill="#e8e4de"/>

      {/* Big check circle — overlapping top of envelope */}
      <circle cx="120" cy="84" r="28" fill="#1d6f42"/>
      <circle cx="120" cy="84" r="22" fill="#185e38"/>
      <path d="M109 84 L117 92 L132 74" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Confetti */}
      <rect x="60"  y="58"  width="8" height="8" rx="2" fill="#c4522a" opacity="0.7" transform="rotate(20 64 62)"/>
      <rect x="168" y="56"  width="8" height="8" rx="2" fill="#1d6f42" opacity="0.5" transform="rotate(-15 172 60)"/>
      <rect x="52"  y="148" width="6" height="6" rx="1.5" fill="#c4522a" opacity="0.4" transform="rotate(10 55 151)"/>
      <rect x="178" y="152" width="6" height="6" rx="1.5" fill="#d0ecdb" transform="rotate(-20 181 155)"/>
      <circle cx="76"  cy="72"  r="4" fill="#f9ddd1"/>
      <circle cx="168" cy="148" r="4" fill="#c4522a" opacity="0.5"/>
      <circle cx="164" cy="76"  r="3" fill="#d0ecdb"/>
    </svg>
  )
}
