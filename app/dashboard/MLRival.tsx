'use client'
import { useState } from 'react'
import { CardProduto, MLDetalheModal, type Produto } from './MLMineracao'

// ─────────────────────────────────────────────────────────────────────────────
// ANÁLISE RIVAL — MERCADO LIVRE. Cola o link (ou MLB) de um anúncio de outro
// seller e recebe a MESMA análise do garimpo: comissão e envio reais, "você
// recebe", compre até, concorrência do catálogo, marca — e o modal completo
// (score, simulador, previsão, como melhorar, imagens).
// O backend resolve as 3 entidades do ML (anúncio, catálogo /p/, MLBU).
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  card: 'var(--card)', cardHov: 'var(--cardHov)', line: 'var(--line)', line2: 'var(--line2, var(--line))',
  lineG: 'var(--lineG)', goldG: 'var(--goldG)', gold: 'var(--gold)', r: 'var(--r)',
  t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)', t4: 'var(--t4)',
}
const tint = (v: string, pct: number) => `color-mix(in srgb, ${v} ${pct}%, transparent)`

export default function MLRival() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [produto, setProduto] = useState<Produto | null>(null)
  const [modal, setModal] = useState(false)

  const analisar = async () => {
    const alvo = q.trim()
    if (!alvo || loading) return
    setLoading(true); setErro(null); setProduto(null)
    try {
      const r = await fetch(`/api/ml/mineracao/analisar?q=${encodeURIComponent(alvo)}`)
      const d = await r.json()
      if (!r.ok || d.error) { setErro(d.error || 'Não foi possível analisar este anúncio.'); return }
      setProduto(d.produto)
      setModal(true)   // já abre a análise completa, que é o que o cliente veio buscar
    } catch { setErro('Falha de conexão.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ width: '100%' }}>
      <div className="ora-phead" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.t3, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>Mercado Livre</span>
            <span style={{ color: T.t3, fontSize: 9 }}>/</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.gold, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>Análise Rival</span>
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em', marginBottom: 6, lineHeight: 1 }}>Análise Rival ML</h1>
          <p style={{ fontSize: 11, color: T.t3 }}>Cole o link de qualquer anúncio do Mercado Livre e veja a análise completa — taxas reais, líquido, concorrência e como melhorar.</p>
        </div>
      </div>

      {/* Input no estilo da busca da Amazon (input + botão dourado) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 380px', maxWidth: 640, background: T.cardHov, border: `1px solid ${q ? T.lineG : T.line2}`, borderRadius: 8, overflow: 'hidden' }}>
          <input value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') analisar() }}
            placeholder="Cole o link do anúncio ou o código MLB…" aria-label="Link ou código do anúncio"
            style={{ background: 'none', border: 'none', outline: 'none', color: T.t1, fontSize: 12, fontWeight: 500, padding: '10px 12px', fontFamily: 'inherit', flex: 1, minWidth: 0 }} />
          <button onClick={analisar} disabled={loading} title="Analisar anúncio"
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.goldG, border: 'none', color: '#1a1200', cursor: loading ? 'wait' : 'pointer', padding: '11px 18px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.4" stroke="currentColor" strokeWidth="1.6" /><path d="M7.6 7.6L10.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            {loading ? 'Analisando…' : 'Analisar'}
          </button>
        </div>
      </div>

      {erro && <div style={{ padding: '13px 16px', color: T.r, fontSize: 12.5, background: tint(T.r, 8), border: `1px solid ${tint(T.r, 25)}`, borderRadius: 12, marginBottom: 14, maxWidth: 640, lineHeight: 1.55 }}>{erro}</div>}

      {produto && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, maxWidth: 480 }}>
          <div className="ora-card-in">
            <CardProduto p={produto} onOpen={() => setModal(true)} />
          </div>
        </div>
      )}

      {!produto && !erro && !loading && (
        <div style={{ padding: '44px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13, maxWidth: 640, lineHeight: 1.7 }}>
          Exemplos que funcionam:<br />
          <span style={{ color: T.t4, fontSize: 11.5 }}>mercadolivre.com.br/p/MLB63904966 · produto.mercadolivre.com.br/MLB-123… · MLB63904966</span>
        </div>
      )}

      <p style={{ fontSize: 10.5, color: T.t4, marginTop: 16, lineHeight: 1.5, maxWidth: 640 }}>
        A análise usa os MESMOS motores do garimpo: comissão real da categoria, envio real (reputação verde) e a concorrência do catálogo. Alguns anúncios avulsos o ML fecha pra consulta — nesses, cole o link da página do produto (/p/MLB…).
      </p>

      {modal && produto && <MLDetalheModal p={produto} onClose={() => setModal(false)} />}
    </div>
  )
}
