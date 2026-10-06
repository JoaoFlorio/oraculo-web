'use client'
// Visual novo do painel (em validação, só admin): true quando <html data-visual="ouro"> está ligado e o tema é escuro.
// Acompanha ao vivo o botão "Visual novo: ligado/desligado" (VisualNovo.tsx). Pra quem não é admin, sempre false.
import { useEffect, useState } from 'react'

export function useVisualNovo(): boolean {
  const [novo, setNovo] = useState(false)
  useEffect(() => {
    const h = document.documentElement
    const ler = () => setNovo(h.getAttribute('data-visual') === 'ouro' && h.getAttribute('data-theme') !== 'light')
    ler()
    const mo = new MutationObserver(ler)
    mo.observe(h, { attributes: true, attributeFilter: ['data-visual', 'data-theme'] })
    return () => mo.disconnect()
  }, [])
  return novo
}
