export function IllustrationPrograms() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Background circle */}
      <circle cx="100" cy="100" r="80" fill="#edf7f1" />

      {/* Megaphone body */}
      <path d="M60 82 L95 70 L95 130 L60 118 Z" fill="#1d6f42" rx="4" />

      {/* Megaphone bell */}
      <path d="M95 70 L130 52 L130 148 L95 130 Z" fill="#185e38" />

      {/* Speaker handle */}
      <rect x="48" y="88" width="14" height="24" rx="7" fill="#1d6f42" />

      {/* Sound waves */}
      <path d="M138 80 Q148 100 138 120" stroke="#c4522a" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M146 72 Q162 100 146 128" stroke="#c4522a" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6"/>

      {/* Stars / sparkles */}
      <circle cx="60" cy="55" r="4" fill="#c4522a" opacity="0.7"/>
      <circle cx="155" cy="60" r="3" fill="#1d6f42" opacity="0.5"/>
      <circle cx="148" cy="148" r="4" fill="#c4522a" opacity="0.5"/>
      <circle cx="48" cy="148" r="3" fill="#1d6f42" opacity="0.4"/>
    </svg>
  )
}
