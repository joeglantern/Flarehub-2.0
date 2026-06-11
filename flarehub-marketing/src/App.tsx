import { useEffect, useState } from 'react'
import './index.css'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Process } from './components/Process'
import { Programs } from './components/Programs'
import { About } from './components/About'
import { Mentors } from './components/Mentors'
import { CTAFooter } from './components/CTAFooter'
import { TornEdge } from './components/primitives'

type Theme = 'cream' | 'sage' | 'ink'
type Font = 'editorial' | 'grotesk'
type Page = 'home' | 'process' | 'programs' | 'about' | 'mentors'

export default function App() {
  const [page, setPage] = useState<Page>(() => {
    try { return (localStorage.getItem('fh:page') as Page) || 'home' } catch { return 'home' }
  })
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem('fh:theme') as Theme) || 'cream' } catch { return 'cream' }
  })
  const [font] = useState<Font>('editorial')

  const isDark = theme === 'ink'
  const toggleDark = () => {
    const next: Theme = isDark ? 'cream' : 'ink'
    setTheme(next)
    try { localStorage.setItem('fh:theme', next) } catch {}
  }

  useEffect(() => { try { localStorage.setItem('fh:page', page) } catch {} }, [page])
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    document.body.setAttribute('data-font', font)
  }, [theme, font])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [page])

  const go = (p: string) => {
    if (p === 'apply') { window.open('https://app.afosihub.com/signup', '_blank'); return }
    setPage(p as Page)
  }

  let body: React.ReactNode
  if (page === 'home') {
    body = (
      <>
        <Hero setPage={go} />
        <TornEdge fill="var(--elevated)" />
        <Process />
        <TornEdge fill="var(--base)" flip />
        <Programs setPage={go} />
        <TornEdge fill="var(--elevated)" />
        <About />
        <TornEdge fill="var(--base)" flip />
        <Mentors />
        <CTAFooter setPage={go} />
      </>
    )
  } else if (page === 'process') {
    body = <><Process /><TornEdge fill="var(--base)" flip /><Programs setPage={go} /><CTAFooter setPage={go} /></>
  } else if (page === 'programs') {
    body = <><Programs setPage={go} /><CTAFooter setPage={go} /></>
  } else if (page === 'about') {
    body = <><About /><TornEdge fill="var(--base)" flip /><Mentors /><CTAFooter setPage={go} /></>
  } else if (page === 'mentors') {
    body = <><Mentors /><CTAFooter setPage={go} /></>
  }

  return (
    <div key={page} style={{ animation: 'pageIn 380ms cubic-bezier(.2,.8,.2,1.05)' }}>
      <Nav current={page} setPage={go} isDark={isDark} toggleDark={toggleDark} />
      {body}
    </div>
  )
}
