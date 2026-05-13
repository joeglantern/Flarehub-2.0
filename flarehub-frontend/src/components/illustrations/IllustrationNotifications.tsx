export function IllustrationNotifications() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Background circle */}
      <circle cx="100" cy="100" r="80" fill="#edf7f1" />

      {/* Bell body */}
      <path
        d="M100 52 C78 52 64 68 64 90 L64 114 L52 126 L52 132 L148 132 L148 126 L136 114 L136 90 C136 68 122 52 100 52 Z"
        fill="#1d6f42"
      />

      {/* Bell inner highlight */}
      <path
        d="M100 58 C82 58 70 72 70 90 L70 112 L136 112 L136 90 C136 72 118 58 100 58 Z"
        fill="#185e38"
      />

      {/* Clapper / bell base */}
      <rect x="88" y="130" width="24" height="6" rx="3" fill="#1d6f42"/>
      <circle cx="100" cy="143" r="8" fill="#1d6f42"/>

      {/* Notification dot */}
      <circle cx="136" cy="64" r="12" fill="#c4522a"/>
      <path d="M136 58 L136 66" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="136" cy="70" r="1.5" fill="white"/>

      {/* Sound arcs */}
      <path d="M52 88 Q44 100 52 112" stroke="#d0ecdb" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M148 88 Q156 100 148 112" stroke="#d0ecdb" strokeWidth="2.5" strokeLinecap="round" fill="none"/>

      {/* Sparkles */}
      <circle cx="58" cy="58" r="4" fill="#c4522a" opacity="0.4"/>
      <circle cx="150" cy="148" r="3" fill="#1d6f42" opacity="0.4"/>
    </svg>
  )
}
