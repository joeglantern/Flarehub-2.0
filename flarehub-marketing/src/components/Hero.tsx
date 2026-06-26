import { CountUp, MarkerPortrait, Reveal, Squiggle } from './primitives'

const partners = ['UNICEF', 'KeNIA', 'KCB', 'NETFUND', 'CEMASTEA', 'gDIH']

export function Hero({ setPage }: { setPage: (p: string) => void }) {
  return (
    <section className="section dot-grid" style={{ paddingTop: 40, paddingBottom: 40, position: 'relative', minHeight: 'calc(100vh - 80px)' }}>
      {/* Ambient background orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '6%', right: '3%', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,111,66,0.1) 0%, transparent 60%)', animation: 'orb-1 9s ease-in-out infinite', filter: 'blur(54px)' }} />
        <div style={{ position: 'absolute', top: '52%', left: '-7%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,82,42,0.08) 0%, transparent 60%)', animation: 'orb-2 13s ease-in-out infinite', filter: 'blur(58px)' }} />
        <div style={{ position: 'absolute', top: '22%', left: '36%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,111,66,0.05) 0%, transparent 60%)', animation: 'orb-3 7s ease-in-out infinite 1.5s', filter: 'blur(42px)' }} />
      </div>

      {/* Floating stickers — hidden on mobile via CSS */}
      <div className="hero-stickers" style={{ position: 'absolute', top: 80, right: 40, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-end', zIndex: 2 }}>
        <span className="sticker" style={{ transform: 'rotate(3deg)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
          For young Kenyan founders
        </span>
        <span className="sticker sticker-terra" style={{ transform: 'rotate(-4deg)' }}>Cohort 07 · Open</span>
      </div>

      <div className="container" style={{ position: 'relative' }}>
        <div className="hero-grid">
          {/* Left — copy */}
          <div>
            <Reveal delay={80}>
              <h1 className="display" style={{ fontSize: 'clamp(48px, 8.4vw, 132px)', margin: 0, color: 'var(--ink)' }}>
                Build{' '}<br />
                <span style={{ fontWeight: 300 }}>something </span>
                <span className="squiggle display-italic" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                  real
                  <Squiggle />
                </span>
                .
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p style={{ fontSize: 'clamp(16px,2vw,19px)', color: 'var(--ink-2)', maxWidth: 520, marginTop: 32, lineHeight: 1.55 }}>
                A cohort-based launchpad for Kenyan founders under 30. Mentors who've done the thing.
                Funding that shows up. Milestones that mean it.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="hero-btns" style={{ display: 'flex', gap: 12, marginTop: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn" onClick={() => setPage('apply')}>
                  Start your application <span>→</span>
                </button>
                <button className="btn btn-ghost" onClick={() => setPage('process')}>
                  How it works
                </button>
                <div className="mono" style={{ color: 'var(--ink-2)', marginLeft: 4 }}>⏱ 6 min</div>
              </div>
            </Reveal>
            <Reveal delay={340}>
              <div className="hero-stats" style={{ marginTop: 48, display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                <div>
                  <div className="display" style={{ fontSize: 'clamp(28px,4vw,40px)', color: 'var(--g500)', fontWeight: 800 }}>
                    <CountUp to={36} suffix="K+" />
                  </div>
                  <div className="mono" style={{ color: 'var(--ink-2)' }}>Youth registered</div>
                </div>
                <div>
                  <div className="display" style={{ fontSize: 'clamp(28px,4vw,40px)', color: 'var(--t500)', fontWeight: 800 }}>
                    <CountUp to={300} suffix="+" />
                  </div>
                  <div className="mono" style={{ color: 'var(--ink-2)' }}>YCIC applications</div>
                </div>
                <div>
                  <div className="display" style={{ fontSize: 'clamp(28px,4vw,40px)', color: 'var(--ink)', fontWeight: 800 }}>
                    <CountUp to={10} />
                  </div>
                  <div className="mono" style={{ color: 'var(--ink-2)' }}>Innovators funded</div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={420}>
              <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-3)' }}>
                <svg width="16" height="24" viewBox="0 0 16 24" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
                  <circle cx="8" cy="6" r="2" fill="currentColor" className="scroll-dot" />
                </svg>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', opacity: 0.6 }}>SCROLL</span>
              </div>
            </Reveal>
          </div>

          {/* Right — portrait collage (hidden on mobile) */}
          <div className="hero-portrait" style={{ position: 'relative', height: 520 }}>
            {/* Ambient portrait rings */}
            <div style={{ position: 'absolute', left: 12, top: 8, width: 400, height: 460, borderRadius: '50%', border: '2px dashed rgba(29,111,66,0.16)', animation: 'spin-slow 26s linear infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: 28, top: 24, width: 368, height: 428, borderRadius: '42% 58% 54% 46% / 50% 44% 56% 50%', border: '1.5px dashed rgba(196,82,42,0.13)', animation: 'spin-slow-reverse 19s linear infinite', pointerEvents: 'none' }} />
            <div style={{
              position: 'absolute', right: -20, top: 20, width: 220, height: 280,
              background: 'var(--surface)',
              backgroundImage: 'repeating-linear-gradient(0deg,rgba(29,111,66,0.08) 0 1px,transparent 1px 24px),repeating-linear-gradient(90deg,rgba(29,111,66,0.08) 0 1px,transparent 1px 24px)',
              transform: 'rotate(4deg)', borderRadius: 4,
              boxShadow: '0 6px 20px -8px rgba(26,25,22,0.25)', border: '1px solid var(--border)',
            }} />
            <div style={{ position: 'absolute', left: 40, top: 40 }}>
              <MarkerPortrait seed={1} rotate={-3} w={340} h={400} />
            </div>
            <svg style={{ position: 'absolute', left: -20, top: 420, width: 180, height: 80 }} viewBox="0 0 180 80">
              <path d="M20 60 C 40 30, 80 30, 120 50" stroke="var(--t500)" strokeWidth="2.2" fill="none" strokeDasharray="1 6" strokeLinecap="round" />
              <path d="M112 44 L 122 50 L 114 58" stroke="var(--t500)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <text x="10" y="48" fontFamily="var(--display)" fontSize="18" fontStyle="italic" fill="var(--ink)">that's User</text>
            </svg>
            <div style={{
              position: 'absolute', right: 40, bottom: 40,
              background: '#f9ddd1', padding: '14px 16px', borderRadius: 2,
              transform: 'rotate(-5deg)', boxShadow: '2px 8px 20px -6px rgba(26,25,22,0.25)',
              fontFamily: 'var(--display)', fontSize: 15, maxWidth: 180, lineHeight: 1.3, color: '#1a1916',
            }}>
              <div className="mono" style={{ color: 'var(--t600)', fontSize: 10, marginBottom: 6 }}>COHORT 05 · 2025</div>
              Raised KES 4.2M in her first round. Now hiring.
            </div>
            <div style={{
              position: 'absolute', right: 10, top: 10, width: 96, height: 96, borderRadius: '50%',
              border: '2.5px dashed var(--t500)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: 'rotate(-15deg)', color: 'var(--t500)',
              fontFamily: 'var(--mono)', fontSize: 10, textAlign: 'center', lineHeight: 1.2, padding: 10,
            }}>
              APPS<br />OPEN<br />★
            </div>
          </div>
        </div>
      </div>

      {/* Scroll marquee */}
      <div className="marquee" style={{ marginTop: 80 }}>
        <div className="marquee-track">
          {[1, 2].flatMap((k) => [
            <span className="marquee-item" key={`a${k}`}>36K+ Youth Registered</span>,
            <span className="marquee-dot" key={`d1${k}`} />,
            <span className="marquee-item" key={`b${k}`}>300+ YCIC Applications</span>,
            <span className="marquee-dot" key={`d2${k}`} />,
            <span className="marquee-item" key={`c${k}`}>10 Innovators Funded</span>,
            <span className="marquee-dot" key={`d3${k}`} />,
            <span className="marquee-item" key={`e${k}`}>KES 2.5M Seed Deployed</span>,
            <span className="marquee-dot" key={`d4${k}`} />,
            <span className="marquee-item" key={`f${k}`}>YCIC Cohort 1 · 2025</span>,
            <span className="marquee-dot" key={`d5${k}`} />,
            <span className="marquee-item" key={`g${k}`}>Nairobi · Mombasa · Kisumu</span>,
            <span className="marquee-dot" key={`d6${k}`} />,
          ])}
        </div>
      </div>

      {/* Partners strip */}
      <div className="container" style={{ marginTop: 48 }}>
        <div className="mono" style={{ color: 'var(--ink-3)', marginBottom: 20, textAlign: 'center' }}>Backed &amp; supported by</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {partners.map((p, i) => (
            <div key={p} style={{
              padding: '16px 28px', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14,
              letterSpacing: '-0.01em', color: 'var(--ink-3)',
              borderRight: i < partners.length - 1 ? '1px solid var(--border)' : 'none',
              borderBottom: '0',
              transition: 'color 160ms, background 160ms',
              cursor: 'default', flex: '1 1 auto', textAlign: 'center',
              background: 'var(--surface)',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.background = 'var(--elevated)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-3)'; e.currentTarget.style.background = 'var(--surface)' }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
