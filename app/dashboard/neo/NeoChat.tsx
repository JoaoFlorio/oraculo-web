'use client'
import { useEffect, useState } from 'react'
import AssistenteChat from '../assistente/AssistenteChat'

// A aba do Agente NEO: o insight do dia no topo (ele fala ANTES de ser
// perguntado) e o chat logo abaixo. O cartão vem de /api/agent/insight, que
// tem cache de 12h no backend — abrir a aba várias vezes não custa nada.

type Insight = { texto: string; severidade: 'critico' | 'atencao' | 'ok'; geradoEm: string } | null

const CORES = {
  critico: { fundo: '#ef4444', rotulo: 'Precisa de decisão hoje' },
  atencao: { fundo: '#f59e0b', rotulo: 'Vale olhar' },
  ok:      { fundo: '#22c55e', rotulo: 'Operação na régua' },
} as const

export default function NeoChat() {
  const [ins, setIns] = useState<Insight>(null)
  const [carregando, setCarregando] = useState(true)
  // Sem Amazon conectada o NEO não tem o que ler. Melhor dizer isso com clareza
  // do que deixar o chat responder erro a cada pergunta.
  const [semConexao, setSemConexao] = useState(false)
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    let vivo = true
    fetch('/api/agent/insight', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return
        if (d?.connected === false) setSemConexao(true)
        else if (d?.demo) setDemo(true)
        else if (d?.texto) setIns(d)
      })
      .catch(() => {})
      .finally(() => { if (vivo) setCarregando(false) })
    return () => { vivo = false }
  }, [])

  const c = ins ? CORES[ins.severidade] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Cabeçalho — identidade do NEO */}
      <div style={{ padding: '4px 2px 12px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 38, height: 38, borderRadius: 999, background: 'var(--gold)', display: 'grid', placeItems: 'center', color: '#1a1200', fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>N</div>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.2 }}>Agente NEO</h1>
          <p style={{ color: 'var(--t3, #888)', fontSize: 12.5, opacity: 0.85 }}>O agente do João Florio. Lê os seus números e aponta a decisão.</p>
        </div>
      </div>

      {/* Sem conta Amazon: o NEO fica indisponível, e a gente explica por quê. */}
      {semConexao && (
        <div style={{ border: '1px solid var(--line)', borderLeft: '3px solid var(--gold)', borderRadius: 14, padding: '16px 18px', background: 'color-mix(in srgb, var(--gold) 7%, var(--card))' }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Conecte sua conta Amazon primeiro</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--t3, #888)' }}>
            O NEO trabalha em cima dos seus números reais — faturamento, margem, estoque, ACOS. Sem a conta conectada ele estaria chutando, e chute não ajuda ninguém.
            <br /><br />
            Vá em <strong style={{ color: 'var(--foreground)' }}>Gestão</strong> no menu e conecte sua conta. Leva um minuto.
            <br /><br />
            Dúvida sobre o Oráculo? Use o botão <strong style={{ color: 'var(--foreground)' }}>Suporte</strong> no canto da tela.
          </div>
        </div>
      )}

      {demo && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: '16px 18px', background: 'var(--card)', fontSize: 14, lineHeight: 1.6, color: 'var(--t3, #888)' }}>
          Esta é a conta de demonstração. O NEO analisa dados reais da Amazon, então aqui ele fica indisponível — teste numa conta com a Amazon conectada.
        </div>
      )}

      {/* Insight do dia */}
      {!semConexao && !demo && (carregando || ins) && (
        <div style={{
          border: '1px solid var(--line)', borderRadius: 14, padding: '13px 15px', marginBottom: 12,
          background: c ? `color-mix(in srgb, ${c.fundo} 8%, var(--card))` : 'var(--card)',
          borderLeft: c ? `3px solid ${c.fundo}` : '1px solid var(--line)',
        }}>
          {carregando ? (
            <div style={{ fontSize: 13.5, color: 'var(--t3, #888)', opacity: 0.8 }}>Lendo sua operação…</div>
          ) : ins && c ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: c.fundo, marginBottom: 6 }}>{c.rotulo}</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{ins.texto}</div>
            </>
          ) : null}
        </div>
      )}

      {!semConexao && !demo && (
        <div style={{ flex: 1, minHeight: 0 }}>
          <AssistenteChat agent="neo" embedded />
        </div>
      )}
    </div>
  )
}
