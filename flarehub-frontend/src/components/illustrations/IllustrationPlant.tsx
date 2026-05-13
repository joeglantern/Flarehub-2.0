/** Standalone growing plant / sprout */
export function IllustrationPlant() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="100" r="80" fill="#edf7f1" />

      {/* Pot */}
      <path d="M72 148 L80 168 L120 168 L128 148 Z" fill="#c4522a" opacity="0.8"/>
      <rect x="68" y="142" width="64" height="10" rx="5" fill="#c4522a"/>
      {/* Pot soil */}
      <ellipse cx="100" cy="142" rx="28" ry="6" fill="#185e38"/>

      {/* Main stem */}
      <path d="M100 142 L100 96" stroke="#185e38" strokeWidth="4" strokeLinecap="round"/>

      {/* Left leaf */}
      <path
        d="M100 118 C88 108 72 112 70 124 C80 122 92 122 100 118 Z"
        fill="#1d6f42"
      />
      {/* Left leaf vein */}
      <path d="M100 118 C88 118 76 120 70 124" stroke="#185e38" strokeWidth="1" fill="none" opacity="0.5"/>

      {/* Right leaf */}
      <path
        d="M100 108 C112 96 130 98 132 112 C120 108 108 106 100 108 Z"
        fill="#1d6f42"
      />
      {/* Right leaf vein */}
      <path d="M100 108 C112 106 124 108 132 112" stroke="#185e38" strokeWidth="1" fill="none" opacity="0.5"/>

      {/* Top small leaf */}
      <path
        d="M100 96 C96 84 88 80 84 86 C90 88 96 90 100 96 Z"
        fill="#d0ecdb"
      />
      <path
        d="M100 96 C104 84 112 80 116 86 C110 88 104 90 100 96 Z"
        fill="#d0ecdb"
      />

      {/* Sparkles */}
      <circle cx="58" cy="72" r="4" fill="#c4522a" opacity="0.5"/>
      <circle cx="148" cy="80" r="3" fill="#1d6f42" opacity="0.4"/>
      <circle cx="55"  cy="148" r="3" fill="#d0ecdb"/>
      <circle cx="150" cy="152" r="4" fill="#c4522a" opacity="0.35"/>
    </svg>
  )
}
