'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { SeloAmazon, SeloML } from './SelosMarketplace'
import { totaisDoPeriodo, lucroDoPeriodo, type AjustePedido } from '@/lib/margemProduto'

// ─────────────────────────────────────────────────────────────────────────────
// Visão CONSOLIDADA (Amazon + Mercado Livre somados) — no MESMO layout da Gestão
// Amazon: o grid de 12 KPIs, com cada número sendo a SOMA das duas lojas.
//
// ⚠️ NÃO recalcula nada por uma segunda fórmula: o lado Amazon passa pela FONTE
// ÚNICA (`totaisDoPeriodo`/`lucroDoPeriodo` de lib/margemProduto — a mesma que o
// GestaoHub usa) e o lado ML vem pronto da DRE do ML. Aqui só se SOMA.
//
// ⚠️ Marketplace desconectado NÃO vira zero: a tela declara quem entrou na conta.
// ⚠️ KPI que depende de custo cadastrado ou de Ads fica "—" quando falta o dado
//    em QUALQUER das duas lojas somadas — meia soma é número errado com cara de
//    certo (zero ≠ "não sei").
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  card: 'var(--card)', line: 'var(--line)', line2: 'var(--line2)', modal: 'var(--modal)',
  gold: 'var(--gold)', g: 'var(--g)', a: 'var(--a)', r: 'var(--r)', pur: 'var(--pur)', blue: 'var(--blue)',
  t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)', t4: 'var(--t4)',
}
const tint = (v: string, pct: number) => `color-mix(in srgb, ${v} ${pct}%, transparent)`
const brl = (n: number) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pc = (n: number) => (Number(n) || 0).toFixed(1).replace('.', ',') + '%'

function Thumb({ foto, id }: { foto: string | null; id: string }) {
  const pal = ['#7C3AED', '#E7B85C', '#2FBE8F', '#4F86C6', '#F2685C', '#9B8CFF']
  const c = pal[(parseInt((id || '0').replace(/\D/g, '').slice(-3) || '0')) % pal.length]
  if (foto) return <img src={foto} alt="" width={34} height={34} style={{ borderRadius: 8, objectFit: 'cover' as const, flexShrink: 0, background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }} />
  return <span aria-hidden style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${c}22` }}><i className="ti ti-photo" style={{ fontSize: 15, color: c }} /></span>
}

// KPI idêntico ao da Gestão Amazon: borda de acento, valor grande, ⓘ clicável.
function Kpi({ label, valor, cor, ajuda }: { label: string; valor: string; cor: string; ajuda: string }) {
  const [aberto, setAberto] = useState(false)
  useEffect(() => {
    if (!aberto) return
    const fechar = () => setAberto(false)
    document.addEventListener('click', fechar)
    return () => document.removeEventListener('click', fechar)
  }, [aberto])
  return (
    <div style={{ background: T.card, border: `1.5px solid ${cor}`, borderRadius: 14, padding: '16px 14px 18px', textAlign: 'center' as const, position: 'relative' as const, minHeight: 96, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', boxShadow: 'var(--elev1)' }}>
      <button aria-label={`O que é ${label}`} onClick={e => { e.stopPropagation(); setAberto(v => !v) }}
        style={{ position: 'absolute' as const, top: 5, right: 6, background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 14, color: aberto ? T.gold : T.t3, opacity: aberto ? 1 : 0.7 }} aria-hidden="true" />
      </button>
      {aberto && (
        <div onClick={e => e.stopPropagation()}
          style={{ position: 'absolute' as const, top: 30, right: 6, left: 6, zIndex: 30, background: T.modal, border: `1px solid ${T.line2}`, borderRadius: 10, padding: '10px 12px', fontSize: 11, color: T.t2, lineHeight: 1.55, textAlign: 'left' as const, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>{ajuda}</div>
      )}
      <div style={{ fontSize: 12.5, color: T.t2, fontWeight: 500, marginBottom: 9, lineHeight: 1.25 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 25, letterSpacing: '-0.01em', color: T.t1, fontVariantNumeric: 'tabular-nums' as const }}>{valor}</div>
    </div>
  )
}

type Fonte = 'amazon' | 'ml'
type LinhaProduto = { fonte: Fonte; id: string; titulo: string; foto: string | null; unidades: number; receita: number; taxas: number; liquido: number | null }

function BarraSplit({ amz, ml }: { amz: number; ml: number }) {
  const tot = amz + ml
  if (tot <= 0) return null
  const pa = Math.round((amz / tot) * 100)
  return (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '13px 16px', marginBottom: 14, boxShadow: 'var(--elev1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, flexWrap: 'wrap' as const }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: T.t2 }}>De onde veio o faturamento</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <SeloAmazon size={12} /><strong style={{ color: T.t1 }}>{pa}%</strong>
          <span style={{ color: T.t4 }}>·</span>
          <SeloML size={12} /><strong style={{ color: T.t1 }}>{100 - pa}%</strong>
        </span>
      </div>
      <div style={{ display: 'flex', height: 9, borderRadius: 999, overflow: 'hidden', background: T.modal }}>
        <div style={{ width: `${pa}%`, background: '#FF9900' }} />
        <div style={{ width: `${100 - pa}%`, background: '#FFE600' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5, color: T.t3 }}>
        <span>Amazon {brl(amz)}</span><span>Mercado Livre {brl(ml)}</span>
      </div>
    </div>
  )
}

const PER = [{ d: 0, l: 'Hoje', w: 'today' }, { d: 7, l: '7 dias', w: '7d' }, { d: 15, l: '15 dias', w: '15d' }, { d: 30, l: '30 dias', w: '30d' }]

export default function GestaoConsolidada() {
  const [dias, setDias] = useState(7)
  const [amz, setAmz] = useState<any>(null)
  const [ml, setMl] = useState<any>(null)
  const [ads, setAds] = useState<any>(null)            // Ads da AMAZON (o do ML vem na DRE)
  const [custos, setCustos] = useState<Record<string, number>>({})
  const [aliquota, setAliquota] = useState(0)
  const [ajustes, setAjustes] = useState<AjustePedido[]>([])
  const [loading, setLoading] = useState(true)

  // Custos/imposto da Amazon (mesmas chaves que o GestaoHub lê).
  useEffect(() => {
    Promise.all([
      fetch('/api/user/metadata?key=gestao_cmv').then(r => r.json()).catch(() => null),
      fetch('/api/user/metadata?key=gestao_extras').then(r => r.json()).catch(() => null),
      fetch('/api/user/metadata?key=gestao_imposto').then(r => r.json()).catch(() => null),
      fetch('/api/user/metadata?key=gestao_ajustes').then(r => r.json()).catch(() => null),
    ]).then(([c, e, i, aj]) => {
      const cmv = (c?.value && typeof c.value === 'object') ? c.value : {}
      const ext = (e?.value && typeof e.value === 'object') ? e.value : {}
      const merged: Record<string, number> = {}
      for (const sku of new Set([...Object.keys(cmv), ...Object.keys(ext)])) {
        const soma = (Number(cmv[sku]) || 0) + (Number(ext[sku]) || 0)
        if (soma > 0) merged[sku] = soma
      }
      setCustos(merged)
      const v = Number(i?.value); if (isFinite(v) && v > 0) setAliquota(v)
      if (Array.isArray(aj?.value)) setAjustes(aj.value)
    }).catch(() => {})
  }, [])

  const carregar = useCallback(async (d: number) => {
    setLoading(true)
    // Janela no fuso de São Paulo (regra da casa: nunca no fuso do servidor).
    const agora = new Date()
    const brMs = agora.getTime() - 3 * 3600_000
    const meiaNoiteBR = new Date(Math.floor(brMs / 86400_000) * 86400_000 + 3 * 3600_000)
    const from = d === 0 ? meiaNoiteBR : new Date(meiaNoiteBR.getTime() - d * 86400_000)
    const fromISO = from.toISOString(), toISO = agora.toISOString()
    const win = PER.find(p => p.d === d)?.w || '30d'
    const [a, m, ad] = await Promise.all([
      fetch(`/api/amazon/finance?from=${encodeURIComponent(fromISO.slice(0, 10))}&to=${encodeURIComponent(toISO.slice(0, 10))}`).then(r => r.json()).catch(() => null),
      fetch(`/api/ml/gestao/dre?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`).then(r => r.json()).catch(() => null),
      fetch(`/api/ads/report?window=${win}&from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`).then(r => r.json()).catch(() => null),
    ])
    setAmz(a); setMl(m); setAds(ad); setLoading(false)
  }, [])

  useEffect(() => { carregar(dias) }, [dias, carregar])

  const amzOn = !!amz?.connected
  const mlOn = !!ml?.connected

  // ── Lado AMAZON pela FONTE ÚNICA (mesma conta do GestaoHub) ────────────────
  const amzCalc = useMemo(() => {
    if (!amzOn) return { fat: 0, liq: 0, vendas: 0, unid: 0, cmv: 0, imposto: 0, lucro: 0, temCusto: false }
    const linhas = amz?.linhas || {}
    const t = totaisDoPeriodo(linhas, amz?.produtos || [], amz?.reembolsos, custos, aliquota, ajustes,
      { from: amz?.period?.from, to: amz?.period?.to })
    const liq = amz?.liqMarketplace || 0
    return {
      fat: linhas.receitaBruta || 0,
      liq,
      vendas: amz?.vendas || 0,
      unid: Math.max(0, (amz?.unidades || 0) - (amz?.reembolsos || []).reduce((s: number, r: any) => s + Math.abs(r.units || 0), 0)),
      cmv: t.cmv, imposto: t.imposto,
      lucro: lucroDoPeriodo(liq, { cmv: t.cmv, imposto: t.imposto, credito: t.credito, custoEventual: t.custoEventual, armazenagem: t.armazenagem }),
      temCusto: t.cmv > 0,
    }
  }, [amzOn, amz, custos, aliquota, ajustes])

  // ── Lado ML (a DRE do ML já entrega tudo pronto) ──────────────────────────
  const mlCalc = {
    fat: mlOn ? (ml?.receita || 0) : 0,
    liq: mlOn ? (ml?.liquidoML || 0) : 0,
    vendas: mlOn ? (ml?.vendas || 0) : 0,
    unid: mlOn ? (ml?.unidades || 0) : 0,
    cmv: mlOn ? (ml?.cmv || 0) : 0,
    imposto: mlOn ? (ml?.imposto || 0) : 0,
    lucro: mlOn ? (ml?.lucroFinal || 0) : 0,
    temCusto: mlOn ? (ml?.cmv || 0) > 0 : false,
    ads: mlOn && ml?.adsConnected ? (ml?.ads ?? null) : null,
  }

  // ── A SOMA ────────────────────────────────────────────────────────────────
  const fat = amzCalc.fat + mlCalc.fat
  const liq = amzCalc.liq + mlCalc.liq
  const vendas = amzCalc.vendas + mlCalc.vendas
  const unid = amzCalc.unid + mlCalc.unid
  const cmv = amzCalc.cmv + mlCalc.cmv
  const lucroBruto = amzCalc.lucro + mlCalc.lucro
  const ticket = vendas > 0 ? fat / vendas : 0
  const temCusto = amzCalc.temCusto || mlCalc.temCusto
  const margem = fat > 0 ? lucroBruto / fat * 100 : 0
  const roi = cmv > 0 ? lucroBruto / cmv * 100 : 0

  // Ads: só soma quando as lojas CONECTADAS têm gasto medido. Se uma delas não
  // mediu, a soma seria meia — e meia soma mente. Aí fica "—".
  const adsAmz: number | null = amzOn ? (ads?.ready ? (Number(ads.spend) || 0) : null) : 0
  const adsMl: number | null = mlOn ? mlCalc.ads : 0
  const adsOk = adsAmz != null && adsMl != null
  const adsTot = adsOk ? (adsAmz as number) + (adsMl as number) : null
  const tacos = adsOk && fat > 0 ? (adsTot as number) / fat * 100 : null
  const lucroPosAds = adsOk ? lucroBruto - (adsTot as number) : null
  const mpa = lucroPosAds != null && fat > 0 ? lucroPosAds / fat * 100 : null

  const produtos: LinhaProduto[] = [
    ...(amzOn ? (amz?.produtos || []).map((p: any): LinhaProduto => ({
      fonte: 'amazon', id: p.sku, titulo: p.name || p.sku, foto: p.image || null,
      unidades: p.units || 0, receita: p.receita || 0,
      taxas: (p.comissao || 0) + (p.fba || 0) + (p.taxaPrograma || 0) + (p.outrasTaxas || 0),
      liquido: p.feeMedido ? (p.receita || 0) - ((p.comissao || 0) + (p.fba || 0) + (p.taxaPrograma || 0) + (p.outrasTaxas || 0)) : null,
    })) : []),
    ...(mlOn ? (ml?.produtos || []).map((p: any): LinhaProduto => ({
      fonte: 'ml', id: p.itemId, titulo: p.titulo, foto: p.foto || null,
      unidades: p.qty || 0, receita: p.receita || 0,
      taxas: (p.tarifa || 0) + (p.envio || 0),
      liquido: p.liquido,
    })) : []),
  ].sort((a, b) => b.receita - a.receita)

  const ADS_TIP = 'Soma o gasto de anúncio das duas lojas. Fica "—" enquanto alguma loja conectada não tiver gasto medido — meia soma seria um número errado com cara de certo.'
  const CUSTO_TIP = 'Precisa do custo dos produtos cadastrado (em Gerenciamento, em cada loja). Sem custo em nenhuma das duas, fica "—".'

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%', paddingTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' as const }}>
        <h2 style={{ fontSize: 27, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em' }}>Visão geral</h2>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><SeloAmazon size={14} /><SeloML size={14} /></span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {PER.map(p => (
            <button key={p.d} onClick={() => setDias(p.d)}
              style={{
                fontSize: 11.5, fontWeight: 700, padding: '7px 13px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                background: dias === p.d ? tint(T.gold, 15) : T.card,
                border: `1px solid ${dias === p.d ? tint(T.gold, 45) : T.line}`,
                color: dias === p.d ? T.gold : T.t3,
              }}>{p.l}</button>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: T.t3, marginBottom: 16 }}>Suas duas lojas somadas — cada número vem da conta que aquele marketplace cobrou.</p>

      {loading && <div style={{ padding: 40, textAlign: 'center' as const, color: T.t3, fontSize: 13 }}>Somando Amazon e Mercado Livre…</div>}

      {!loading && (
        <>
          {(!amzOn || !mlOn) && (
            <div style={{ fontSize: 11.5, color: T.t3, background: tint(T.a, 8), border: `1px solid ${tint(T.a, 25)}`, borderRadius: 10, padding: '9px 13px', marginBottom: 14 }}>
              {!amzOn && !mlOn ? 'Nenhuma loja conectada ainda — conecte a Amazon ou o Mercado Livre para ver a visão somada.'
                : !mlOn ? 'Só a Amazon está nesta soma. Conecte o Mercado Livre na aba da loja para ver as duas juntas.'
                : 'Só o Mercado Livre está nesta soma. Conecte a Amazon para ver as duas juntas.'}
            </div>
          )}

          {/* O MESMO grid de 12 KPIs da Gestão Amazon — agora somando as duas lojas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 13, marginBottom: 16 }}>
            <Kpi label="Faturamento" valor={brl(fat)} cor={T.pur} ajuda="Tudo que você vendeu no período nas duas lojas somadas." />
            <Kpi label="Líq. dos Marketplaces" valor={brl(liq)} cor={T.blue} ajuda="O que sobra da venda depois da parte de cada marketplace (comissões, tarifas, FBA e envios). Antes de imposto, CMV e Ads." />
            <Kpi label="Lucro Bruto" valor={temCusto ? brl(lucroBruto) : '—'} cor={T.g} ajuda={`Líquido dos marketplaces − imposto − CMV das duas lojas. ${CUSTO_TIP}`} />
            <Kpi label="Margem" valor={temCusto ? pc(margem) : '—'} cor={T.g} ajuda="Lucro Bruto ÷ faturamento somado." />
            <Kpi label="Número de Vendas" valor={String(vendas)} cor={T.blue} ajuda="Pedidos das duas lojas no período (cancelados fora)." />
            <Kpi label="Número de Unidades Vendidas" valor={String(unid)} cor={T.blue} ajuda="Unidades líquidas das duas lojas — a mesma contagem que o CMV usa." />
            <Kpi label="Ticket Médio" valor={brl(ticket)} cor={T.g} ajuda="Faturamento somado ÷ número de vendas somado." />
            <Kpi label="Retorno Sobre Investimento" valor={temCusto ? pc(roi) : '—'} cor={T.g} ajuda="Lucro Bruto ÷ CMV. Quanto cada real investido em mercadoria devolveu, nas duas lojas." />
            <Kpi label="Valor em Ads" valor={adsTot == null ? '—' : brl(adsTot)} cor={T.g} ajuda={ADS_TIP} />
            <Kpi label="TACOS" valor={tacos == null ? '—' : pc(tacos)} cor={T.g} ajuda="Ads somado ÷ faturamento somado." />
            <Kpi label="Lucro bruto pós ADS" valor={(lucroPosAds == null || !temCusto) ? '—' : brl(lucroPosAds)} cor={lucroPosAds != null && lucroPosAds < 0 ? T.r : T.g} ajuda="Lucro Bruto − gasto de anúncio das duas lojas." />
            <Kpi label="MPA" valor={(mpa == null || !temCusto) ? '—' : pc(mpa)} cor={T.g} ajuda="Margem Pós-Anúncio das duas lojas somadas." />
          </div>

          {amzOn && mlOn && <BarraSplit amz={amzCalc.fat} ml={mlCalc.fat} />}

          {/* Comparativo lado a lado — a pergunta "qual loja rende mais?" */}
          {(amzOn || mlOn) && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 16 }}>
              {amzOn && (
                <div style={{ flex: '1 1 300px', background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '13px 16px', boxShadow: 'var(--elev1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><SeloAmazon size={14} /><strong style={{ fontSize: 13, color: T.t1 }}>Amazon</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.t3, padding: '3px 0' }}><span>Faturamento</span><strong style={{ color: T.t1 }}>{brl(amzCalc.fat)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.t3, padding: '3px 0' }}><span>Líquido</span><strong style={{ color: T.g }}>{brl(amzCalc.liq)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.t3, padding: '3px 0' }}><span>Retenção do marketplace</span><strong style={{ color: T.a }}>{amzCalc.fat > 0 ? `${Math.round(((amzCalc.fat - amzCalc.liq) / amzCalc.fat) * 100)}%` : '—'}</strong></div>
                </div>
              )}
              {mlOn && (
                <div style={{ flex: '1 1 300px', background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '13px 16px', boxShadow: 'var(--elev1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><SeloML size={14} /><strong style={{ fontSize: 13, color: T.t1 }}>Mercado Livre</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.t3, padding: '3px 0' }}><span>Faturamento</span><strong style={{ color: T.t1 }}>{brl(mlCalc.fat)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.t3, padding: '3px 0' }}><span>Líquido</span><strong style={{ color: T.g }}>{brl(mlCalc.liq)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.t3, padding: '3px 0' }}><span>Retenção do marketplace</span><strong style={{ color: T.a }}>{mlCalc.fat > 0 ? `${Math.round(((mlCalc.fat - mlCalc.liq) / mlCalc.fat) * 100)}%` : '—'}</strong></div>
                </div>
              )}
            </div>
          )}

          {produtos.length > 0 && (
            <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--elev1)', overflowX: 'auto' as const }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.t1, marginBottom: 10 }}>Produtos das duas lojas</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 12, minWidth: 620 }}>
                <thead>
                  <tr style={{ color: T.t4, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.05em', textAlign: 'left' as const }}>
                    <th style={{ padding: '4px 8px 8px 0', fontWeight: 700 }}>Produto</th>
                    <th style={{ padding: '4px 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Un.</th>
                    <th style={{ padding: '4px 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Receita</th>
                    <th style={{ padding: '4px 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Taxas</th>
                    <th style={{ padding: '4px 0 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.slice(0, 40).map(p => (
                    <tr key={`${p.fonte}-${p.id}`} style={{ borderTop: `1px solid ${tint(T.line, 60)}` }}>
                      <td style={{ padding: '8px 8px 8px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <Thumb foto={p.foto} id={p.id} />
                            <span style={{ position: 'absolute', bottom: -3, right: -3 }}>{p.fonte === 'amazon' ? <SeloAmazon size={11} /> : <SeloML size={11} />}</span>
                          </div>
                          <span style={{ color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 280 }}>{p.titulo}</span>
                        </div>
                      </td>
                      <td style={{ padding: 8, textAlign: 'right' as const, color: T.t2 }}>{p.unidades}</td>
                      <td style={{ padding: 8, textAlign: 'right' as const, color: T.t1, fontWeight: 600 }}>{brl(p.receita)}</td>
                      <td style={{ padding: 8, textAlign: 'right' as const, color: T.a }}>− {brl(p.taxas)}</td>
                      <td style={{ padding: '8px 0 8px 8px', textAlign: 'right' as const, fontWeight: 800, color: p.liquido != null ? (p.liquido >= 0 ? T.g : T.r) : T.t4 }}>
                        {p.liquido != null ? brl(p.liquido) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
