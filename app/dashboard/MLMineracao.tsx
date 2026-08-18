'use client'
import { useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Mineração MERCADO LIVRE — o garimpo com dado REAL do próprio ML:
//  · ranking BEST_SELLER oficial por categoria (giro real, não estimado por BSR)
//  · "você recebe" líquido por produto (comissão real + envio real, reputação verde)
//  · buscas em alta (trends) pra farejar demanda
// Nada aqui toca a mineração da Amazon — outro marketplace, outra fonte.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  card: 'var(--card)', cardHov: 'var(--cardHov)', line: 'var(--line)', modal: 'var(--modal)',
  gold: 'var(--gold)', g: 'var(--g)', a: 'var(--a)', r: 'var(--r)', pur: 'var(--pur)',
  t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)', t4: 'var(--t4)',
}
const tint = (v: string, pct: number) => `color-mix(in srgb, ${v} ${pct}%, transparent)`
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type Produto = {
  pos: number; id: string; itemId: string | null; nome: string; foto: string | null
  preco: number; categoria: string | null; listingType: string | null; vendidos: number | null
  comissao: number | null; comissaoPct: number | null; envio: number | null
  voceRecebe: number | null; margemPct: number | null; permalink: string | null
  custoAlvo: { m20: number; m30: number; m40: number } | null
  concorrencia: { ofertas: number; vendedores: number; precoMin: number; precoMax: number; lojasOficiais: number; usandoFull: number; amostra: number } | null
  sinais: string[]
}

const MEDALHA = ['🥇', '🥈', '🥉']

function CardProduto({ p }: { p: Produto }) {
  const mCor = p.margemPct == null ? T.t3 : p.margemPct >= 70 ? T.g : p.margemPct >= 55 ? T.gold : T.a
  return (
    <div style={{ background: T.card, border: `1px solid ${p.pos <= 3 ? tint(T.gold, 40) : T.line}`, borderRadius: 14, padding: 14, display: 'flex', gap: 12, boxShadow: 'var(--elev1)' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {p.foto
          ? <img src={p.foto} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'contain', background: '#fff' }} />
          : <div style={{ width: 64, height: 64, borderRadius: 10, background: T.modal }} />}
        <span style={{ position: 'absolute', top: -7, left: -7, fontSize: p.pos <= 3 ? 16 : 10, fontWeight: 800, background: T.modal, border: `1px solid ${T.line}`, borderRadius: 999, minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.t2, padding: '0 4px' }}>
          {p.pos <= 3 ? MEDALHA[p.pos - 1] : `${p.pos}º`}
        </span>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.t1, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
          {p.nome || '—'}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: T.t1 }}>{p.preco > 0 ? brl(p.preco) : '—'}</span>
          {p.vendidos != null && p.vendidos > 0 && <span style={{ fontSize: 10.5, color: T.g, fontWeight: 700 }}>{p.vendidos.toLocaleString('pt-BR')}+ vendidos</span>}
          {p.listingType && <span style={{ fontSize: 9.5, color: T.t4 }}>{p.listingType === 'gold_pro' ? 'Premium' : 'Clássico'}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
          {p.voceRecebe != null ? (
            <span style={{ fontSize: 11.5, fontWeight: 800, color: mCor, background: tint(mCor, 10), border: `1px solid ${tint(mCor, 28)}`, borderRadius: 8, padding: '3px 8px' }}>
              recebe {brl(p.voceRecebe)} · {p.margemPct}%
            </span>
          ) : (
            <span style={{ fontSize: 10.5, color: T.t4 }}>líquido não medido</span>
          )}
          {p.comissao != null && <span style={{ fontSize: 10, color: T.t3 }}>comissão {brl(p.comissao)}</span>}
          {p.envio != null && <span style={{ fontSize: 10, color: T.t3 }}>envio {brl(p.envio)}</span>}
          {p.permalink && (
            <a href={p.permalink} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: T.gold, fontWeight: 700, textDecoration: 'none', marginLeft: 'auto' }}>
              ver no ML ↗
            </a>
          )}
        </div>

        {/* ⭐ A pergunta que decide a compra: por quanto eu tenho que comprar? */}
        {p.custoAlvo && p.custoAlvo.m30 > 0 && (
          <div style={{ marginTop: 8, background: T.modal, borderRadius: 9, padding: '7px 10px' }}>
            <div style={{ fontSize: 9.5, color: T.t4, marginBottom: 3, fontWeight: 700, letterSpacing: '0.03em' }}>COMPRE ATÉ (p/ a margem que você quer)</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {([['20%', p.custoAlvo.m20], ['30%', p.custoAlvo.m30], ['40%', p.custoAlvo.m40]] as Array<[string, number]>).map(([m, v]) => (
                <span key={m} style={{ fontSize: 11 }}>
                  <span style={{ color: T.t4 }}>{m}</span>{' '}
                  <strong style={{ color: v > 0 ? T.t1 : T.t4 }}>{v > 0 ? brl(v) : '—'}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Concorrência real do produto (ofertas do mesmo catálogo). */}
        {p.concorrencia && (
          <div style={{ fontSize: 10, color: T.t3, marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span>👥 <strong style={{ color: T.t2 }}>{p.concorrencia.vendedores}</strong> vendedores</span>
            {p.concorrencia.precoMin > 0 && <span>💰 {brl(p.concorrencia.precoMin)}–{brl(p.concorrencia.precoMax)}</span>}
            {p.concorrencia.amostra > 0 && <span>📦 {p.concorrencia.usandoFull}/{p.concorrencia.amostra} no Full</span>}
          </div>
        )}

        {p.sinais.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
            {p.sinais.slice(0, 3).map(sn => (
              <span key={sn} style={{ fontSize: 9.5, color: T.t2, background: tint(T.pur, 12), border: `1px solid ${tint(T.pur, 25)}`, borderRadius: 6, padding: '2px 7px' }}>{sn}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MLMineracao() {
  const [categorias, setCategorias] = useState<Array<{ id: string; nome: string }>>([])
  const [trends, setTrends] = useState<Array<{ keyword: string; url: string }>>([])
  const [cat, setCat] = useState<string>(() => {
    try { return localStorage.getItem('oraculo_ml_minera_cat') || 'MLB1574' } catch { return 'MLB1574' }
  })
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ml/mineracao/categorias').then(r => r.json()).then(d => setCategorias(d.categorias || [])).catch(() => {})
    fetch('/api/ml/mineracao/trends').then(r => r.json()).then(d => setTrends((d.trends || []).slice(0, 12))).catch(() => {})
  }, [])

  const garimpar = useCallback(async (categoria: string) => {
    setLoading(true); setErro(null)
    try {
      const r = await fetch(`/api/ml/mineracao?category=${encodeURIComponent(categoria)}`)
      const d = await r.json()
      if (!r.ok || d.error) { setErro(d.error || 'Não foi possível garimpar agora.'); setProdutos([]) }
      else setProdutos(d.produtos || [])
    } catch { setErro('Falha de conexão.'); setProdutos([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('oraculo_ml_minera_cat', cat) } catch {}
    garimpar(cat)
  }, [cat, garimpar])

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', width: '100%', paddingTop: 20 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#fff159', background: '#2d3277', borderRadius: 6, padding: '3px 8px' }}>Mercado Livre</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em' }}>Mineração</h2>
        </div>
        <p style={{ fontSize: 13, color: T.t3, lineHeight: 1.6, maxWidth: 680 }}>
          O ranking <strong style={{ color: T.t2 }}>Mais Vendidos oficial do ML</strong> por categoria — giro real, não estimativa —
          com o <strong style={{ color: T.g }}>líquido que você receberia</strong> vendendo pelo mesmo preço (comissão e envio reais, reputação verde).
        </p>
      </div>

      {trends.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.t3, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 7 }}>🔥 Buscas em alta agora</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {trends.map(t => (
              <a key={t.keyword} href={t.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 11.5, color: T.t2, background: T.card, border: `1px solid ${T.line}`, borderRadius: 20, padding: '4px 11px', textDecoration: 'none' }}>
                {t.keyword}
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <select value={cat} onChange={e => setCat(e.target.value)}
          style={{ background: T.modal, border: `1px solid ${T.line}`, borderRadius: 10, padding: '9px 12px', fontSize: 13, color: T.t1, outline: 'none', cursor: 'pointer', minWidth: 240 }}>
          {categorias.length === 0 && <option value={cat}>Carregando categorias…</option>}
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        {loading && <span style={{ fontSize: 12, color: T.t3 }}>⛏️ garimpando a categoria…</span>}
      </div>

      {erro && <div style={{ padding: '14px 16px', textAlign: 'center', color: T.r, fontSize: 13, background: tint(T.r, 8), border: `1px solid ${tint(T.r, 25)}`, borderRadius: 12, marginBottom: 12 }}>{erro}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, opacity: loading ? 0.5 : 1, transition: 'opacity .2s' }}>
        {produtos.map(p => <CardProduto key={`${p.pos}-${p.id}`} p={p} />)}
      </div>

      {!loading && !erro && produtos.length === 0 && (
        <div style={{ padding: '48px 24px', textAlign: 'center', background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
          Escolha uma categoria pra garimpar os mais vendidos.
        </div>
      )}

      <p style={{ fontSize: 10.5, color: T.t4, marginTop: 14, lineHeight: 1.5 }}>
        "Recebe" = preço − comissão real da categoria − custo de envio real (reputação verde) — antes de imposto, custo do produto e Ads.
        "Compre até" = o máximo a pagar no fornecedor pra fechar naquela margem (já com imposto de 4% e o líquido real). Produto sem "líquido medido" é aquele em que o ML não expôs a oferta/frete — nada aqui é inventado.
      </p>
    </div>
  )
}
