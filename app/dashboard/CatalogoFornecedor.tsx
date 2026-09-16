'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   ANÁLISE DE CATÁLOGO — o NEO lê o PDF do fornecedor e devolve os produtos que
   valem a pena no formato de card da Mineração (foto · demanda · preço · veredito,
   clicável pro anúncio). Reusa o pipeline /api/agent/fornecedor (admin-only):
   upload → extração (feedback em etapas) → varredura na Amazon → resultados.
   ═══════════════════════════════════════════════════════════════════════════ */

const brl = (n: number) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const tint = (v: string, pct: number) => `color-mix(in srgb, ${v} ${pct}%, transparent)`

type Cat = any
type Resultado = any

const VEREDITO: Record<string, { rot: string; cor: string; ic: string }> = {
  'oportunidade':    { rot: 'Oportunidade', cor: 'var(--g)',    ic: '🎯' },
  'margem-apertada': { rot: 'Margem apertada', cor: 'var(--gold)', ic: '⚠️' },
  'sem-demanda':     { rot: 'Sem demanda', cor: 'var(--t3)',   ic: '💤' },
  'sem-match':       { rot: 'Sem match na Amazon', cor: 'var(--t3)', ic: '❔' },
  'sem-preco':       { rot: 'Sem preço', cor: 'var(--t3)',     ic: '❔' },
}

export default function CatalogoFornecedor({ marketplace = 'amazon' }: { marketplace?: 'amazon' | 'ml' }) {
  const [cat, setCat] = useState<Cat | null>(null)
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'oportunidade'>('oportunidade')
  const fileRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastPartialRef = useRef(0)

  const carregarStatus = useCallback(async () => {
    try {
      const r = await fetch(`/api/agent/fornecedor?marketplace=${marketplace}`, { cache: 'no-store' })
      const d = await r.json().catch(() => null)
      if (d && d.status !== 'nenhum') setCat(d); else setCat(null)
      const vs = d?.varredura?.status
      // PRONTA → resultado final. RODANDO → streaming: puxa os parciais já achados,
      // mas throttled (~12s) pra não trazer milhares de itens a cada 3s de poll.
      if (vs === 'pronta' || vs === 'rodando') {
        const agora = Date.now()
        if (vs === 'pronta' || agora - lastPartialRef.current > 12000) {
          lastPartialRef.current = agora
          const q = `/api/agent/fornecedor?resultados=1&marketplace=${marketplace}${vs === 'rodando' ? '&parcial=1' : ''}`
          const dd = await fetch(q, { cache: 'no-store' }).then(x => x.json()).catch(() => null)
          if (Array.isArray(dd?.resultados)) setResultados(dd.resultados)
        }
      }
    } catch {}
  }, [marketplace])

  // Poll enquanto extrai/varre; para quando assenta.
  useEffect(() => {
    void carregarStatus()
    pollRef.current = setInterval(() => {
      const extraindo = cat?.status === 'extraindo' || cat?.status === 'enviando'
      const varrendo = cat?.varredura?.status === 'rodando'
      if (extraindo || varrendo || !cat) void carregarStatus()
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat?.status, cat?.varredura?.status])

  async function subir(f: File) {
    if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { setErro('Envie o catálogo em PDF.'); return }
    setErro(null); setEnviando(true); setResultados([])
    try {
      const r = await fetch(`/api/agent/fornecedor?nome=${encodeURIComponent(f.name)}`, { method: 'POST', body: f })
      const d = await r.json().catch(() => null)
      if (!r.ok || d?.error) setErro(d?.error || 'falha ao enviar o catálogo')
      else await carregarStatus()
    } catch { setErro('falha de rede ao enviar') }
    finally { setEnviando(false); if (fileRef.current) fileRef.current.value = '' }
  }
  async function varrer() {
    setErro(null)
    try { await fetch(`/api/agent/fornecedor?op=varrer&marketplace=${marketplace}`, { method: 'POST' }); await carregarStatus() }
    catch { setErro('falha ao iniciar a varredura') }
  }

  const st = cat?.status
  const vr = cat?.varredura
  const extraindo = st === 'extraindo' || st === 'enviando' || enviando
  const pl = Number(cat?.paginas_lidas) || 0, pt = Number(cat?.paginas_total) || 0
  const pctExtra = pt > 0 ? Math.min(100, Math.round((pl / pt) * 100)) : null
  const pctVarr = vr?.total > 0 ? Math.min(100, Math.round((Number(vr.progresso) / Number(vr.total)) * 100)) : null

  const oportunidades = resultados.filter(r => r.veredito === 'oportunidade')
  const mostrados = (filtro === 'oportunidade' && oportunidades.length ? oportunidades : resultados)
    .slice().sort((a, b) => (b.margemPct ?? -99) - (a.margemPct ?? -99))

  const card = { background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14 }

  return (
    <div style={{ padding: '4px 0 40px' }}>
      {/* Cabeçalho + upload */}
      <div style={{ ...card, borderColor: tint('var(--gold)', 30), padding: '16px 18px', marginBottom: 16, boxShadow: 'var(--elev1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
          <i className="ti ti-file-analytics" style={{ fontSize: 20, color: 'var(--gold)' }} aria-hidden="true" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em' }}>Analisar meu catálogo</div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>
              Suba o PDF do fornecedor — o NEO lê, cruza cada produto na {marketplace === 'ml' ? 'Mercado Livre' : 'Amazon'} e te devolve os que valem a pena: <b style={{ color: 'var(--t2)' }}>demanda, preço e margem</b> já prontos.
            </div>
          </div>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={e => e.target.files?.[0] && subir(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={extraindo}
            style={{ fontSize: 12, fontWeight: 800, color: '#02020A', background: 'var(--gold)', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: extraindo ? 'default' : 'pointer', opacity: extraindo ? 0.6 : 1, fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>
            {cat ? 'Trocar catálogo' : 'Enviar PDF'}
          </button>
        </div>
        {erro && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--r)' }}>{erro}</div>}

        {/* Progresso da EXTRAÇÃO (feedback em etapas) */}
        {cat && extraindo && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: tint('var(--gold)', 6) }}>
            <div style={{ fontSize: 12, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ora-spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid ' + tint('var(--gold)', 35), borderTopColor: 'var(--gold)', borderRadius: '50%' }} />
              <b>{cat.nome_arquivo}</b>: {cat.etapa === 'subindo' ? 'subindo o PDF pro NEO…' : pt > 0 ? `lendo página ${pl}/${pt}…` : 'lendo o catálogo…'}
            </div>
            {pctExtra != null && <Barra pct={pctExtra} />}
          </div>
        )}
        {cat && st === 'erro' && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--r)' }}>❌ {cat.erro || 'não consegui ler esse catálogo'}</div>}

        {/* Catálogo pronto → varrer / progresso da varredura */}
        {cat && st === 'pronto' && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 12, color: 'var(--t2)' }}>✅ <b>{cat.total}</b> produtos lidos.</span>
            {(!vr || vr.status === 'erro') && (
              <button onClick={varrer} style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', background: tint('var(--gold)', 10), border: '1px solid ' + tint('var(--gold)', 30), borderRadius: 9, padding: '7px 13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                🔍 Analisar na {marketplace === 'ml' ? 'ML' : 'Amazon'}
              </button>
            )}
            {vr?.status === 'rodando' && (
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Cruzando na {marketplace === 'ml' ? 'ML' : 'Amazon'}: <b style={{ color: 'var(--t2)' }}>{vr.progresso}/{vr.total}</b> (pode sair, continua sozinho)</div>
                {pctVarr != null && <Barra pct={pctVarr} />}
              </div>
            )}
            {vr?.status === 'pronta' && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--g)' }}>🎯 {Number(vr.oportunidades) || 0} oportunidades</span>}
          </div>
        )}
      </div>

      {/* Aviso do NEO durante a varredura — o seller entende que leva tempo e que
          as oportunidades vão CAINDO aqui conforme cruza (não precisa esperar tudo). */}
      {vr?.status === 'rodando' && (
        <div style={{ ...card, borderColor: tint('var(--gold)', 26), background: tint('var(--gold)', 6), padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span className="ora-spin" style={{ display: 'inline-block', width: 14, height: 14, marginTop: 2, flexShrink: 0, border: '2px solid ' + tint('var(--gold)', 35), borderTopColor: 'var(--gold)', borderRadius: '50%' }} />
          <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>
            <b style={{ color: 'var(--t1)' }}>O NEO está garimpando cada produto na {marketplace === 'ml' ? 'Mercado Livre' : 'Amazon'}</b> — isso leva um tempo (catálogo grande passa de uma hora).
            {oportunidades.length > 0
              ? <> Já achei <b style={{ color: 'var(--g)' }}>{oportunidades.length} oportunidade{oportunidades.length > 1 ? 's' : ''}</b> em {Number(vr.progresso) || 0}/{Number(vr.total) || 0} cruzados — e vão aparecendo aqui embaixo conforme saem.</>
              : <> Já cruzei {Number(vr.progresso) || 0}/{Number(vr.total) || 0}; as oportunidades aparecem aqui assim que a primeira sair.</>}
            {' '}Pode fechar a aba, continua sozinho. 👇
          </div>
        </div>
      )}

      {/* Resultados como cards de Mineração — durante a varredura são PARCIAIS
          (streaming); quando 'pronta', o conjunto final ordenado. */}
      {(vr?.status === 'pronta' || vr?.status === 'rodando') && resultados.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' as const }}>
            {[{ id: 'oportunidade', lbl: `Oportunidades (${oportunidades.length})` }, { id: 'todos', lbl: `Todos (${resultados.length})` }].map(f => (
              <button key={f.id} onClick={() => setFiltro(f.id as any)}
                style={{ fontSize: 11.5, fontWeight: 700, padding: '6px 12px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
                  color: filtro === f.id ? '#02020A' : 'var(--t2)', background: filtro === f.id ? 'var(--gold)' : 'transparent', border: '1px solid ' + (filtro === f.id ? 'transparent' : 'var(--line)') }}>
                {f.lbl}
              </button>
            ))}
            {vr?.status === 'rodando' && <span style={{ fontSize: 10.5, color: 'var(--t4)' }}>parcial · atualiza sozinho</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 13 }}>
            {mostrados.map((r, i) => <CardResultado key={(r.match?.asin || r.cod || i) + ':' + i} r={r} card={card} marketplace={marketplace} />)}
          </div>
        </>
      )}
    </div>
  )
}

function Barra({ pct }: { pct: number }) {
  return (
    <div style={{ marginTop: 7, height: 5, borderRadius: 99, background: tint('var(--gold)', 15), overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gold)', transition: 'width .4s ease' }} />
    </div>
  )
}

function CardResultado({ r, card, marketplace = 'amazon' }: { r: Resultado; card: React.CSSProperties; marketplace?: 'amazon' | 'ml' }) {
  const ml = marketplace === 'ml'
  const praca = ml ? 'ML' : 'Amazon'
  const base = VEREDITO[r.veredito] || VEREDITO['sem-match']
  // 'sem-match' cita a praça — no ML o texto genérico "na Amazon" mentiria.
  const v = r.veredito === 'sem-match' ? { ...base, rot: `Sem match no ${praca}` } : base
  const m = r.match
  const dem = r.demanda
  const corMargem = r.margemPct == null ? 'var(--t3)' : r.margemPct >= 15 ? 'var(--g)' : r.margemPct >= 0 ? 'var(--gold)' : 'var(--r)'
  const conteudo = (
    <>
      <div style={{ display: 'flex', gap: 11 }}>
        <div style={{ width: 62, height: 62, borderRadius: 10, background: 'var(--line2)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {m?.foto ? <img src={m.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <i className="ti ti-package" style={{ fontSize: 22, color: 'var(--t4)' }} />}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{m?.titulo || r.nome}</div>
          <div style={{ fontSize: 9.5, color: 'var(--t4)', marginTop: 3 }}>catálogo: {r.nome}</div>
        </div>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 9.5, fontWeight: 700, color: v.cor, background: tint(v.cor, 12), border: '1px solid ' + tint(v.cor, 26), padding: '3px 9px', borderRadius: 99, textTransform: 'uppercase' as const, letterSpacing: '0.03em' }}>
        {v.ic} {v.rot}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 11, fontVariantNumeric: 'tabular-nums' as const }}>
        <Num rot="Demanda"
          val={dem ? (ml ? `${Number(dem.vendasMes).toLocaleString('pt-BR')} vend.` : `${dem.vendasMes}/mês`) : '—'}
          sub={dem ? (ml ? (dem.bsr ? `#${dem.bsr} no ranking` : 'no ranking') : `BSR ${dem.bsr.toLocaleString('pt-BR')}`) : ''}
          cor="var(--blue)" />
        <Num rot="Preço venda" val={r.precoVenda != null ? brl(r.precoVenda) : '—'} sub={`custo ${brl(r.custoUn)}`} cor="var(--t1)" />
        <Num rot="Margem" val={r.margemPct != null ? `${r.margemPct}%` : '—'} sub={r.lucroUn != null ? `lucro ${brl(r.lucroUn)}/un` : ''} cor={corMargem} />
        <Num rot="Avaliação" val="—" sub={`via ${praca} (em breve)`} cor="var(--t3)" />
      </div>
      {r.nota && <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 9, lineHeight: 1.4 }}>{String(r.nota).slice(0, 160)}</div>}
    </>
  )
  return m?.link
    ? <a href={m.link} target="_blank" rel="noreferrer" style={{ ...card, padding: 13, textDecoration: 'none', display: 'block', transition: 'border-color .15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = tint('var(--gold)', 40) }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)' }}>{conteudo}</a>
    : <div style={{ ...card, padding: 13 }}>{conteudo}</div>
}

function Num({ rot, val, sub, cor }: { rot: string; val: string; sub?: string; cor: string }) {
  return (
    <div>
      <div style={{ fontSize: 8.5, color: 'var(--t4)', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{rot}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: cor, lineHeight: 1.15 }}>{val}</div>
      {sub && <div style={{ fontSize: 9, color: 'var(--t4)', marginTop: 1 }}>{sub}</div>}
    </div>
  )
}
