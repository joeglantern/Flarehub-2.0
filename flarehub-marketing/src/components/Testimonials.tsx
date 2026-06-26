import { Reveal } from './primitives'

const testimonials = [
  {
    quote: "I'd pitched to 12 investors and gotten nowhere. Afosihub paired me with a mentor who'd built in the exact same space. We fixed my unit economics in two sessions. Three months later I closed my first round.",
    name: 'User', role: 'Founder, PayHarvest · Cohort 03', avatar: 'U', bg: '#d0ecdb', accent: 'var(--g500)',
  },
  {
    quote: "The mentors don't waste your time. No motivational speeches. My mentor looked at my P&L on week one and told me I was burning in the wrong places. Painful. Correct. Exactly what I needed.",
    name: 'User', role: 'CEO, Thamani Logistics · Cohort 05', avatar: 'U', bg: '#f9ddd1', accent: 'var(--t500)',
  },
  {
    quote: "I was doing this alone and burning out. The Solo Founder Lab gave me a peer pod of four other founders at the same stage. We still talk every week, two years on.",
    name: 'User', role: 'Founder, Maisha Health · Cohort 04', avatar: 'U', bg: '#e8e4de', accent: 'var(--ink)',
  },
  {
    quote: "Afosihub is the only program I've seen that actually checks if your idea works with Kenyan infrastructure — not some sanitised version of it. They made us test with real USSD flows on day one.",
    name: 'User', role: 'CTO, AgroLink Kenya · Cohort 06', avatar: 'U', bg: '#d0ecdb', accent: 'var(--g500)',
  },
  {
    quote: "As a woman founder I was constantly having to prove myself first before people engaged with my idea. Sauti removed that tax entirely. I just got to build.",
    name: 'User', role: 'Founder, Soko Fresh · Sauti Track', avatar: 'U', bg: '#f9ddd1', accent: 'var(--t500)',
  },
  {
    quote: "We shipped our MVP in week 6. By graduation we had 140 paying users. The milestone structure forced us to stay honest about what 'done' actually meant.",
    name: 'User', role: 'Co-founder, Stori · Cohort 06', avatar: 'U', bg: '#e8e4de', accent: 'var(--ink)',
  },
]

export function Testimonials() {
  return (
    <section className="section" style={{ position: 'relative' }}>
      <div className="container">
        <Reveal>
          <div className="mono" style={{ color: 'var(--t500)', marginBottom: 12 }}>▸ What founders say</div>
          <h2 className="display" style={{ fontSize: 'clamp(32px,6vw,80px)', margin: 0 }}>
            Don't take our{' '}
            <span className="display-italic" style={{ color: 'var(--g500)' }}>word</span> for it.
          </h2>
          <p style={{ color: 'var(--ink-2)', marginTop: 16, fontSize: 17, maxWidth: 560, lineHeight: 1.55 }}>
            420 founders have been through Afosihub. Here's a few of them.
          </p>
        </Reveal>

        <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 24 }}>
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 60}>
              <div className="testimonial-card">
                {/* Quote mark */}
                <div style={{ fontFamily: 'var(--display)', fontSize: 64, fontWeight: 800, color: t.accent, lineHeight: 0.7, marginBottom: 12, opacity: 0.35 }}>"</div>
                <p style={{ margin: 0, color: 'var(--ink)', fontSize: 15, lineHeight: 1.65, fontStyle: 'italic' }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, paddingTop: 18, borderTop: '1px dashed var(--border)' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: t.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--display)', fontWeight: 800, fontSize: 13, color: t.accent,
                    flexShrink: 0, border: '1px solid var(--border)',
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{t.name}</div>
                    <div className="mono" style={{ color: 'var(--ink-3)', fontSize: 10, marginTop: 2 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Social proof bar */}
        <Reveal>
          <div style={{
            marginTop: 60, padding: '28px 36px',
            background: 'var(--elevated)', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            flexWrap: 'wrap', gap: 32, border: '1px solid var(--border)',
          }}>
            {[
              { n: '94%', label: 'would recommend Afosihub to a friend' },
              { n: '78%', label: 'of graduates still operating 12 months later' },
              { n: 'KES 64M', label: 'raised by cohort companies in total' },
            ].map((s) => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div className="display" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--g500)' }}>{s.n}</div>
                <div style={{ color: 'var(--ink-2)', fontSize: 13, marginTop: 4, maxWidth: 180 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
