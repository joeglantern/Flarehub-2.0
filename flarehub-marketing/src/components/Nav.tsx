import { useEffect, useState } from 'react'

function FlameMark() {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: 'var(--ink)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
      <svg viewBox="0 0 256 256" width="17" height="17" aria-hidden="true">
        <path d="M173.79,51.48a221.25,221.25,0,0,0-41.67-34.34,8,8,0,0,0-8.24,0A221.25,221.25,0,0,0,82.21,51.48C54.59,80.48,40,112.47,40,144a88,88,0,0,0,176,0C216,112.47,201.41,80.48,173.79,51.48ZM96,184c0-27.67,22.53-47.28,32-54.3,9.48,7,32,26.63,32,54.3a32,32,0,0,1-64,0Z" fill="white" />
      </svg>
      <span style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: 'var(--t500)', border: '2px solid var(--base)' }} />
    </span>
  )
}

const links = [
  { id: 'home', label: 'Home' },
  { id: 'process', label: 'Process' },
  { id: 'programs', label: 'Programs' },
  { id: 'about', label: 'About' },
  { id: 'mentors', label: 'Mentors' },
]

export function Nav({
  current,
  setPage,
  isDark,
  toggleDark,
}: {
  current: string
  setPage: (p: string) => void
  isDark: boolean
  toggleDark: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <button className="nav-logo" onClick={() => setPage('home')}>
        <FlameMark />
        Afosihub
      </button>
      <div className="nav-links">
        {links.map((l) => (
          <button
            key={l.id}
            className={`nav-link ${current === l.id ? 'active' : ''}`}
            onClick={() => setPage(l.id)}
          >
            {l.label}
          </button>
        ))}
        {/* Dark / light toggle */}
        <button
          onClick={toggleDark}
          aria-label="Toggle dark mode"
          title={isDark ? 'Switch to light' : 'Switch to dark'}
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: '1.5px solid var(--border-strong)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
            transition: 'background 160ms, border-color 160ms',
            marginLeft: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--inset)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        <button className="btn" style={{ marginLeft: 4 }} onClick={() => setPage('apply')}>
          Apply now →
        </button>
      </div>
      <button
        aria-label="menu"
        onClick={() => setMenuOpen((v) => !v)}
        style={{ display: 'none', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
        className="nav-mobile-btn"
      >
        ☰
      </button>
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--base)', zIndex: 60, display: 'flex', flexDirection: 'column', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
            <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22 }}>
              <FlameMark /> Afosihub
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={toggleDark}
                style={{ background: 'var(--inset)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
          </div>
          {links.map((l) => (
            <button
              key={l.id}
              className="nav-link"
              style={{ fontSize: 28, fontFamily: 'var(--display)', padding: '16px 0', textAlign: 'left' }}
              onClick={() => { setPage(l.id); setMenuOpen(false) }}
            >
              {l.label}
            </button>
          ))}
          <button className="btn" style={{ marginTop: 20 }} onClick={() => { setPage('apply'); setMenuOpen(false) }}>
            Apply now →
          </button>
        </div>
      )}
    </nav>
  )
}
