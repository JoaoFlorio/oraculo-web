'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Mineração MERCADO LIVRE — garimpo com dado REAL do ML, no MESMO padrão da
// mineração da Amazon (card image-forward, badge GENÉRICO, SCROLL INFINITO):
//
//  · ranking BEST_SELLER oficial (giro real) — 20 posições FIXAS por categoria
//  · ⭐ scroll infinito: o ML só dá 20 por categoria, então a paginação DESCE NA
//    ÁRVORE (página 0 = a categoria, página N = a N-ésima subcategoria). Casa,
//    com 13 filhos, vira ~280 produtos. Igual à Amazon: sentinela + pool + dedupe.
//  · "você recebe" líquido real (comissão + envio reais, reputação verde)
//  · GENÉRICO × marca: a MESMA régua da Amazon (`isGeneric = !brand`), com uma
//    lista de commodity/marca grande — é o filtro "só oportunidades".
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
  marca: string | null; revendavel: boolean; fonteNome?: string
}

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
  const abrir = () => { if (p.permalink) window.open(p.permalink, '_blank', 'noopener') }
  return (
    <div onClick={abrir} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      role="link" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') abrir() }}
      style={{ background: hov ? T.cardHov : T.card, border: `1px solid ${hov ? tint(T.gold, 45) : T.line}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, cursor: p.permalink ? 'pointer' : 'default', boxShadow: hov ? 'var(--elev2)' : 'var(--elev1)', transform: hov ? 'translateY(-2px)' : 'none', transition: 'transform .15s, border-color .15s, box-shadow .15s' }}>
      {/* Imagem (fundo branco, contain) — padrão da mineração Amazon */}
      <div style={{ position: 'relative', background: '#F8F8FC', height: 162, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
        {p.foto
          ? <img src={p.foto} alt="" loading="lazy" decoding="async" style={{ maxHeight: 138, maxWidth: '88%', objectFit: 'contain' as const, transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)', transform: hov ? 'scale(1.08)' : 'scale(1)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <div style={{ width: 44, height: 44, background: '#e8e8f0', borderRadius: 8 }} />}
        {/* GENÉRICO (oportunidade) × marca — mesma leitura da mineração Amazon */}
        {p.revendavel
          ? <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, background: 'rgba(3,3,10,0.8)', backdropFilter: 'blur(4px)', border: `1px solid ${tint(T.pur, 21)}`, borderRadius: 4, padding: '2px 7px', fontSize: 8, fontWeight: 700, color: T.pur, letterSpacing: '0.1em' }}>{p.marca ? 'GENÉRICO' : 'SEM MARCA'}</div>
          : <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, background: 'rgba(3,3,10,0.8)', backdropFilter: 'blur(4px)', border: `1px solid ${T.line}`, borderRadius: 4, padding: '2px 7px', fontSize: 8, fontWeight: 700, color: T.t3, letterSpacing: '0.08em', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{(p.marca || 'MARCA').toUpperCase()}</div>}
        {/* Posição no ranking + de qual ranking veio */}
        <div style={{ position: 'absolute', bottom: 8, left: 10, zIndex: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(3,3,10,0.78)', backdropFilter: 'blur(4px)', color: '#fff', borderRadius: 6, padding: '2px 7px' }}>{p.pos}º</span>
          {p.fonteNome && <span style={{ fontSize: 8.5, fontWeight: 600, background: 'rgba(3,3,10,0.62)', backdropFilter: 'blur(4px)', color: '#D8D8E8', borderRadius: 5, padding: '2px 6px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.fonteNome}</span>}
        </div>
      </div>

      <div style={{ padding: '13px 13px 15px', flex: 1, display: 'flex', flexDirection: 'column' as const }}>
        {/* Hero: a margem real (o equivalente ao "~530 est./mês" da Amazon) */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 8, flexWrap: 'wrap' as const }}>
          {p.margemPct != null ? (
            <>
              <span className="ora-num" style={{ fontSize: 22, fontWeight: 700, color: mCor, letterSpacing: '-0.03em', lineHeight: 1 }}>{p.margemPct}%</span>
              <span style={{ fontSize: 10, color: T.t3, fontWeight: 500 }}>você recebe {p.voceRecebe != null ? brl(p.voceRecebe) : '—'}</span>
            </>
          ) : <span style={{ fontSize: 11, color: T.t4 }}>líquido não medido</span>}
          {p.vendidos != null && p.vendidos > 0 && <span style={{ marginLeft: 'auto', fontSize: 9.5, color: T.g, fontWeight: 700 }}>{p.vendidos.toLocaleString('pt-BR')}+ vend.</span>}
        </div>

        <p style={{ fontSize: 12, fontWeight: 500, color: T.t1, lineHeight: 1.58, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', margin: '0 0 10px' }}>{p.nome || '—'}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11, flexWrap: 'wrap' as const }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: T.t1 }}>{p.preco > 0 ? brl(p.preco) : '—'}</span>
          {p.concorrencia && <span style={{ fontSize: 10, color: T.t3 }}>· {p.concorrencia.vendedores} vend.</span>}
          {p.concorrencia && p.concorrencia.amostra > 0 && <span style={{ fontSize: 10, color: T.t3 }}>· {p.concorrencia.usandoFull}/{p.concorrencia.amostra} Full</span>}
        </div>

        {/* ⭐ Compre até — a pergunta que decide a compra */}
        {p.custoAlvo && p.custoAlvo.m30 > 0 && (
          <div style={{ background: T.modal, borderRadius: 9, padding: '7px 9px', marginBottom: 10 }}>
            <div style={{ fontSize: 8.5, color: T.t4, marginBottom: 3, fontWeight: 700, letterSpacing: '0.04em' }}>COMPRE ATÉ (p/ a margem)</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
              {([['20%', p.custoAlvo.m20], ['30%', p.custoAlvo.m30], ['40%', p.custoAlvo.m40]] as Array<[string, number]>).map(([m, v]) => (
                <span key={m} style={{ fontSize: 10.5 }}><span style={{ color: T.t4 }}>{m}</span> <strong style={{ color: v > 0 ? T.t1 : T.t4 }}>{v > 0 ? brl(v) : '—'}</strong></span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${T.line}`, paddingTop: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: hov ? T.gold : T.t3, transition: 'color .15s' }}>Ver no ML</span>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${hov ? tint(T.gold, 45) : T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke={hov ? T.gold : T.t3} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>

        {p.sinais.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginTop: 9 }}>
            {p.sinais.slice(0, 2).map(sn => (
              <span key={sn} style={{ fontSize: 9, color: T.t2, background: tint(T.pur, 12), border: `1px solid ${tint(T.pur, 22)}`, borderRadius: 6, padding: '2px 6px' }}>{sn}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SkeletonCard({ i }: { i: number }) {
  return <div style={{ background: T.card, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.line}`, animationDelay: `${i * .05}s`, animation: 'pulse 1.8s ease-in-out infinite' }}>
    <div style={{ background: '#F8F8FC', height: 162 }} />
    <div style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
      <div style={{ height: 10, background: T.t3, borderRadius: 4, width: '50%', opacity: .5 }} />
      <div style={{ height: 8, background: T.t3, borderRadius: 4, width: '90%', opacity: .3 }} />
      <div style={{ height: 8, background: T.t3, borderRadius: 4, width: '70%', opacity: .3 }} />
    </div>
  </div>
}

export default function MLMineracao() {
  const [categorias, setCategorias] = useState<Array<{ id: string; nome: string }>>([])
  const [subcats, setSubcats] = useState<Array<{ id: string; nome: string }>>([])
  const [trends, setTrends] = useState<Array<{ keyword: string; url: string }>>([])
  const [catRaiz, setCatRaiz] = useState<string>(() => { try { return localStorage.getItem('oraculo_ml_minera_cat') || 'MLB1574' } catch { return 'MLB1574' } })
  const [sub, setSub] = useState<string>('')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [fim, setFim] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState('giro')
  const [soOportunidades, setSoOportunidades] = useState(false)

  const catAtiva = sub || catRaiz
  const pageRef = useRef(0)          // próxima página a buscar (0 = a própria categoria)
  const vistosRef = useRef<Set<string>>(new Set())
  const buscandoRef = useRef(false)

  useEffect(() => {
    fetch('/api/ml/mineracao/categorias').then(r => r.json()).then(d => setCategorias(d.categorias || [])).catch(() => {})
    fetch('/api/ml/mineracao/trends').then(r => r.json()).then(d => setTrends((d.trends || []).slice(0, 12))).catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`/api/ml/mineracao/subcategorias?cat=${encodeURIComponent(catRaiz)}`).then(r => r.json()).then(d => setSubcats(d.subcategorias || [])).catch(() => setSubcats([]))
  }, [catRaiz])

  /** Busca UMA página do garimpo e ANEXA ao pool (dedupe por id). */
  const buscarPagina = useCallback(async (categoria: string, page: number, bust = false): Promise<boolean> => {
    if (buscandoRef.current) return false
    buscandoRef.current = true
    if (page === 0) { setLoading(true); setErro(null) } else setCarregandoMais(true)
    try {
      const r = await fetch(`/api/ml/mineracao?category=${encodeURIComponent(categoria)}&page=${page}${bust ? '&bust=1' : ''}`)
      const d = await r.json()
      if (!r.ok || d.error) { if (page === 0) { setErro(d.error || 'Não foi possível garimpar agora.'); setProdutos([]) } return false }
      const lista: Produto[] = d.produtos || []
      const novos = lista.filter(p => !vistosRef.current.has(p.id))
      novos.forEach(p => vistosRef.current.add(p.id))
      if (novos.length) setProdutos(prev => page === 0 ? novos : [...prev, ...novos])
      else if (page === 0) setProdutos([])
      pageRef.current = page + 1
      if (!d.temMais) setFim(true)
      return novos.length > 0
    } catch {
      if (page === 0) { setErro('Falha de conexão.'); setProdutos([]) }
      return false
    } finally {
      buscandoRef.current = false
      setLoading(false); setCarregandoMais(false)
    }
  }, [])

  // Troca de categoria/subcategoria → zera o pool e busca a página 0.
  useEffect(() => {
    try { localStorage.setItem('oraculo_ml_minera_cat', catRaiz) } catch {}
    vistosRef.current = new Set(); pageRef.current = 0; setFim(false); setProdutos([])
    buscarPagina(catAtiva, 0)
  }, [catAtiva, buscarPagina]) // eslint-disable-line

  // Scroll infinito: sentinela no fim do grid puxa a próxima página (= a próxima
  // subcategoria). Mesmo padrão da mineração da Amazon.
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || fim || loading || erro) return
    const io = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && !buscandoRef.current) buscarPagina(catAtiva, pageRef.current)
    }, { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  })

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
    return ord
  }, [produtos, soOportunidades, busca, ordem])

  const nOportunidades = useMemo(() => produtos.filter(p => p.revendavel).length, [produtos])
  const selStyle: React.CSSProperties = { background: T.modal, border: `1px solid ${T.line}`, borderRadius: 10, padding: '9px 12px', fontSize: 12.5, color: T.t1, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }

  const recarregar = () => {
    vistosRef.current = new Set(); pageRef.current = 0; setFim(false); setProdutos([])
    buscarPagina(catAtiva, 0, true)
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', paddingTop: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#fff159', background: '#2d3277', borderRadius: 6, padding: '3px 8px' }}>Mercado Livre</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em' }}>Mineração</h2>
        </div>
        <p style={{ fontSize: 13, color: T.t3, lineHeight: 1.6, maxWidth: 720 }}>
          O ranking <strong style={{ color: T.t2 }}>Mais Vendidos oficial do ML</strong> — giro real — com o <strong style={{ color: T.g }}>líquido que você receberia</strong>.
          Role a página: o garimpo desce nas subcategorias e traz produto novo sem parar.
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' as const }}>
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
        <button onClick={() => setSoOportunidades(v => !v)} title="Esconde marcas de supermercado e marcas grandes — mostra só o que dá pra revender genérico"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' as const, border: `1px solid ${soOportunidades ? tint(T.g, 55) : T.line}`, background: soOportunidades ? tint(T.g, 14) : T.card, color: soOportunidades ? T.g : T.t2 }}>
          <i className={`ti ${soOportunidades ? 'ti-bulb-filled' : 'ti-bulb'}`} style={{ fontSize: 15 }} aria-hidden="true" /> Só oportunidades
        </button>
        <button onClick={recarregar} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, border: `1px solid ${T.line}`, background: T.card, color: T.t2, opacity: loading ? 0.6 : 1 }}>
          <i className="ti ti-refresh" style={{ fontSize: 14 }} aria-hidden="true" /> Atualizar
        </button>
      </div>

      {!loading && !erro && produtos.length > 0 && (
        <div style={{ fontSize: 11.5, color: T.t3, marginBottom: 12, display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
          <span>{visiveis.length} produto{visiveis.length === 1 ? '' : 's'}{fim ? '' : '+'}{soOportunidades ? ' (só oportunidades)' : ''}</span>
          {!soOportunidades && <span style={{ color: T.g }}>💡 {nOportunidades} sem marca dominando</span>}
        </div>
      )}

      {erro && <div style={{ padding: '14px 16px', textAlign: 'center' as const, color: T.r, fontSize: 13, background: tint(T.r, 8), border: `1px solid ${tint(T.r, 25)}`, borderRadius: 12, marginBottom: 12 }}>{erro}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
        {loading && produtos.length === 0
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} i={i} />)
          : visiveis.map(p => <CardProduto key={p.id} p={p} />)}
        {carregandoMais && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`m${i}`} i={i} />)}
      </div>

      {/* Sentinela do scroll infinito + botão explícito.
          ⚠️ O botão não é redundante: se o IntersectionObserver não disparar (aba
          em segundo plano, navegador que pausa observers, zoom estranho), o
          garimpo travaria em 20 produtos sem o usuário ter como continuar. */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {!fim && !loading && produtos.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 0 4px' }}>
          <button onClick={() => buscarPagina(catAtiva, pageRef.current)} disabled={carregandoMais}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 11, cursor: carregandoMais ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, border: `1px solid ${T.line}`, background: T.card, color: carregandoMais ? T.t4 : T.t2 }}>
            {carregandoMais
              ? <><i className="ti ti-loader-2" style={{ fontSize: 15 }} aria-hidden="true" /> garimpando…</>
              : <><i className="ti ti-plus" style={{ fontSize: 15 }} aria-hidden="true" /> Carregar mais produtos</>}
          </button>
        </div>
      )}

      {!loading && !erro && produtos.length > 0 && visiveis.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
          {soOportunidades ? 'Nenhuma oportunidade nesse recorte — role mais pra carregar outras subcategorias, ou desligue "só oportunidades".' : 'Nada bateu com a busca.'}
        </div>
      )}

      {fim && produtos.length > 0 && (
        <div style={{ textAlign: 'center' as const, color: T.t4, fontSize: 11.5, padding: '18px 0 4px' }}>
          Fim do garimpo desta categoria — troque a categoria pra continuar.
        </div>
      )}

      <p style={{ fontSize: 10.5, color: T.t4, marginTop: 14, lineHeight: 1.5 }}>
        <strong>GENÉRICO / sem marca</strong> = dá pra comprar genérico e revender (a régua é a marca, igual à mineração da Amazon). Marca de supermercado (Omo, Tixan…) e marca grande (Samsung, Tramontina…) aparecem marcadas — é o mercado do fabricante.
        {' '}<strong>Recebe</strong> = preço − comissão real − envio real (reputação verde), antes de imposto/custo/Ads. <strong>Compre até</strong> = o máximo a pagar no fornecedor pra fechar naquela margem (imposto 4% embutido).
      </p>
    </div>
  )
}
