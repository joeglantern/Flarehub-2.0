export function IllustrationMessages() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Background circle */}
      <circle cx="100" cy="100" r="80" fill="#edf7f1" />

      {/* Back bubble */}
      <rect x="72" y="60" width="76" height="50" rx="14" fill="#d0ecdb"/>
      <path d="M86 110 L80 124 L98 110 Z" fill="#d0ecdb"/>

      {/* Front bubble */}
      <rect x="52" y="88" width="76" height="50" rx="14" fill="white" stroke="#e2ddd7" strokeWidth="1.5"/>
      <path d="M114 138 L120 152 L102 138 Z" fill="white" stroke="#e2ddd7" strokeWidth="1.5"/>
      {/* Cover stroke on bubble join */}
      <path d="M114 138 L102 138" stroke="white" strokeWidth="2"/>

      {/* Dots in back bubble */}
      <circle cx="96" cy="85" r="4" fill="#1d6f42" opacity="0.4"/>
      <circle cx="110" cy="85" r="4" fill="#1d6f42" opacity="0.4"/>
      <circle cx="124" cy="85" r="4" fill="#1d6f42" opacity="0.4"/>

      {/* Lines in front bubble */}
      <rect x="66" y="106" width="44" height="3" rx="1.5" fill="#d0ecdb"/>
      <rect x="66" y="116" width="34" height="3" rx="1.5" fill="#d0ecdb"/>

      {/* Decorations */}
      <circle cx="58" cy="65" r="5" fill="#c4522a" opacity="0.5"/>
      <circle cx="155" cy="72" r="4" fill="#1d6f42" opacity="0.4"/>
      <circle cx="150" cy="148" r="4" fill="#c4522a" opacity="0.4"/>
    </svg>
  )
}
