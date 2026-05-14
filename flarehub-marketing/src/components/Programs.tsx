import { useState, useEffect, useRef } from 'react'
import { CountUp, Reveal, Squiggle } from './primitives'

const tabs = ['All', 'Pre-seed', 'Growth', 'Solo', 'Women-led']

const programs = [
  { title: 'Program', cat: 'Pre-seed',   deadline: 'May 14',  spots: 8,  total: 20, amount: 'KES 500k',  focus: 'Program description',            tags: ['Mentorship', 'KES 500k', '12 weeks'] },
  { title: 'Program',       cat: 'Growth',     deadline: 'Jun 02',  spots: 3,  total: 10, amount: 'KES 2M',    focus: 'Program description',         tags: ['Capital', 'Hiring', '16 weeks'] },
  { title: 'Program',        cat: 'Solo',       deadline: 'May 28',  spots: 14, total: 30, amount: 'Stipend',   focus: 'Program description',         tags: ['Community', 'Stipend', '8 weeks'] },
  { title: 'Program',  cat: 'Women-led',  deadline: 'Jun 20',  spots: 6,  total: 15, amount: 'KES 1.5M',  focus: 'Program description',                tags: ['Capital', 'Childcare', '14 weeks'] },
  { title: 'Program',        cat: 'Pre-seed',   deadline: 'Jul 05',  spots: 11, total: 20, amount: 'KES 350k',  focus: 'Program description',           tags: ['Mentorship', 'Studio', '10 weeks'] },
  { title: 'Program',         cat: 'Growth',     deadline: 'Rolling', spots: 2,  total: 6,  amount: 'KES 3M',    focus: 'Program description',            tags: ['Relocation', 'Capital'] },
]

export function Programs({ setPage }: { setPage: (p: string) => void }) {
  const [filter, setFilter] = useState('All')
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const list = filter === 'All' ? programs : programs.filter((p) => p.cat === filter)

  const changeFilter = (t: string) => {
    setVisible(false)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { setFilter(t); setVisible(true) }, 220)
  }
  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <section className="section" style={{ position: 'relative' }}>
      <div className="container">
        <Reveal>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <div className="mono" style={{ color: 'var(--t500)', marginBottom: 12 }}>▸ 004 — What\u2019s open</div>
              <h2 className="display" style={{ fontSize: 'clamp(32px,6vw,96px)', margin: 0 }}>
                Active{' '}
                <span className="squiggle" style={{ color: 'var(--g500)' }}>
                  programs<Squiggle color="var(--t500)" />
                </span>
              </h2>
            </div>
            <div style={{ position: 'relative', paddingRight: 64 }}>
              <svg viewBox="0 0 120 70" width="80" height="50" style={{ position: 'absolute', right: 0, top: -8 }}>
                <path d="M10 55 C 40 10, 80 10, 110 40" stroke="var(--t500)" strokeWidth="2" strokeDasharray="1 5" fill="none" strokeLinecap="round" />
                <path d="M104 32 L 112 40 L 102 46" stroke="var(--t500)" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="display" style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, color: 'var(--g500)', lineHeight: 1 }}>
                  <CountUp to={list.length} />
                </div>
                <div>
                  <div className="mono" style={{ color: 'var(--ink-2)' }}>programs</div>
                  <div className="mono" style={{ color: 'var(--ink-3)' }}>live right now</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 40 }}>
            {tabs.map((t) => (
              <button key={t} className={`pill ${filter === t ? 'active' : ''}`} onClick={() => changeFilter(t)}>
                {t}
              </button>
            ))}
          </div>
        </Reveal>

        <div
          style={{
            marginTop: 40,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,320px),1fr))',
            gap: 28,
            alignItems: 'flex-start',
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(8px)',
            transition: 'opacity 200ms, transform 200ms',
          }}
        >
          {list.map((p, i) => {
            const fillPct = ((p.total - p.spots) / p.total) * 100
            const stagger = [0, 16, 32, 8, 24, 0][i % 6]
            return (
              <div
                key={p.title}
                className="card card-program folded"
                style={{
                  marginTop: stagger,
                  position: 'relative',
                  transition: 'transform 220ms cubic-bezier(.3,1.2,.3,1), box-shadow 220ms',
                  animationDelay: `${i * 40}ms`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px) rotate(-0.4deg)'
                  e.currentTarget.style.boxShadow = '-6px 14px 0 rgba(26,25,22,0.08), 0 18px 36px -20px rgba(26,25,22,0.35)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <div className="dog-ear" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div className="mono" style={{ color: 'var(--ink-3)', fontSize: 10 }}>{p.cat.toUpperCase()}</div>
                  <div className="mono" style={{ color: 'var(--t500)', fontSize: 11 }}>⏱ {p.deadline}</div>
                </div>
                <h3 className="display" style={{ fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 700, margin: '0 0 10px', color: 'var(--g500)' }}>{p.title}</h3>
                <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.5, minHeight: 56 }}>{p.focus}</p>
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="mono" style={{ color: 'var(--ink-2)' }}>Spots left</span>
                    <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{p.spots} / {p.total}</span>
                  </div>
                  <div className="rough-bar">
                    <div className="rough-fill" style={{ transform: `scaleX(${fillPct / 100})` }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 18 }}>
                  {p.tags.map((t) => (
                    <span key={t} className="mono" style={{ padding: '4px 9px', background: 'var(--inset)', borderRadius: 999, fontSize: 10, color: 'var(--ink-2)' }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, paddingTop: 18, borderTop: '1px dashed var(--border)' }}>
                  <div>
                    <div className="mono" style={{ color: 'var(--ink-3)', fontSize: 10 }}>FUNDING</div>
                    <div className="display" style={{ fontWeight: 700, color: 'var(--t500)', fontSize: 18 }}>{p.amount}</div>
                  </div>
                  <button className="btn" style={{ padding: '10px 14px', fontSize: 13 }} onClick={() => setPage('apply')}>Apply →</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
