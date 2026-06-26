import { CountUp, Reveal } from './primitives'

const stats = [
  { num: 36,  label: 'Thousand youth registered', suffix: 'K+', rot: -4, color: 'var(--g500)', bg: '#f9ddd1' },
  { num: 300, label: 'YCIC applications received', suffix: '+', rot: 3,  color: 'var(--t500)', bg: 'var(--surface)' },
  { num: 10,  label: 'Innovators funded', suffix: '',  rot: -2, color: 'var(--ink)', bg: '#d0ecdb' },
  { num: 9,   label: 'Universities activated', suffix: '+', rot: 4, color: 'var(--g500)', bg: 'var(--surface)' },
]

const facts = [
  { k: 'Powered by',  v: 'AFOSI — Action for Sustainability Initiative.' },
  { k: 'Backed by',   v: 'UNICEF, KeNIA, KCB, NETFUND & partners.' },
  { k: 'Live in',     v: 'Nairobi, Mombasa, Kisumu.' },
  { k: 'Since',       v: 'May 2025 — YCIC Cohort 1.' },
]

export function About() {
  return (
    <section className="section alt-bg" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Rising particle overlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {Array.from({ length: 14 }, (_, i) => {
          const colors = ['rgba(29,111,66,0.35)', 'rgba(196,82,42,0.25)', 'rgba(29,111,66,0.2)', 'rgba(208,236,219,0.6)']
          return (
            <div key={i} style={{
              position: 'absolute',
              bottom: `${(i * 19 + 5) % 55}%`,
              left: `${(i * 83 + 4) % 94}%`,
              width: 3 + (i % 3),
              height: 3 + (i % 3),
              borderRadius: '50%',
              background: colors[i % colors.length],
              animation: `particle-rise ${3.2 + (i % 4) * 0.75}s ease-in-out ${(i * 0.45) % 3.8}s infinite`,
            }} />
          )
        })}
      </div>
      <div className="container">
        <Reveal>
          <div className="mono" style={{ color: 'var(--t500)', marginBottom: 12 }}>▸ 005 — Who we are</div>
          <h2 className="display" style={{ fontSize: 'clamp(32px, 6vw, 88px)', margin: 0, maxWidth: 920 }}>
            Kenya's next climate <span className="display-italic" style={{ color: 'var(--g500)' }}>innovators</span>{' '}
            are in Kibera, Kisumu &amp; Mombasa —{' '}
            <span style={{ color: 'var(--ink-2)' }}>not Silicon Valley.</span>
          </h2>
        </Reveal>

        {/* Stat scraps */}
        <div className="about-stats">
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="paper" style={{
                background: s.bg, transform: `rotate(${s.rot}deg)`,
                padding: 'clamp(18px,3vw,28px) clamp(14px,2vw,22px)', borderRadius: 4,
                boxShadow: '4px 10px 24px -14px rgba(26,25,22,0.4)',
                border: '1px solid rgba(26,25,22,0.06)', position: 'relative',
              }}>
                <div className="display" style={{ fontSize: 'clamp(48px,7vw,80px)', fontWeight: 800, color: s.color, lineHeight: 0.85, letterSpacing: '-0.04em' }}>
                  <CountUp to={s.num} suffix={s.suffix ?? ''} />
                </div>
                <div className="mono" style={{ color: 'var(--ink-2)', marginTop: 10, fontSize: 11 }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Letter + Mission */}
        <div className="about-letter">
          <Reveal>
            <div style={{
              background: 'var(--surface)', padding: 'clamp(24px,4vw,40px)', borderRadius: 4,
              boxShadow: '0 20px 60px -30px rgba(26,25,22,0.4), 0 0 0 1px var(--border)',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 14, color: 'var(--ink)', lineHeight: 1.75, position: 'relative',
              transform: 'rotate(-0.8deg)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, color: 'var(--ink-3)', fontSize: 11, flexWrap: 'wrap', gap: 8 }}>
                <span>Nairobi · Westlands · Floor 4</span>
                <span>19 April 2026</span>
              </div>
              <p style={{ margin: '0 0 18px' }}>
                We started AFOSI because we believed Kenya's best climate innovations weren't going to come out of a boardroom.
                They'd come from a 24-year-old in Kibera who'd watched floods destroy her neighbourhood, or a TVET graduate
                in Kisumu who figured out a cleaner way to run a small business.
              </p>
              <p style={{ margin: '0 0 18px' }}>
                The challenge was never the talent. It was the pipeline — the structured support between a raw idea and a
                funded venture. So we built one. Through Afosihub, we run programmes like YCIC and BeGreen that take young
                innovators from application to incubation to seed funding, with real mentorship at every stage.
              </p>
              <p style={{ margin: '0 0 18px' }}>
                This year, 300+ innovators applied for YCIC. Thirty-two made it to our bootcamp at CEMASTEA. Ten walked
                away with KES 250,000 each and a six-month scaling plan. That's cohort one. We're just getting started.
              </p>
              <div className="display" style={{ fontSize: 'clamp(24px,3vw,36px)', fontStyle: 'italic', fontWeight: 500, color: 'var(--t500)', marginTop: 18, transform: 'rotate(-3deg)' }}>
                — The AFOSI Team
              </div>
              <div className="mono" style={{ color: 'var(--ink-3)', marginTop: 8, fontSize: 10 }}>ACTION FOR SUSTAINABILITY INITIATIVE</div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div style={{ position: 'relative', padding: '20px 0 20px 32px', borderLeft: '4px solid var(--t500)' }}>
              <div style={{
                position: 'absolute', left: -40, top: -30, fontFamily: 'var(--display)',
                fontSize: 'clamp(120px,18vw,220px)', fontWeight: 800, color: 'var(--g500)',
                opacity: 0.06, lineHeight: 0.8, userSelect: 'none', pointerEvents: 'none',
              }}>"</div>
              <div className="mono" style={{ color: 'var(--t500)', marginBottom: 16 }}>OUR MISSION</div>
              <p className="display" style={{ fontSize: 'clamp(22px,2.6vw,38px)', fontWeight: 500, color: 'var(--g500)', lineHeight: 1.25, margin: 0 }}>
                To give every young Kenyan innovator a{' '}
                <span className="display-italic">structured pathway</span>{' '}
                from idea to funded, scaling venture.
              </p>
              <div className="facts-grid" style={{ marginTop: 32 }}>
                {facts.map((x) => (
                  <div key={x.k}>
                    <div className="mono" style={{ color: 'var(--ink-3)', fontSize: 10 }}>{x.k.toUpperCase()}</div>
                    <div style={{ color: 'var(--ink)', fontSize: 14, marginTop: 4 }}>{x.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
