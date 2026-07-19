'use client'

/**
 * Selo flutuante da marca — olho do Oráculo dentro de uma argola tracejada
 * que gira, com halo pulsando.
 *
 * Além de assinatura visual, tem função: é um CTA persistente pros planos.
 * Aparece depois da primeira dobra (no topo o hero já tem CTA próprio) e
 * some quando a seção de planos entra na tela — ali ele seria redundante.
 * No hover/foco abre um rótulo "Começar agora".
 */

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export default function FloatingSeal() {
  const reduce = useReducedMotion()
  const [show, setShow] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const passouOHero = window.scrollY > window.innerHeight * 0.85
      const planos = document.getElementById('planos')
      // some quando os planos aparecem: o CTA já está na tela
      const planosAVista = planos
        ? planos.getBoundingClientRect().top < window.innerHeight * 0.75
        : false
      setShow(passouOHero && !planosAVista)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href="#planos"
          className="ora-seal"
          aria-label="Ver planos e começar agora"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          initial={reduce ? false : { opacity: 0, scale: 0.6, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, scale: 0.6, y: 16 }}
          transition={{ duration: 0.42, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {/* rótulo que abre no hover */}
          <AnimatePresence>
            {hover && (
              <motion.span
                className="ora-seal-label"
                initial={reduce ? false : { opacity: 0, x: 10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={reduce ? undefined : { opacity: 0, x: 10, width: 0 }}
                transition={{ duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }}
              >
                Começar agora
              </motion.span>
            )}
          </AnimatePresence>

          <span className="ora-seal-disc">
            {/* halo pulsando */}
            <span className="ora-seal-halo" aria-hidden />

            {/* argola tracejada girando */}
            <svg className="ora-seal-ring" viewBox="0 0 64 64" aria-hidden>
              <circle cx="32" cy="32" r="29" fill="none" stroke="url(#sealG)"
                strokeWidth="1.6" strokeDasharray="4 7" strokeLinecap="round" />
              <defs>
                <linearGradient id="sealG" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFE7A6" />
                  <stop offset="55%" stopColor="#F0C262" />
                  <stop offset="100%" stopColor="#C48F10" />
                </linearGradient>
              </defs>
            </svg>

            {/* argola interna contínua, girando ao contrário */}
            <svg className="ora-seal-ring2" viewBox="0 0 64 64" aria-hidden>
              <circle cx="32" cy="32" r="24" fill="none" stroke="#F0C262"
                strokeWidth="1" strokeDasharray="34 120" strokeLinecap="round" opacity="0.85" />
            </svg>

            {/* o olho da marca */}
            <svg className="ora-seal-eye" viewBox="0 0 48 48" fill="none" aria-hidden>
              <ellipse cx="24" cy="24" rx="17" ry="9.5" stroke="#F0C262" strokeWidth="2.4" />
              <circle cx="24" cy="24" r="6" fill="url(#sealEye)" />
              <circle cx="25.6" cy="22.4" r="1.9" fill="#FFF6E0" />
              <defs>
                <radialGradient id="sealEye" cx="0.4" cy="0.35" r="0.75">
                  <stop offset="0%" stopColor="#FFE7A6" />
                  <stop offset="100%" stopColor="#C48F10" />
                </radialGradient>
              </defs>
            </svg>
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  )
}
