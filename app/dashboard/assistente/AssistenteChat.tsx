'use client'
import { useState, useRef, useEffect } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGESTOES = [
  'Qual foi meu faturamento nos últimos 30 dias?',
  'Por que meu lucro mudou vs o mês passado?',
  'Quais produtos estão perto de rupturar?',
  'Como está meu ACOS nos anúncios?',
]

// Chat reutilizável: preenche o container pai (height 100%). Usado na página
// /dashboard/assistente (container alto) e no painel flutuante (AssistenteFab).
// embedded=true esconde o cabeçalho grande (o painel já tem o seu).
export default function AssistenteChat({ embedded = false }: { embedded?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [msgs, loading])

  async function enviar(texto: string) {
    const q = texto.trim()
    if (!q || loading) return
    setErro(null)
    const historico = [...msgs, { role: 'user' as const, content: q }]
    setMsgs(historico)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: historico }),
      })
      const data = await res.json()
      if (!res.ok || data?.error) setErro(data?.error || 'Falha ao consultar o assistente.')
      else setMsgs([...historico, { role: 'assistant', content: data.reply || '(sem resposta)' }])
    } catch {
      setErro('Erro de rede ao falar com o assistente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {!embedded && (
        <div style={{ padding: '4px 2px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 34, height: 34, borderRadius: 999, background: 'var(--gold)', display: 'grid', placeItems: 'center', color: '#1a1200', fontWeight: 800 }}>✦</div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Assistente do Oráculo</h1>
          </div>
          <p style={{ color: 'var(--t3, #888)', fontSize: 13, opacity: 0.85 }}>Pergunte sobre faturamento, lucro, devoluções, estoque e anúncios — eu leio seus números reais da Amazon.</p>
        </div>
      )}

      {/* Área de mensagens (rola) */}
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 2px' }}>
        {msgs.length === 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {SUGESTOES.map((s) => (
              <button key={s} onClick={() => enviar(s)} style={{ border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--foreground)', borderRadius: 999, padding: '8px 12px', fontSize: 12.5, cursor: 'pointer', textAlign: 'left' }}>{s}</button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
            <div style={{
              background: m.role === 'user' ? 'var(--gold)' : 'var(--card)',
              color: m.role === 'user' ? '#1a1200' : 'var(--foreground)',
              border: m.role === 'user' ? 'none' : '1px solid var(--line)',
              borderRadius: 14, padding: '10px 14px', fontSize: 14.5, lineHeight: 1.55, whiteSpace: 'pre-wrap',
            }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ alignSelf: 'flex-start', color: 'var(--t3, #888)', fontSize: 13, opacity: 0.7, padding: '2px 4px' }}>consultando seus dados…</div>}
        {erro && <div style={{ alignSelf: 'flex-start', color: 'var(--foreground)', background: 'color-mix(in srgb, red 12%, var(--card))', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px', fontSize: 13.5 }}>{erro}</div>}
      </div>

      {/* Barra de input (fixa no rodapé do container) */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 10 }}>
        <input
          value={input}
          placeholder="Pergunte sobre seus números…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') enviar(input) }}
          disabled={loading}
          style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r, 12px)', padding: '11px 14px', color: 'var(--foreground)', fontSize: 14.5, outline: 'none' }}
        />
        <button onClick={() => enviar(input)} disabled={loading} style={{ background: 'var(--gold)', color: '#1a1200', border: 'none', borderRadius: 'var(--r, 12px)', padding: '0 18px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>Enviar</button>
      </div>
    </div>
  )
}
