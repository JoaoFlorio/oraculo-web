'use client'
// VISUAL NOVO DO PAINEL — em validação (05/10/2026). Só é renderizado para admin (ver page.tsx). Liga o atributo
// <html data-visual="ouro">, que troca as cores/fontes do painel (globals.css). O botão no canto alterna entre o
// visual novo e o antigo pra comparar; a escolha fica neste navegador (localStorage 'oraculo_visual').
// Pra liberar pra todos depois: renderizar para todo mundo (ou aplicar o bloco do CSS direto no :root).
import { useEffect, useState } from 'react'

export default function VisualNovo() {
  const [ligado, setLigado] = useState(true)
  useEffect(() => {
    try { if (localStorage.getItem('oraculo_visual') === 'antigo') setLigado(false) } catch { /* sem storage: fica ligado */ }
  }, [])
  useEffect(() => {
    const h = document.documentElement
    if (ligado) h.setAttribute('data-visual', 'ouro'); else h.removeAttribute('data-visual')
    try { localStorage.setItem('oraculo_visual', ligado ? 'ouro' : 'antigo') } catch { /* ok */ }
    return () => { h.removeAttribute('data-visual') }
  }, [ligado])
  return (
    <button type="button" onClick={() => setLigado(v => !v)} title="Só você (admin) vê este botão e o visual novo"
      style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 14, zIndex: 2147483000, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 13px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '.01em',
        fontFamily: 'var(--font-ui)', border: '1px solid rgba(255,200,61,.45)',
        background: ligado ? 'linear-gradient(180deg,#FFE7A3,#FFC83D 50%,#EBA31A)' : 'rgba(10,11,14,.9)',
        color: ligado ? '#1a1204' : '#FFE7A3', boxShadow: '0 10px 30px -10px rgba(0,0,0,.7)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: ligado ? '#1a1204' : '#7E796E' }} />
      Visual novo: {ligado ? 'ligado' : 'desligado'} · só você vê
    </button>
  )
}
