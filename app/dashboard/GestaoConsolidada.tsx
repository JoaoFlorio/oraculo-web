'use client'
import { useState, useEffect, useCallback } from 'react'
import { SeloAmazon, SeloML } from './SelosMarketplace'

// ─────────────────────────────────────────────────────────────────────────────
// Visão CONSOLIDADA (Amazon + Mercado Livre somados).
//
// ⚠️ NÃO recalcula nada: lê o payload que CADA marketplace já produz (a DRE da
// Amazon e a DRE do ML) e SOMA. Total derivado se define como a soma — nunca por
// uma segunda fórmula (a doença-mãe do projeto).
//
// ⚠️ Marketplace desconectado NÃO vira zero: a tela declara quem entrou na conta.
// Somar 0 de um lado não conectado seria afirmar "vendeu nada" — que é diferente
// de "não sei".
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  card: 'var(--card)', line: 'var(--line)', modal: 'var(--modal)',
  gold: 'var(--gold)', g: 'var(--g)', a: 'var(--a)', r: 'var(--r)', pur: 'var(--pur)',
  t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)', t4: 'var(--t4)',
}
const tint = (v: string, pct: number) => `color-mix(in srgb, ${v} ${pct}%, transparent)`
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function Thumb({ foto, id }: { foto: string | null; id: string }) {
  const pal = ['#7C3AED', '#E7B85C', '#2FBE8F', '#4F86C6', '#F2685C', '#9B8CFF']
  const c = pal[(parseInt((id || '0').replace(/\D/g, '').slice(-3) || '0')) % pal.length]
  if (foto) return <img src={foto} alt="" width={34} height={34} style={{ borderRadius: 8, objectFit: 'cover' as const, flexShrink: 0, background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }} />
  return <span aria-hidden style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${c}22` }}><i className="ti ti-photo" style={{ fontSize: 15, color: c }} /></span>
}

type Fonte = 'amazon' | 'ml'
type LinhaProduto = { fonte: Fonte; id: string; titulo: string; foto: string | null; unidades: number; receita: number; taxas: number; liquido: number | null }

function Card({ label, valor, cor, sub, destaque }: { label: string; valor: string; cor?: string; sub?: string; destaque?: boolean }) {
  return (
    <div style={{
      flex: '1 1 170px', minWidth: 170, background: T.card,
      border: `1px solid ${destaque ? tint(T.g, 35) : T.line}`, borderRadius: 14,
      padding: '14px 16px', boxShadow: 'var(--elev1)',
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: T.t3, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: cor || T.t1, marginTop: 5, fontVariantNumeric: 'tabular-nums' as const }}>{valor}</div>
      {sub && <div style={{ fontSize: 10, color: T.t4, marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  )
}

// Barra de participação Amazon × ML — a leitura que só a visão somada dá.
function BarraSplit({ amz, ml }: { amz: number; ml: number }) {
  const tot = amz + ml
  if (tot <= 0) return null
  const pa = Math.round((amz / tot) * 100)
  return (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '13px 16px', marginBottom: 12, boxShadow: 'var(--elev1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, flexWrap: 'wrap' }}>
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

export default function GestaoConsolidada() {
  const [dias, setDias] = useState(7)
  const [amz, setAmz] = useState<any>(null)
  const [ml, setMl] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async (d: number) => {
    setLoading(true)
    // Janela no fuso de São Paulo (regra da casa: nunca no fuso do servidor).
    const agora = new Date()
    const brMs = agora.getTime() - 3 * 3600_000
    const meiaNoiteBR = new Date(Math.floor(brMs / 86400_000) * 86400_000 + 3 * 3600_000)
    const from = d === 0 ? meiaNoiteBR : new Date(meiaNoiteBR.getTime() - d * 86400_000)
    const fromISO = from.toISOString(), toISO = agora.toISOString()
    const [a, m] = await Promise.all([
      fetch(`/api/amazon/finance?from=${encodeURIComponent(fromISO.slice(0, 10))}&to=${encodeURIComponent(toISO.slice(0, 10))}`).then(r => r.json()).catch(() => null),
      fetch(`/api/ml/gestao/dre?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`).then(r => r.json()).catch(() => null),
    ])
    setAmz(a); setMl(m); setLoading(false)
  }, [])

  useEffect(() => { carregar(dias) }, [dias, carregar])

  const amzOn = !!amz?.connected
  const mlOn = !!ml?.connected

  // ── SOMA (nunca recálculo) ────────────────────────────────────────────────
  const aFat = amzOn ? (amz?.linhas?.receitaBruta || 0) : 0
  const aLiq = amzOn ? (amz?.liqMarketplace || 0) : 0
  const aVendas = amzOn ? (amz?.vendas || 0) : 0
  const aUnid = amzOn ? (amz?.unidades || 0) : 0
  const mFat = mlOn ? (ml?.receita || 0) : 0
  const mLiq = mlOn ? (ml?.liquidoML || 0) : 0
  const mVendas = mlOn ? (ml?.vendas || 0) : 0
  const mUnid = mlOn ? (ml?.unidades || 0) : 0

  const fat = aFat + mFat, liq = aLiq + mLiq
  const vendas = aVendas + mVendas, unid = aUnid + mUnid
  const taxas = fat - liq
  const ticket = vendas > 0 ? fat / vendas : 0

  // Produtos das duas lojas na mesma lista, cada um com seu selo.
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

  const PER = [{ d: 0, l: 'Hoje' }, { d: 7, l: '7 dias' }, { d: 15, l: '15 dias' }, { d: 30, l: '30 dias' }]

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', width: '100%', paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em' }}>Visão geral</h2>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><SeloAmazon size={13} /><SeloML size={13} /></span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {PER.map(p => (
            <button key={p.d} onClick={() => setDias(p.d)}
              style={{
                fontSize: 11.5, fontWeight: 700, padding: '6px 12px', borderRadius: 9, cursor: 'pointer',
                background: dias === p.d ? tint(T.gold, 15) : T.card,
                border: `1px solid ${dias === p.d ? tint(T.gold, 45) : T.line}`,
                color: dias === p.d ? T.gold : T.t3,
              }}>{p.l}</button>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: T.t4, marginBottom: 14 }}>Suas duas lojas somadas — cada número vem da conta que aquele marketplace cobrou.</p>

      {loading && <div style={{ padding: 40, textAlign: 'center' as const, color: T.t3, fontSize: 13 }}>Somando Amazon e Mercado Livre…</div>}

      {!loading && (
        <>
          {/* Quem entrou na conta — desconectado NÃO vira zero em silêncio. */}
          {(!amzOn || !mlOn) && (
            <div style={{ fontSize: 11.5, color: T.t3, background: tint(T.a, 8), border: `1px solid ${tint(T.a, 25)}`, borderRadius: 10, padding: '9px 13px', marginBottom: 12 }}>
              {!amzOn && !mlOn ? 'Nenhuma loja conectada ainda — conecte a Amazon ou o Mercado Livre para ver a visão somada.'
                : !mlOn ? 'Só a Amazon está nesta soma. Conecte o Mercado Livre na aba da loja para ver as duas juntas.'
                : 'Só o Mercado Livre está nesta soma. Conecte a Amazon para ver as duas juntas.'}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <Card label="Faturamento" valor={brl(fat)} sub={`${vendas} venda${vendas === 1 ? '' : 's'} · ${unid} un.`} />
            <Card label="Taxas dos marketplaces" valor={`− ${brl(taxas)}`} cor={T.a} sub="comissões, tarifas e envios" />
            <Card label="Líquido dos marketplaces" valor={brl(liq)} cor={liq >= 0 ? T.g : T.r} destaque sub="antes de imposto, CMV e Ads" />
            <Card label="Ticket médio" valor={brl(ticket)} />
          </div>

          {amzOn && mlOn && <BarraSplit amz={aFat} ml={mFat} />}

          {/* Comparativo lado a lado — a pergunta "qual loja rende mais?" */}
          {(amzOn || mlOn) && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              {amzOn && (
                <div style={{ flex: '1 1 300px', background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '13px 16px', boxShadow: 'var(--elev1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><SeloAmazon size={14} /><strong style={{ fontSize: 13, color: T.t1 }}>Amazon</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.t3, padding: '3px 0' }}><span>Faturamento</span><strong style={{ color: T.t1 }}>{brl(aFat)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.t3, padding: '3px 0' }}><span>Líquido</span><strong style={{ color: T.g }}>{brl(aLiq)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.t3, padding: '3px 0' }}><span>Retenção do marketplace</span><strong style={{ color: T.a }}>{aFat > 0 ? `${Math.round(((aFat - aLiq) / aFat) * 100)}%` : '—'}</strong></div>
                </div>
              )}
              {mlOn && (
                <div style={{ flex: '1 1 300px', background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '13px 16px', boxShadow: 'var(--elev1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><SeloML size={14} /><strong style={{ fontSize: 13, color: T.t1 }}>Mercado Livre</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.t3, padding: '3px 0' }}><span>Faturamento</span><strong style={{ color: T.t1 }}>{brl(mFat)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.t3, padding: '3px 0' }}><span>Líquido</span><strong style={{ color: T.g }}>{brl(mLiq)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.t3, padding: '3px 0' }}><span>Retenção do marketplace</span><strong style={{ color: T.a }}>{mFat > 0 ? `${Math.round(((mFat - mLiq) / mFat) * 100)}%` : '—'}</strong></div>
                </div>
              )}
            </div>
          )}

          {produtos.length > 0 && (
            <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--elev1)', overflowX: 'auto' as const }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.t1, marginBottom: 10 }}>Produtos das duas lojas</div>
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
