import { useState } from 'react'
import { MarkerPortrait, Reveal } from './primitives'

const mentors = [
  { name: 'User',    role: 'Mentor role',       bio: 'Mentor about',                     avail: true,  seed: 2 },
  { name: 'User',role: 'Mentor role',         bio: 'Mentor about',              avail: true,  seed: 3 },
  { name: 'User',    role: 'Mentor role',        bio: 'Mentor about',                        avail: false, seed: 4 },
  { name: 'User',  role: 'Mentor role',       bio: 'Mentor about',                             avail: true,  seed: 5 },
  { name: 'User', role: 'Mentor role',   bio: 'Mentor about',                                avail: true,  seed: 6 },
  { name: 'User',   role: 'Mentor role',          bio: 'Mentor about',                    avail: false, seed: 7 },
]

export function Mentors({ setPage }: { setPage?: (p: string) => void }) {
  const [flipped, setFlipped] = useState(new Set<number>())

  const toggle = (i: number) => {
    setFlipped((prev) => {
      const n = new Set(prev)
      if (n.has(i)) n.delete(i); else n.add(i)
      return n
    })
  }

  return (
    <section className="section" style={{ position: 'relative' }}>
      <div className="container">
        <Reveal>
          <div className="mono" style={{ color: 'var(--t500)', marginBottom: 12 }}>▸ 006 — The bench</div>
          <h2 className="display" style={{ fontSize: 'clamp(32px,6vw,88px)', margin: 0, maxWidth: 900 }}>
            The people in your{' '}
            <span className="display-italic" style={{ color: 'var(--g500)' }}>corner</span>.
          </h2>
          <p style={{ maxWidth: 620, color: 'var(--ink-2)', fontSize: 'clamp(15px,2vw,17px)', marginTop: 20, lineHeight: 1.55 }}>
            Every mentor has shipped a real product, run a real team, or written real checks in East Africa.
            No life coaches. No keynote motivators. Just operators.
          </p>
        </Reveal>

        <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 28 }}>
          {mentors.map((m, i) => (
            <Reveal key={m.name} delay={i * 70}>
              <div
                className={`flip ${flipped.has(i) ? 'flipped' : ''}`}
                onClick={() => toggle(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i) } }}
                role="button"
                tabIndex={0}
                aria-label={`${m.name} — ${flipped.has(i) ? 'click to flip back' : 'click to see bio'}`}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <div className="flip-inner">
                  {/* Front */}
                  <div className="flip-face card" style={{ padding: 0, overflow: 'hidden', background: 'var(--surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
                      <div style={{ width: 40, height: 14, background: 'var(--ink)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 30, height: 8, border: '2px solid var(--ink)', borderBottom: 0, borderRadius: '8px 8px 0 0' }} />
                      </div>
                    </div>
                    <div style={{ padding: '14px 18px 18px' }}>
                      <div style={{ height: 160, borderRadius: 10, overflow: 'hidden', background: 'var(--inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <MarkerPortrait seed={m.seed} rotate={0} w={160} h={190} />
                        <div style={{
                          position: 'absolute', inset: 0,
                          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.15'/></svg>\")",
                          mixBlendMode: 'multiply', pointerEvents: 'none',
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 14, gap: 10 }}>
                        <div>
                          <h3 className="display" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{m.name}</h3>
                          <div className="mono" style={{ color: 'var(--ink-2)', marginTop: 4 }}>{m.role}</div>
                        </div>
                        <span style={{
                          padding: '4px 10px',
                          background: m.avail ? '#d0ecdb' : '#f9ddd1',
                          color: m.avail ? 'var(--g600)' : 'var(--t600)',
                          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, borderRadius: 4,
                          letterSpacing: '0.06em', transform: 'rotate(2deg)', flexShrink: 0,
                          border: m.avail ? '1px solid #a5d5b7' : '1px solid #e8b9a4',
                        }}>
                          {m.avail ? (
                            <>
                              <span style={{
                                display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                                background: '#1d6f42', marginRight: 5, verticalAlign: 'middle',
                                animation: 'ping-dot 1.8s ease-in-out infinite',
                              }} />
                              Avail.
                            </>
                          ) : '● Busy'}
                        </span>
                      </div>
                      <div className="mono" style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed var(--border)', color: 'var(--ink-3)', fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
                        <span>ID · FH-{String(i + 1).padStart(3, '0')}</span>
                        <span>Tap to flip ↻</span>
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="flip-face flip-back card" style={{ padding: 24, background: 'var(--g500)', color: '#fff' }}>
                    <div className="mono" style={{ opacity: 0.8, fontSize: 10 }}>ABOUT</div>
                    <p className="display" style={{ fontSize: 19, lineHeight: 1.35, fontWeight: 500, marginTop: 10 }}>{m.bio}</p>
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed rgba(255,255,255,0.3)' }}>
                      <div className="mono" style={{ opacity: 0.75, fontSize: 10 }}>MEETS WITH</div>
                      <div style={{ fontSize: 14, marginTop: 6 }}>Mondays &amp; Thursdays · 45 min</div>
                    </div>
                    <button
                      className="btn btn-terra"
                      style={{ marginTop: 22, width: '100%', justifyContent: 'center' }}
                      onClick={(e) => { e.stopPropagation(); setPage?.('apply') }}
                    >
                      Request a session →
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
