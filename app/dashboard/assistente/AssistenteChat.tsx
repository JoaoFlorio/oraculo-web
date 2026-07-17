'use client'
import { useState, useRef, useEffect } from 'react'

type Img = { mediaType: string; data: string } // data = base64 sem prefixo
type Msg = { role: 'user' | 'assistant'; text: string; images?: Img[] }

const GPT_AGENT_URL = 'https://chatgpt.com/g/g-6a02736d422081918e58416c49426a3a-oraculo-ia-especialista-em-marketplace'
const SUGESTOES = [
  'Qual foi meu faturamento nos últimos 30 dias?',
  'Por que meu lucro mudou vs o mês passado?',
  'Quais produtos estão perto de rupturar?',
  'Como funciona a Gestão do Oráculo?',
]
const MAX_IMGS = 3

// Converte um File de imagem em { mediaType, base64 } (sem o prefixo data:).
function lerImagem(file: File): Promise<Img> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const s = String(r.result || '')
      const m = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/.exec(s)
      if (!m) return reject(new Error('formato inválido'))
      resolve({ mediaType: m[1], data: m[2] })
    }
    r.onerror = () => reject(new Error('falha ao ler'))
    r.readAsDataURL(file)
  })
}

// Monta o content da mensagem do jeito que a API espera (texto ou texto+imagens).
function toApiContent(m: Msg): any {
  if (!m.images?.length) return m.text
  return [
    ...m.images.map((im) => ({ type: 'image', source: { type: 'base64', media_type: im.mediaType, data: im.data } })),
    ...(m.text ? [{ type: 'text', text: m.text }] : []),
  ]
}

export default function AssistenteChat({ embedded = false }: { embedded?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [pend, setPend] = useState<Img[]>([]) // imagens anexadas aguardando envio
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [msgs, loading, pend])

  async function anexar(files: FileList | null) {
    if (!files?.length) return
    setErro(null)
    const novas: Img[] = []
    for (const f of Array.from(files)) {
      if (pend.length + novas.length >= MAX_IMGS) break
      if (f.size > 5 * 1024 * 1024) { setErro('Cada imagem deve ter até 5MB.'); continue }
      try { novas.push(await lerImagem(f)) } catch { setErro('Não consegui ler essa imagem.') }
    }
    if (novas.length) setPend((p) => [...p, ...novas].slice(0, MAX_IMGS))
    if (fileRef.current) fileRef.current.value = ''
  }

  async function enviar(texto: string) {
    const q = texto.trim()
    if ((!q && pend.length === 0) || loading) return
    setErro(null)
    const userMsg: Msg = { role: 'user', text: q, images: pend.length ? pend : undefined }
    const historico = [...msgs, userMsg]
    setMsgs(historico)
    setInput('')
    setPend([])
    setLoading(true)
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: historico.map((m) => ({ role: m.role, content: toApiContent(m) })) }),
      })
      const data = await res.json()
      if (!res.ok || data?.error) setErro(data?.error || 'Falha ao consultar o assistente.')
      else setMsgs([...historico, { role: 'assistant', text: data.reply || '(sem resposta)' }])
    } catch {
      setErro('Erro de rede ao falar com o assistente.')
    } finally {
      setLoading(false)
    }
  }

  const iconBtn = { background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r, 12px)', color: 'var(--foreground)', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 44, flexShrink: 0 } as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {!embedded && (
        <div style={{ padding: '4px 2px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: 'var(--gold)', display: 'grid', placeItems: 'center', color: '#1a1200', fontWeight: 800 }}>✦</div>
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 700 }}>Assistente do Oráculo</h1>
            <p style={{ color: 'var(--t3, #888)', fontSize: 12.5, opacity: 0.85 }}>Seus números, dúvidas do Oráculo e leitura de imagens — tudo aqui.</p>
          </div>
        </div>
      )}

      {/* Botão de acesso ao Agente GPT (criador de imagens/anúncios) */}
      <a href={GPT_AGENT_URL} target="_blank" rel="noreferrer"
        style={{ alignSelf: 'flex-start', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#0a3', background: 'color-mix(in srgb, #22c55e 14%, var(--card))', border: '1px solid color-mix(in srgb, #22c55e 30%, var(--line))', borderRadius: 999, padding: '6px 12px', marginBottom: 8 }}>
        🎨 Criar imagens no Agente GPT ↗
      </a>

      {/* Área de mensagens */}
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
              borderRadius: 14, padding: '10px 14px', fontSize: 14.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {m.images?.map((im, k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={k} src={`data:${im.mediaType};base64,${im.data}`} alt="anexo" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 10, display: 'block', marginBottom: m.text ? 8 : 0 }} />
              ))}
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div style={{ alignSelf: 'flex-start', color: 'var(--t3, #888)', fontSize: 13, opacity: 0.7, padding: '2px 4px' }}>pensando…</div>}
        {erro && <div style={{ alignSelf: 'flex-start', color: 'var(--foreground)', background: 'color-mix(in srgb, red 12%, var(--card))', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px', fontSize: 13.5 }}>{erro}</div>}
      </div>

      {/* Miniaturas das imagens anexadas (antes de enviar) */}
      {pend.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 2px 0' }}>
          {pend.map((im, k) => (
            <div key={k} style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`data:${im.mediaType};base64,${im.data}`} alt="anexo" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />
              <button onClick={() => setPend((p) => p.filter((_, j) => j !== k))} aria-label="remover" style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 999, background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--foreground)', fontSize: 11, lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Barra de input */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 10 }}>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => anexar(e.target.files)} />
        <button style={iconBtn} onClick={() => fileRef.current?.click()} disabled={loading || pend.length >= MAX_IMGS} title="Anexar imagem" aria-label="Anexar imagem">📎</button>
        <input
          value={input}
          placeholder="Pergunte ou anexe uma imagem…"
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
