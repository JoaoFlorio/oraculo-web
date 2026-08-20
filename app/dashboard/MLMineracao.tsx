'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Mineração MERCADO LIVRE — garimpo com dado REAL do ML, no layout limpo (image-
// forward) da mineração da Amazon, e MAIS inteligente:
//  · ranking BEST_SELLER oficial por categoria E subcategoria (giro real)
//  · "você recebe" líquido por produto (comissão + envio reais, reputação verde)
//  · filtro "só oportunidades": esconde marca/commodity (Omo, Tixan, loja oficial
//    dominando) e destaca o mercado ABERTO — o que o revendedor consegue girar
//  · busca, ordenação (giro/margem/recebe/preço/concorrência) e "compre até"
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  card: 'var(--card)', cardHov: 'var(--cardHov)', line: 'var(--line)', modal: 'var(--modal)',
  gold: 'var(--gold)', g: 'var(--g)', a: 'var(--a)', r: 'var(--r)', pur: 'var(--pur)', blue: 'var(--blue)',
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
  marca: string | null; revendavel: boolean
}

const MEDALHA = ['🥇', '🥈', '🥉']
const ORDENS = [
  { id: 'giro', label: 'Giro (mais vendidos)' },
  { id: 'margem', label: 'Melhor margem' },
  { id: 'recebe', label: 'Maior você recebe' },
  { id: 'preco', label: 'Menor preço' },
  { id: 'concorrencia', label: 'Menos concorrência' },
]

function CardProduto({ p }: { p: Produto }) {
  const [hov, setHov] = useState(false)
  const mCor = p.margemPct == null ? T.t3 : p.margemPct >= 70 ? T.g : p.margemPct >= 55 ? T.gold : T.a
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: T.card, border: `1px solid ${hov ? tint(T.gold, 45) : (p.pos <= 3 ? tint(T.gold, 30) : T.line)}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, boxShadow: hov ? 'var(--elev2)' : 'var(--elev1)', transform: hov ? 'translateY(-2px)' : 'none', transition: 'transform .15s, border-color .15s, box-shadow .15s' }}>
      {/* Imagem (fundo branco, contain) — padrão da mineração Amazon */}
      <div style={{ position: 'relative', background: '#F8F8FC', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
        {p.foto
          ? <img src={p.foto} alt="" loading="lazy" style={{ maxHeight: 128, maxWidth: '86%', objectFit: 'contain' as const, transition: 'transform .3s', transform: hov ? 'scale(1.06)' : 'scale(1)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <div style={{ width: 44, height: 44, background: '#e8e8f0', borderRadius: 8 }} />}
        {/* Rank (o giro real: posição no ranking Mais Vendidos do ML) */}
        <span style={{ position: 'absolute', top: 9, left: 9, fontSize: p.pos <= 3 ? 15 : 11, fontWeight: 800, background: 'rgba(3,3,10,0.78)', backdropFilter: 'blur(4px)', borderRadius: 7, minWidth: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '0 6px' }}>
          {p.pos <= 3 ? MEDALHA[p.pos - 1] : `${p.pos}º`}
        </span>
        {/* Oportunidade × Marca (a inteligência do garimpo) */}
        {p.revendavel
          ? <span style={{ position: 'absolute', top: 9, right: 9, fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', color: T.g, background: 'rgba(3,3,10,0.8)', backdropFilter: 'blur(4px)', border: `1px solid ${tint(T.g, 40)}`, borderRadius: 5, padding: '3px 7px' }}>OPORTUNIDADE</span>
          : <span style={{ position: 'absolute', top: 9, right: 9, fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', color: T.t3, background: 'rgba(3,3,10,0.8)', backdropFilter: 'blur(4px)', border: `1px solid ${T.line}`, borderRadius: 5, padding: '3px 7px', maxWidth: 96, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{(p.marca || 'MARCA').toUpperCase()}</span>}
      </div>

      <div style={{ padding: '12px 13px 14px', flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
        {/* Hero: quanto você recebe (a profitabilidade real) */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 7, flexWrap: 'wrap' as const }}>
          {p.margemPct != null ? (
            <>
              <span style={{ fontSize: 21, fontWeight: 800, color: mCor, letterSpacing: '-0.02em', lineHeight: 1 }}>{p.margemPct}%</span>
              <span style={{ fontSize: 10.5, color: T.t3 }}>você recebe <strong style={{ color: T.t2 }}>{p.voceRecebe != null ? brl(p.voceRecebe) : '—'}</strong></span>
            </>
          ) : (
            <span style={{ fontSize: 11, color: T.t4 }}>líquido não medido</span>
          )}
          {p.vendidos != null && p.vendidos > 0 && <span style={{ marginLeft: 'auto', fontSize: 9.5, color: T.g, fontWeight: 700 }}>{p.vendidos.toLocaleString('pt-BR')}+ vend.</span>}
        </div>

        <p style={{ fontSize: 12, fontWeight: 500, color: T.t1, lineHeight: 1.45, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', margin: '0 0 8px' }}>{p.nome || '—'}</p>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 10, flexWrap: 'wrap' as const }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: T.t1 }}>{p.preco > 0 ? brl(p.preco) : '—'}</span>
          {p.listingType && <span style={{ fontSize: 9.5, color: T.t4 }}>{p.listingType === 'gold_pro' ? 'Premium' : 'Clássico'}</span>}
        </div>

        {/* ⭐ Compre até — a pergunta que decide a compra */}
        {p.custoAlvo && p.custoAlvo.m30 > 0 && (
          <div style={{ background: T.modal, borderRadius: 9, padding: '7px 9px', marginBottom: 9 }}>
            <div style={{ fontSize: 8.5, color: T.t4, marginBottom: 3, fontWeight: 700, letterSpacing: '0.04em' }}>COMPRE ATÉ (p/ a margem)</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
              {([['20%', p.custoAlvo.m20], ['30%', p.custoAlvo.m30], ['40%', p.custoAlvo.m40]] as Array<[string, number]>).map(([m, v]) => (
                <span key={m} style={{ fontSize: 10.5 }}><span style={{ color: T.t4 }}>{m}</span> <strong style={{ color: v > 0 ? T.t1 : T.t4 }}>{v > 0 ? brl(v) : '—'}</strong></span>
              ))}
            </div>
          </div>
        )}

        {/* Concorrência + link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 9.5, color: T.t3, flexWrap: 'wrap' as const, borderTop: `1px solid ${T.line}`, paddingTop: 9 }}>
          {p.concorrencia && <span>👥 <strong style={{ color: T.t2 }}>{p.concorrencia.vendedores}</strong> vend.</span>}
          {p.concorrencia && p.concorrencia.amostra > 0 && <span>📦 {p.concorrencia.usandoFull}/{p.concorrencia.amostra} Full</span>}
          {p.permalink && <a href={p.permalink} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: T.gold, fontWeight: 700, textDecoration: 'none' }}>ver no ML ↗</a>}
        </div>

        {p.sinais.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginTop: 8 }}>
            {p.sinais.slice(0, 2).map(sn => (
              <span key={sn} style={{ fontSize: 9, color: T.t2, background: tint(T.pur, 12), border: `1px solid ${tint(T.pur, 22)}`, borderRadius: 6, padding: '2px 6px' }}>{sn}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MLMineracao() {
  const [categorias, setCategorias] = useState<Array<{ id: string; nome: string }>>([])
  const [subcats, setSubcats] = useState<Array<{ id: string; nome: string }>>([])
  const [trends, setTrends] = useState<Array<{ keyword: string; url: string }>>([])
  const [catRaiz, setCatRaiz] = useState<string>(() => { try { return localStorage.getItem('oraculo_ml_minera_cat') || 'MLB1574' } catch { return 'MLB1574' } })
  const [sub, setSub] = useState<string>('')  // '' = a categoria-raiz inteira
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  // Controles do garimpo
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState('giro')
  const [soOportunidades, setSoOportunidades] = useState(false)

  const catAtiva = sub || catRaiz

  useEffect(() => {
    fetch('/api/ml/mineracao/categorias').then(r => r.json()).then(d => setCategorias(d.categorias || [])).catch(() => {})
    fetch('/api/ml/mineracao/trends').then(r => r.json()).then(d => setTrends((d.trends || []).slice(0, 12))).catch(() => {})
  }, [])

  // Subcategorias da raiz selecionada (o reset de `sub` acontece no onChange).
  useEffect(() => {
    fetch(`/api/ml/mineracao/subcategorias?cat=${encodeURIComponent(catRaiz)}`).then(r => r.json()).then(d => setSubcats(d.subcategorias || [])).catch(() => setSubcats([]))
  }, [catRaiz])

  const garimpar = useCallback(async (categoria: string, bust = false) => {
    setLoading(true); setErro(null)
    try {
      const r = await fetch(`/api/ml/mineracao?category=${encodeURIComponent(categoria)}${bust ? '&bust=1' : ''}`)
      const d = await r.json()
      if (!r.ok || d.error) { setErro(d.error || 'Não foi possível garimpar agora.'); setProdutos([]) }
      else setProdutos(d.produtos || [])
    } catch { setErro('Falha de conexão.'); setProdutos([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('oraculo_ml_minera_cat', catRaiz) } catch {}
    garimpar(catAtiva)
  }, [catAtiva, garimpar]) // eslint-disable-line

  // Filtro (busca + oportunidades) e ordenação — tudo client-side sobre o garimpo.
  const visiveis = useMemo(() => {
    let arr = produtos
    if (soOportunidades) arr = arr.filter(p => p.revendavel)
    const q = busca.trim().toLowerCase()
    if (q) arr = arr.filter(p => (p.nome || '').toLowerCase().includes(q) || (p.marca || '').toLowerCase().includes(q))
    const ord = [...arr]
    if (ordem === 'margem') ord.sort((a, b) => (b.margemPct ?? -1) - (a.margemPct ?? -1))
    else if (ordem === 'recebe') ord.sort((a, b) => (b.voceRecebe ?? -1) - (a.voceRecebe ?? -1))
    else if (ordem === 'preco') ord.sort((a, b) => (a.preco || Infinity) - (b.preco || Infinity))
    else if (ordem === 'concorrencia') ord.sort((a, b) => (a.concorrencia?.vendedores ?? Infinity) - (b.concorrencia?.vendedores ?? Infinity))
    else ord.sort((a, b) => a.pos - b.pos)
    return ord
  }, [produtos, soOportunidades, busca, ordem])

  const nOportunidades = useMemo(() => produtos.filter(p => p.revendavel).length, [produtos])

  const selStyle: React.CSSProperties = { background: T.modal, border: `1px solid ${T.line}`, borderRadius: 10, padding: '9px 12px', fontSize: 12.5, color: T.t1, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%', paddingTop: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#fff159', background: '#2d3277', borderRadius: 6, padding: '3px 8px' }}>Mercado Livre</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em' }}>Mineração</h2>
        </div>
        <p style={{ fontSize: 13, color: T.t3, lineHeight: 1.6, maxWidth: 720 }}>
          O ranking <strong style={{ color: T.t2 }}>Mais Vendidos oficial do ML</strong> por categoria — giro real —
          com o <strong style={{ color: T.g }}>líquido que você receberia</strong> e um filtro de <strong style={{ color: T.g }}>oportunidade</strong>: some as marcas de supermercado e veja só o que dá pra revender.
        </p>
      </div>

      {trends.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.t3, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 7 }}>🔥 Buscas em alta agora</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' as const }}>
            {trends.map(t => (
              <a key={t.keyword} href={t.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 11.5, color: T.t2, background: T.card, border: `1px solid ${T.line}`, borderRadius: 20, padding: '4px 11px', textDecoration: 'none' }}>{t.keyword}</a>
            ))}
          </div>
        </div>
      )}

      {/* Controles: categoria · subcategoria · busca · ordenar · só oportunidades · atualizar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' as const }}>
        <select value={catRaiz} onChange={e => { setCatRaiz(e.target.value); setSub('') }} style={{ ...selStyle, minWidth: 190 }}>
          {categorias.length === 0 && <option value={catRaiz}>Carregando…</option>}
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        {subcats.length > 0 && (
          <select value={sub} onChange={e => setSub(e.target.value)} style={{ ...selStyle, minWidth: 170 }}>
            <option value="">Toda a categoria</option>
            {subcats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: T.t4 }} aria-hidden="true" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar no garimpo…"
            style={{ width: '100%', background: T.modal, border: `1px solid ${T.line}`, borderRadius: 10, padding: '9px 12px 9px 32px', fontSize: 12.5, color: T.t1, outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <select value={ordem} onChange={e => setOrdem(e.target.value)} style={selStyle}>
          {ORDENS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <button onClick={() => setSoOportunidades(v => !v)}
          title="Esconde marcas de supermercado e produtos com loja oficial dominando"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' as const, border: `1px solid ${soOportunidades ? tint(T.g, 55) : T.line}`, background: soOportunidades ? tint(T.g, 14) : T.card, color: soOportunidades ? T.g : T.t2 }}>
          <i className={`ti ${soOportunidades ? 'ti-bulb-filled' : 'ti-bulb'}`} style={{ fontSize: 15 }} aria-hidden="true" />
          Só oportunidades
        </button>
        <button onClick={() => garimpar(catAtiva, true)} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, border: `1px solid ${T.line}`, background: T.card, color: T.t2, opacity: loading ? 0.6 : 1 }}>
          <i className="ti ti-refresh" style={{ fontSize: 14 }} aria-hidden="true" /> Atualizar
        </button>
      </div>

      {/* Linha de status: quantos produtos / oportunidades */}
      {!loading && !erro && produtos.length > 0 && (
        <div style={{ fontSize: 11.5, color: T.t3, marginBottom: 12, display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
          <span>{visiveis.length} produto{visiveis.length === 1 ? '' : 's'}{soOportunidades ? ' (só oportunidades)' : ''}</span>
          {!soOportunidades && <span style={{ color: T.g }}>💡 {nOportunidades} oportunidade{nOportunidades === 1 ? '' : 's'} (sem marca dominando)</span>}
        </div>
      )}

      {loading && <div style={{ padding: 30, textAlign: 'center' as const, color: T.t3, fontSize: 13 }}>⛏️ garimpando a categoria… (a 1ª vez leva alguns segundos)</div>}
      {erro && <div style={{ padding: '14px 16px', textAlign: 'center' as const, color: T.r, fontSize: 13, background: tint(T.r, 8), border: `1px solid ${tint(T.r, 25)}`, borderRadius: 12, marginBottom: 12 }}>{erro}</div>}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(248px, 1fr))', gap: 12 }}>
          {visiveis.map(p => <CardProduto key={`${p.pos}-${p.id}`} p={p} />)}
        </div>
      )}

      {!loading && !erro && produtos.length > 0 && visiveis.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
          {soOportunidades ? 'Nenhuma oportunidade nesse recorte — quase tudo aqui é de marca. Troque a categoria ou desligue "só oportunidades".' : 'Nada bateu com a busca.'}
        </div>
      )}

      {!loading && !erro && produtos.length === 0 && (
        <div style={{ padding: '48px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
          Escolha uma categoria pra garimpar os mais vendidos.
        </div>
      )}

      <p style={{ fontSize: 10.5, color: T.t4, marginTop: 16, lineHeight: 1.5 }}>
        <strong>Oportunidade</strong> = mercado aberto: sem loja oficial dominando e sem marca de commodity (Omo, Tixan, Dove…) — é o que dá pra comprar genérico e revender com margem.
        <strong> Recebe</strong> = preço − comissão real − envio real (reputação verde), antes de imposto/custo/Ads. <strong>Compre até</strong> = o máximo a pagar no fornecedor pra fechar naquela margem (imposto 4% embutido). Nada aqui é inventado.
      </p>
    </div>
  )
}
