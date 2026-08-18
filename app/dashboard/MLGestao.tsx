'use client'
import { useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Gestão MERCADO LIVRE — a DRE com números REAIS COBRADOS pelo ML:
//   receita = pago no pedido · tarifa = sale_fee do pedido · envio = custo real
//   do shipment. Nada recalculado — as contas fecham com o painel do ML por
//   construção (provado: 49,90 − 5,74 − 7,85 = 36,31, centavo a centavo).
// Isolada da Gestão Amazon: outra conexão, outro espelho, outras rotas.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  card: 'var(--card)', line: 'var(--line)', modal: 'var(--modal)',
  gold: 'var(--gold)', g: 'var(--g)', a: 'var(--a)', r: 'var(--r)', pur: 'var(--pur)',
  t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)', t4: 'var(--t4)',
}
const tint = (v: string, pct: number) => `color-mix(in srgb, ${v} ${pct}%, transparent)`
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type Dre = {
  connected: boolean
  nickname?: string | null
  vendas: number; unidades: number
  receita: number; tarifaVenda: number; envio: number; enviosPendentes: number
  liquidoML: number
  canceladas: { pedidos: number; valor: number }
  produtos: Array<{ itemId: string; titulo: string; pedidos: number; qty: number; receita: number; tarifa: number; envio: number | null; envioParcial: boolean; liquido: number | null }>
  pedidos: Array<{ orderId: string; data: string; status: string; titulo: string; qty: number; receita: number; tarifa: number; envio: number | null; liquido: number | null }>
  motivo?: string
}

const PERIODOS = [
  { id: 'hoje', label: 'Hoje', dias: 0 },
  { id: '7d', label: '7 dias', dias: 7 },
  { id: '15d', label: '15 dias', dias: 15 },
  { id: '30d', label: '30 dias', dias: 30 },
]

// Janela no fuso do seller (São Paulo) — regra da casa: nunca no fuso do servidor.
function janela(dias: number): { from: string; to: string } {
  const agora = new Date()
  const brMs = agora.getTime() - 3 * 3600_000
  const meiaNoiteBR = new Date(Math.floor(brMs / 86400_000) * 86400_000 + 3 * 3600_000)
  const from = dias === 0 ? meiaNoiteBR : new Date(meiaNoiteBR.getTime() - dias * 86400_000)
  return { from: from.toISOString(), to: agora.toISOString() }
}

function Card({ label, valor, cor, sub }: { label: string; valor: string; cor?: string; sub?: string }) {
  return (
    <div style={{ flex: '1 1 150px', minWidth: 150, background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--elev1)' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: T.t3, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 800, color: cor || T.t1, marginTop: 5, fontVariantNumeric: 'tabular-nums' as const }}>{valor}</div>
      {sub && <div style={{ fontSize: 10, color: T.t4, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

export default function MLGestao() {
  const [status, setStatus] = useState<{ connected: boolean; nickname?: string | null } | null>(null)
  const [periodo, setPeriodo] = useState('7d')
  const [dre, setDre] = useState<Dre | null>(null)
  const [loading, setLoading] = useState(true)
  const [conectando, setConectando] = useState(false)

  const carregar = useCallback(async (per: string) => {
    setLoading(true)
    try {
      const dias = PERIODOS.find(p => p.id === per)?.dias ?? 7
      const { from, to } = janela(dias)
      const r = await fetch(`/api/ml/gestao/dre?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      const d = await r.json()
      setDre(d)
      setStatus({ connected: !!d.connected, nickname: d.nickname })
    } catch { setDre(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetch('/api/ml/gestao/status').then(r => r.json()).then(st => {
      setStatus(st)
      if (st.connected) carregar(periodo)
      else setLoading(false)
    }).catch(() => setLoading(false))
  }, []) // eslint-disable-line

  useEffect(() => { if (status?.connected) carregar(periodo) }, [periodo]) // eslint-disable-line

  const conectar = async () => {
    setConectando(true)
    try {
      const r = await fetch('/api/ml/gestao/connect')
      const d = await r.json()
      if (d.url) { window.location.href = d.url; return }
    } catch {}
    setConectando(false)
  }

  // ── Não conectado: o convite ────────────────────────────────────────────────
  if (!loading && !status?.connected) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', paddingTop: 60, textAlign: 'center' as const }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff159', background: '#2d3277', borderRadius: 6, padding: '3px 8px' }}>Mercado Livre</span>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em', margin: '14px 0 10px' }}>Gestão ML</h2>
        <p style={{ fontSize: 13.5, color: T.t3, lineHeight: 1.7, marginBottom: 24 }}>
          Conecte sua conta do Mercado Livre e veja <strong style={{ color: T.t2 }}>quanto você recebe de verdade</strong> em cada venda:
          a tarifa que o ML cobrou, o custo real de cada envio e o líquido — os mesmos números do painel do ML, sem planilha.
        </p>
        <button onClick={conectar} disabled={conectando}
          style={{ background: 'linear-gradient(135deg, #ffe600, #f0b429)', color: '#2d3277', fontWeight: 800, fontSize: 14, border: 'none', borderRadius: 12, padding: '13px 26px', cursor: 'pointer', opacity: conectando ? 0.7 : 1 }}>
          {conectando ? 'Abrindo o Mercado Livre…' : 'Conectar minha conta do Mercado Livre'}
        </button>
        <p style={{ fontSize: 10.5, color: T.t4, marginTop: 14 }}>Acesso somente-leitura de vendas e envios. Você pode desconectar quando quiser.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', width: '100%', paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff159', background: '#2d3277', borderRadius: 6, padding: '3px 8px' }}>Mercado Livre</span>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em' }}>Gestão</h2>
        {status?.nickname && <span style={{ fontSize: 11, color: T.t3 }}>conta <strong style={{ color: T.t2 }}>{status.nickname}</strong></span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {PERIODOS.map(p => (
            <button key={p.id} onClick={() => setPeriodo(p.id)}
              style={{
                fontSize: 11.5, fontWeight: 700, padding: '6px 12px', borderRadius: 9, cursor: 'pointer',
                background: periodo === p.id ? tint(T.gold, 15) : T.card,
                border: `1px solid ${periodo === p.id ? tint(T.gold, 45) : T.line}`,
                color: periodo === p.id ? T.gold : T.t3,
              }}>{p.label}</button>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: T.t4, marginBottom: 16 }}>Números lidos do que o ML cobrou de verdade — batem com o seu painel.</p>

      {loading && <div style={{ padding: 40, textAlign: 'center' as const, color: T.t3, fontSize: 13 }}>Carregando suas vendas do ML…</div>}

      {!loading && dre?.connected && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <Card label="Vendas" valor={String(dre.vendas)} sub={`${dre.unidades} unidade${dre.unidades === 1 ? '' : 's'}`} />
            <Card label="Receita" valor={brl(dre.receita)} />
            <Card label="Tarifas ML" valor={`− ${brl(dre.tarifaVenda)}`} cor={T.a} sub="tarifa real cobrada por venda" />
            <Card label="Envios" valor={`− ${brl(dre.envio)}`} cor={T.a}
              sub={dre.enviosPendentes > 0 ? `${dre.enviosPendentes} envio${dre.enviosPendentes === 1 ? '' : 's'} ainda sem custo medido` : 'custo real dos envios'} />
            <Card label="Você recebeu (líquido ML)" valor={brl(dre.liquidoML)} cor={dre.liquidoML >= 0 ? T.g : T.r} sub="antes de imposto, custo do produto e Ads" />
          </div>

          {dre.canceladas.pedidos > 0 && (
            <div style={{ fontSize: 11.5, color: T.t3, background: tint(T.r, 6), border: `1px solid ${tint(T.r, 20)}`, borderRadius: 10, padding: '8px 12px', marginBottom: 14 }}>
              {dre.canceladas.pedidos} pedido{dre.canceladas.pedidos === 1 ? '' : 's'} cancelado{dre.canceladas.pedidos === 1 ? '' : 's'} ({brl(dre.canceladas.valor)}) — fora da receita.
            </div>
          )}

          {dre.produtos.length > 0 && (
            <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 14, boxShadow: 'var(--elev1)', overflowX: 'auto' as const }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.t1, marginBottom: 10 }}>Por produto</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 12, minWidth: 640 }}>
                <thead>
                  <tr style={{ color: T.t4, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.05em', textAlign: 'left' as const }}>
                    <th style={{ padding: '4px 8px 8px 0', fontWeight: 700 }}>Produto</th>
                    <th style={{ padding: '4px 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Un.</th>
                    <th style={{ padding: '4px 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Receita</th>
                    <th style={{ padding: '4px 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Tarifa ML</th>
                    <th style={{ padding: '4px 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Envio</th>
                    <th style={{ padding: '4px 0 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {dre.produtos.map(p => (
                    <tr key={p.itemId} style={{ borderTop: `1px solid ${tint(T.line, 60)}` }}>
                      <td style={{ padding: '8px 8px 8px 0', color: T.t1, maxWidth: 320 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.titulo}</div>
                        <div style={{ fontSize: 9.5, color: T.t4 }}>{p.itemId} · {p.pedidos} pedido{p.pedidos === 1 ? '' : 's'}</div>
                      </td>
                      <td style={{ padding: 8, textAlign: 'right' as const, color: T.t2 }}>{p.qty}</td>
                      <td style={{ padding: 8, textAlign: 'right' as const, color: T.t1, fontWeight: 600 }}>{brl(p.receita)}</td>
                      <td style={{ padding: 8, textAlign: 'right' as const, color: T.a }}>− {brl(p.tarifa)}</td>
                      <td style={{ padding: 8, textAlign: 'right' as const, color: p.envio != null ? T.a : T.t4 }}>
                        {p.envio != null ? `− ${brl(p.envio)}` : '—'}{p.envioParcial && p.envio != null ? ' *' : ''}
                      </td>
                      <td style={{ padding: '8px 0 8px 8px', textAlign: 'right' as const, fontWeight: 800, color: p.liquido != null ? (p.liquido >= 0 ? T.g : T.r) : T.t4 }}>
                        {p.liquido != null ? brl(p.liquido) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dre.produtos.some(p => p.envioParcial) && (
                <div style={{ fontSize: 10, color: T.t4, marginTop: 8 }}>* produto com pedido de vários itens ou envio ainda sem custo — o líquido só aparece quando TODO o custo foi medido (nada de rateio).</div>
              )}
            </div>
          )}

          {dre.pedidos.length > 0 && (
            <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--elev1)', overflowX: 'auto' as const }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.t1, marginBottom: 10 }}>Pedidos do período</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 12, minWidth: 640 }}>
                <thead>
                  <tr style={{ color: T.t4, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.05em', textAlign: 'left' as const }}>
                    <th style={{ padding: '4px 8px 8px 0', fontWeight: 700 }}>Data</th>
                    <th style={{ padding: '4px 8px 8px', fontWeight: 700 }}>Produto</th>
                    <th style={{ padding: '4px 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Receita</th>
                    <th style={{ padding: '4px 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Tarifa</th>
                    <th style={{ padding: '4px 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Envio</th>
                    <th style={{ padding: '4px 0 8px 8px', fontWeight: 700, textAlign: 'right' as const }}>Você recebe</th>
                  </tr>
                </thead>
                <tbody>
                  {dre.pedidos.map(o => (
                    <tr key={o.orderId} style={{ borderTop: `1px solid ${tint(T.line, 60)}` }}>
                      <td style={{ padding: '8px 8px 8px 0', color: T.t3, whiteSpace: 'nowrap' as const }}>
                        {new Date(o.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{' '}
                        <span style={{ color: T.t4, fontSize: 10 }}>{new Date(o.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td style={{ padding: 8, color: T.t1, maxWidth: 300 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{o.titulo}{o.qty > 1 ? ` ×${o.qty}` : ''}</div>
                      </td>
                      <td style={{ padding: 8, textAlign: 'right' as const, color: T.t1, fontWeight: 600 }}>{brl(o.receita)}</td>
                      <td style={{ padding: 8, textAlign: 'right' as const, color: T.a }}>− {brl(o.tarifa)}</td>
                      <td style={{ padding: 8, textAlign: 'right' as const, color: o.envio != null ? T.a : T.t4 }}>{o.envio != null ? `− ${brl(o.envio)}` : 'medindo…'}</td>
                      <td style={{ padding: '8px 0 8px 8px', textAlign: 'right' as const, fontWeight: 800, color: o.liquido != null ? (o.liquido >= 0 ? T.g : T.r) : T.t4 }}>
                        {o.liquido != null ? brl(o.liquido) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {dre.vendas === 0 && (
            <div style={{ padding: '40px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
              Nenhuma venda no período. Troque o período acima.
            </div>
          )}
        </>
      )}
    </div>
  )
}
