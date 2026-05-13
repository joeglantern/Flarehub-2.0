/** Standalone wave / horizon — sunrise energy */
export function IllustrationWave() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="100" r="80" fill="#edf7f1" />

      {/* Sun */}
      <circle cx="100" cy="82" r="22" fill="#f9ddd1" />
      <circle cx="100" cy="82" r="15" fill="#c4522a" opacity="0.8" />

      {/* Sun rays */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 100 + 20 * Math.cos(rad)
        const y1 = 82  + 20 * Math.sin(rad)
        const x2 = 100 + 30 * Math.cos(rad)
        const y2 = 82  + 30 * Math.sin(rad)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#c4522a" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
        )
      })}

      {/* Back wave */}
      <path
        d="M20 138 Q50 118 80 132 Q110 146 140 128 Q170 110 180 130 L180 180 L20 180 Z"
        fill="#d0ecdb"
      />

      {/* Front wave */}
      <path
        d="M20 152 Q45 136 75 148 Q105 160 135 144 Q160 132 180 148 L180 180 L20 180 Z"
        fill="#1d6f42" opacity="0.7"
      />

      {/* Foam sparkles on waves */}
      <circle cx="58"  cy="135" r="3" fill="white" opacity="0.8"/>
      <circle cx="122" cy="130" r="2.5" fill="white" opacity="0.7"/>
      <circle cx="160" cy="138" r="2" fill="white" opacity="0.6"/>
    </svg>
  )
}
