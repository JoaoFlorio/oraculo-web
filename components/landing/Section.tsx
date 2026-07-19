'use client'

/**
 * Blocos compartilhados das seções: cabeçalho (eyebrow+h2+lead),
 * mini-features, banner de CTA e rodapé de ícones de confiança.
 */

import type { CSSProperties, ReactNode } from 'react'
import Reveal from './Reveal'

export function SectionHead({ eyebrow, title, lead, center = true }: {
  eyebrow: string; title: ReactNode; lead?: ReactNode; center?: boolean
}) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', maxWidth: 780, margin: center ? '0 auto' : undefined }}>
      <Reveal>
        <span className="ora-kicker">{eyebrow}</span>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="ora-h2" style={{ margin: '20px 0 0' }}>{title}</h2>
      </Reveal>
      {lead && (
        <Reveal delay={0.16}>
          <p className="ora-lead" style={{ margin: center ? '18px auto 0' : '18px 0 0' }}>{lead}</p>
        </Reveal>
      )}
    </div>
  )
}

export function MiniFeature({ icon, title, desc, accent = 'var(--gold)', delay = 0 }: {
  icon: ReactNode; title: string; desc: string; accent?: string; delay?: number
}) {
  return (
    <Reveal delay={delay} className="ora-card ora-card-glow" style={{ padding: '22px 20px', textAlign: 'center' }}>
      <div style={{
        width: 46, height: 46, borderRadius: 14, margin: '0 auto 12px', display: 'grid', placeItems: 'center',
        color: accent, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--tx1)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.55 }}>{desc}</div>
    </Reveal>
  )
}

export function CtaBanner({ title, cta, href = '#planos', foot }: {
  title: ReactNode; cta: string; href?: string; foot?: ReactNode
}) {
  return (
    <Reveal delay={0.1}>
      <div className="ora-glass" style={{
        borderRadius: 20, padding: 'clamp(24px, 4vw, 38px)', marginTop: 'clamp(40px, 6vh, 64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
      }}>
        <div className="ora-display" style={{ fontSize: 'clamp(1.3rem, 2.6vw, 1.9rem)', fontWeight: 800, lineHeight: 1.2, minWidth: 240 }}>
          {title}
        </div>
        <a href={href} className="ora-cta" style={{ flexShrink: 0 }}>{cta} →</a>
        {foot && (
          <div style={{
            width: '100%', display: 'flex', gap: '8px 26px', flexWrap: 'wrap', justifyContent: 'center',
            paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', color: 'var(--tx3)', fontSize: 12.5,
          }}>
            {foot}
          </div>
        )}
      </div>
    </Reveal>
  )
}

export function FootIcon({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ color: 'var(--gold)', display: 'inline-flex' }}>{icon}</span>
      {label}
    </span>
  )
}

export const sectionWrap: CSSProperties = { position: 'relative', zIndex: 1 }
