import { Reveal, SketchIcon } from './primitives'

const steps = [
  { n: '01', icon: 'pencil',    title: 'Apply',         desc: 'Tell us your idea in your own words. No slide decks required. 10 minute form, real humans read every one.', rotate: -3, top: 40 },
  { n: '02', icon: 'handshake', title: 'Get matched',   desc: "We pair you with a mentor who's shipped what you're trying to ship. Weekly check-ins, no corporate speak.", rotate: 2, top: 10 },
  { n: '03', icon: 'rocket',    title: 'Build & launch', desc: "Track milestones, pull on funding, and take your thing to market. Graduate with a working business, not a certificate.", rotate: -1, top: 60 },
]

export function Process() {
  return (
    <section className="section alt-bg" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="watermark" style={{ top: 40, left: -20, transform: 'rotate(-3deg)' }}>Process</div>
      <div className="container" style={{ position: 'relative' }}>
        <Reveal>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div className="mono" style={{ color: 'var(--t500)', marginBottom: 12 }}>▸ 003 — How it works</div>
              <h2 className="display" style={{ fontSize: 'clamp(36px, 6vw, 88px)', margin: 0, maxWidth: 780 }}>
                Three steps. No <span className="display-italic" style={{ color: 'var(--g500)' }}>fluff</span>.
              </h2>
            </div>
            <div style={{ maxWidth: 320, color: 'var(--ink-2)', fontSize: 15 }}>
              Our process is deliberately short. Great founders learn by doing, not by sitting in workshops. So we built the runway, not the airport.
            </div>
          </div>
        </Reveal>

        {/* Corkboard */}
        <div style={{
          marginTop: 80, position: 'relative',
          background: 'repeating-linear-gradient(47deg, rgba(196,82,42,0.04) 0 2px, transparent 2px 8px), var(--elevated)',
          borderRadius: 16, padding: 'clamp(40px,6vw,100px) clamp(16px,4vw,40px)',
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 1000 500" preserveAspectRatio="none">
            <path d="M 180 230 C 340 180, 420 320, 500 220 C 580 120, 660 300, 820 220" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="6 8" fill="none" opacity="0.25" />
          </svg>
          <div className="process-grid">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="card paper" style={{
                  transform: `rotate(${s.rotate}deg) translateY(${s.top}px)`,
                  background: 'var(--surface)', padding: 28, position: 'relative',
                }}>
                  <div className="pin" />
                  <div className="display" style={{ fontSize: 'clamp(48px,8vw,72px)', fontWeight: 800, color: 'var(--g500)', lineHeight: 0.9 }}>{s.n}</div>
                  <div style={{ position: 'absolute', top: 24, right: 24, padding: 8, background: 'var(--inset)', borderRadius: 8 }}>
                    <SketchIcon name={s.icon} size={32} color="var(--ink)" />
                  </div>
                  <h3 className="display" style={{ fontSize: 'clamp(22px,3vw,30px)', margin: '18px 0 8px', fontWeight: 700 }}>{s.title}</h3>
                  <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55 }}>{s.desc}</p>
                  <div className="mono" style={{ marginTop: 24, color: 'var(--ink-3)', fontSize: 10 }}>STEP {s.n} / 03</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Quote */}
        <Reveal>
          <div className="pq-grid" style={{ marginTop: 60, padding: 'clamp(20px,4vw,36px) clamp(20px,4vw,40px)', background: 'var(--g500)', borderRadius: 16, color: '#fff' }}>
            <div className="pq-open-quote display" style={{ fontSize: 72, fontWeight: 800, lineHeight: 0.8, opacity: 0.4 }}>"</div>
            <div>
              <p className="display" style={{ fontSize: 'clamp(20px,2.6vw,28px)', fontWeight: 500, margin: 0, lineHeight: 1.3 }}>
                Flarehub doesn't teach you to pitch. It makes you <span className="display-italic">useful.</span>
              </p>
              <div className="mono" style={{ marginTop: 14, opacity: 0.7, fontSize: 11 }}>
                — Amani Otieno · Cohort 04 · Founder, Soma AI
              </div>
            </div>
            <div className="pq-avatar" style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--t500)', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, flexShrink: 0 }}>
              AO
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
