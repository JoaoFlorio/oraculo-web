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
  bg: 'var(--bg)', card: 'var(--card)', cardHov: 'var(--cardHov)', line: 'var(--line)', line2: 'var(--line2, var(--line))',
  lineG: 'var(--lineG)', goldG: 'var(--goldG)', goldSub: 'var(--goldSub)', modal: 'var(--modal)',
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

function CardProduto({ p, onOpen }: { p: Produto; onOpen: () => void }) {
  const [hov, setHov] = useState(false)
  const score = mlScore(p)
  const dem = mInfo(p.margemPct)
  const mCor = p.margemPct == null ? T.t3 : p.margemPct >= 70 ? T.g : p.margemPct >= 55 ? T.gold : T.a
  return (
    <div onClick={onOpen} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      role="button" tabIndex={0} title={p.sinais[0] || undefined}
      aria-label={`Ver análise de ${p.nome || 'produto'}`}
      onKeyDown={e => { if (e.key === 'Enter') onOpen() }}
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
        {/* Rodapé idêntico ao "VER ANÁLISE →" — o clique abre o modal de análise */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${T.line}`, paddingTop: 11 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: hov ? T.gold : T.t3, transition: 'color .15s' }}>Ver análise</span>
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

/* ── Modal de análise do produto — espelho do DetailModal da mineração Amazon ── */
function Chip({ text, c }: { text: string; c: string }) { return <span style={{ background: tint(c, 9), color: c, border: `1px solid ${tint(c, 16)}`, borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 600, letterSpacing: '0.03em' }}>{text}</span> }
function Lbl({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) { return <div style={{ fontSize: 9, fontWeight: 700, color: T.t3, letterSpacing: '0.14em', textTransform: 'uppercase' as const, ...style }}>{children}</div> }
const fmtN = (n: number) => Math.round(n).toLocaleString('pt-BR')
const fmtR = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type Detalhe = {
  itemId: string; titulo: string; tituloLen: number; preco: number
  pictures: string[]; dateCreated: string | null; atributos: number
  vendidos: number | null; permalink: string | null; health: number | null
  listingType: string | null; logisticType: string | null
}

// Baixa as imagens do anúncio pelo MESMO proxy da Amazon (mlstatic liberado lá).
function MLImageDownloader({ images, itemId, titulo }: { images: string[]; itemId: string; titulo: string }) {
  const [downloading, setDownloading] = useState<number | 'all' | null>(null)
  const slug = (t: string) => (t || itemId).slice(0, 40).replace(/[^a-z0-9]/gi, '-').toLowerCase()
  async function baixar(url: string, idx: number) {
    const filename = `${slug(titulo)}-img${idx + 1}.jpg`
    const res = await fetch(`/api/product/image-proxy?url=${encodeURIComponent(url)}&filename=${filename}`)
    if (!res.ok) throw new Error()
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = filename; a.click()
    URL.revokeObjectURL(a.href)
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Lbl>Imagens do Anúncio ({images.length})</Lbl>
        <button disabled={downloading === 'all'}
          onClick={async () => { setDownloading('all'); for (let i = 0; i < images.length; i++) { try { await baixar(images[i], i); await new Promise(r => setTimeout(r, 400)) } catch {} } setDownloading(null) }}
          style={{ background: downloading === 'all' ? 'rgba(240,180,41,0.05)' : T.goldSub, border: `1px solid ${T.lineG}`, color: T.gold, fontSize: 10, fontWeight: 700, padding: '5px 14px', borderRadius: 7, cursor: downloading === 'all' ? 'wait' : 'pointer', fontFamily: 'inherit', letterSpacing: '0.06em', opacity: downloading === 'all' ? 0.6 : 1 }}>
          {downloading === 'all' ? 'Baixando…' : '⬇ Baixar Todas'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(96px,1fr))', gap: 8 }}>
        {images.map((url, i) => (
          <div key={i} style={{ position: 'relative' as const, background: '#F8F8FC', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.line}` }}>
            <img src={url} alt={`img ${i + 1}`} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <button disabled={downloading === i || downloading === 'all'}
              onClick={async () => { setDownloading(i); try { await baixar(url, i) } catch { alert('Erro ao baixar imagem. Tente novamente.') } finally { setDownloading(null) } }}
              style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(3,3,10,0.82)', backdropFilter: 'blur(4px)', border: `1px solid ${T.lineG}`, color: T.gold, fontSize: 11, width: 26, height: 26, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: downloading === i ? 0.5 : 1 }}
              title={`Baixar imagem ${i + 1}`}>{downloading === i ? '…' : '⬇'}</button>
            <div style={{ position: 'absolute', top: 3, left: 3, background: 'rgba(3,3,10,0.7)', borderRadius: 4, padding: '1px 5px', fontSize: 9, color: T.t3, fontWeight: 600 }}>{i + 1}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MLDetalheModal({ p, onClose }: { p: Produto; onClose: () => void }) {
  const [det, setDet] = useState<Detalhe | null>(null)
  const [price, setPrice] = useState(p.preco || 0)
  const [cost, setCost] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  useEffect(() => {
    // `product` = id do ranking (catálogo, que o token de serviço LÊ);
    // `item` = a oferta vencedora (best-effort — /items de terceiro costuma dar 403).
    const qs = new URLSearchParams({ product: p.id })
    if (p.itemId && p.itemId !== p.id) qs.set('item', p.itemId)
    fetch(`/api/ml/mineracao/detalhe?${qs.toString()}`).then(r => r.json())
      .then(d => { if (d && !d.error) setDet(d) }).catch(() => {})
  }, [p.id, p.itemId])

  // ── Dados derivados (tudo do ML, nada chutado) ──────────────────────────────
  const vendidos = det?.vendidos ?? p.vendidos
  const meses = det?.dateCreated ? Math.max(1, Math.round((Date.now() - new Date(det.dateCreated).getTime()) / (30 * 86400_000))) : null
  // Giro médio REAL: vendidos totais ÷ meses de anúncio (os dois vêm da API).
  const estMensal = (vendidos != null && meses) ? Math.max(1, Math.round(vendidos / meses)) : null
  const dem = p.pos <= 3 ? { l: 'Muito Alta', c: T.g } : p.pos <= 8 ? { l: 'Alta', c: T.g } : p.pos <= 14 ? { l: 'Média', c: T.a } : { l: 'Baixa', c: T.a }

  // Simulador: comissão real (% da categoria) + envio real medido.
  const pct = p.comissaoPct ?? (p.preco > 0 && p.comissao != null ? +(p.comissao / p.preco * 100).toFixed(1) : 13)
  const tarifa = +(price * pct / 100).toFixed(2)
  const envioVal = p.envio
  const profit = +(price - tarifa - (envioVal || 0) - cost).toFixed(2)
  const margin = price > 0 ? +((profit / price) * 100).toFixed(1) : 0
  const roi = cost > 0 ? +((profit / cost) * 100).toFixed(1) : 0

  // ── Score do anúncio — critérios REAIS (soma 100, igual ao breakdown Amazon) ──
  const nImgs = det ? det.pictures.length : (p.foto ? 1 : 0)
  const tituloLen = det?.tituloLen ?? (p.nome || '').length
  const nAttrs = det?.atributos ?? null
  const breakdown = [
    { key: 'demanda', icon: 'ti-chart-bar', label: 'Demanda', score: p.pos <= 3 ? 30 : p.pos <= 8 ? 25 : p.pos <= 14 ? 18 : 12, max: 30, sub: `${p.pos}º do ranking oficial` },
    { key: 'imagens', icon: 'ti-photo', label: 'Imagens', score: det ? (nImgs >= 8 ? 20 : nImgs >= 6 ? 16 : nImgs >= 4 ? 10 : nImgs * 2) : 0, max: 20, sub: det ? `${nImgs} imagens` : 'carregando…' },
    { key: 'ficha', icon: 'ti-list-details', label: 'Ficha técnica', score: nAttrs != null ? (nAttrs >= 25 ? 20 : nAttrs >= 15 ? 16 : nAttrs >= 8 ? 10 : 5) : 0, max: 20, sub: nAttrs != null ? `${nAttrs} atributos` : 'carregando…' },
    { key: 'titulo', icon: 'ti-typography', label: 'Título', score: tituloLen >= 55 ? 15 : tituloLen >= 45 ? 12 : tituloLen >= 30 ? 8 : 4, max: 15, sub: `${tituloLen}/60 caracteres` },
    { key: 'marca', icon: 'ti-tag', label: 'Marca', score: p.revendavel ? 15 : 6, max: 15, sub: p.revendavel ? 'Sem marca — PL mais fácil' : `Marca ${p.marca || 'estabelecida'}` },
  ]
  const score = breakdown.reduce((s, b) => s + b.score, 0)
  const sc = sColor(score)

  const idade = (() => {
    if (!det?.dateCreated) return null
    const m = meses || 1
    if (m < 4) return 'Recente'
    if (m < 12) return `${m} meses`
    const anos = Math.floor(m / 12), resto = m % 12
    return resto ? `${anos}a ${resto}m` : `${anos} ano${anos > 1 ? 's' : ''}`
  })()

  // ── Como melhorar (regras sobre o dado real do anúncio) ─────────────────────
  type Rec = { priority: 'Alta' | 'Média' | 'Baixa'; icon: string; title: string; desc: string }
  const recs: Rec[] = []
  // O título do anúncio só é confiável quando o /items abriu (item de terceiro dá
  // 403; nome de CATÁLOGO não tem o limite de 60) — a rec só sai com o dado certo.
  const leuItem = !!(det && (det.dateCreated || det.health != null || det.vendidos != null))
  if (det && nImgs < 6) recs.push({ priority: 'Alta', icon: '📸', title: `Adicione mais imagens (você tem ${nImgs}, o ideal é 6+)`, desc: 'No ML, anúncios com 6+ fotos convertem melhor e pontuam mais na busca. Inclua fundo branco, foto em uso, detalhe do material e comparativo de tamanho.' })
  if (leuItem && tituloLen < 50) recs.push({ priority: tituloLen < 35 ? 'Alta' : 'Média', icon: '🔤', title: `Título com ${tituloLen} de 60 caracteres — use o espaço`, desc: 'O ML corta em 60 caracteres e as primeiras palavras pesam mais na busca. Encaixe produto + modelo + característica principal + benefício.' })
  if (p.concorrencia && p.concorrencia.amostra >= 5 && p.concorrencia.usandoFull / p.concorrencia.amostra <= 0.25) recs.push({ priority: 'Alta', icon: '🚚', title: `Só ${p.concorrencia.usandoFull} de ${p.concorrencia.amostra} concorrentes no Full — vantagem em aberto`, desc: 'Anúncio no Full ganha selo de entrega rápida e prioridade no ranking. Quem entrar primeiro leva a preferência do comprador.' })
  if (det?.health != null && det.health < 0.8) recs.push({ priority: 'Alta', icon: '🩺', title: `Saúde do anúncio em ${Math.round(det.health * 100)}%`, desc: 'O próprio ML mede a "saúde" do anúncio. Complete a ficha técnica, código universal e variações pra chegar perto de 100% — anúncio saudável rankeia melhor.' })
  if (p.concorrencia && p.concorrencia.precoMin > 0 && p.preco > p.concorrencia.precoMin * 1.15) recs.push({ priority: 'Média', icon: '💰', title: `Preço ${Math.round((p.preco / p.concorrencia.precoMin - 1) * 100)}% acima do menor da disputa`, desc: `A disputa deste produto vai de ${brl(p.concorrencia.precoMin)} a ${brl(p.concorrencia.precoMax)}. No catálogo do ML, o preço pesa muito na buy box.` })
  if (p.revendavel) recs.push({ priority: 'Média', icon: '🏷️', title: 'Registre sua marca no Brand Protection do ML', desc: 'Nicho sem marca dominante é a chance de criar a sua: marca registrada ganha proteção contra cópia e loja oficial no ML.' })
  if (p.listingType === 'gold_special' && p.preco >= 100) recs.push({ priority: 'Baixa', icon: '💳', title: 'Considere o anúncio Premium (parcelamento sem juros)', desc: 'Em ticket alto, o parcelamento sem juros do Premium aumenta conversão. A comissão sobe — simule o líquido na Calculadora ML antes.' })
  const pOrd = { Alta: 0, 'Média': 1, Baixa: 2 } as const
  recs.sort((a, b) => pOrd[a.priority] - pOrd[b.priority])

  const verdictDetails = (() => {
    const parts: string[] = []
    parts.push(`${p.pos}º do ranking Mais Vendidos — demanda comprovada pelo próprio ML`)
    if (p.margemPct != null) parts.push(p.margemPct >= 60 ? `líquido de ${p.margemPct}% após taxas reais` : `taxas comem ${100 - p.margemPct}% — margem apertada`)
    if (det && nImgs < 4) parts.push(`⚠️ só ${nImgs} imagem(ns) — ponto crítico`)
    if (p.revendavel) parts.push('nicho genérico sem marca dominante')
    else parts.push(`⚠️ marca ${p.marca || 'estabelecida'} na disputa`)
    return parts.join(' · ')
  })()
  const verdict = score >= 75 ? { l: 'Excelente Oportunidade', c: T.g } : score >= 55 ? { l: 'Boa Oportunidade', c: T.g } : score >= 38 ? { l: 'Potencial Médio', c: T.a } : { l: 'Baixo Potencial', c: T.r }

  const imagens = det?.pictures?.length ? det.pictures : (p.foto ? [p.foto] : [])
  const linkML = det?.permalink || p.permalink

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(1,1,8,0.92)', backdropFilter: 'blur(12px)', zIndex: 900, overflowY: 'auto', padding: '32px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 860, background: T.modal, border: `1px solid ${T.line}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', padding: '24px 28px', borderBottom: `1px solid ${T.line}`, background: 'linear-gradient(180deg,rgba(240,180,41,0.04) 0%,transparent 100%)' }}>
          <div style={{ width: 84, height: 84, background: '#F8F8F8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {imagens[0] ? <img src={imagens[0]} alt="" loading="lazy" style={{ maxWidth: 70, maxHeight: 70, objectFit: 'contain' }} /> : <div style={{ width: 32, height: 32, background: '#e0e0e0', borderRadius: 6 }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.t1, lineHeight: 1.55, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{det?.titulo || p.nome}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {p.itemId && <Chip text={p.itemId} c={T.t3} />}
              {p.fonteNome && <Chip text={p.fonteNome} c={T.gold} />}
              {p.marca ? <Chip text={p.marca} c={T.pur} /> : <Chip text="Genérico" c={T.pur} />}
              {p.listingType && <Chip text={p.listingType === 'gold_pro' ? 'Premium' : 'Clássico'} c={T.t3} />}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: `1px solid ${T.line}`, color: T.t2, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
        </div>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: `1px solid ${T.line}` }}>
          {[
            { v: `#${p.pos}`, l: 'Ranking do ML', c: T.t1, num: true },
            { v: estMensal != null ? `~${fmtN(estMensal)}/mês` : (vendidos != null ? `${fmtN(vendidos)}` : '—'), l: estMensal != null ? 'Média real de vendas' : (vendidos != null ? 'Vendidos (total)' : 'Vendas'), c: dem.c, num: true },
            { v: dem.l, l: 'Nível de Demanda', c: dem.c, num: false },
            { v: det ? `${score}/100` : '…', l: 'Score do Anúncio', c: sc, num: true },
          ].map((k, i) => (
            <div key={i} style={{ padding: '18px 20px', borderRight: i < 3 ? `1px solid ${T.line}` : 'none', textAlign: 'center' as const }}>
              <div className={k.num ? 'ora-num' : undefined} style={{ fontSize: 20, fontWeight: 700, color: k.c, letterSpacing: '-0.02em', marginBottom: 4, lineHeight: 1 }}>{k.v}</div>
              <div style={{ fontSize: 9, color: T.t3, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{k.l}</div>
            </div>
          ))}
        </div>
        {/* Score breakdown */}
        <div style={{ padding: '16px 28px', borderBottom: `1px solid ${T.line}`, background: tint(T.card, 50) }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.t3, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Score do Anúncio — Critérios Reais</div>
          <div className="ora-mlbr" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
            {breakdown.map(b => {
              const pctB = Math.round((b.score / b.max) * 100)
              const c = pctB >= 80 ? T.g : pctB >= 50 ? T.a : T.r
              return (
                <div key={b.key} style={{ background: T.bg, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.line}` }}>
                  <div style={{ marginBottom: 4 }}><i className={`ti ${b.icon}`} style={{ fontSize: 15, color: c }} aria-hidden="true" /></div>
                  <div style={{ fontSize: 9, color: T.t3, fontWeight: 600, letterSpacing: '0.08em', marginBottom: 6 }}>{b.label}</div>
                  <div className="ora-num" style={{ fontSize: 14, fontWeight: 700, color: c, marginBottom: 4 }}>{b.score}<span style={{ fontSize: 9, color: T.t3, fontWeight: 400 }}>/{b.max}</span></div>
                  <div style={{ height: 3, background: T.card, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pctB}%`, background: c, borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: 9, color: T.t3, marginTop: 5, lineHeight: 1.4 }}>{b.sub}</div>
                </div>
              )
            })}
          </div>
        </div>
        {/* Idade + faturamento */}
        <div style={{ padding: '14px 28px', borderBottom: `1px solid ${T.line}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 9, color: T.t3, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><i className="ti ti-clock" style={{ fontSize: 12 }} aria-hidden="true" /> Idade do Anúncio</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.t1, letterSpacing: '-0.02em' }}>{idade || (det ? '—' : '…')}</div>
            <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{det?.dateCreated ? `Data real da API do ML (${new Date(det.dateCreated).toLocaleDateString('pt-BR')})` : det ? 'o ML não expõe a data deste anúncio de catálogo' : 'carregando o anúncio…'}</div>
          </div>
          <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 9, color: T.t3, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><i className="ti ti-cash" style={{ fontSize: 12, color: T.gold }} aria-hidden="true" /> Faturamento Anual Est.</div>
            <div className="ora-num" style={{ fontSize: 18, fontWeight: 700, color: T.gold, letterSpacing: '-0.02em' }}>{estMensal != null ? `R$ ${fmtN(estMensal * p.preco * 12)}` : '—'}</div>
            <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{estMensal != null ? `~${fmtN(estMensal)} un/mês × R$ ${fmtR(p.preco)} × 12` : 'o ML não publica o giro deste anúncio'}</div>
          </div>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Ranking gauge */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <Lbl>Ranking no Mercado Livre</Lbl>
              <span style={{ fontSize: 10, color: T.t3 }}>posição menor = produto mais vendido</span>
            </div>
            <div style={{ height: 6, background: T.card, borderRadius: 99, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right,${T.g},${T.a},${T.r})`, opacity: .3 }} />
              <div style={{ position: 'absolute', top: -3, left: `${Math.min(94, ((p.pos - 1) / 19) * 100)}%`, transform: 'translateX(-50%)', width: 12, height: 12, background: dem.c, borderRadius: '50%', border: `2px solid ${T.modal}`, boxShadow: `0 0 10px ${dem.c}` }} />
            </div>
          </div>
          {/* Simulador */}
          <div>
            <Lbl style={{ marginBottom: 14 }}>Simulador de Lucratividade</Lbl>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[{ l: 'Preço de Venda (R$)', v: price, s: setPrice, isPrice: true }, { l: 'Custo do Produto (R$)', v: cost, s: setCost, isPrice: false }].map(f => (
                <div key={f.l} style={{ background: T.bg, border: `1px solid ${T.lineG}`, borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: 9, color: T.t3, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{f.l}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 13, color: T.t3, fontWeight: 500 }}>R$</span>
                    <input type="number" min={0} value={f.v} onChange={e => f.s(+e.target.value || 0)} style={{ background: 'none', border: 'none', color: T.gold, fontSize: 22, fontWeight: 700, width: '100%', outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  {f.isPrice && <div style={{ fontSize: 9, color: T.g, marginTop: 4 }}>📍 Preço real do Mercado Livre</div>}
                  {!f.isPrice && p.custoAlvo && p.custoAlvo.m30 > 0 && <div style={{ fontSize: 9, color: T.t3, marginTop: 4 }}>compre até {brl(p.custoAlvo.m30)} p/ 30% de margem</div>}
                </div>
              ))}
            </div>
            <div style={{ background: T.bg, borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.line}` }}>
              <div style={{ padding: '0 16px' }}>
                {[
                  { l: 'Preço de venda', v: `R$ ${fmtR(price)}`, neg: false },
                  { l: `Tarifa do ML (${pct.toFixed(1).replace('.', ',')}%)`, v: `− R$ ${fmtR(tarifa)}`, neg: true },
                  { l: 'Envio (custo real do seller)', v: envioVal != null ? `− R$ ${fmtR(envioVal)}` : 'não medido', neg: true },
                  { l: 'Custo do produto', v: `− R$ ${fmtR(cost)}`, neg: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.line}` }}>
                    <span style={{ fontSize: 12, color: row.neg ? T.t2 : T.t1 }}>{row.l}</span>
                    <span style={{ fontSize: 12, color: row.neg ? T.r : T.t1, fontWeight: row.neg ? 400 : 500 }}>{row.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: T.card }}>
                {[{ l: 'Lucro / unidade', v: `R$ ${fmtR(profit)}`, s: `Margem ${margin.toFixed(1).replace('.', ',')}%`, c: profit >= 0 ? T.gold : T.r }, { l: 'ROI sobre custo', v: cost > 0 ? `${roi.toFixed(0)}%` : '—', s: 'Retorno do capital', c: roi >= 0 ? T.g : T.r }].map((b, i) => (
                  <div key={i} style={{ padding: '14px 16px', borderRight: i === 0 ? `1px solid ${T.line}` : 'none' }}>
                    <div style={{ fontSize: 9, color: T.t3, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 6 }}>{b.l}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: b.c, letterSpacing: '-0.02em', marginBottom: 2 }}>{b.v}</div>
                    <div style={{ fontSize: 10, color: T.t3 }}>{b.s}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 9.5, color: T.t4, marginTop: 6 }}>Tarifa e envio são os REAIS medidos pra este anúncio (reputação verde) — não é estimativa de tabela. Imposto e Ads ficam por sua conta.</div>
          </div>
          {/* Previsão mensal */}
          <div>
            <Lbl style={{ marginBottom: 14 }}>Previsão Mensal</Lbl>
            {estMensal != null ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[{ l: 'Conservador', m: .3, c: T.t2 }, { l: 'Realista', m: .6, c: T.a }, { l: 'Otimista', m: 1, c: T.g }].map(sce => {
                  const u = Math.max(1, Math.round(estMensal * sce.m)); const luc = +(u * profit).toFixed(0)
                  return (
                    <div key={sce.l} style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 12, padding: '16px', position: 'relative' as const, overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: sce.c, opacity: .5 }} />
                      <div style={{ fontSize: 9, fontWeight: 700, color: sce.c, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 10 }}>{sce.l}</div>
                      <div style={{ fontSize: 11, color: T.t3, marginBottom: 2 }}>{Math.round(sce.m * 100)}% · {fmtN(u)} un.</div>
                      <div style={{ fontSize: 11, color: T.t3, marginBottom: 14 }}>Receita R$ {fmtN(Math.round(u * price))}</div>
                      <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
                        <div style={{ fontSize: 9, color: T.t3, fontWeight: 600, letterSpacing: '0.1em', marginBottom: 4 }}>{luc < 0 ? 'PREJUÍZO' : 'LUCRO LÍQUIDO'}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: luc >= 0 ? sce.c : T.r, letterSpacing: '-0.02em' }}>{luc < 0 ? '− ' : ''}R$ {fmtN(Math.abs(luc))}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ background: T.bg, border: `1px dashed ${T.line}`, borderRadius: 12, padding: '16px 18px', fontSize: 11.5, color: T.t3, lineHeight: 1.6 }}>
                O ML não publica o giro deste anúncio (sem <em>sold_quantity</em>), então não dá pra projetar o mês sem inventar número.
                A posição <strong style={{ color: T.t1 }}>#{p.pos}</strong> no ranking oficial já comprova a demanda — use o simulador acima pro lucro por unidade.
              </div>
            )}
            {estMensal != null && <div style={{ fontSize: 9.5, color: T.t4, marginTop: 6 }}>Base: {fmtN(vendidos!)} vendidos ÷ {meses} mês(es) de anúncio = ~{fmtN(estMensal)}/mês (média real; o giro atual pode ser maior ou menor).</div>}
          </div>
          {/* Como melhorar */}
          {recs.length > 0 && (
            <div>
              <Lbl style={{ marginBottom: 12 }}>Como Melhorar Este Anúncio</Lbl>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recs.map((r, i) => {
                  const hc = r.priority === 'Alta' ? T.r : r.priority === 'Média' ? T.a : T.t3
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: T.bg, border: `1px solid ${tint(hc, 15)}`, borderLeft: `3px solid ${hc}`, borderRadius: 10, padding: '11px 14px' }}>
                      <div style={{ lineHeight: 1, flexShrink: 0, marginTop: 1, fontSize: 17 }}>{r.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{r.title}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: hc, background: tint(hc, 8), padding: '2px 7px', borderRadius: 4, letterSpacing: '0.05em', flexShrink: 0 }}>{r.priority}</span>
                        </div>
                        <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.55 }}>{r.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {/* Verdict */}
          <div style={{ background: tint(verdict.c, 3), border: `1px solid ${tint(verdict.c, 9)}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <ScoreRing score={score} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: verdict.c, marginBottom: 4 }}>{verdict.l}</div>
              <div style={{ fontSize: 12, color: T.t4, lineHeight: 1.6 }}>{verdictDetails}</div>
            </div>
          </div>
          {/* Imagens */}
          {imagens.length > 0 && <MLImageDownloader images={imagens} itemId={p.itemId || p.id} titulo={det?.titulo || p.nome} />}
          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10 }}>
            {linkML && (
              <a href={linkML} target="_blank" rel="noreferrer"
                style={{ flex: 1, display: 'block', textAlign: 'center' as const, background: T.goldG, color: '#03030A', fontWeight: 700, fontSize: 11, padding: '13px', borderRadius: 9, letterSpacing: '0.1em', textDecoration: 'none', textTransform: 'uppercase' as const, boxShadow: '0 4px 20px rgba(240,180,41,0.25)' }}>
                Ver no Mercado Livre
              </a>
            )}
            <button onClick={onClose} style={{ flex: 1, background: 'none', border: `1px solid ${T.line}`, color: T.t2, fontWeight: 500, fontSize: 11, padding: '13px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
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
  const [buscaInput, setBuscaInput] = useState('')
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState('giro')
  const [soOportunidades, setSoOportunidades] = useState(false)
  const [detail, setDetail] = useState<Produto | null>(null)

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
              <CardProduto p={p} onOpen={() => setDetail(p)} />
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

      {detail && <MLDetalheModal p={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
