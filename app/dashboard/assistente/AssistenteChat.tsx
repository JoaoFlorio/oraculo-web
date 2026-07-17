'use client'
import { useState, useRef, useEffect } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGESTOES = [
  'Qual foi meu faturamento nos últimos 30 dias?',
  'Por que meu lucro mudou em relação ao mês passado?',
  'Quais produtos estão perto de rupturar o estoque?',
  'Como está meu ACOS nos anúncios?',
]

export default function AssistenteChat({ userName }: { userName: string }) {
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
      if (!res.ok || data?.error) {
        setErro(data?.error || 'Falha ao consultar o assistente.')
      } else {
        setMsgs([...historico, { role: 'assistant', content: data.reply || '(sem resposta)' }])
      }
    } catch {
      setErro('Erro de rede ao falar com o assistente.')
    } finally {
      setLoading(false)
    }
  }

  const S = {
    page: { maxWidth: 820, margin: '0 auto', padding: '24px 16px 120px', minHeight: '100vh' } as const,
    head: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 } as const,
    dot: { width: 34, height: 34, borderRadius: 999, background: 'var(--gold)', display: 'grid', placeItems: 'center', color: '#1a1200', fontWeight: 800 } as const,
    sub: { color: 'var(--ink)', fontSize: 13, marginBottom: 18, opacity: 0.8 } as const,
    chip: { border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--foreground)', borderRadius: 999, padding: '8px 12px', fontSize: 13, cursor: 'pointer' } as const,
    bar: { position: 'fixed' as const, left: 0, right: 0, bottom: 0, padding: '12px 16px', background: 'linear-gradient(to top, var(--bg) 70%, transparent)', display: 'flex', justifyContent: 'center' },
    barInner: { width: '100%', maxWidth: 820, display: 'flex', gap: 8 } as const,
    input: { flex: 1, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius, 12px)', padding: '12px 14px', color: 'var(--foreground)', fontSize: 15, outline: 'none' } as const,
    send: { background: 'var(--gold)', color: '#1a1200', border: 'none', borderRadius: 'var(--radius, 12px)', padding: '0 18px', fontWeight: 700, cursor: 'pointer' } as const,
  }

  return (
    <div style={S.page}>
      <div style={S.head}>
        <div style={S.dot}>✦</div>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Assistente do Oráculo</h1>
      </div>
      <p style={S.sub}>Pergunte sobre faturamento, lucro, devoluções, estoque e anúncios — eu leio seus números reais da Amazon.</p>

      {msgs.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {SUGESTOES.map((s) => (
            <button key={s} style={S.chip} onClick={() => enviar(s)}>{s}</button>
          ))}
        </div>
      )}

      <div ref={scrollRef} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{
              background: m.role === 'user' ? 'var(--gold)' : 'var(--card)',
              color: m.role === 'user' ? '#1a1200' : 'var(--foreground)',
              border: m.role === 'user' ? 'none' : '1px solid var(--line)',
              borderRadius: 14, padding: '10px 14px', fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap',
            }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--ink)', fontSize: 14, opacity: 0.7, padding: '4px 4px' }}>
            consultando seus dados…
          </div>
        )}
        {erro && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--foreground)', background: 'color-mix(in srgb, red 12%, var(--card))', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px', fontSize: 14 }}>
            {erro}
          </div>
        )}
      </div>

      <div style={S.bar}>
        <div style={S.barInner}>
          <input
            style={S.input}
            value={input}
            placeholder="Pergunte sobre seus números…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') enviar(input) }}
            disabled={loading}
          />
          <button style={S.send} onClick={() => enviar(input)} disabled={loading}>Enviar</button>
        </div>
      </div>
    </div>
  )
}
