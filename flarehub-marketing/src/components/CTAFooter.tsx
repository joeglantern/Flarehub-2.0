import { useState } from 'react'
import { FlareMark, Reveal, Squiggle } from './primitives'

const footerCols = [
  { h: 'Programs', items: ['Program', 'Program', 'Program', 'Program', 'Program'] },
  { h: 'Company',  items: ['About', 'Mentors', 'Press', 'Contact', 'Careers'] },
  { h: 'Follow',   items: ['Newsletter', 'LinkedIn', 'X · @afosihub', 'Instagram', 'YouTube'] },
]

export function CTAFooter({ setPage }: { setPage: (p: string) => void }) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubscribed(true)
  }

  return (
    <>
      {/* Newsletter strip */}
      <section style={{ background: 'var(--elevated)', padding: '72px 32px', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Reveal>
            <div className="mono" style={{ color: 'var(--t500)', marginBottom: 12 }}>✉ Stay in the loop</div>
            <h3 className="display" style={{ fontSize: 'clamp(28px,4vw,52px)', margin: 0 }}>
              Cohort updates, founder stories,<br />
              <span className="display-italic" style={{ color: 'var(--g500)' }}>no noise</span>.
            </h3>
            <p style={{ color: 'var(--ink-2)', marginTop: 16, fontSize: 16 }}>
              One email a month. Unsubscribe any time.
            </p>
            {subscribed ? (
              <div style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 10, background: '#d0ecdb', border: '1px solid #a5d5b7', borderRadius: 12, padding: '12px 24px', color: 'var(--g600)', fontWeight: 600 }}>
                ✓ You're in — check your inbox!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ marginTop: 28, display: 'flex', gap: 10, maxWidth: 480, margin: '28px auto 0', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.co.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1, minWidth: 200 }}
                  required
                />
                <button type="submit" className="btn" style={{ flexShrink: 0 }}>Subscribe →</button>
              </form>
            )}
            <div className="mono" style={{ color: 'var(--ink-3)', marginTop: 16, fontSize: 10 }}>
              No spam. No sharing. Just founder stories and program news.
            </div>
          </Reveal>
        </div>
      </section>

      {/* Main CTA */}
      <section style={{ background: 'var(--g500)', padding: 'clamp(72px,10vw,120px) 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.15'/></svg>\")",
          mixBlendMode: 'overlay', opacity: 0.4,
        }} />
        {/* CSS confetti overlay */}
        {Array.from({ length: 16 }, (_, i) => {
          const palette = ['#d0ecdb', '#a8d5bc', '#f9ddd1', '#f2c4a0', 'rgba(255,255,255,0.75)', 'rgba(208,236,219,0.9)']
          return (
            <div key={i} style={{
              position: 'absolute', top: -14,
              left: `${((i * 73 + 17) % 90) + 3}%`,
              width: 5 + (i % 4) * 4,
              height: 7 + (i % 3) * 5,
              borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? 3 : 1,
              background: palette[i % palette.length],
              animation: `conf-fall ${2.2 + (i % 5) * 0.45}s ease-in ${(i * 0.24) % 2.8}s infinite, conf-sway ${2.6 + (i % 3) * 0.55}s ease-in-out ${(i * 0.24) % 2.8}s infinite`,
              pointerEvents: 'none', zIndex: 1,
            }} />
          )
        })}
        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <Reveal>
            <div className="mono" style={{ color: '#d0ecdb', marginBottom: 18, letterSpacing: '0.15em' }}>★  YOUR MOVE  ★</div>
            <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 128px)', color: '#fff', margin: 0, lineHeight: 0.95 }}>
              Your idea deserves<br />
              a{' '}
              <span className="squiggle display-italic">
                shot
                <Squiggle color="var(--t500)" thickness={4} />
              </span>
              .
            </h2>
            <p style={{ color: '#d0ecdb', maxWidth: 560, margin: '32px auto 0', fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.55 }}>
              Applications for Cohort 07 are open. No cost to apply. No fluff.
              We respond within 7 days, whatever the answer.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
              <button className="btn btn-terra" style={{ padding: 'clamp(14px,2vw,18px) clamp(18px,3vw,28px)', fontSize: 'clamp(14px,2vw,17px)', borderRadius: 10 }} onClick={() => setPage('apply')}>
                Apply now <span>→</span>
              </button>
              <button
                className="btn btn-ghost"
                style={{ padding: 'clamp(14px,2vw,18px) clamp(14px,2vw,24px)', fontSize: 'clamp(13px,2vw,15px)', borderRadius: 10, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                onClick={() => setPage('programs')}
              >
                Browse programs
              </button>
            </div>
            <div className="mono" style={{ color: '#d0ecdb', marginTop: 24, fontSize: 11, letterSpacing: '0.1em' }}>
              APPLICATIONS OPEN · NO COST TO APPLY · 7-DAY TURNAROUND
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0a2e1c', color: '#d0ecdb', padding: 'clamp(40px,6vw,60px) clamp(20px,4vw,32px) 36px', position: 'relative', overflow: 'hidden' }}>
        {/* Animated film grain */}
        <div style={{
          position: 'absolute', inset: '-60%', pointerEvents: 'none', zIndex: 0, opacity: 0.07,
          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23g)' opacity='1'/></svg>\")",
          animation: 'footer-grain 0.4s steps(1) infinite',
        }} />
        {/* Ambient glow orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '6%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,111,66,0.22) 0%, transparent 65%)', animation: 'orb-2 11s ease-in-out infinite', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '8%', right: '10%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,82,42,0.16) 0%, transparent 65%)', animation: 'orb-1 15s ease-in-out infinite', filter: 'blur(42px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '55%', left: '55%', width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,111,66,0.12) 0%, transparent 65%)', animation: 'orb-3 9s ease-in-out infinite 2s', filter: 'blur(36px)', pointerEvents: 'none', zIndex: 0 }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FlareMark bg="rgba(255,255,255,0.1)" accent="#c4522a" size={18} />
                <span className="display" style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Afosihub</span>
              </div>
              <p style={{ marginTop: 16, fontSize: 13, lineHeight: 1.6, opacity: 0.7, maxWidth: 300 }}>
                A home for Kenyan founders. Built in Nairobi. Open to the whole continent.
              </p>
              <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                {['X', 'IG', 'LI', 'YT'].map((s) => (
                  <button key={s} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(208,236,219,0.2)', background: 'transparent', color: '#d0ecdb', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {footerCols.map((col) => (
              <div key={col.h}>
                <div className="mono" style={{ fontSize: 10, color: '#6b8a7a', marginBottom: 14 }}>{col.h.toUpperCase()}</div>
                {col.items.map((item) => (
                  <div key={item} style={{ padding: '5px 0', fontSize: 13, cursor: 'pointer', opacity: 0.8, transition: 'opacity 140ms' }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                  >{item}</div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 52, paddingTop: 24, borderTop: '1px solid rgba(208,236,219,0.12)', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ color: '#6b8a7a', fontSize: 12 }}>© 2026 Afosihub Ltd. · Nairobi, Kenya</div>
            <div style={{ color: '#6b8a7a', fontSize: 12, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <span style={{ cursor: 'pointer' }}>Privacy</span>
              <span style={{ cursor: 'pointer' }}>Terms</span>
              <span style={{ cursor: 'pointer' }}>Code of conduct</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
