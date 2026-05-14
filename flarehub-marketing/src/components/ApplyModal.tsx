import { useEffect, useState } from 'react'

const programs = ['Flare Pre-seed', 'Growth Collective', 'Solo Founder Lab', 'Sauti — Women-led']
const stages = ['Idea', 'Prototype', 'Live users', 'Revenue']

type FormData = { name: string; email: string; program: string; idea: string; stage: string }

export function ApplyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>({ name: '', email: '', program: 'Flare Pre-seed', idea: '', stage: 'Idea' })

  useEffect(() => { if (!open) setStep(0) }, [open])

  if (!open) return null
  const total = 3
  const next = () => setStep((s) => Math.min(total, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))
  const refNum = Math.floor(Math.random() * 9000) + 1000

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(26,25,22,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 560, padding: 36,
          position: 'relative', border: '1px solid var(--border)',
          boxShadow: '0 40px 80px -30px rgba(0,0,0,0.5)',
          animation: 'popIn 380ms cubic-bezier(.3,1.3,.4,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'var(--inset)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 18 }}>×</button>
        <div className="mono" style={{ color: 'var(--t500)', marginBottom: 8 }}>Step {step + 1} / {total + 1}</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {Array.from({ length: total + 1 }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? 'var(--g500)' : 'var(--inset)', transition: 'background 240ms' }} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h3 className="display" style={{ fontSize: 36, margin: 0, fontWeight: 700 }}>Who's this?</h3>
            <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>First, the basics.</p>
            <div style={{ marginTop: 20 }}>
              <label className="mono" style={{ color: 'var(--ink-2)' }}>Your name</label>
              <input className="input" style={{ marginTop: 6 }} value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Wambui Njeri" />
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="mono" style={{ color: 'var(--ink-2)' }}>Email</label>
              <input className="input" type="email" style={{ marginTop: 6 }} value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="you@example.co.ke" />
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h3 className="display" style={{ fontSize: 36, margin: 0, fontWeight: 700 }}>Which program?</h3>
            <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>Pick one. You can change later.</p>
            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              {programs.map((p) => (
                <label key={p} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10,
                  border: `1.5px solid ${data.program === p ? 'var(--g500)' : 'var(--border)'}`,
                  background: data.program === p ? '#edf7f1' : 'var(--surface)',
                  cursor: 'pointer', transition: 'all 160ms',
                }}>
                  <input type="radio" checked={data.program === p} onChange={() => setData({ ...data, program: p })} />
                  <span style={{ fontWeight: 500 }}>{p}</span>
                </label>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h3 className="display" style={{ fontSize: 36, margin: 0, fontWeight: 700 }}>Tell us about it.</h3>
            <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>In your own words. No jargon points.</p>
            <div style={{ marginTop: 20 }}>
              <label className="mono" style={{ color: 'var(--ink-2)' }}>Your idea in 2–3 sentences</label>
              <textarea
                className="input"
                style={{ marginTop: 6, minHeight: 120, resize: 'vertical', fontFamily: 'var(--body)' }}
                value={data.idea}
                onChange={(e) => setData({ ...data, idea: e.target.value })}
                placeholder="A better way to pay farmers using USSD..."
              />
              <div className="mono" style={{ color: 'var(--ink-3)', marginTop: 4, textAlign: 'right' }}>{data.idea.length} / 400</div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="mono" style={{ color: 'var(--ink-2)' }}>Stage</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {stages.map((s) => (
                  <button key={s} className={`pill ${data.stage === s ? 'active' : ''}`} onClick={() => setData({ ...data, stage: s })}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <h3 className="display" style={{ fontSize: 40, margin: 0, fontWeight: 700 }}>You're in the pile!</h3>
            <p style={{ color: 'var(--ink-2)', marginTop: 10 }}>
              We'll email <strong style={{ color: 'var(--ink)' }}>{data.email || 'you'}</strong> within 7 days.
              Real humans read every one.
            </p>
            <span className="sticker sticker-terra" style={{ display: 'inline-flex', marginTop: 20 }}>
              Reference #FH-{refNum}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          {step > 0 && step < 3 ? (
            <button className="btn btn-ghost" onClick={back}>← Back</button>
          ) : <div />}
          {step < 2 && <button className="btn" onClick={next} disabled={step === 0 && (!data.name || !data.email)}>Continue →</button>}
          {step === 2 && <button className="btn btn-terra" onClick={next}>Submit application →</button>}
          {step === 3 && <button className="btn" onClick={onClose}>Close</button>}
        </div>
      </div>
    </div>
  )
}
