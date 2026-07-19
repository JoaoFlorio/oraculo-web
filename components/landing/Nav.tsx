'use client'

/**
 * Navegação da landing.
 *
 * Desktop: links inline + Entrar/Começar.
 * Mobile/tablet: botão de menu abre um drawer com os links e os CTAs.
 * Fecha no ESC, ao clicar num link, ou tocando fora. Trava o scroll do body
 * enquanto aberto e devolve o foco ao botão ao fechar.
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Menu, X, ArrowRight } from 'lucide-react'
import { EyeMark } from './marks'

const LINKS = [
  { l: 'Gestão', h: '#gestao' },
  { l: 'Como funciona', h: '#como-funciona' },
  { l: 'Mineração', h: '#mineracao' },
  { l: 'Inteligência', h: '#inteligencia' },
  { l: 'NEO', h: '#agente' },
  { l: 'Preços', h: '#planos' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  // ESC fecha + trava o scroll do body enquanto o drawer está aberto
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    // foco no painel pra leitores de tela seguirem a abertura
    panelRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  const close = () => {
    setOpen(false)
    btnRef.current?.focus()
  }

  return (
    <>
      <nav style={{
        position: 'relative', zIndex: 6, maxWidth: 1240, margin: '0 auto',
        padding: '20px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
      }}>
        <a href="#" className="ora-brand-link" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--tx1)', flexShrink: 0 }}>
          <EyeMark />
          <span className="ora-display" style={{ fontWeight: 700, fontSize: 19, letterSpacing: '.04em' }}>ORÁCULO</span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 26 }} className="ora-nav-links">
          {LINKS.map(({ l, h }) => (
            <a key={l} href={h} style={{ color: 'var(--tx2)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>

        {/* CTAs — só no desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="ora-nav-cta">
          <a href="/login" className="ora-cta-ghost" style={{ padding: '.58rem 1.05rem', fontSize: 14 }}>Entrar</a>
          <a href="#planos" className="ora-cta" style={{ padding: '.58rem 1.15rem', fontSize: 14 }}>Começar agora</a>
        </div>

        {/* botão de menu — só no mobile/tablet */}
        <button
          ref={btnRef}
          type="button"
          className="ora-nav-burger"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="ora-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="ora-nav-scrim"
              onClick={close}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.22 }}
            />
            <motion.div
              id="ora-menu"
              ref={panelRef}
              tabIndex={-1}
              className="ora-nav-panel"
              initial={reduce ? false : { opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: 0.26, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {LINKS.map(({ l, h }) => (
                <a key={l} href={h} onClick={close} className="ora-nav-panel-link">
                  {l}
                  <ArrowRight size={15} style={{ opacity: 0.45 }} />
                </a>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                <a href="#planos" onClick={close} className="ora-cta" style={{ justifyContent: 'center' }}>
                  Começar agora <ArrowRight size={17} />
                </a>
                <a href="/login" onClick={close} className="ora-cta-ghost" style={{ justifyContent: 'center' }}>
                  Entrar
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
