'use client'

/**
 * CTA final + rodapé.
 */

import Image from 'next/image'
import Reveal from './Reveal'
import { EyeMark } from './Hero'

export default function Footer() {
  return (
    <footer style={{ position: 'relative', background: 'var(--ink2)', overflow: 'hidden' }}>
      <div className="ora-divider" />

      {/* CTA final com o olho */}
      <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', padding: 'clamp(72px, 11vh, 120px) 24px 60px', textAlign: 'center' }}>
        <div aria-hidden style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-58%)',
          width: 'min(720px, 100vw)', height: 'min(720px, 100vw)', pointerEvents: 'none', opacity: 0.3,
          maskImage: 'radial-gradient(closest-side, #000 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(closest-side, #000 30%, transparent 70%)',
        }}>
          <Image src="/oracle-eye.png" alt="" fill sizes="720px" style={{ objectFit: 'contain' }} />
        </div>
        <Reveal>
          <h2 className="ora-h2" style={{ position: 'relative' }}>
            Pare de adivinhar.<br /><span className="ora-goldtext">Comece a enxergar.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="ora-lead" style={{ margin: '18px auto 0', position: 'relative' }}>
            Seu lucro real, seus melhores produtos e suas próximas oportunidades — num painel só.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div style={{ marginTop: 32, position: 'relative' }}>
            <a href="#planos" className="ora-cta" style={{ fontSize: '1.08rem', padding: '1.1rem 2.4rem' }}>
              Quero enxergar meu lucro real →
            </a>
          </div>
        </Reveal>
      </div>

      {/* rodapé */}
      <div style={{
        maxWidth: 1240, margin: '0 auto', padding: '28px 24px 40px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px 28px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EyeMark size={24} />
          <span className="ora-display" style={{ fontWeight: 700, fontSize: 16, letterSpacing: '.04em', color: 'var(--tx1)' }}>ORÁCULO</span>
        </div>
        <nav style={{ display: 'flex', gap: '10px 22px', flexWrap: 'wrap' }} aria-label="Rodapé">
          {[
            { l: 'Gestão', h: '#gestao' },
            { l: 'Como funciona', h: '#como-funciona' },
            { l: 'Mineração', h: '#mineracao' },
            { l: 'Preços', h: '#planos' },
            { l: 'Entrar', h: '/login' },
          ].map(({ l, h }) => (
            <a key={l} href={h} style={{ color: 'var(--tx2)', fontSize: 13, textDecoration: 'none' }}>{l}</a>
          ))}
        </nav>
        <div style={{ fontSize: 12, color: 'var(--tx3)', textAlign: 'right' }}>
          <a href="mailto:atendimento@oraculojf.com.br" style={{ color: 'var(--tx2)', textDecoration: 'none' }}>
            atendimento@oraculojf.com.br
          </a>
          <div style={{ marginTop: 4 }}>© 2026 Oráculo — Todos os direitos reservados.</div>
        </div>
      </div>
    </footer>
  )
}
