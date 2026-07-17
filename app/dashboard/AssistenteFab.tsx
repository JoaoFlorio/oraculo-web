'use client'
import { useState } from 'react'
import AssistenteChat from './assistente/AssistenteChat'

// Botão flutuante (canto inferior direito) que abre o Assistente num painel
// sobreposto — disponível de qualquer aba do dashboard. Mexe só neste componente,
// montado uma vez no dashboard; não toca na navegação existente.
export default function AssistenteFab() {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      {/* Painel do chat */}
      {aberto && (
        <div style={{
          position: 'fixed', zIndex: 60, right: 20, bottom: 92,
          width: 'min(400px, calc(100vw - 32px))', height: 'min(600px, calc(100dvh - 130px))',
          background: 'var(--modal, var(--bg))', border: '1px solid var(--line)',
          borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ width: 26, height: 26, borderRadius: 999, background: 'var(--gold)', display: 'grid', placeItems: 'center', color: '#1a1200', fontWeight: 800, fontSize: 13 }}>✦</div>
            <div style={{ fontWeight: 700, fontSize: 14.5, flex: 1 }}>Assistente do Oráculo</div>
            <button onClick={() => setAberto(false)} aria-label="Fechar" style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: 20, lineHeight: 1, cursor: 'pointer', opacity: 0.7, padding: 4 }}>×</button>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 12px' }}>
            <AssistenteChat embedded />
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Abrir assistente"
        style={{
          position: 'fixed', zIndex: 61, right: 20, bottom: 20,
          height: 56, minWidth: 56, padding: aberto ? 0 : '0 20px 0 16px', width: aberto ? 56 : 'auto',
          borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'var(--gold)', color: '#1a1200', fontWeight: 800, fontSize: 14,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 10px 30px color-mix(in srgb, var(--gold) 40%, transparent)',
        }}
      >
        <span style={{ fontSize: 20 }}>{aberto ? '×' : '✦'}</span>
        {!aberto && <span>Assistente</span>}
      </button>
    </>
  )
}
