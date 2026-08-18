'use client'
import { useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Gestão MERCADO LIVRE — MESMO PADRÃO da Gestão Amazon (grupos + telas + seletor
// de período + grid de KPIs), com os números REAIS COBRADOS pelo ML:
//   receita = pago no pedido · tarifa = sale_fee do pedido · envio = custo real
//   do shipment. Nada recalculado — fecha com o painel do ML por construção
//   (provado: 49,90 − 5,74 − 7,85 = 36,31, centavo a centavo).
//
// ⚠️ A navegação é ESPELHADA, não importada: o `BarraGestao` da Amazon carrega
// GRUPOS/TABS da SP-API (Repasses, Estoque FBA, Curva ABC…) que não existem aqui.
// Copiar a ESTÉTICA e manter as telas honestas > reusar o componente e inventar
// aba vazia. Só entra grupo que tem tela com dado de verdade.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  card: 'var(--card)', cardHov: 'var(--cardHov)', line: 'var(--line)', modal: 'var(--modal)',
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
  vendasBrutas: number
  canceladas: { pedidos: number; valor: number }
  produtos: Array<{ itemId: string; titulo: string; pedidos: number; qty: number; receita: number; tarifa: number; envio: number | null; envioParcial: boolean; liquido: number | null }>
  pedidos: Array<{ orderId: string; data: string; status: string; titulo: string; qty: number; receita: number; tarifa: number; envio: number | null; liquido: number | null }>
  motivo?: string
}

// ── Navegação (espelha GRUPOS/TABS da Amazon, com o que o ML entrega hoje) ─────
const TABS_ML = [
  { id: 'resumo',   label: 'Resumo',      icon: 'ti-layout-dashboard' },
  { id: 'pedidos',  label: 'Pedidos',     icon: 'ti-cash' },
  { id: 'produtos', label: 'Por produto', icon: 'ti-chart-bar' },
] as const
type TabMl = (typeof TABS_ML)[number]['id']

const GRUPOS_ML: Array<{ id: string; label: string; icon: string; pergunta: string; tabs: TabMl[] }> = [
  { id: 'venda',  label: 'Vendas',    icon: 'ti-shopping-cart',
    pergunta: 'Como está indo: o panorama do período e os pedidos um a um.',
    tabs: ['resumo', 'pedidos'] },
  { id: 'result', label: 'Resultado', icon: 'ti-chart-pie',
    pergunta: 'Quais produtos rendem de verdade depois das taxas do Mercado Livre.',
    tabs: ['produtos'] },
]

const PERIODOS = [
  { id: 'hoje', label: 'Hoje', dias: 0 },
  { id: '7d', label: 'Últimos 7 dias', dias: 7 },
  { id: '15d', label: 'Últimos 15 dias', dias: 15 },
  { id: '30d', label: 'Últimos 30 dias', dias: 30 },
]

// Janela no fuso do seller (São Paulo) — regra da casa: nunca no fuso do servidor.
function janela(dias: number): { from: string; to: string } {
  const agora = new Date()
  const brMs = agora.getTime() - 3 * 3600_000
  const meiaNoiteBR = new Date(Math.floor(brMs / 86400_000) * 86400_000 + 3 * 3600_000)
  const from = dias === 0 ? meiaNoiteBR : new Date(meiaNoiteBR.getTime() - dias * 86400_000)
  return { from: from.toISOString(), to: agora.toISOString() }
}

// KPI no formato da Amazon: borda colorida, rótulo centrado, número grande, ⓘ.
function Kpi({ label, valor, cor, ajuda, sub }: { label: string; valor: string; cor: string; ajuda: string; sub?: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ position: 'relative', background: T.card, border: `1px solid ${tint(cor, 45)}`, borderRadius: 14, padding: '18px 16px', textAlign: 'center' as const, boxShadow: 'var(--elev1)' }}>
      <button onClick={() => setAberto(v => !v)} aria-label={`O que é ${label}`}
        style={{ position: 'absolute', top: 9, right: 9, background: 'none', border: 'none', cursor: 'pointer', color: T.t4, padding: 2, lineHeight: 1 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 14 }} aria-hidden="true" />
      </button>
      <div style={{ fontSize: 12.5, color: T.t3, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: T.t1, marginTop: 7, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' as const }}>{valor}</div>
      {sub && <div style={{ fontSize: 10, color: T.t4, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
      {aberto && (
        <div style={{ fontSize: 10.5, color: T.t2, background: T.modal, border: `1px solid ${T.line}`, borderRadius: 9, padding: '8px 10px', marginTop: 9, lineHeight: 1.6, textAlign: 'left' as const }}>
          {ajuda}
        </div>
      )}
    </div>
  )
}

function Tabela({ children, minWidth = 640 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--elev1)', overflowX: 'auto' as const }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 12.5, minWidth }}>{children}</table>
    </div>
  )
}
const th: React.CSSProperties = { padding: '4px 8px 9px', fontWeight: 700, color: T.t4, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.05em', textAlign: 'left' }
const thR: React.CSSProperties = { ...th, textAlign: 'right' }
const td: React.CSSProperties = { padding: '9px 8px', color: T.t2 }
const tdR: React.CSSProperties = { ...td, textAlign: 'right' }

export default function MLGestao() {
  const [status, setStatus] = useState<{ connected: boolean; nickname?: string | null } | null>(null)
  const [periodo, setPeriodo] = useState('7d')
  const [grupo, setGrupo] = useState('venda')
  const [tab, setTab] = useState<TabMl>('resumo')
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

  const irGrupo = (id: string) => {
    setGrupo(id)
    const g = GRUPOS_ML.find(x => x.id === id)!
    if (!g.tabs.includes(tab)) setTab(g.tabs[0])
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

  const g = GRUPOS_ML.find(x => x.id === grupo)!
  const perLabel = PERIODOS.find(p => p.id === periodo)?.label || ''

  return (
    <div style={{ width: '100%', paddingTop: 4 }}>
      {/* Cabeçalho + seletor de período (mesmo lugar da Amazon: canto direito) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em', lineHeight: 1.1 }}>Gestão</h1>
          <div style={{ fontSize: 12.5, color: T.t3, marginTop: 5 }}>
            Visão financeira da sua operação no Mercado Livre · <span style={{ color: T.g }}>dados reais do ML</span>
            {status?.nickname && <span style={{ color: T.t4 }}> · conta {status.nickname}</span>}
          </div>
        </div>
        <select value={periodo} onChange={e => setPeriodo(e.target.value)}
          style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 11, padding: '10px 14px', fontSize: 13, color: T.t1, outline: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {PERIODOS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      {/* Conexão — mesmo selo verde da Amazon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: T.g, background: tint(T.g, 10), border: `1px solid ${tint(T.g, 30)}`, borderRadius: 20, padding: '5px 12px' }}>
          <i className="ti ti-circle-check" style={{ fontSize: 14 }} aria-hidden="true" /> Conta Mercado Livre conectada
        </span>
        <button onClick={async () => { if (confirm('Desconectar a conta do Mercado Livre? Os pedidos guardados serão apagados.')) { await fetch('/api/ml/gestao/disconnect', { method: 'POST' }); location.reload() } }}
          style={{ background: 'none', border: 'none', color: T.t3, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
          desconectar
        </button>
      </div>

      {/* Barra de grupos + telas (estética idêntica à da Amazon) */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' as const, marginBottom: 11 }}>
        {GRUPOS_ML.map(gr => {
          const on = grupo === gr.id
          return (
            <button key={gr.id} onClick={() => irGrupo(gr.id)} aria-current={on ? 'page' : undefined} title={gr.pergunta}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 11, cursor: 'pointer',
                fontFamily: 'inherit', flexShrink: 0, fontSize: 13, fontWeight: on ? 700 : 600, whiteSpace: 'nowrap' as const,
                border: `1px solid ${on ? T.gold : T.line}`, background: on ? T.gold : T.card,
                color: on ? '#1c1606' : T.t2,
              }}>
              <i className={`ti ${gr.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />{gr.label}
            </button>
          )
        })}
      </div>
      <div style={{ fontSize: 11.5, color: T.t3, marginBottom: g.tabs.length > 1 ? 9 : 0, lineHeight: 1.5 }}>{g.pergunta}</div>
      {g.tabs.length > 1 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginBottom: 2 }}>
          {g.tabs.map(id => {
            const tb = TABS_ML.find(x => x.id === id)!
            const on = tab === id
            return (
              <button key={id} onClick={() => setTab(id)} aria-current={on ? 'page' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, whiteSpace: 'nowrap' as const,
                  padding: '7px 11px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid transparent',
                  background: on ? tint(T.gold, 13) : 'transparent', color: on ? T.gold : T.t2, fontWeight: on ? 700 : 500,
                }}>
                <i className={`ti ${tb.icon}`} style={{ fontSize: 14 }} aria-hidden="true" />{tb.label}
              </button>
            )
          })}
        </div>
      )}
      <div style={{ borderBottom: `1px solid ${T.line}`, marginBottom: 18, paddingTop: 9 }} />

      {loading && <div style={{ padding: 40, textAlign: 'center' as const, color: T.t3, fontSize: 13 }}>Carregando suas vendas do ML…</div>}

      {!loading && dre?.connected && (
        <>
          {/* ── RESUMO ── */}
          {tab === 'resumo' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: 13, marginBottom: 14 }}>
                <Kpi label="Faturamento" valor={brl(dre.receita)} cor={T.pur}
                  sub={`${dre.vendas} venda${dre.vendas === 1 ? '' : 's'} · ${dre.unidades} un.`}
                  ajuda="O que os compradores pagaram nos pedidos válidos do período. Pedido cancelado não entra aqui (o painel do ML soma cancelado em 'vendas brutas' — por isso os números diferem)." />
                <Kpi label="Líq. do Marketplace" valor={brl(dre.liquidoML)} cor={T.g}
                  sub="antes de imposto, CMV e Ads"
                  ajuda="Faturamento menos o que o ML cobrou: tarifa de venda real de cada pedido e o custo real de cada envio. É o que sobra do marketplace, antes do custo do produto." />
                <Kpi label="Tarifas do ML" valor={`− ${brl(dre.tarifaVenda)}`} cor={T.a}
                  sub="tarifa real cobrada por venda"
                  ajuda="A tarifa que o ML cobrou em cada pedido (sale_fee) — não é estimativa nem tabela: é o valor que aparece no seu extrato." />
                <Kpi label="Envios" valor={`− ${brl(dre.envio)}`} cor={T.a}
                  sub={dre.enviosPendentes > 0 ? `${dre.enviosPendentes} envio${dre.enviosPendentes === 1 ? '' : 's'} sem custo medido` : 'custo real dos envios'}
                  ajuda="O custo de envio que ficou com você (frete grátis que você banca ou a logística do ML). Envio ainda não medido aparece declarado — nunca somamos zero fingindo que medimos." />
                <Kpi label="Ticket médio" valor={brl(dre.vendas > 0 ? dre.receita / dre.vendas : 0)} cor={T.pur}
                  ajuda="Faturamento dividido pelo número de vendas do período." />
                <Kpi label="Retenção do ML" valor={dre.receita > 0 ? `${Math.round(((dre.tarifaVenda + dre.envio) / dre.receita) * 100)}%` : '—'} cor={T.a}
                  sub="quanto o marketplace ficou"
                  ajuda="A fatia do seu faturamento que o Mercado Livre reteve em tarifas e envios. Serve pra comparar com a Amazon na visão 'Tudo'." />
              </div>

              {dre.canceladas.pedidos > 0 && (
                <div style={{ fontSize: 12, color: T.t2, background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: '11px 14px', marginBottom: 14, boxShadow: 'var(--elev1)' }}>
                  <div style={{ fontWeight: 700, color: T.t1, marginBottom: 5 }}>Por que o painel do ML mostra outro número?</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'baseline', lineHeight: 1.7 }}>
                    <span>Receita (dinheiro que entrou) <strong style={{ color: T.g }}>{brl(dre.receita)}</strong></span>
                    <span style={{ color: T.t4 }}>+</span>
                    <span>{dre.canceladas.pedidos} cancelado{dre.canceladas.pedidos === 1 ? '' : 's'} <strong style={{ color: T.r }}>{brl(dre.canceladas.valor)}</strong></span>
                    <span style={{ color: T.t4 }}>=</span>
                    <span><strong style={{ color: T.t1 }}>{brl(dre.vendasBrutas)}</strong> — é o "Vendas brutas" do ML</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: T.t4, marginTop: 5 }}>
                    O ML soma pedidos cancelados em "vendas brutas". O Oráculo mostra o que de fato entrou — por isso a diferença.
                  </div>
                </div>
              )}

              {dre.vendas === 0 && (
                <div style={{ padding: '40px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
                  Nenhuma venda em {perLabel.toLowerCase()}. Troque o período no canto superior direito.
                </div>
              )}
            </>
          )}

          {/* ── PEDIDOS ── */}
          {tab === 'pedidos' && (
            dre.pedidos.length > 0 ? (
              <Tabela>
                <thead>
                  <tr>
                    <th style={th}>Data</th><th style={th}>Produto</th>
                    <th style={thR}>Receita</th><th style={thR}>Tarifa</th><th style={thR}>Envio</th><th style={thR}>Você recebe</th>
                  </tr>
                </thead>
                <tbody>
                  {dre.pedidos.map(o => (
                    <tr key={o.orderId} style={{ borderTop: `1px solid ${tint(T.line, 60)}` }}>
                      <td style={{ ...td, whiteSpace: 'nowrap' as const, color: T.t3 }}>
                        {new Date(o.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{' '}
                        <span style={{ color: T.t4, fontSize: 10.5 }}>{new Date(o.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td style={{ ...td, color: T.t1, maxWidth: 320 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{o.titulo}{o.qty > 1 ? ` ×${o.qty}` : ''}</div>
                      </td>
                      <td style={{ ...tdR, color: T.t1, fontWeight: 600 }}>{brl(o.receita)}</td>
                      <td style={{ ...tdR, color: T.a }}>− {brl(o.tarifa)}</td>
                      <td style={{ ...tdR, color: o.envio != null ? T.a : T.t4 }}>{o.envio != null ? `− ${brl(o.envio)}` : 'medindo…'}</td>
                      <td style={{ ...tdR, fontWeight: 800, color: o.liquido != null ? (o.liquido >= 0 ? T.g : T.r) : T.t4 }}>{o.liquido != null ? brl(o.liquido) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
            ) : (
              <div style={{ padding: '40px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
                Nenhum pedido em {perLabel.toLowerCase()}.
              </div>
            )
          )}

          {/* ── POR PRODUTO ── */}
          {tab === 'produtos' && (
            dre.produtos.length > 0 ? (
              <>
                <Tabela>
                  <thead>
                    <tr>
                      <th style={th}>Produto</th><th style={thR}>Un.</th><th style={thR}>Receita</th>
                      <th style={thR}>Tarifa ML</th><th style={thR}>Envio</th><th style={thR}>Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dre.produtos.map(p => (
                      <tr key={p.itemId} style={{ borderTop: `1px solid ${tint(T.line, 60)}` }}>
                        <td style={{ ...td, color: T.t1, maxWidth: 330 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.titulo}</div>
                          <div style={{ fontSize: 9.5, color: T.t4 }}>{p.itemId} · {p.pedidos} pedido{p.pedidos === 1 ? '' : 's'}</div>
                        </td>
                        <td style={tdR}>{p.qty}</td>
                        <td style={{ ...tdR, color: T.t1, fontWeight: 600 }}>{brl(p.receita)}</td>
                        <td style={{ ...tdR, color: T.a }}>− {brl(p.tarifa)}</td>
                        <td style={{ ...tdR, color: p.envio != null ? T.a : T.t4 }}>{p.envio != null ? `− ${brl(p.envio)}` : '—'}{p.envioParcial && p.envio != null ? ' *' : ''}</td>
                        <td style={{ ...tdR, fontWeight: 800, color: p.liquido != null ? (p.liquido >= 0 ? T.g : T.r) : T.t4 }}>{p.liquido != null ? brl(p.liquido) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Tabela>
                {dre.produtos.some(p => p.envioParcial) && (
                  <div style={{ fontSize: 10.5, color: T.t4, marginTop: 9, lineHeight: 1.5 }}>
                    * produto com pedido de vários itens ou envio ainda sem custo — o líquido só aparece quando TODO o custo foi medido. Não rateamos envio entre produtos: rateio é palpite com cara de número.
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '40px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
                Nenhum produto vendido em {perLabel.toLowerCase()}.
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
