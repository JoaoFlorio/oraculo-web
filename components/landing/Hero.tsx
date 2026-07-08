'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Play, ShieldCheck, ChevronDown } from 'lucide-react'
import HeroDashboard from './HeroDashboard'

// WebGL só no cliente (ssr:false exige Client Component — este arquivo é 'use client')
const EyeCanvas = dynamic(() => import('./EyeCanvas'), { ssr: false })

const CHECKOUT = 'https://payfast.greenn.com.br/pm36pq4/offer/B0febG' // mensal R$79,90

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 0.15 + i * 0.1 },
  }),
}

function EyeMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 48 48" fill="none" aria-hidden>
      <ellipse cx="24" cy="24" rx="22" ry="12" stroke="#F0C262" strokeWidth="2" />
      <circle cx="24" cy="24" r="7.5" fill="url(#g)" />
      <circle cx="24" cy="24" r="2.4" fill="#fff" />
      <defs>
        <radialGradient id="g" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0%" stopColor="#FFE7A6" />
          <stop offset="100%" stopColor="#C48F10" />
        </radialGradient>
      </defs>
    </svg>
  )
}

export default function Hero() {
  const reduce = useReducedMotion()
  const mouse = useRef({ x: 0, y: 0 })
  const [m, setM] = useState({ x: 0, y: 0 })
  const [allowWebgl, setAllowWebgl] = useState(false)

  useEffect(() => {
    setAllowWebgl(!reduce)
  }, [reduce])

  useEffect(() => {
    if (reduce) return
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -((e.clientY / window.innerHeight) * 2 - 1)
      mouse.current = { x, y }
      setM({ x, y })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [reduce])

  return (
    <section style={{ position: 'relative', minHeight: '100svh', overflow: 'hidden' }}>
      {/* fundo */}
      <div className="ora-backdrop" />
      <div className="ora-grid" />

      {/* composição do olho (foto + shader), centralizada atrás do conteúdo */}
      <div
        aria-hidden
        style={{
          position: 'absolute', left: '50%', top: '34%',
          width: 'min(1100px, 150vw)', height: 'min(1100px, 150vw)',
          transform: `translate(-50%,-50%) translate(${m.x * 14}px, ${m.y * 10}px)`,
          zIndex: 1, pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, opacity: 0.55,
          maskImage: 'radial-gradient(closest-side, #000 35%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(closest-side, #000 35%, transparent 72%)' }}>
          <Image
            src="/oracle-eye.png" alt="" fill priority sizes="1100px"
            style={{ objectFit: 'contain', filter: 'saturate(1.15) brightness(0.92)' }}
          />
        </div>
        {allowWebgl && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <EyeCanvas mouse={mouse} />
          </div>
        )}
      </div>

      {/* escurecimento p/ leitura do texto — miolo levemente escuro p/ contraste */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(78% 58% at 50% 40%, rgba(4,4,12,0.34) 0%, rgba(4,4,12,0.52) 52%, rgba(4,4,12,0.92) 100%)',
        pointerEvents: 'none' }} />

      {/* NAV */}
      <nav style={{
        position: 'relative', zIndex: 5, maxWidth: 1200, margin: '0 auto',
        padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EyeMark />
          <span className="ora-display" style={{ fontWeight: 700, fontSize: 19, letterSpacing: '.02em' }}>ORÁCULO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="ora-nav-links">
          {[{l:'Poderes',h:'#poderes'},{l:'Como funciona',h:'#como-funciona'},{l:'Preços',h:'/planos'}].map(({l,h}) => (
            <a key={l} href={h} style={{ color: 'var(--tx2)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/login" className="ora-cta-ghost" style={{ padding: '.6rem 1.05rem', fontSize: 14 }}>Entrar</a>
          <a href={CHECKOUT} className="ora-cta" style={{ padding: '.6rem 1.15rem', fontSize: 14 }}>Começar agora</a>
        </div>
      </nav>

      {/* CONTEÚDO CENTRAL */}
      <div style={{
        position: 'relative', zIndex: 5, maxWidth: 880, margin: '0 auto',
        padding: '0 24px', textAlign: 'center',
        paddingTop: 'clamp(48px, 9vh, 110px)',
      }}>
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
          <span className="ora-kicker"><span className="ora-dot" />Inteligência real para vendedores Amazon</span>
        </motion.div>

        <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show"
          style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)', fontWeight: 800, lineHeight: 1.02, margin: '22px 0 0' }}>
          Pare de adivinhar.<br /><span className="ora-goldtext">Comece a enxergar.</span>
        </motion.h1>

        <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
          style={{ fontSize: 'clamp(1.02rem, 2vw, 1.22rem)', color: 'var(--tx2)', maxWidth: 620, margin: '22px auto 0', lineHeight: 1.55 }}>
          Conecte sua conta Amazon e veja sua <strong style={{ color: 'var(--tx1)' }}>DRE real</strong>, seu lucro,
          seus anúncios e seus melhores produtos — automático, sem planilha.
        </motion.p>

        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
          style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 34 }}>
          <a href={CHECKOUT} className="ora-cta">Começar agora <ArrowRight size={18} /></a>
          <a href="#como-funciona" className="ora-cta-ghost"><Play size={16} /> Ver como funciona</a>
        </motion.div>

        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
          style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24, color: 'var(--tx3)', fontSize: 13 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} /> Integração oficial Amazon</span>
          <span>· Dados reais ·</span>
          <span>Acesso imediato</span>
        </motion.div>
      </div>

      {/* PAINEL FLUTUANTE */}
      <div style={{
        position: 'relative', zIndex: 4, display: 'flex', justifyContent: 'center',
        marginTop: 'clamp(36px, 6vh, 72px)', paddingBottom: 70,
        transform: `translate(${m.x * -8}px, ${m.y * -6}px)`,
      }}>
        <HeroDashboard />
      </div>

      {/* scroll cue */}
      <div className="ora-scrollcue" style={{
        position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
        zIndex: 5, color: 'var(--tx3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 12,
      }}>
        <span style={{ letterSpacing: '.1em' }}>ROLE</span>
        <ChevronDown size={18} />
      </div>

      {/* texturas por cima */}
      <div className="ora-noise" />
      <div className="ora-scan" />
    </section>
  )
}
