/** Generic "nothing here" illustration — stacked documents */
export function IllustrationEmpty() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Background circle */}
      <circle cx="100" cy="100" r="80" fill="#edf7f1" />

      {/* Bottom page */}
      <rect x="68" y="72" width="68" height="84" rx="8" fill="#d0ecdb" transform="rotate(-6 68 72)"/>

      {/* Middle page */}
      <rect x="66" y="68" width="68" height="84" rx="8" fill="#f0ede8" transform="rotate(3 66 68)"/>

      {/* Top page */}
      <rect x="64" y="64" width="68" height="84" rx="8" fill="white" stroke="#e2ddd7" strokeWidth="1.5"/>

      {/* Lines on top page */}
      <rect x="78" y="84" width="40" height="3" rx="1.5" fill="#d0ecdb"/>
      <rect x="78" y="94" width="32" height="3" rx="1.5" fill="#d0ecdb"/>
      <rect x="78" y="104" width="36" height="3" rx="1.5" fill="#d0ecdb"/>
      <rect x="78" y="114" width="24" height="3" rx="1.5" fill="#e8e4de"/>

      {/* Magnifying glass */}
      <circle cx="130" cy="130" r="18" fill="white" stroke="#1d6f42" strokeWidth="3"/>
      <circle cx="130" cy="130" r="11" fill="#edf7f1"/>
      <line x1="143" y1="143" x2="155" y2="155" stroke="#1d6f42" strokeWidth="3.5" strokeLinecap="round"/>

      {/* Decorations */}
      <circle cx="58" cy="66" r="4" fill="#c4522a" opacity="0.5"/>
      <circle cx="152" cy="68" r="3" fill="#1d6f42" opacity="0.4"/>
      <circle cx="55" cy="148" r="3" fill="#c4522a" opacity="0.35"/>
    </svg>
  )
}
