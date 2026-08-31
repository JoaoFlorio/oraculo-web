'use client'
import { useState, useEffect } from 'react'
import AssistenteChat from './assistente/AssistenteChat'

// Botão flutuante do SUPORTE — tira dúvida sobre o Oráculo, de qualquer aba.
// Não é o NEO: quem analisa os números do vendedor é o agente da aba "Agente
// NEO". Fica ACIMA do FAB do WhatsApp (bottom:24/right:24/z-index:90) e também
// abre pelo evento 'oraculo:abrir-assistente'.
//
// 31/08: encolhido para uma BOLINHA (só o símbolo) e ganhou um × pra o cliente
// DISPENSAR quando estiver cobrindo a tela (ex.: a coluna da lupa no Top 15). O
// dispensar vale só pra sessão — volta no reload, porque este FAB é o ÚNICO jeito
// de abrir o suporte (nada mais dispara o evento) e some-lo pra sempre tiraria o
// suporte do cliente.
export default function AssistenteFab() {
  const [aberto, setAberto] = useState(false)
  const [oculto, setOculto] = useState(false)

  useEffect(() => {
    const abrir = () => { setOculto(false); setAberto(true) }
    window.addEventListener('oraculo:abrir-assistente', abrir)
    return () => window.removeEventListener('oraculo:abrir-assistente', abrir)
  }, [])

  if (oculto) return null

  return (
    <>
      {/* Painel do chat (acima do botão) */}
      {aberto && (
        <div style={{
          position: 'fixed', zIndex: 95, right: 20, bottom: 148,
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

      {/* Bolinha compacta — só o símbolo, com um × pra dispensar */}
      <div style={{ position: 'fixed', zIndex: 96, right: 20, bottom: 84 }}>
        <button
          onClick={() => setAberto((v) => !v)}
          aria-label={aberto ? 'Fechar suporte' : 'Abrir suporte'}
          title="Suporte do Oráculo"
          style={{
            width: 46, height: 46, borderRadius: 999, border: 'none', cursor: 'pointer',
            background: 'var(--gold)', color: '#1a1200', fontWeight: 800, fontSize: 21, lineHeight: 1,
            display: 'grid', placeItems: 'center',
            boxShadow: '0 10px 30px color-mix(in srgb, var(--gold) 40%, transparent)',
          }}
        >
          {aberto ? '×' : '?'}
        </button>
        {/* × pra dispensar a bolinha (só quando fechada). Volta no próximo reload. */}
        {!aberto && (
          <button
            onClick={() => setOculto(true)}
            aria-label="Dispensar o suporte"
            title="Esconder por agora (volta quando recarregar a página)"
            style={{
              position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: 999,
              border: '1px solid var(--line2)', cursor: 'pointer', padding: 0,
              background: 'var(--modal, var(--bg))', color: 'var(--t2)', fontSize: 13, lineHeight: 1,
              display: 'grid', placeItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
            }}
          >
            ×
          </button>
        )}
      </div>
    </>
  )
}
