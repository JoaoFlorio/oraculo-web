'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts'

// ─────────────────────────────────────────────────────────────────────────────
// Gestão MERCADO LIVRE — PARIDADE com a Gestão Amazon (GestaoHub): o MESMO grid de
// 12 KPIs, o MESMO gráfico "Resumo de Receitas", a MESMA tabela Top produtos (com
// imagem, preço, custo, lucro, margem) e o MESMO modal de detalhamento (lupa).
//
// Os números são REAIS COBRADOS pelo ML: receita = valor do anúncio (preço ×
// unidades, NÃO o frete que o comprador paga) · tarifa = sale_fee real · envio =
// custo real do shipment. Nada recalculado. O frete do comprador aparece como
// linha separada "repasse" no cartão do pedido.
//
// ⚠️ Os campos de ADS (Valor em Ads, TACOS, MPA, Lucro pós ADS, Custo Ads) mostram
// "—" até o Mercado Ads ser integrado — igual a Amazon mostra "—" quando o Ads não
// está conectado. Nunca inventa nem zera "não sei".
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  card: 'var(--card)', cardHov: 'var(--cardHov)', line: 'var(--line)', line2: 'var(--line2)', modal: 'var(--modal)',
  gold: 'var(--gold)', g: 'var(--g)', a: 'var(--a)', r: 'var(--r)', pur: 'var(--pur)', blue: 'var(--blue)',
  t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)', t4: 'var(--t4)',
}
const tint = (v: string, pct: number) => `color-mix(in srgb, ${v} ${pct}%, transparent)`
const brl = (n: number) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pc = (n: number) => (Number(n) || 0).toFixed(1).replace('.', ',') + '%'

// ── Série diária (gráfico): preenche cada dia do intervalo com 0 onde não houve venda.
const fmtDM = (d: string) => { const [, m, dd] = d.split('-'); return `${dd}/${m}` }
const nextDay = (d: string) => { const dt = new Date(d + 'T12:00:00Z'); dt.setUTCDate(dt.getUTCDate() + 1); return dt.toISOString().slice(0, 10) }
function fillDaily(daily: Array<{ date: string; receita: number }> = [], fromISO?: string, toISO?: string) {
  const map: Record<string, number> = {}; for (const d of daily) map[d.date] = d.receita
  const s = (fromISO || '').slice(0, 10), e = (toISO || '').slice(0, 10)
  if (!s || !e) return daily.map(d => ({ label: fmtDM(d.date), receita: d.receita }))
  const out: { label: string; receita: number }[] = []; let cur = s, guard = 0
  while (cur <= e && guard++ < 400) { out.push({ label: fmtDM(cur), receita: map[cur] || 0 }); cur = nextDay(cur) }
  return out
}

type Produto = { itemId: string; titulo: string; foto: string | null; pedidos: number; qty: number; receita: number; tarifa: number; envio: number | null; envioParcial: boolean; liquido: number | null; imposto: number; cmv: number | null; temCusto: boolean; lucroFinal: number | null; custoAds: number | null; lucroPosAds: number | null; mpa: number | null }
type Pedido = { orderId: string; data: string; status: string; titulo: string; foto: string | null; qty: number; receita: number; freteComprador?: number; tarifa: number; envio: number | null; liquido: number | null; imposto: number; cmv: number | null; lucroFinal: number | null; itens: Array<{ itemId: string; titulo: string; foto: string | null; qty: number; unitPrice: number; tarifa: number }> }
type Dre = {
  connected: boolean
  nickname?: string | null
  vendas: number; unidades: number
  receita: number; tarifaVenda: number; envio: number; enviosPendentes: number
  liquidoML: number
  aliquota: number; imposto: number; cmv: number; lucroFinal: number
  adsConnected: boolean; ads: number | null; tacos: number | null; lucroPosAds: number | null; mpa: number | null
  adsSangria: { total: number; itens: Array<{ itemId: string; titulo: string; foto: string | null; gasto: number }> }
  produtosSemCusto: number; unidadesSemCusto: number; receitaSemCusto: number
  vendasBrutas: number
  daily: Array<{ date: string; receita: number }>
  canceladas: { pedidos: number; valor: number }
  produtos: Produto[]
  pedidos: Pedido[]
  motivo?: string
}

// Foto do produto — imagem quando há, senão placeholder colorido estável por id.
function Thumb({ foto, id, size = 34 }: { foto: string | null; id: string; size?: number }) {
  const pal = ['#7C3AED', '#E7B85C', '#2FBE8F', '#4F86C6', '#F2685C', '#9B8CFF', '#0EA5E9', '#F59E0B']
  const c = pal[(parseInt((id || '0').replace(/\D/g, '').slice(-3) || '0')) % pal.length]
  if (foto) return <img src={foto} alt="" width={size} height={size} style={{ borderRadius: 8, objectFit: 'cover' as const, flexShrink: 0, background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }} />
  return <span aria-hidden style={{ width: size, height: size, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${c}22` }}><i className="ti ti-photo" style={{ fontSize: size * 0.45, color: c }} /></span>
}

// Pílula de margem (verde/dourado/vermelho), igual a Amazon.
function Pill({ kind, children }: { kind: 'grn' | 'gold' | 'red'; children: React.ReactNode }) {
  const cor = kind === 'grn' ? T.g : kind === 'gold' ? T.gold : T.r
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: tint(cor, 15), color: cor, display: 'inline-block' }}>{children}</span>
}
const pillKind = (m: number): 'grn' | 'gold' | 'red' => m > 20 ? 'grn' : m > 0 ? 'gold' : 'red'

// Botão de lupa (abre o modal de detalhamento do produto).
function ZoomBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} title="Ver detalhamento"
      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.line2}`, background: T.card, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: T.t2 }}>
      <i className="ti ti-zoom-money" style={{ fontSize: 15 }} aria-hidden="true" />
    </button>
  )
}

// Tabela com cabeçalho declarativo (mesmo componente estético da Amazon).
function TableH({ head, minWidth, children }: { head: { label: string; right?: boolean; w?: string }[]; minWidth?: number; children: React.ReactNode }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--elev1)' }}>
      <div style={{ overflowX: 'auto' as const }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, tableLayout: 'fixed' as const, minWidth }}>
          <thead><tr style={{ background: tint(T.t4, 6) }}>
            {head.map((h, i) => <th key={i} style={{ width: h.w, textAlign: h.right ? 'right' : 'left', padding: '10px 8px', fontSize: 10.5, fontWeight: 600, color: T.t3, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h.label}</th>)}
          </tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  )
}
const cellNum: React.CSSProperties = { padding: '9px 8px', borderTop: `1px solid ${T.line}`, textAlign: 'right', fontWeight: 500, fontSize: 13, color: T.t1, fontVariantNumeric: 'tabular-nums' as const }

// KPI no formato da Amazon: borda de acento 1.5px, valor grande, ⓘ que abre popover.
function Kpi({ label, valor, cor, ajuda }: { label: string; valor: string; cor: string; ajuda: string }) {
  const [aberto, setAberto] = useState(false)
  useEffect(() => {
    if (!aberto) return
    const fechar = () => setAberto(false)
    document.addEventListener('click', fechar)
    return () => document.removeEventListener('click', fechar)
  }, [aberto])
  return (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '18px 14px 18px', textAlign: 'center' as const, position: 'relative' as const, minHeight: 96, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', boxShadow: 'var(--elev1)' }}>
      {/* Faixa de acento no topo — IGUAL à Amazon (GestaoHub). Antes a cor ia na
          borda inteira: o violeta/azul sumiam no escuro e o verde brilhava, dando
          cara de layout quebrado. Só a cor da faixa muda por métrica; o grid fica uniforme. */}
      <div aria-hidden style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: 3, background: cor, borderTopLeftRadius: 13, borderTopRightRadius: 13 }} />
      <button aria-label={`O que é ${label}`} onClick={e => { e.stopPropagation(); setAberto(v => !v) }}
        style={{ position: 'absolute' as const, top: 5, right: 6, background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 14, color: aberto ? T.gold : T.t3, opacity: aberto ? 1 : 0.7 }} aria-hidden="true" />
      </button>
      {aberto && (
        <div onClick={e => e.stopPropagation()}
          style={{ position: 'absolute' as const, top: 30, right: 6, left: 6, zIndex: 30, background: T.modal, border: `1px solid ${T.line2}`, borderRadius: 10, padding: '10px 12px', fontSize: 11, color: T.t2, lineHeight: 1.55, textAlign: 'left' as const, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
          {ajuda}
        </div>
      )}
      <div style={{ fontSize: 12.5, color: T.t2, fontWeight: 500, marginBottom: 9, lineHeight: 1.25 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 25, letterSpacing: '-0.01em', color: T.t1, fontVariantNumeric: 'tabular-nums' as const }}>{valor}</div>
    </div>
  )
}

// ── Navegação (espelha GRUPOS/TABS da Amazon) ──────────────────────────────────
const TABS_ML = [
  { id: 'resumo',   label: 'Resumo',        icon: 'ti-layout-dashboard' },
  { id: 'pedidos',  label: 'Pedidos',       icon: 'ti-cash' },
  { id: 'produtos', label: 'Por produto',   icon: 'ti-chart-bar' },
  { id: 'ads',      label: 'Ads',           icon: 'ti-speakerphone' },
  { id: 'gerenc',   label: 'Gerenciamento', icon: 'ti-adjustments' },
] as const
type TabMl = (typeof TABS_ML)[number]['id']

const GRUPOS_ML: Array<{ id: string; label: string; icon: string; pergunta: string; tabs: TabMl[] }> = [
  { id: 'venda',  label: 'Vendas',    icon: 'ti-shopping-cart',
    pergunta: 'Como está indo: o panorama do período e os pedidos um a um.',
    tabs: ['resumo', 'pedidos'] },
  { id: 'result', label: 'Resultado', icon: 'ti-chart-pie',
    pergunta: 'Quais produtos rendem de verdade depois das taxas do ML e do anúncio.',
    tabs: ['produtos'] },
  { id: 'anuncio', label: 'Ads', icon: 'ti-speakerphone',
    pergunta: 'Quanto o Mercado Ads custou e o que ele trouxe de volta.',
    tabs: ['ads'] },
  { id: 'ajuste', label: 'Ajustes', icon: 'ti-settings',
    pergunta: 'Onde você informa o custo de cada produto e o imposto — é o que faz o lucro fechar.',
    tabs: ['gerenc'] },
]

// Os MESMOS 8 presets da Gestão Amazon (GestaoHub PRESETS), na mesma ordem.
const PERIODOS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'ontem', label: 'Ontem' },
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '15d', label: 'Últimos 15 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
  { id: 'mes', label: 'Esse mês' },
  { id: 'mespass', label: 'Mês passado' },
  { id: 'ano', label: 'Esse ano' },
]

// Janela no fuso do seller (São Paulo, UTC−3 fixo — o Brasil não tem mais horário
// de verão) — regra da casa: nunca no fuso do servidor. Espelha o computeRange da
// Amazon, mas ancorado na meia-noite BR (não na do runtime).
function janela(id: string): { from: string; to: string } {
  const agora = new Date()
  const OFF = 3 * 3600_000
  const meiaNoiteBR = new Date(Math.floor((agora.getTime() - OFF) / 86400_000) * 86400_000 + OFF)
  const to = agora.toISOString()
  const brNow = new Date(agora.getTime() - OFF)   // getters UTC = relógio BR
  const y = brNow.getUTCFullYear(), m = brNow.getUTCMonth()
  const inicioMesBR = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 1, 3, 0, 0))  // 00:00 BR = 03:00 UTC
  const menosDias = (n: number) => new Date(meiaNoiteBR.getTime() - n * 86400_000).toISOString()
  switch (id) {
    case 'hoje':    return { from: meiaNoiteBR.toISOString(), to }
    case 'ontem':   return { from: menosDias(1), to: new Date(meiaNoiteBR.getTime() - 1).toISOString() }
    case '7d':      return { from: menosDias(7), to }
    case '15d':     return { from: menosDias(15), to }
    case '30d':     return { from: menosDias(30), to }
    case 'mes':     return { from: inicioMesBR(y, m).toISOString(), to }
    case 'mespass': return { from: inicioMesBR(y, m - 1).toISOString(), to: new Date(inicioMesBR(y, m).getTime() - 1).toISOString() }
    case 'ano':     return { from: new Date(Date.UTC(y, 0, 1, 3, 0, 0)).toISOString(), to }
    default:        return { from: menosDias(7), to }
  }
}

// ── Modal de detalhamento do produto (a lupa) — o waterfall até o lucro ─────────
function LinhaWF({ label, val, sign, cor, strong, nota }: { label: string; val: string; sign?: '-' | '=' | '+'; cor?: string; strong?: boolean; nota?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, padding: '7px 0', borderTop: sign === '=' ? `1px solid ${T.line}` : 'none' }}>
      <div style={{ minWidth: 0 }}>
        <span style={{ fontSize: 12.5, color: strong ? T.t1 : T.t2, fontWeight: strong ? 700 : 500 }}>{label}</span>
        {nota && <div style={{ fontSize: 10, color: T.t4, marginTop: 1, lineHeight: 1.4 }}>{nota}</div>}
      </div>
      <span style={{ fontSize: 13, fontWeight: strong ? 800 : 600, color: cor || T.t1, whiteSpace: 'nowrap' as const, fontVariantNumeric: 'tabular-nums' as const }}>
        {sign === '-' ? '− ' : sign === '+' ? '+ ' : ''}{val}
      </span>
    </div>
  )
}

function ProdutoDetalhe({ produto, pedidos, aliquota, custoUn, onClose }: { produto: Produto; pedidos: Pedido[]; aliquota: number; custoUn: number | null; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  const p = produto
  const meus = pedidos.filter(o => o.itens.some(it => it.itemId === p.itemId))
  const adsCon = p.custoAds != null                       // Ads conectado (0 = sem campanha)
  // Lucro final exibido: pós-ads quando o Ads está conectado; senão antes do ads.
  const lucroExibe = adsCon ? p.lucroPosAds : p.lucroFinal
  const margemExibe = adsCon ? p.mpa : ((p.temCusto && p.lucroFinal != null && p.receita > 0) ? p.lucroFinal / p.receita * 100 : null)

  return (
    <div onClick={onClose} style={{ position: 'fixed' as const, inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' as const }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(760px, 96vw)', background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', borderBottom: `1px solid ${T.line}` }}>
          <Thumb foto={p.foto} id={p.itemId} size={42} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.titulo}</div>
            <div style={{ fontSize: 10.5, color: T.t4 }}>{p.itemId} · {p.qty} un. · {p.pedidos} pedido{p.pedidos === 1 ? '' : 's'}</div>
          </div>
          <button onClick={onClose} aria-label="Fechar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.t3, fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Waterfall */}
        <div style={{ margin: '14px 16px', background: T.modal, border: `1px solid ${T.line}`, borderRadius: 12, padding: '6px 14px' }}>
          <LinhaWF label={`Faturado (${p.qty} un.)`} val={brl(p.receita)} strong nota="valor do anúncio (preço × unidades) no período — o frete que o comprador paga é repasse ao transportador e não entra aqui" />
          <LinhaWF label="Tarifa do Mercado Livre" val={brl(p.tarifa)} sign="-" cor={T.r} nota="sale_fee real cobrada em cada pedido" />
          <LinhaWF label="Envio" val={p.envio != null ? brl(p.envio) : 'medindo…'} sign={p.envio != null ? '-' : undefined} cor={p.envio != null ? T.r : T.t4} nota="custo real do frete que ficou com você (só de pedido mono-item; multi-item não rateamos)" />
          <LinhaWF label="Líq. do Marketplace" val={p.liquido != null ? brl(p.liquido) : '—'} sign="=" cor={p.liquido != null ? T.g : T.t4} strong />
          {aliquota > 0 && <LinhaWF label={`Imposto (${aliquota}%)`} val={brl(p.imposto)} sign="-" cor={T.r} />}
          <LinhaWF label={`Custo do produto (CMV, ${p.qty} un.)`} val={p.temCusto && p.cmv != null ? brl(p.cmv) : 'informe o custo'} sign={p.temCusto ? '-' : undefined} cor={p.temCusto ? T.r : T.gold} nota={custoUn != null ? `custo unitário ${brl(custoUn)} × ${p.qty} un.` : 'cadastre o custo na aba Por produto pra fechar o lucro'} />
          <LinhaWF label="Mercado Ads deste produto" val={p.custoAds == null ? '—' : p.custoAds > 0 ? brl(p.custoAds) : brl(0)} sign={p.custoAds ? '-' : undefined} cor={p.custoAds ? T.r : T.t4} nota={p.custoAds == null ? 'Mercado Ads não conectado nesta conta' : p.custoAds > 0 ? 'gasto real de anúncio deste item no período' : 'este item não teve gasto de anúncio no período'} />
          {/* Rodapé: lucro (pós-ads quando o Mercado Ads está conectado) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0 7px', borderTop: `1.5px solid ${T.line2}`, marginTop: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.t1 }}>{!p.temCusto ? 'Lucro (falta o custo)' : adsCon ? 'Lucro pós Ads' : 'Lucro do produto'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              {margemExibe != null && <Pill kind={pillKind(margemExibe)}>{pc(margemExibe)}</Pill>}
              <strong style={{ fontSize: 15, fontWeight: 800, color: (p.temCusto && lucroExibe != null) ? (lucroExibe >= 0 ? T.g : T.r) : T.t4, fontVariantNumeric: 'tabular-nums' as const }}>
                {p.temCusto && lucroExibe != null ? brl(lucroExibe) : '—'}
              </strong>
            </span>
          </div>
        </div>

        {/* Pedidos deste produto */}
        <div style={{ margin: '0 16px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.t2, margin: '4px 0 8px' }}>Pedidos deste produto no período</div>
          <TableH head={[{ label: 'Data' }, { label: 'Un.', right: true }, { label: 'Faturado', right: true }, { label: 'Tarifa', right: true }]} minWidth={420}>
            {meus.slice(0, 30).map((o, i) => {
              const it = o.itens.find(x => x.itemId === p.itemId)!
              return (
                <tr key={`${o.orderId}-${i}`}>
                  <td style={{ padding: '9px 8px', borderTop: `1px solid ${T.line}`, fontSize: 12, color: T.t2 }}>
                    {new Date(o.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                  <td style={cellNum}>{it.qty}</td>
                  <td style={{ ...cellNum, fontWeight: 600 }}>{brl(it.unitPrice * it.qty)}</td>
                  <td style={{ ...cellNum, color: T.a }}>− {brl(it.tarifa)}</td>
                </tr>
              )
            })}
          </TableH>
          {meus.length === 0 && <div style={{ fontSize: 11.5, color: T.t4, padding: '8px 2px' }}>Sem pedidos deste produto nos 60 mais recentes do período.</div>}
        </div>
      </div>
    </div>
  )
}

export default function MLGestao() {
  const [status, setStatus] = useState<{ connected: boolean; nickname?: string | null } | null>(null)
  const [periodo, setPeriodo] = useState('7d')
  const [grupo, setGrupo] = useState('venda')
  const [tab, setTab] = useState<TabMl>('resumo')
  const [dre, setDre] = useState<Dre | null>(null)
  const [chart30, setChart30] = useState<{ daily: Dre['daily']; from: string; to: string; netRatio: number | null } | null>(null)
  const [detail, setDetail] = useState<Produto | null>(null)
  const [loading, setLoading] = useState(true)
  const [conectando, setConectando] = useState(false)

  // Custo por ANÚNCIO (itemId) e alíquota de imposto — guardados no metadata do User.
  const [custos, setCustos] = useState<Record<string, string>>({})
  const [imposto, setImposto] = useState<string>('')  // '' = herda o imposto da Amazon
  const custoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const impTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async (per: string) => {
    setLoading(true)
    try {
      const { from, to } = janela(per)
      const r = await fetch(`/api/ml/gestao/dre?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      const d = await r.json()
      setDre(d)
      setStatus({ connected: !!d.connected, nickname: d.nickname })
    } catch { setDre(null) }
    finally { setLoading(false) }
  }, [])

  // Gráfico "Resumo de Receitas": janela FIXA de 30 dias (independente do filtro),
  // igual a Amazon. netRatio = líquido/receita do período (líquido proporcional).
  const carregarChart = useCallback(async () => {
    const { from, to } = janela('30d')
    try {
      const r = await fetch(`/api/ml/gestao/dre?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      const d = await r.json()
      if (d?.connected) setChart30({ daily: d.daily || [], from, to, netRatio: d.receita > 0 ? d.liquidoML / d.receita : null })
    } catch {}
  }, [])

  const recarregarDre = useCallback(async () => {
    const { from, to } = janela(periodo)
    try {
      const r = await fetch(`/api/ml/gestao/dre?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      setDre(await r.json())
    } catch {} finally { setSalvando(false) }
  }, [periodo])

  // Carrega custos e imposto salvos (uma vez).
  useEffect(() => {
    fetch('/api/user/metadata?key=ml_gestao_cmv').then(r => r.json()).then(d => {
      if (d?.value && typeof d.value === 'object') {
        const m: Record<string, string> = {}
        for (const k of Object.keys(d.value)) { const v = Number(d.value[k]); if (isFinite(v) && v > 0) m[k] = String(v) }
        setCustos(m)
      }
    }).catch(() => {})
    fetch('/api/user/metadata?key=ml_gestao_imposto').then(r => r.json()).then(d => {
      const v = Number(d?.value); if (isFinite(v) && v > 0) setImposto(String(v))
    }).catch(() => {})
  }, [])

  const salvarCusto = (itemId: string, valor: string) => {
    const next = { ...custos }
    if (valor.trim() === '') delete next[itemId]
    else next[itemId] = valor
    setCustos(next)
    if (custoTimer.current) clearTimeout(custoTimer.current)
    setSalvando(true)
    custoTimer.current = setTimeout(async () => {
      // Grava só números > 0 (0/vazio = "não sei", não zero). Aceita vírgula BR.
      const limpo: Record<string, number> = {}
      for (const k of Object.keys(next)) { const v = Number(String(next[k]).replace(',', '.')); if (isFinite(v) && v > 0) limpo[k] = v }
      await fetch('/api/user/metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'ml_gestao_cmv', value: limpo }) }).catch(() => {})
      recarregarDre()
    }, 1000)
  }

  const salvarImposto = (valor: string) => {
    setImposto(valor)
    if (impTimer.current) clearTimeout(impTimer.current)
    setSalvando(true)
    impTimer.current = setTimeout(async () => {
      const v = Number(String(valor).replace(',', '.'))
      const value = isFinite(v) && v > 0 ? v : null   // vazio/0 → volta a herdar da Amazon
      await fetch('/api/user/metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'ml_gestao_imposto', value }) }).catch(() => {})
      recarregarDre()
    }, 1000)
  }

  useEffect(() => {
    fetch('/api/ml/gestao/status').then(r => r.json()).then(st => {
      setStatus(st)
      if (st.connected) { carregar(periodo); carregarChart() }
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
    const gr = GRUPOS_ML.find(x => x.id === id)!
    if (!gr.tabs.includes(tab)) setTab(gr.tabs[0])
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

  // ── Dados derivados dos KPIs (mesmas fórmulas do GestaoHub) ──────────────────
  const fat = dre?.receita || 0
  const liq = dre?.liquidoML || 0
  const cmvTot = dre?.cmv || 0
  const lucroBruto = dre?.lucroFinal || 0
  const cm = cmvTot > 0                                  // sem custo nenhum → lucro/margem/ROI = —
  const vendas = dre?.vendas || 0
  const ticket = vendas > 0 ? fat / vendas : 0
  const margem = fat > 0 ? lucroBruto / fat * 100 : 0
  const roi = cmvTot > 0 ? lucroBruto / cmvTot * 100 : 0
  const fatTot = (dre?.produtos || []).reduce((s, p) => s + p.receita, 0)
  const chartData = chart30 ? fillDaily(chart30.daily, chart30.from, chart30.to).map(x => ({ ...x, liq: chart30.netRatio == null ? null : Math.round(x.receita * chart30.netRatio * 100) / 100 })) : []

  const ADS_TIP = 'Vem do Mercado Ads da sua conta. Como não há gasto de anúncio medido no período, aparece como "—" — nunca é inventado nem zerado.'

  return (
    <div style={{ width: '100%', paddingTop: 4 }}>
      {/* Cabeçalho + seletor de período */}
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

      {/* Conexão */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: T.g, background: tint(T.g, 10), border: `1px solid ${tint(T.g, 30)}`, borderRadius: 20, padding: '5px 12px' }}>
          <i className="ti ti-circle-check" style={{ fontSize: 14 }} aria-hidden="true" /> Conta Mercado Livre conectada
        </span>
        <button onClick={async () => { if (confirm('Desconectar a conta do Mercado Livre? Os pedidos guardados serão apagados.')) { await fetch('/api/ml/gestao/disconnect', { method: 'POST' }); location.reload() } }}
          style={{ background: 'none', border: 'none', color: T.t3, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
          desconectar
        </button>
      </div>

      {/* Barra de grupos + telas */}
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
          {/* ── RESUMO (paridade com a Amazon: 12 KPIs + gráfico + Top produtos) ── */}
          {tab === 'resumo' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 13, marginBottom: 16 }}>
                <Kpi label="Faturamento" valor={brl(fat)} cor={T.blue}
                  ajuda="O valor dos anúncios (preço × unidades) nos pedidos válidos do período. O frete pago pelo comprador é repasse ao transportador — não entra. Pedido cancelado também não (o painel do ML soma cancelado em 'vendas brutas')." />
                <Kpi label="Líq. do Marketplace" valor={brl(liq)} cor={T.blue}
                  ajuda="O que sobra DA VENDA depois da parte do ML: tarifa de venda real e custo real de cada envio. Antes de imposto, CMV e Ads." />
                <Kpi label="Lucro Bruto" valor={cm ? brl(lucroBruto) : '—'} cor={T.g}
                  ajuda="Líq. do Marketplace − imposto − CMV (custo dos produtos). É o lucro da VENDA, antes do anúncio. Fica '—' até você cadastrar algum custo." />
                <Kpi label="Margem" valor={cm ? pc(margem) : '—'} cor={T.g}
                  ajuda="Lucro Bruto ÷ faturamento. A mesma régua do card de cada produto." />
                <Kpi label="Número de Vendas" valor={String(vendas)} cor={T.blue}
                  ajuda="Pedidos que caíram no período (cancelados fora)." />
                <Kpi label="Número de Unidades Vendidas" valor={String(dre.unidades)} cor={T.blue}
                  ajuda="Total de unidades vendidas no período — a mesma contagem que o CMV usa." />
                <Kpi label="Ticket Médio" valor={brl(ticket)} cor={T.g}
                  ajuda="Faturamento ÷ número de vendas." />
                <Kpi label="Retorno Sobre Investimento" valor={cm ? pc(roi) : '—'} cor={T.g}
                  ajuda="Lucro Bruto ÷ CMV. Quanto cada real investido em mercadoria devolveu." />
                <Kpi label="Valor em Ads" valor={dre.ads == null ? '—' : brl(dre.ads)} cor={T.g}
                  ajuda={dre.adsConnected ? 'Gasto REAL de Mercado Ads no período (não estimativa) — somado dos anúncios da sua conta.' : ADS_TIP} />
                <Kpi label="TACOS" valor={dre.tacos == null ? '—' : pc(dre.tacos)} cor={T.g}
                  ajuda={dre.adsConnected ? 'Ads ÷ faturamento. Quanto do que você vendeu foi pro anúncio.' : ADS_TIP} />
                <Kpi label="Lucro bruto pós ADS" valor={(dre.lucroPosAds == null || !cm) ? '—' : brl(dre.lucroPosAds)} cor={dre.lucroPosAds != null && dre.lucroPosAds < 0 ? T.r : T.g}
                  ajuda={dre.adsConnected ? 'Lucro Bruto − gasto de Mercado Ads. É o que de fato sobrou depois do anúncio.' : ADS_TIP} />
                <Kpi label="MPA" valor={(dre.mpa == null || !cm) ? '—' : pc(dre.mpa)} cor={T.g}
                  ajuda={dre.adsConnected ? 'Margem Pós-Anúncio: lucro pós ads ÷ faturamento. A margem final da operação.' : ADS_TIP} />
              </div>

              {/* Aviso: de quanto é o buraco quando há produto sem custo. */}
              {dre.produtosSemCusto > 0 && (
                <div style={{ fontSize: 12, color: T.t2, background: tint(T.a, 7), border: `1px solid ${tint(T.a, 30)}`, borderRadius: 12, padding: '11px 14px', marginBottom: 16, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 16, color: T.a, marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
                  <div>
                    <strong style={{ color: T.t1 }}>{dre.produtosSemCusto} produto{dre.produtosSemCusto === 1 ? '' : 's'} sem custo cadastrado</strong> — {brl(dre.receitaSemCusto)} de faturamento entram no lucro como se o custo fosse zero.
                    Cadastre o custo desses anúncios na aba <button onClick={() => irGrupo('ajuste')} style={{ background: 'none', border: 'none', padding: 0, color: T.gold, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, textDecoration: 'underline' }}>Gerenciamento</button>.
                  </div>
                </div>
              )}

              {/* Gráfico "Resumo de Receitas" */}
              <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: '16px 16px 10px', marginBottom: 16, boxShadow: 'var(--elev1)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.t1 }}>Resumo de Receitas</span>
                  <span style={{ fontSize: 11, color: T.t3 }}>últimos 30 dias{chart30?.netRatio != null ? ' · líquido proporcional ao período' : ''}</span>
                </div>
                <div style={{ height: 300 }}>
                  {chart30 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="mlgReceita" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={T.pur} stopOpacity={0.34} />
                            <stop offset="100%" stopColor={T.pur} stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="mlgLiq" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={T.g} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={T.g} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={tint(T.t4, 22)} vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: T.t3, fontSize: 11 }} interval="preserveStartEnd" minTickGap={28} tickMargin={8} />
                        <YAxis tick={{ fill: T.t3, fontSize: 10.5 }} width={82} tickFormatter={(v: number) => 'R$ ' + Math.round(v).toLocaleString('pt-BR')} />
                        <RTooltip contentStyle={{ background: T.modal, border: `1px solid ${T.line}`, borderRadius: 10, fontSize: 12 }} formatter={(v, n) => [brl(Number(v)), n === 'liq' ? 'Líq. do Marketplace' : 'Receita']} labelStyle={{ color: T.t2 }} />
                        <Area type="monotone" dataKey="receita" name="Receita" stroke={T.pur} strokeWidth={2.4} fill="url(#mlgReceita)" dot={false} activeDot={{ r: 4 }} />
                        {chart30.netRatio != null && <Area type="monotone" dataKey="liq" name="Líq. do Marketplace" stroke={T.g} strokeWidth={2.4} fill="url(#mlgLiq)" dot={false} activeDot={{ r: 4 }} />}
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.t4, fontSize: 12.5 }}>Carregando o gráfico…</div>
                  )}
                </div>
              </div>

              {/* Top 15 produtos vendidos */}
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, margin: '2px 0 10px' }}>Top 15 produtos vendidos</div>
              {dre.produtos.length > 0 ? (
                <TableH minWidth={1000} head={[
                  { label: 'Produto', w: '22%' }, { label: 'Preço méd.', right: true }, { label: 'Custo un.', right: true },
                  { label: 'Unid.', right: true }, { label: 'Faturado', right: true }, { label: 'Repres.', right: true },
                  { label: 'Lucro', right: true }, { label: 'Margem', right: true }, { label: 'Custo Ads', right: true },
                  { label: 'Lucro pós ADS', right: true }, { label: 'MPA', right: true }, { label: '', right: true, w: '48px' },
                ]}>
                  {dre.produtos.slice(0, 15).map(p => {
                    const preco = p.qty > 0 ? p.receita / p.qty : 0
                    const custoU = custos[p.itemId] ? Number(String(custos[p.itemId]).replace(',', '.')) : null
                    const repres = fatTot > 0 ? p.receita / fatTot * 100 : 0
                    const temLucro = p.temCusto && p.lucroFinal != null
                    const mrg = temLucro && p.receita > 0 ? (p.lucroFinal as number) / p.receita * 100 : null
                    return (
                      <tr key={p.itemId}>
                        <td style={{ padding: '9px 8px', borderTop: `1px solid ${T.line}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <Thumb foto={p.foto} id={p.itemId} size={34} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 500, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.titulo}</div>
                              <div style={{ fontSize: 10, color: T.t3, marginTop: 1 }}>{p.itemId}</div>
                            </div>
                          </div>
                        </td>
                        <td style={cellNum}>{brl(preco)}</td>
                        <td style={{ ...cellNum, color: custoU != null ? T.t1 : T.t3 }}>{custoU != null ? brl(custoU) : '—'}</td>
                        <td style={cellNum}>{p.qty}</td>
                        <td style={{ ...cellNum, fontWeight: 600 }}>{brl(p.receita)}</td>
                        <td style={{ ...cellNum, color: T.t2 }}>{repres.toFixed(1)}%</td>
                        <td style={{ ...cellNum, color: temLucro ? ((p.lucroFinal as number) >= 0 ? T.g : T.r) : T.t3 }}>{temLucro ? brl(p.lucroFinal as number) : '—'}</td>
                        <td style={{ padding: '9px 8px', borderTop: `1px solid ${T.line}`, textAlign: 'right' }}>{mrg != null ? <Pill kind={pillKind(mrg)}>{pc(mrg)}</Pill> : '—'}</td>
                        <td style={{ ...cellNum, color: p.custoAds == null ? T.t3 : p.custoAds > 0 ? T.a : T.t3 }}>{p.custoAds == null ? '—' : p.custoAds > 0 ? `− ${brl(p.custoAds)}` : brl(0)}</td>
                        <td style={{ ...cellNum, color: (p.temCusto && p.lucroPosAds != null) ? ((p.lucroPosAds as number) >= 0 ? T.g : T.r) : T.t3 }}>{(p.temCusto && p.lucroPosAds != null) ? brl(p.lucroPosAds as number) : '—'}</td>
                        <td style={{ padding: '9px 8px', borderTop: `1px solid ${T.line}`, textAlign: 'right' }}>{(p.temCusto && p.mpa != null) ? <Pill kind={pillKind(p.mpa as number)}>{pc(p.mpa as number)}</Pill> : '—'}</td>
                        <td style={{ padding: '9px 8px', borderTop: `1px solid ${T.line}`, textAlign: 'right' }}><ZoomBtn onClick={() => setDetail(p)} /></td>
                      </tr>
                    )
                  })}
                </TableH>
              ) : (
                <div style={{ padding: '40px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
                  Nenhuma venda em {perLabel.toLowerCase()}. Troque o período no canto superior direito.
                </div>
              )}
              <div style={{ fontSize: 10.5, color: T.t4, marginTop: 9, lineHeight: 1.6 }}>
                Lucro e Margem aparecem só nos produtos com custo cadastrado. As colunas de <strong>Ads</strong> (Custo Ads, Lucro pós ADS, MPA) vêm do <strong>Mercado Ads</strong> real da sua conta — item sem anúncio no período aparece como <strong>R$ 0,00</strong> medido (não como valor desconhecido). Clique na <i className="ti ti-zoom-money" style={{ fontSize: 12 }} /> pra ver a conta completa do produto.
              </div>
            </>
          )}

          {/* ── PEDIDOS ── cada pedido é um CARTÃO, cada item uma linha com foto ── */}
          {tab === 'pedidos' && (
            dre.pedidos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {dre.pedidos.map(o => (
                  <div key={o.orderId} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, boxShadow: 'var(--elev1)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${tint(T.line, 70)}`, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: T.g, background: tint(T.g, 12), border: `1px solid ${tint(T.g, 30)}`, borderRadius: 5, padding: '2px 7px' }}>
                        {o.status === 'delivered' ? 'entregue' : o.status === 'shipped' ? 'enviado' : 'pago'}
                      </span>
                      <span style={{ fontSize: 12, color: T.t2, fontWeight: 600 }}>
                        {new Date(o.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        <span style={{ color: T.t4, fontWeight: 400 }}> · {new Date(o.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      <span style={{ fontSize: 10, color: T.t4 }}>#{o.orderId}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 800, color: (o.liquido ?? 0) >= 0 ? T.g : T.r }}>
                        {o.liquido != null ? `você recebe ${brl(o.liquido)}` : brl(o.receita)}
                      </span>
                    </div>
                    {o.itens.map((it, i) => (
                      <div key={`${it.itemId}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px', borderTop: i > 0 ? `1px solid ${tint(T.line, 50)}` : 'none' }}>
                        <Thumb foto={it.foto} id={it.itemId} size={44} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12.5, color: T.t1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{it.titulo}</div>
                          <div style={{ fontSize: 10, color: T.t4, marginTop: 1 }}>{it.itemId}{it.qty > 1 ? ` · ${it.qty} un.` : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, fontVariantNumeric: 'tabular-nums' as const }}>{brl(it.unitPrice * it.qty)}</div>
                          <div style={{ fontSize: 10, color: T.a }}>tarifa − {brl(it.tarifa)}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', flexWrap: 'wrap', padding: '8px 14px', borderTop: `1px solid ${tint(T.line, 70)}`, background: T.modal, fontSize: 11.5 }}>
                      <span style={{ color: T.t3 }}>Valor do anúncio <strong style={{ color: T.t1 }}>{brl(o.receita)}</strong></span>
                      {(o.freteComprador ?? 0) > 0 && (
                        <span style={{ color: T.t4 }} title="O comprador pagou este frete direto ao transportador. Não é sua receita — por isso não soma no faturamento nem no imposto.">Frete do comprador <strong style={{ color: T.t4 }}>{brl(o.freteComprador as number)}</strong> · repasse</span>
                      )}
                      <span style={{ color: T.t3 }}>Tarifa <strong style={{ color: T.a }}>− {brl(o.tarifa)}</strong></span>
                      <span style={{ color: T.t3 }}>Envio <strong style={{ color: o.envio != null ? T.a : T.t4 }}>{o.envio != null ? `− ${brl(o.envio)}` : 'medindo…'}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
                Nenhum pedido em {perLabel.toLowerCase()}.
              </div>
            )
          )}

          {/* ── GERENCIAMENTO (Ajustes) ── onde se INFORMA o custo/imposto → lucro ── */}
          {tab === 'gerenc' && (
            dre.produtos.length > 0 ? (
              <>
                <div style={{ fontSize: 12, color: T.t2, background: tint(T.gold, 7), border: `1px solid ${tint(T.gold, 30)}`, borderRadius: 12, padding: '11px 14px', marginBottom: 12, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <i className="ti ti-adjustments" style={{ fontSize: 16, color: T.gold, marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
                  <div>É aqui que o lucro fecha: informe o <strong>custo unitário</strong> de cada anúncio e a <strong>alíquota de imposto</strong>. O Oráculo já mede tarifa, envio e Ads — o custo do produto só você tem. Cada valor salva sozinho e recalcula o lucro na hora.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap', background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: '10px 14px', boxShadow: 'var(--elev1)' }}>
                  <i className="ti ti-receipt-tax" style={{ fontSize: 16, color: T.a }} aria-hidden="true" />
                  <label htmlFor="ml-imposto" style={{ fontSize: 12.5, color: T.t2, fontWeight: 600 }}>Imposto sobre a venda</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input id="ml-imposto" value={imposto} onChange={e => salvarImposto(e.target.value)}
                      inputMode="decimal" placeholder={String(dre.aliquota || 0)}
                      style={{ width: 64, textAlign: 'right' as const, background: T.modal, border: `1px solid ${T.line}`, borderRadius: 8, padding: '6px 8px', fontSize: 13, color: T.t1, outline: 'none', fontVariantNumeric: 'tabular-nums' as const }} />
                    <span style={{ fontSize: 13, color: T.t3, fontWeight: 600 }}>%</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: T.t4, lineHeight: 1.4 }}>
                    {imposto.trim() === '' && dre.aliquota > 0
                      ? `herdado da Amazon (${dre.aliquota}%) — mude aqui pra usar outra alíquota só no ML`
                      : 'aplicado no lucro de todos os produtos. Vazio = herda o imposto da Amazon.'}
                  </span>
                  {salvando && <span style={{ marginLeft: 'auto', fontSize: 11, color: T.t4, display: 'flex', alignItems: 'center', gap: 5 }}><i className="ti ti-loader-2" style={{ fontSize: 13 }} aria-hidden="true" /> salvando…</span>}
                </div>

                <TableH minWidth={920} head={[
                  { label: 'Produto', w: '26%' }, { label: 'Un.', right: true }, { label: 'Receita', right: true },
                  { label: 'Tarifa ML', right: true }, { label: 'Envio', right: true }, { label: 'Líquido', right: true },
                  { label: 'Custo un.', right: true }, { label: 'CMV', right: true }, { label: 'Lucro', right: true },
                ]}>
                  {dre.produtos.map(p => (
                    <tr key={p.itemId}>
                      <td style={{ padding: '9px 8px', borderTop: `1px solid ${T.line}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <Thumb foto={p.foto} id={p.itemId} size={34} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 500, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.titulo}</div>
                            <div style={{ fontSize: 10, color: T.t3 }}>{p.itemId} · {p.pedidos} pedido{p.pedidos === 1 ? '' : 's'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={cellNum}>{p.qty}</td>
                      <td style={{ ...cellNum, fontWeight: 600 }}>{brl(p.receita)}</td>
                      <td style={{ ...cellNum, color: T.a }}>− {brl(p.tarifa)}</td>
                      <td style={{ ...cellNum, color: p.envio != null ? T.a : T.t3 }}>{p.envio != null ? `− ${brl(p.envio)}` : '—'}{p.envioParcial && p.envio != null ? ' *' : ''}</td>
                      <td style={{ ...cellNum, fontWeight: 700, color: p.liquido != null ? (p.liquido >= 0 ? T.g : T.r) : T.t3 }}>{p.liquido != null ? brl(p.liquido) : '—'}</td>
                      <td style={{ padding: '6px 8px', borderTop: `1px solid ${T.line}`, textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: `1px solid ${p.temCusto ? T.line : tint(T.a, 40)}`, borderRadius: 8, padding: '3px 6px', background: T.modal }}>
                          <span style={{ fontSize: 10.5, color: T.t4 }}>R$</span>
                          <input value={custos[p.itemId] ?? ''} onChange={e => salvarCusto(p.itemId, e.target.value)}
                            inputMode="decimal" placeholder="0,00" aria-label={`Custo unitário de ${p.titulo}`}
                            style={{ width: 56, textAlign: 'right' as const, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: T.t1, fontVariantNumeric: 'tabular-nums' as const, fontFamily: 'inherit' }} />
                        </span>
                      </td>
                      <td style={{ ...cellNum, color: p.cmv != null ? T.a : T.t3 }}>{p.cmv != null ? `− ${brl(p.cmv)}` : '—'}</td>
                      <td style={{ ...cellNum, fontWeight: 700, color: p.lucroFinal == null ? T.t3 : !p.temCusto ? T.a : (p.lucroFinal >= 0 ? T.g : T.r) }}>
                        {p.lucroFinal == null ? '—' : `${!p.temCusto ? '≈ ' : ''}${brl(p.lucroFinal)}`}
                      </td>
                    </tr>
                  ))}
                </TableH>
                <div style={{ fontSize: 10.5, color: T.t4, marginTop: 9, lineHeight: 1.6 }}>
                  {dre.produtos.some(p => p.envioParcial) && (
                    <div>* produto com pedido de vários itens ou envio ainda sem custo — o líquido só aparece quando TODO o custo foi medido. Não rateamos envio entre produtos.</div>
                  )}
                  {dre.produtos.some(p => !p.temCusto) && (
                    <div><strong style={{ color: T.a }}>≈</strong> lucro <strong>otimista</strong>: falta cadastrar o custo do produto (entra na conta como zero). Preencha o custo unitário pra fechar o lucro.</div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: '40px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
                Nenhum produto vendido em {perLabel.toLowerCase()}.
              </div>
            )
          )}

          {/* ── POR PRODUTO (Resultado) ── o lucro de cada produto, leitura ── */}
          {tab === 'produtos' && (
            dre.produtos.length > 0 ? (
              <>
                <TableH minWidth={1020} head={[
                  { label: 'Produto', w: '24%' }, { label: 'Un.', right: true }, { label: 'Faturado', right: true },
                  { label: 'Líquido ML', right: true }, { label: 'Imposto', right: true }, { label: 'CMV', right: true },
                  { label: 'Lucro', right: true }, { label: 'Margem', right: true }, { label: 'Custo Ads', right: true },
                  { label: 'Lucro pós ADS', right: true }, { label: 'MPA', right: true }, { label: '', right: true, w: '48px' },
                ]}>
                  {dre.produtos.map(p => {
                    const temLucro = p.temCusto && p.lucroFinal != null
                    const mrg = temLucro && p.receita > 0 ? (p.lucroFinal as number) / p.receita * 100 : null
                    return (
                      <tr key={p.itemId}>
                        <td style={{ padding: '9px 8px', borderTop: `1px solid ${T.line}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <Thumb foto={p.foto} id={p.itemId} size={34} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 500, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.titulo}</div>
                              <div style={{ fontSize: 10, color: T.t3 }}>{p.itemId} · {p.pedidos} pedido{p.pedidos === 1 ? '' : 's'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={cellNum}>{p.qty}</td>
                        <td style={{ ...cellNum, fontWeight: 600 }}>{brl(p.receita)}</td>
                        <td style={{ ...cellNum, color: p.liquido != null ? T.g : T.t3 }}>{p.liquido != null ? brl(p.liquido) : '—'}</td>
                        <td style={{ ...cellNum, color: T.a }}>− {brl(p.imposto)}</td>
                        <td style={{ ...cellNum, color: p.cmv != null ? T.a : T.t3 }}>{p.cmv != null ? `− ${brl(p.cmv)}` : '—'}</td>
                        <td style={{ ...cellNum, color: temLucro ? ((p.lucroFinal as number) >= 0 ? T.g : T.r) : T.t3 }}>{temLucro ? brl(p.lucroFinal as number) : '—'}</td>
                        <td style={{ padding: '9px 8px', borderTop: `1px solid ${T.line}`, textAlign: 'right' }}>{mrg != null ? <Pill kind={pillKind(mrg)}>{pc(mrg)}</Pill> : '—'}</td>
                        <td style={{ ...cellNum, color: p.custoAds == null ? T.t3 : p.custoAds > 0 ? T.a : T.t3 }}>{p.custoAds == null ? '—' : p.custoAds > 0 ? `− ${brl(p.custoAds)}` : brl(0)}</td>
                        <td style={{ ...cellNum, color: (p.temCusto && p.lucroPosAds != null) ? ((p.lucroPosAds as number) >= 0 ? T.g : T.r) : T.t3 }}>{(p.temCusto && p.lucroPosAds != null) ? brl(p.lucroPosAds as number) : '—'}</td>
                        <td style={{ padding: '9px 8px', borderTop: `1px solid ${T.line}`, textAlign: 'right' }}>{(p.temCusto && p.mpa != null) ? <Pill kind={pillKind(p.mpa as number)}>{pc(p.mpa as number)}</Pill> : '—'}</td>
                        <td style={{ padding: '9px 8px', borderTop: `1px solid ${T.line}`, textAlign: 'right' }}><ZoomBtn onClick={() => setDetail(p)} /></td>
                      </tr>
                    )
                  })}
                </TableH>
                <div style={{ fontSize: 10.5, color: T.t4, marginTop: 9, lineHeight: 1.6 }}>
                  Lucro, Margem e MPA aparecem nos produtos com custo cadastrado (informe em <button onClick={() => irGrupo('ajuste')} style={{ background: 'none', border: 'none', padding: 0, color: T.gold, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10.5, textDecoration: 'underline' }}>Gerenciamento</button>). Clique na <i className="ti ti-zoom-money" style={{ fontSize: 12 }} /> pra ver a conta completa.
                </div>
              </>
            ) : (
              <div style={{ padding: '40px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
                Nenhum produto vendido em {perLabel.toLowerCase()}.
              </div>
            )
          )}

          {/* ── ADS (Mercado Ads) ── quanto o anúncio custou e o que trouxe ── */}
          {tab === 'ads' && (
            dre.adsConnected ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 13, marginBottom: 16 }}>
                  <Kpi label="Valor em Ads" valor={dre.ads == null ? '—' : brl(dre.ads)} cor={T.a}
                    ajuda="Gasto REAL de Mercado Ads no período, somado dos seus anúncios. Não é estimativa." />
                  <Kpi label="TACOS" valor={dre.tacos == null ? '—' : pc(dre.tacos)} cor={T.a}
                    ajuda="Ads ÷ faturamento. Quanto do que você vendeu foi pro anúncio." />
                  <Kpi label="Lucro bruto pós ADS" valor={(dre.lucroPosAds == null || !cm) ? '—' : brl(dre.lucroPosAds)} cor={dre.lucroPosAds != null && dre.lucroPosAds < 0 ? T.r : T.g}
                    ajuda="Lucro Bruto − gasto de Mercado Ads. O que de fato sobrou depois do anúncio." />
                  <Kpi label="MPA" valor={(dre.mpa == null || !cm) ? '—' : pc(dre.mpa)} cor={T.g}
                    ajuda="Margem Pós-Anúncio: lucro pós ads ÷ faturamento." />
                </div>

                {/* Sangria: gasto em item que NÃO vendeu no período */}
                {(dre.adsSangria?.total || 0) > 0 && (
                  <div style={{ background: tint(T.a, 7), border: `1px solid ${tint(T.a, 30)}`, borderRadius: 14, padding: '13px 16px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: dre.adsSangria?.itens?.length ? 10 : 0 }}>
                      <i className="ti ti-droplet-off" style={{ fontSize: 17, color: T.a, marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
                      <div style={{ fontSize: 12.5, color: T.t2 }}>
                        <strong style={{ color: T.a }}>{brl(dre.adsSangria?.total || 0)}</strong> em anúncios foram para produtos que <strong>não venderam</strong> no período. É gasto real que não virou receita nenhuma — vale revisar ou pausar essas campanhas.
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                      {(dre.adsSangria?.itens || []).map(it => (
                        <div key={it.itemId} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: '7px 11px' }}>
                          <Thumb foto={it.foto} id={it.itemId} size={30} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, color: T.t1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{it.titulo}</div>
                            <div style={{ fontSize: 9.5, color: T.t4 }}>{it.itemId}</div>
                          </div>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: T.a, fontVariantNumeric: 'tabular-nums' as const }}>− {brl(it.gasto)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gasto por produto anunciado (o que vendeu, com retorno) */}
                {dre.produtos.some(p => (p.custoAds || 0) > 0) ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, margin: '2px 0 10px' }}>Produtos anunciados que venderam</div>
                    <TableH minWidth={720} head={[
                      { label: 'Produto', w: '34%' }, { label: 'Faturado', right: true }, { label: 'Gasto Ads', right: true },
                      { label: 'Lucro pós ADS', right: true }, { label: 'MPA', right: true },
                    ]}>
                      {dre.produtos.filter(p => (p.custoAds || 0) > 0).sort((a, b) => (b.custoAds || 0) - (a.custoAds || 0)).map(p => (
                        <tr key={p.itemId}>
                          <td style={{ padding: '9px 8px', borderTop: `1px solid ${T.line}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              <Thumb foto={p.foto} id={p.itemId} size={34} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 500, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.titulo}</div>
                                <div style={{ fontSize: 10, color: T.t3 }}>{p.itemId}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ ...cellNum, fontWeight: 600 }}>{brl(p.receita)}</td>
                          <td style={{ ...cellNum, color: T.a }}>− {brl(p.custoAds as number)}</td>
                          <td style={{ ...cellNum, color: (p.temCusto && p.lucroPosAds != null) ? ((p.lucroPosAds as number) >= 0 ? T.g : T.r) : T.t3 }}>{(p.temCusto && p.lucroPosAds != null) ? brl(p.lucroPosAds as number) : '—'}</td>
                          <td style={{ padding: '9px 8px', borderTop: `1px solid ${T.line}`, textAlign: 'right' }}>{(p.temCusto && p.mpa != null) ? <Pill kind={pillKind(p.mpa as number)}>{pc(p.mpa as number)}</Pill> : '—'}</td>
                        </tr>
                      ))}
                    </TableH>
                  </>
                ) : (
                  (dre.adsSangria?.total || 0) === 0 && (
                    <div style={{ padding: '30px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13 }}>
                      Nenhum gasto de Mercado Ads medido em {perLabel.toLowerCase()}.
                    </div>
                  )
                )}
              </>
            ) : (
              <div style={{ maxWidth: 520, margin: '10px auto', textAlign: 'center' as const, padding: '30px 20px', background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16 }}>
                <i className="ti ti-speakerphone" style={{ fontSize: 26, color: T.gold, display: 'block', marginBottom: 10 }} aria-hidden="true" />
                <div style={{ fontSize: 13.5, color: T.t2, lineHeight: 1.7 }}>
                  Sua conta não tem <strong>Mercado Ads</strong> ativo (ou sem gasto no período). Quando houver anúncio, o gasto por produto, o TACOS e o lucro pós-anúncio aparecem aqui — com dado real, nunca estimado.
                </div>
              </div>
            )
          )}
        </>
      )}

      {detail && dre && (
        <ProdutoDetalhe produto={detail} pedidos={dre.pedidos} aliquota={dre.aliquota}
          custoUn={custos[detail.itemId] ? Number(String(custos[detail.itemId]).replace(',', '.')) : null}
          onClose={() => setDetail(null)} />
      )}
    </div>
  )
}
