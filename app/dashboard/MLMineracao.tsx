'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Mineração MERCADO LIVRE — o MESMO design da mineração da Amazon ("Mais
// Vendidos" do DashboardClient), de propósito e peça por peça:
//   · cabeçalho: breadcrumb 9px + h1 21px + "{categoria} · N produtos+" à
//     esquerda; busca (botão dourado), "Categoria:", "Ordenar:", CSV e
//     ATUALIZAR à direita — mesmos tamanhos/cores/uppercase.
//   · grid repeat(auto-fill, minmax(200px,1fr)) + .ora-card-in (fadeUp).
//   · card: ScoreRing no canto, badge GENÉRICO roxo, imagem 162px com zoom no
//     hover, hero grande (.ora-num) + pílula, meta 10px, rodapé "VER NO ML →".
// O dado é o do ML: ranking BEST_SELLER oficial (giro real), "você recebe"
// líquido real e o COMPRE ATÉ. O scroll infinito desce nas subcategorias
// (o ranking do ML tem 20 posições fixas por categoria).
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  card: 'var(--card)', cardHov: 'var(--cardHov)', line: 'var(--line)', line2: 'var(--line2, var(--line))',
  lineG: 'var(--lineG)', goldG: 'var(--goldG)', modal: 'var(--modal)',
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
  marca: string | null; revendavel: boolean; fonteNome?: string
}

// Score do card (0-100), espelhando o espírito do cardScore da Amazon (demanda +
// margem + genérico): aqui é margem real (peso maior), posição no ranking (giro
// real) e o bônus de genérico. Só ordena/da cor — não decide dinheiro.
function mlScore(p: Produto): number {
  const m = p.margemPct != null ? Math.min(55, p.margemPct * 0.6) : 0
  const rank = Math.max(0, (21 - p.pos)) * 1.5
  const gen = p.revendavel ? 15 : 0
  return Math.max(5, Math.min(100, Math.round(m + Math.min(30, rank) + gen)))
}
const sColor = (s: number) => s >= 70 ? T.g : s >= 50 ? T.a : T.r
function ScoreRing({ score }: { score: number }) {
  const c = sColor(score); const r = 9; const circ = 2 * Math.PI * r
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
      <circle cx="14" cy="14" r={r} fill="none" style={{ stroke: T.line }} strokeWidth="2.5" />
      <circle cx="14" cy="14" r={r} fill="none" stroke={c} strokeWidth="2.5"
        strokeDasharray={`${circ * (score / 100)} ${circ}`} strokeDashoffset={circ * .25} strokeLinecap="round" />
      <text x="14" y="18" textAnchor="middle" fontSize="7" fontWeight="700" fill={c} fontFamily="inherit">{score}</text>
    </svg>
  )
}
// Pílula ao lado do hero (o equivalente do nível de demanda da Amazon).
const mInfo = (m: number | null) => m == null ? null : m >= 70 ? { l: 'Margem Alta', c: T.g } : m >= 55 ? { l: 'Margem Boa', c: T.gold } : { l: 'Apertada', c: T.a }

function CardProduto({ p }: { p: Produto }) {
  const [hov, setHov] = useState(false)
  const score = mlScore(p)
  const dem = mInfo(p.margemPct)
  const mCor = p.margemPct == null ? T.t3 : p.margemPct >= 70 ? T.g : p.margemPct >= 55 ? T.gold : T.a
  const abrir = () => { if (p.permalink) window.open(p.permalink, '_blank', 'noopener') }
  return (
    <div onClick={abrir} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      role="link" tabIndex={0} title={p.sinais[0] || undefined}
      onKeyDown={e => { if (e.key === 'Enter') abrir() }}
      style={{ background: hov ? T.cardHov : T.card, border: `1px solid ${hov ? T.lineG : T.line}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        transition: 'background .15s,border-color .15s,transform .15s,box-shadow .15s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? 'var(--elev2),0 0 0 1px rgba(240,180,41,0.08)' : 'var(--elev1)',
        display: 'flex', flexDirection: 'column' as const, position: 'relative' as const }}>
      {/* Score badge (igual Amazon) */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}><ScoreRing score={score} /></div>
      {/* Badge GENÉRICO — idêntico ao da Amazon; marca vai na linha de meta */}
      {p.revendavel && <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, background: 'rgba(3,3,10,0.8)', backdropFilter: 'blur(4px)', border: `1px solid ${tint(T.pur, 21)}`, borderRadius: 4, padding: '2px 7px', fontSize: 8, fontWeight: 700, color: T.pur, letterSpacing: '0.1em' }}>GENÉRICO</div>}
      {/* Imagem */}
      <div style={{ background: '#F8F8FC', height: 162, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
        {p.foto
          ? <img src={p.foto} alt="" loading="lazy" decoding="async" style={{ maxHeight: 138, maxWidth: '88%', objectFit: 'contain' as const, transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)', transform: hov ? 'scale(1.08)' : 'scale(1)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <div style={{ width: 44, height: 44, background: '#e8e8f0', borderRadius: 8 }} />}
      </div>
      <div style={{ padding: '14px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
        {/* Hero: margem real + pílula (anatomia do "~530 est./mês · MUITO ALTA") */}
        {p.margemPct != null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, flexWrap: 'wrap' as const }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span className="ora-num" style={{ fontSize: 22, fontWeight: 700, color: mCor, letterSpacing: '-0.03em', lineHeight: 1 }}>{p.margemPct}%</span>
              <span style={{ fontSize: 10, color: T.t3, fontWeight: 500 }}>recebe {p.voceRecebe != null ? brl(p.voceRecebe) : '—'}</span>
            </div>
            {dem && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' as const, color: dem.c, background: tint(dem.c, 12), borderRadius: 5, padding: '2px 6px' }}>{dem.l}</span>}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: T.t4, marginBottom: 8 }}>líquido não medido</div>
        )}
        <p style={{ fontSize: 12, fontWeight: 500, color: T.t1, lineHeight: 1.58, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', marginBottom: 10 }}>{p.nome || '—'}</p>
        {/* Meta (o "BSR #x · marca" da Amazon): posição · preço · marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, minWidth: 0 }}>
          <span style={{ fontSize: 10, color: T.t3, whiteSpace: 'nowrap' as const }}>{p.pos}º <strong style={{ color: T.t2, fontWeight: 600 }}>{p.fonteNome || 'no ranking'}</strong></span>
          <span style={{ color: T.t3, fontSize: 10 }}>·</span>
          <span style={{ fontSize: 10, color: T.t2, fontWeight: 600, whiteSpace: 'nowrap' as const }}>{p.preco > 0 ? brl(p.preco) : '—'}</span>
          {p.marca && <><span style={{ color: T.t3, fontSize: 10 }}>·</span><span style={{ fontSize: 10, color: T.t3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 70 }}>{p.marca}</span></>}
        </div>
        {/* COMPRE ATÉ — o diferencial do ML (fica, compacto) */}
        {p.custoAlvo && p.custoAlvo.m30 > 0 && (
          <div style={{ background: T.modal, borderRadius: 8, padding: '6px 9px', marginBottom: 11 }}>
            <div style={{ fontSize: 8, color: T.t4, marginBottom: 2, fontWeight: 700, letterSpacing: '0.06em' }}>COMPRE ATÉ</div>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' as const }}>
              {([['20%', p.custoAlvo.m20], ['30%', p.custoAlvo.m30], ['40%', p.custoAlvo.m40]] as Array<[string, number]>).map(([m, v]) => (
                <span key={m} style={{ fontSize: 10 }}><span style={{ color: T.t4 }}>{m}</span> <strong className="ora-num" style={{ color: v > 0 ? T.t1 : T.t4, fontWeight: 600 }}>{v > 0 ? brl(v) : '—'}</strong></span>
              ))}
            </div>
          </div>
        )}
        {/* Rodapé idêntico ao "VER ANÁLISE →" */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${T.line}`, paddingTop: 11 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: hov ? T.gold : T.t3, transition: 'color .15s' }}>Ver no ML</span>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: hov ? 'var(--goldSub)' : 'none', border: `1px solid ${hov ? T.lineG : T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke={hov ? T.gold : T.t3} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke .15s' }} /></svg>
          </div>
        </div>
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

// CSV do garimpo (espelha o exportCSV da Amazon).
function exportCSV(produtos: Produto[], catNome: string) {
  const linhas = [
    ['Posição', 'Ranking', 'Produto', 'Marca', 'Preço', 'Você recebe', 'Margem %', 'Compre até 30%', 'Vendedores', 'Link'],
    ...produtos.map(p => [
      String(p.pos), p.fonteNome || catNome, (p.nome || '').replace(/;/g, ','), p.marca || 'genérico',
      p.preco > 0 ? p.preco.toFixed(2).replace('.', ',') : '',
      p.voceRecebe != null ? p.voceRecebe.toFixed(2).replace('.', ',') : '',
      p.margemPct != null ? String(p.margemPct).replace('.', ',') : '',
      p.custoAlvo ? p.custoAlvo.m30.toFixed(2).replace('.', ',') : '',
      p.concorrencia ? String(p.concorrencia.vendedores) : '', p.permalink || '',
    ]),
  ]
  const csv = '﻿' + linhas.map(l => l.map(c => `"${c}"`).join(';')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `mineracao-ml-${catNome.toLowerCase().replace(/\s+/g, '-')}.csv`
  a.click(); URL.revokeObjectURL(a.href)
}

const ferramenta: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: T.cardHov, border: `1px solid ${T.line2}`, color: T.t2, fontWeight: 600, fontSize: 10, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.08em', textTransform: 'uppercase' as const, transition: 'all .15s' }

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
  const [buscaInput, setBuscaInput] = useState('')
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState('giro')
  const [soOportunidades, setSoOportunidades] = useState(false)

  const catAtiva = sub || catRaiz
  const pageRef = useRef(0)
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

  useEffect(() => {
    try { localStorage.setItem('oraculo_ml_minera_cat', catRaiz) } catch {}
    vistosRef.current = new Set(); pageRef.current = 0; setFim(false); setProdutos([])
    buscarPagina(catAtiva, 0)
  }, [catAtiva, buscarPagina]) // eslint-disable-line

  // Scroll infinito (sentinela) — padrão do DashboardClient.
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
    else if (ordem === 'score') ord.sort((a, b) => mlScore(b) - mlScore(a))
    return ord
  }, [produtos, soOportunidades, busca, ordem])

  const nOportunidades = useMemo(() => produtos.filter(p => p.revendavel).length, [produtos])
  const catNome = categorias.find(c => c.id === catRaiz)?.nome || 'Mercado Livre'
  const subNome = subcats.find(c => c.id === sub)?.nome

  const recarregar = () => {
    vistosRef.current = new Set(); pageRef.current = 0; setFim(false); setProdutos([])
    buscarPagina(catAtiva, 0, true)
  }
  const buscar = () => setBusca(buscaInput)
  const limparBusca = () => { setBuscaInput(''); setBusca('') }

  // Selects no MESMO estilo dos da Amazon (10.5px, cardHov, radius 8).
  const sel = (ativo: boolean): React.CSSProperties => ({ background: T.cardHov, border: `1px solid ${ativo ? T.lineG : T.line2}`, color: ativo ? T.gold : T.t2, fontWeight: 600, fontSize: 10.5, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em', outline: 'none', transition: 'all .15s' })

  return (
    <div style={{ width: '100%' }}>
      {/* ── Cabeçalho: cópia do "Mais Vendidos" da Amazon ── */}
      <div className="ora-phead" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.t3, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>Mineração</span>
            <span style={{ color: T.t3, fontSize: 9 }}>/</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.gold, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>Mercado Livre</span>
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em', marginBottom: 6, lineHeight: 1 }}>Mineração ML</h1>
          <p style={{ fontSize: 11, color: T.t3 }}>
            {busca ? <>Resultados para <span style={{ color: T.gold }}>“{busca}”</span></> : <>{catNome}{subNome ? ` · ${subNome}` : ''}</>}
            {produtos.length > 0 && <> · <span className="ora-num" style={{ color: T.t4 }}>{visiveis.length}</span> <span style={{ color: T.t4 }}>produtos{fim ? '' : '+'}</span></>}
            {produtos.length > 0 && !soOportunidades && <> · <span style={{ color: T.g }}>💡 {nOportunidades} genéricos</span></>}
          </p>
        </div>
        {/* Ferramentas: busca + categoria + subcategoria + ordenar + oportunidades + CSV + atualizar */}
        <div className="ora-ptools" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' as const, justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: T.cardHov, border: `1px solid ${busca ? T.lineG : T.line2}`, borderRadius: 8, overflow: 'hidden' }}>
            <input value={buscaInput} onChange={e => setBuscaInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') buscar() }}
              placeholder="Buscar produto…" aria-label="Buscar produto"
              style={{ background: 'none', border: 'none', outline: 'none', color: T.t1, fontSize: 11.5, fontWeight: 500, padding: '8px 10px', fontFamily: 'inherit', width: 150 }} />
            {busca && (
              <button onClick={limparBusca} title="Limpar busca" aria-label="Limpar busca"
                style={{ background: 'none', border: 'none', color: T.t2, cursor: 'pointer', padding: '0 8px', fontSize: 16, lineHeight: 1 }}>×</button>
            )}
            <button onClick={buscar} title="Buscar" aria-label="Buscar"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.goldG, border: 'none', color: '#1a1200', cursor: 'pointer', padding: '9px 12px' }}>
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.4" stroke="currentColor" strokeWidth="1.6" /><path d="M7.6 7.6L10.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </div>
          <select value={catRaiz} aria-label="Categoria" title="Escolher categoria"
            onChange={e => { setCatRaiz(e.target.value); setSub('') }} style={sel(true)}>
            {categorias.length === 0 && <option value={catRaiz}>Categoria…</option>}
            {categorias.map(c => <option key={c.id} value={c.id}>{`Categoria: ${c.nome}`}</option>)}
          </select>
          {subcats.length > 0 && (
            <select value={sub} aria-label="Subcategoria" title="Afinar a subcategoria"
              onChange={e => setSub(e.target.value)} style={sel(!!sub)}>
              <option value="">Subcategoria: Todas</option>
              {subcats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          )}
          <select value={ordem} aria-label="Ordenar produtos" title="Ordenar produtos"
            onChange={e => setOrdem(e.target.value)} style={sel(ordem !== 'giro')}>
            <option value="giro">Ordenar: Giro (ranking)</option>
            <option value="score">Ordenar: Melhor score</option>
            <option value="margem">Ordenar: Melhor margem</option>
            <option value="recebe">Ordenar: Maior recebe</option>
            <option value="preco">Ordenar: Menor preço</option>
            <option value="concorrencia">Ordenar: Menos concorrência</option>
          </select>
          <button onClick={() => setSoOportunidades(v => !v)} title="Esconde marca de supermercado/marca grande — só o que dá pra revender genérico"
            style={{ ...ferramenta, ...(soOportunidades ? { borderColor: T.lineG, color: T.gold } : {}) }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 3.6 10.8c-.5.4-.6 1-.6 1.7v.5h-6v-.5c0-.7-.1-1.3-.6-1.7A6 6 0 0 1 12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Oportunidades
          </button>
          {produtos.length > 0 && (
            <button onClick={() => exportCSV(visiveis, subNome || catNome)} style={ferramenta}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.lineG; el.style.color = T.gold }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.line2; el.style.color = T.t2 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5.5l3 3 3-3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              CSV
            </button>
          )}
          <button onClick={recarregar} title="Refaz o garimpo desta categoria (fura o cache)"
            style={{ ...ferramenta, letterSpacing: '0.1em', padding: '8px 16px' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.lineG; el.style.color = T.gold }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.line2; el.style.color = T.t2 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M9.5 2A5 5 0 1 0 10 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M9.5 2V5H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Atualizar
          </button>
        </div>
      </div>

      {erro && <div style={{ padding: '14px 16px', textAlign: 'center' as const, color: T.r, fontSize: 13, background: tint(T.r, 8), border: `1px solid ${tint(T.r, 25)}`, borderRadius: 12, marginBottom: 12 }}>{erro}</div>}

      {/* Skeleton (igual Amazon) */}
      {loading && produtos.length === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} i={i} />)}
        </div>
      )}

      {/* Grid (mesmas colunas/gap/entrada animada da Amazon) */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {visiveis.map((p, i) => (
            <div key={p.id} className="ora-card-in" style={{ animationDelay: `${(i % 12) * 40}ms` }}>
              <CardProduto p={p} />
            </div>
          ))}
          {carregandoMais && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`m${i}`} i={i} />)}
        </div>
      )}

      {/* Sentinela + botão (o observer não dispara em aba de 2º plano) */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {!fim && !loading && produtos.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 0 4px' }}>
          <button onClick={() => buscarPagina(catAtiva, pageRef.current)} disabled={carregandoMais} style={ferramenta}>
            {carregandoMais ? 'garimpando…' : 'Carregar mais produtos'}
          </button>
        </div>
      )}

      {!loading && !erro && produtos.length > 0 && visiveis.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13, marginTop: 12 }}>
          {soOportunidades ? 'Nenhum genérico neste recorte — carregue mais produtos ou desligue o filtro de oportunidades.' : 'Nada bateu com a busca.'}
        </div>
      )}
      {fim && produtos.length > 0 && (
        <div style={{ textAlign: 'center' as const, color: T.t4, fontSize: 11.5, padding: '16px 0 4px' }}>
          Fim do garimpo desta categoria — troque a categoria pra continuar.
        </div>
      )}

      {/* Buscas em alta (conteúdo do ML; fica discreto, abaixo do garimpo) */}
      {trends.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.t3, textTransform: 'uppercase' as const, letterSpacing: '0.14em', marginBottom: 8 }}>🔥 Buscas em alta no Mercado Livre</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' as const }}>
            {trends.map(t => (
              <a key={t.keyword} href={t.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: T.t2, background: T.card, border: `1px solid ${T.line}`, borderRadius: 20, padding: '4px 11px', textDecoration: 'none' }}>{t.keyword}</a>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: 10.5, color: T.t4, marginTop: 16, lineHeight: 1.5 }}>
        <strong>GENÉRICO</strong> = sem marca dominando — dá pra comprar genérico e revender (marca de supermercado e marca grande aparecem no card, sem o selo).
        <strong> Recebe</strong> = preço − comissão real − envio real (reputação verde), antes de imposto/custo/Ads. <strong>Compre até</strong> = o máximo a pagar no fornecedor pra fechar naquela margem (imposto 4% embutido). O score resume margem + posição no ranking + genérico.
      </p>
    </div>
  )
}
