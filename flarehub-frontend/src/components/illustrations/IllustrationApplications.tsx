export function IllustrationApplications() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Background circle */}
      <circle cx="100" cy="100" r="80" fill="#edf7f1" />

      {/* Back clipboard */}
      <rect x="68" y="52" width="72" height="90" rx="8" fill="#d0ecdb" />

      {/* Front clipboard */}
      <rect x="60" y="60" width="72" height="90" rx="8" fill="white" stroke="#e2ddd7" strokeWidth="1.5"/>

      {/* Clip at top */}
      <rect x="84" y="54" width="24" height="12" rx="6" fill="#1d6f42"/>

      {/* Lines */}
      <rect x="74" y="84" width="44" height="3" rx="1.5" fill="#d0ecdb"/>
      <rect x="74" y="95" width="36" height="3" rx="1.5" fill="#d0ecdb"/>
      <rect x="74" y="106" width="40" height="3" rx="1.5" fill="#d0ecdb"/>
      <rect x="74" y="117" width="28" height="3" rx="1.5" fill="#d0ecdb"/>

      {/* Check mark circle */}
      <circle cx="132" cy="138" r="18" fill="#1d6f42"/>
      <path d="M124 138 L130 144 L140 132" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Sparkles */}
      <circle cx="60" cy="62" r="4" fill="#c4522a" opacity="0.6"/>
      <circle cx="152" cy="68" r="3" fill="#1d6f42" opacity="0.4"/>
      <circle cx="55" cy="145" r="3" fill="#c4522a" opacity="0.4"/>
    </svg>
  )
}
