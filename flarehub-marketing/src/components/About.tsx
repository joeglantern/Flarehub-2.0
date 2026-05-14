import { CountUp, Reveal } from './primitives'

const stats = [
  { num: 420, label: 'Founders backed', rot: -4, color: 'var(--g500)', bg: '#f9ddd1' },
  { num: 64,  label: 'Million KES deployed', suffix: 'M', rot: 3, color: 'var(--t500)', bg: 'var(--surface)' },
  { num: 38,  label: 'Active mentors', rot: -2, color: 'var(--ink)', bg: '#d0ecdb' },
  { num: 7,   label: 'Cohorts shipped', rot: 4, color: 'var(--g500)', bg: 'var(--surface)' },
]

const facts = [
  { k: 'Built with', v: 'Local mentors, not imported ones.' },
  { k: 'Paid for by', v: 'Five partner funds + fees from graduates.' },
  { k: 'Live in',    v: 'Nairobi, Mombasa, Kisumu.' },
  { k: 'Since',      v: 'February 2023.' },
]

export function About() {
  return (
    <section className="section alt-bg" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="container">
        <Reveal>
          <div className="mono" style={{ color: 'var(--t500)', marginBottom: 12 }}>▸ 005 — Who we are</div>
          <h2 className="display" style={{ fontSize: 'clamp(32px, 6vw, 88px)', margin: 0, maxWidth: 920 }}>
            We think the next great <span className="display-italic" style={{ color: 'var(--g500)' }}>companies</span>{' '}
            will be built in Eastleigh, Kisumu &amp; Westlands —{' '}
            <span style={{ color: 'var(--ink-2)' }}>not Palo Alto.</span>
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
                Bricolage Grotesque. Space Grotesk. Inter. JetBrains Mono. Bricolage Grotesque. Space Grotesk. Inter. JetBrains Mono. Bricolage Grotesque. Space Grotesk. Inter. JetBrains Mono. Bricolage Grotesque. Space Grotesk. Inter. JetBrains Mono.
              </p>
              <p style={{ margin: '0 0 18px' }}>
                Bricolage Grotesque. Space Grotesk. Inter. JetBrains Mono. Bricolage Grotesque. Space Grotesk. Inter. JetBrains Mono. Bricolage Grotesque. Space Grotesk. Inter. JetBrains Mono. Bricolage Grotesque. Space Grotesk. Inter. JetBrains Mono.
              </p>
              <p style={{ margin: '0 0 18px' }}>
                Bricolage Grotesque. Space Grotesk. Inter. JetBrains Mono. Bricolage Grotesque. Space Grotesk. Inter. JetBrains Mono. Bricolage Grotesque. Space Grotesk. Inter. JetBrains Mono.
              </p>
              <div className="display" style={{ fontSize: 'clamp(24px,3vw,36px)', fontStyle: 'italic', fontWeight: 500, color: 'var(--t500)', marginTop: 18, transform: 'rotate(-3deg)' }}>
                — User &amp; User
              </div>
              <div className="mono" style={{ color: 'var(--ink-3)', marginTop: 8, fontSize: 10 }}>CO-FOUNDERS, FLAREHUB</div>
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
                To make starting a company the most normal career choice for a{' '}
                <span className="display-italic">21-year-old in Kenya</span>.
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
