import { useState } from 'react'
import { Reveal } from './primitives'

const faqs = [
  {
    q: 'Who can apply?',
    a: 'Anyone under 30 based in Kenya with a business idea, prototype, or early-stage company. You do not need a co-founder, formal registration, or previous startup experience. We look for grit and a real problem, not credentials.',
  },
  {
    q: 'Is it free to apply and participate?',
    a: 'Applying is completely free. Accepted founders join at no cost — Flarehub is funded by our partner funds and a small success fee from graduates who raise capital after graduating. You never pay us to participate.',
  },
  {
    q: 'What do I actually get from the program?',
    a: 'A dedicated mentor (weekly 45-minute sessions), access to our partner network, milestone tracking, co-working days in Nairobi, and access to our funding track if your metrics are strong. The exact package varies by program.',
  },
  {
    q: 'How long does each program run?',
    a: 'Programs range from 8 to 16 weeks depending on the track. Pre-seed is 12 weeks, Growth Collective is 16 weeks, Solo Founder Lab is 8 weeks. All timelines are listed on each program card.',
  },
  {
    q: 'Do I need to be in Nairobi?',
    a: 'Most programs are hybrid — some sessions are in-person in Nairobi, the rest are remote. The Diaspora Bridge track is fully remote and designed for Kenyan founders based abroad. We are expanding to Mombasa and Kisumu for in-person sessions in 2026.',
  },
  {
    q: 'What happens after I apply?',
    a: 'Real humans read every application within 7 business days. We email you either way. Shortlisted applicants get a 20-minute call with a program lead. Decisions are made within 14 days of your call.',
  },
  {
    q: 'Can I apply to more than one program?',
    a: 'You can apply to multiple programs in the same cycle, but we will match you to the one that fits your stage best. Applying to all of them does not increase your chances — focus on the one that is right for you.',
  },
  {
    q: 'Is there funding attached to every program?',
    a: 'Not every track includes direct funding. Pre-seed, Growth Collective, Sauti, and Diaspora Bridge include capital or stipends. Solo Founder Lab and Maker Fellowship include a stipend. Funding amounts are listed on each program card.',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="section alt-bg" style={{ position: 'relative' }}>
      <div className="container">
        <Reveal>
          <div className="mono" style={{ color: 'var(--t500)', marginBottom: 12 }}>▸ Questions</div>
          <h2 className="display" style={{ fontSize: 'clamp(32px,6vw,80px)', margin: 0 }}>
            Straight{' '}
            <span className="display-italic" style={{ color: 'var(--g500)' }}>answers</span>.
          </h2>
        </Reveal>

        <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,560px),1fr))', gap: '0 64px' }}>
          <div>
            {faqs.slice(0, Math.ceil(faqs.length / 2)).map((faq, i) => (
              <FaqItem key={i} faq={faq} index={i} open={open} setOpen={setOpen} />
            ))}
          </div>
          <div>
            {faqs.slice(Math.ceil(faqs.length / 2)).map((faq, i) => {
              const idx = i + Math.ceil(faqs.length / 2)
              return <FaqItem key={idx} faq={faq} index={idx} open={open} setOpen={setOpen} />
            })}
          </div>
        </div>

        <Reveal>
          <div style={{ marginTop: 60, padding: '28px 32px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>Still have questions?</p>
              <p style={{ margin: '4px 0 0', color: 'var(--ink-2)', fontSize: 14 }}>We read every email. Usually reply within a day.</p>
            </div>
            <a href="mailto:hello@flarehub.co.ke" className="btn btn-ghost">Email us →</a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function FaqItem({ faq, index, open, setOpen }: {
  faq: { q: string; a: string }
  index: number
  open: number | null
  setOpen: (i: number | null) => void
}) {
  const isOpen = open === index
  return (
    <Reveal delay={(index % 4) * 50}>
      <div className="faq-item">
        <button
          className="faq-trigger"
          onClick={() => setOpen(isOpen ? null : index)}
          aria-expanded={isOpen}
        >
          <span>{faq.q}</span>
          <span className="faq-icon" style={{ borderColor: isOpen ? 'var(--g500)' : undefined, color: isOpen ? 'var(--g500)' : undefined }}>
            {isOpen ? '−' : '+'}
          </span>
        </button>
        <div
          className="faq-body"
          style={{ maxHeight: isOpen ? 400 : 0, opacity: isOpen ? 1 : 0, transition: 'max-height 360ms cubic-bezier(.2,.8,.2,1), opacity 280ms' }}
        >
          <p>{faq.a}</p>
        </div>
      </div>
    </Reveal>
  )
}
