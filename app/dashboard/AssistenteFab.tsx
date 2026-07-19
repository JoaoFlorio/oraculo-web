'use client'
import { useState, useEffect } from 'react'
import AssistenteChat from './assistente/AssistenteChat'

// Botão flutuante do SUPORTE — tira dúvida sobre o Oráculo, de qualquer aba.
// Não é o NEO: quem analisa os números do vendedor é o agente da aba "Agente
// NEO". Fica ACIMA do FAB do WhatsApp (bottom:24/right:24/z-index:90) e também
// abre pelo evento 'oraculo:abrir-assistente'.
export default function AssistenteFab() {
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    const abrir = () => setAberto(true)
    window.addEventListener('oraculo:abrir-assistente', abrir)
    return () => window.removeEventListener('oraculo:abrir-assistente', abrir)
  }, [])

  return (
    <>
      {/* Painel do chat (acima do botão) */}
      {aberto && (
        <div style={{
          position: 'fixed', zIndex: 95, right: 24, bottom: 156,
          width: 'min(400px, calc(100vw - 32px))', height: 'min(600px, calc(100dvh - 190px))',
          background: 'var(--modal, var(--bg))', border: '1px solid var(--line)',
          borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ width: 26, height: 26, borderRadius: 999, background: 'var(--gold)', display: 'grid', placeItems: 'center', color: '#1a1200', fontWeight: 800, fontSize: 13 }}>?</div>
            <div style={{ fontWeight: 700, fontSize: 14.5, flex: 1 }}>Suporte do Oráculo</div>
            <button onClick={() => setAberto(false)} aria-label="Fechar" style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: 20, lineHeight: 1, cursor: 'pointer', opacity: 0.7, padding: 4 }}>×</button>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 12px' }}>
            <AssistenteChat embedded agent="suporte" />
          </div>
        </div>
      )}

      {/* Botão flutuante — empilhado acima do WhatsApp */}
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Abrir suporte"
        style={{
          position: 'fixed', zIndex: 96, right: 24, bottom: 88,
          height: 52, minWidth: 52, padding: aberto ? 0 : '0 18px 0 14px', width: aberto ? 52 : 'auto',
          borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'var(--gold)', color: '#1a1200', fontWeight: 800, fontSize: 13.5,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 10px 30px color-mix(in srgb, var(--gold) 40%, transparent)',
        }}
      >
        <span style={{ fontSize: 19 }}>{aberto ? '×' : '?'}</span>
        {!aberto && <span>Suporte</span>}
      </button>
    </>
  )
}
