// ─────────────────────────────────────────────────────────────────────────────
// Conta DEMO da Gestão — dados 100% fictícios, coerentes e configuráveis, para o
// João apresentar a ferramenta a alunos SEM expor sua loja real. Ativado só quando
// o usuário logado tem role='demo'. Os endpoints (finance/ads/status/inventory)
// devolvem esta geração no lugar da SP-API real. Toda a Gestão (Resumo/Vendas/ABC/
// Analítico/Ads/Estoque) deriva desses payloads, então fica tudo fake e consistente.
// ─────────────────────────────────────────────────────────────────────────────

export type DemoProduct = { sku: string; name: string; share: number; price: number }

export type DemoConfig = {
  name: string           // nome exibido na conta (ex.: João Florio)
  revToday: number       // faturamento de hoje
  revYesterday: number   // faturamento de ontem (dia próprio, dentro do total dos 7 dias)
  rev7d: number          // faturamento dos últimos 7 dias (total)
  rev30d: number         // faturamento dos últimos 30 dias (total)
  marginPct: number      // margem FINAL alvo (MPA = lucro pós-ADS / faturamento)
  tacosPct: number       // gasto em ads / faturamento
  commissionPct: number  // comissão Amazon
  fbaPct: number         // tarifa FBA
  roas: number           // retorno do ads (vendas por ads / gasto)
  products: DemoProduct[]
}

export const DEFAULT_DEMO_CONFIG: DemoConfig = {
  name: 'João Florio',
  revToday: 16583.53,
  revYesterday: 89872.40,
  rev7d: 439549.95,
  rev30d: 1883785.50,          // ~ rev7d/7 × 30
  marginPct: 16,
  tacosPct: 8.5,
  commissionPct: 15,
  fbaPct: 8,
  roas: 6.2,
  products: [
    { sku: 'DEMO-01', name: 'Kit Organizador de Gavetas 6 peças', share: 0.22, price: 89.90 },
    { sku: 'DEMO-02', name: 'Luminária LED de Mesa Articulada',   share: 0.18, price: 129.90 },
    { sku: 'DEMO-03', name: 'Garrafa Térmica Inox 1,2L',          share: 0.15, price: 74.90 },
    { sku: 'DEMO-04', name: 'Suporte Ergonômico para Notebook',   share: 0.14, price: 112.50 },
    { sku: 'DEMO-05', name: 'Kit 4 Potes Herméticos com Vedação', share: 0.11, price: 59.90 },
    { sku: 'DEMO-06', name: 'Massageador Facial Recarregável',    share: 0.10, price: 149.90 },
    { sku: 'DEMO-07', name: 'Organizador de Cabos Adesivo 12un',  share: 0.10, price: 39.90 },
  ],
}

export function mergeDemoConfig(partial: any): DemoConfig {
  const c = { ...DEFAULT_DEMO_CONFIG, ...(partial || {}) }
  if (!Array.isArray(c.products) || !c.products.length) c.products = DEFAULT_DEMO_CONFIG.products
  return c as DemoConfig
}

const r2 = (n: number) => Math.round(n * 100) / 100

// Fração do preço que é custo (CMV), calculada p/ a margem final bater exatamente:
// MPA = 1 - comissão% - fba% - tacos% - custo%  →  custo% = 1 - (comissão+fba+tacos+MPA).
function costRatio(cfg: DemoConfig): number {
  const r = 1 - (cfg.commissionPct + cfg.fbaPct + cfg.tacosPct + cfg.marginPct) / 100
  return Math.max(0.05, Math.min(0.9, r))
}

// Custo por SKU — grava no metadata `gestao_cmv` do demo (o front calcula o CMV daí).
export function demoCosts(cfg: DemoConfig): Record<string, number> {
  const cr = costRatio(cfg)
  const out: Record<string, number> = {}
  for (const p of cfg.products) out[p.sku] = r2(p.price * cr)
  return out
}

// Fuso de Brasília (UTC-3, fixo desde 2019 — sem horário de verão). O servidor do
// Railway roda em UTC, mas o cliente (browser) monta os ranges de período no fuso
// dele (BRT). Ancorar a série ao BRT garante que "ontem"/"hoje" caiam no dia certo
// independente do TZ do servidor — senão o fim-de-dia BRT vaza pro dia seguinte em UTC
// e "Ontem" acabava mostrando o valor de Hoje.
const BRT_OFFSET_MS = 3 * 3600000
// Epoch (ms) da meia-noite BRT do dia de calendário BRT que contém o instante `t`.
function brtDayStartMs(t: number): number {
  const shifted = t - BRT_OFFSET_MS
  return Math.floor(shifted / 86400000) * 86400000 + BRT_OFFSET_MS
}
// Rótulo dd/mm no fuso BRT (determinístico em qualquer TZ de servidor).
function mmdd(d: Date): string {
  const b = new Date(d.getTime() - BRT_OFFSET_MS)
  return `${String(b.getUTCDate()).padStart(2, '0')}/${String(b.getUTCMonth() + 1).padStart(2, '0')}`
}

function seriesDates(): Date[] {
  const todayStart = brtDayStartMs(Date.now())          // meia-noite BRT de hoje
  return Array.from({ length: 30 }, (_, i) => new Date(todayStart - (29 - i) * 86400000))
}

// Peso diário determinístico: sazonalidade de dia-da-semana (fim de semana ~20% mais
// fraco) + variação orgânica reproduzível. Faz cada dia ter um faturamento PRÓPRIO e
// realista (não um valor chapado), sem quebrar os totais.
function dayWeight(date: Date, i: number): number {
  const dow = new Date(date.getTime() - BRT_OFFSET_MS).getUTCDay() // dia da semana em BRT (0=Dom..6=Sáb)
  const week = (dow === 0 || dow === 6) ? 0.80 : 1.05    // dia útil > fim de semana
  const wobble = 0.90 + 0.20 * Math.abs(Math.sin(i * 2.3 + 1.1))
  return week * wobble
}

// Série de faturamento dos últimos 30 dias ([29] = hoje). Respeita: hoje=revToday,
// soma dos últimos 7 = rev7d, soma dos 30 = rev30d — com valor DIA A DIA realista.
function dailyValues(cfg: DemoConfig): number[] {
  const dates = seriesDates()
  const arr = new Array(30).fill(0)
  arr[29] = cfg.revToday                                 // hoje (dia em andamento)
  // ontem (dia 28): valor PRÓPRIO configurável. Clampado ao que sobra dos 7 dias
  // (rev7d - hoje) pra nunca estourar o total do período de 7 dias.
  const yest = Math.max(0, Math.min(cfg.revYesterday || 0, Math.max(0, cfg.rev7d - cfg.revToday)))
  arr[28] = r2(yest)
  // 5 dias anteriores a ontem (23..27): somam rev7d - hoje - ontem, ponderados por dia da semana
  const rest5 = Math.max(0, cfg.rev7d - cfg.revToday - yest)
  let w5 = 0; for (let i = 23; i <= 27; i++) w5 += dayWeight(dates[i], i)
  for (let i = 23; i <= 27; i++) arr[i] = r2(rest5 * dayWeight(dates[i], i) / (w5 || 1))
  // dias 0..22: somam rev30d - rev7d
  const rest23 = Math.max(0, cfg.rev30d - cfg.rev7d)
  let w23 = 0; for (let i = 0; i <= 22; i++) w23 += dayWeight(dates[i], i)
  for (let i = 0; i <= 22; i++) arr[i] = r2(rest23 * dayWeight(dates[i], i) / (w23 || 1))
  return arr
}

function avgTicket(cfg: DemoConfig): number {
  // ticket médio ponderado pelos preços dos produtos
  const w = cfg.products.reduce((s, p) => s + p.share, 0) || 1
  return cfg.products.reduce((s, p) => s + p.price * p.share, 0) / w
}

// Soma o faturamento do período [from,to] a partir da série diária + devolve o daily.
// Usa OFFSET de dias (nº de dias no período + quantos dias atrás termina) em vez de
// casar datas — evita o bug de fronteira em que "7 dias" pegava 8 dias de calendário.
function periodRevenue(cfg: DemoConfig, from: string, to: string): { revenue: number; daily: { date: string; receita: number; pedidos: number }[] } {
  const vals = dailyValues(cfg), dates = seriesDates(), MS = 86400000, ticket = avgTicket(cfg) || 1
  const fromMs = new Date(from).getTime(), toMs = new Date(to).getTime()
  // Tudo ancorado à meia-noite BRT (não ao TZ do servidor) — ver brtDayStartMs.
  const t0 = brtDayStartMs(Date.now())                                          // meia-noite BRT de hoje
  const toDay = brtDayStartMs(toMs)                                             // meia-noite BRT do fim do período
  const nDays = Math.max(1, Math.round((toMs - fromMs) / MS))                   // quantos dias o período cobre
  const endOffset = Math.max(0, Math.round((t0 - toDay) / MS))                  // termina quantos dias atrás (0 = hoje)
  const endIdx = 29 - endOffset
  const startIdx = Math.max(0, endIdx - (nDays - 1))
  let revenue = 0
  const daily: { date: string; receita: number; pedidos: number }[] = []
  for (let i = startIdx; i <= endIdx && i >= 0 && i <= 29; i++) {
    revenue += vals[i]
    daily.push({ date: mmdd(dates[i]), receita: vals[i], pedidos: Math.max(1, Math.round(vals[i] / ticket)) })
  }
  return { revenue: r2(revenue), daily }
}

// Núcleo da DRE demo p/ um faturamento R: produtos, taxas, CMV e o ADS que faz a
// margem final (MPA) bater EXATAMENTE o alvo (corrige o arredondamento de unidades:
// MPA = (liq - cmv - ads)/R = marginPct/100). Compartilhado entre a DRE e o
// relatório de Ads — assim o "Valor em Ads" do Resumo e a aba Ads mostram o MESMO gasto.
function coreDre(cfg: DemoConfig, R: number) {
  const costs = demoCosts(cfg)
  const produtos = cfg.products.map(p => {
    const receita = r2(p.share * R)
    const units = Math.max(0, Math.round(receita / p.price))
    return { sku: p.sku, asin: `B0DEMO${p.sku.slice(-2)}`, units, receita, name: p.name, image: '' }
  }).filter(p => p.units > 0).sort((a, b) => b.receita - a.receita)
  const vendas = produtos.reduce((s, p) => s + p.units, 0)
  const comissao = r2(R * cfg.commissionPct / 100)
  const fba = r2(R * cfg.fbaPct / 100)
  const liqMarketplace = r2(R - comissao - fba)
  const cmv = produtos.reduce((s, p) => s + p.units * (costs[p.sku] || 0), 0)
  const ads = Math.max(0, r2(liqMarketplace - cmv - R * cfg.marginPct / 100))
  return { produtos, vendas, comissao, fba, liqMarketplace, cmv, ads }
}

// DRE fake p/ o período. Mesmo shape do backend real (computeOrdersDRE) — a Gestão
// inteira deriva daqui. Só o modo `daily` devolve a série de 30 dias do gráfico.
export function demoFinance(cfg: DemoConfig, from: string, to: string, daily: boolean): any {
  if (daily) {
    const vals = dailyValues(cfg), dates = seriesDates(), ticket = avgTicket(cfg) || 1
    const series = vals.map((v, i) => ({ date: mmdd(dates[i]), receita: v, pedidos: Math.max(1, Math.round(v / ticket)) }))
    return { connected: true, period: { from, to }, daily: series, receita: r2(vals.reduce((s, v) => s + v, 0)) }
  }
  const { revenue: R, daily: dailyArr } = periodRevenue(cfg, from, to)
  const c = coreDre(cfg, R)
  return {
    connected: true,
    period: { from, to },
    linhas: { receitaBruta: R, devolucoes: 0, receitaLiquida: R, comissao: c.comissao, taxaPrograma: 0, fba: c.fba, armazenagem: 0, assinatura: 0, outrasTaxas: 0, ads: c.ads },
    liqMarketplace: c.liqMarketplace,
    vendas: c.vendas, unidades: c.vendas,
    faturamento: R,
    ticket: c.vendas > 0 ? r2(R / c.vendas) : 0,
    produtos: c.produtos,
    reembolsos: [],
    daily: dailyArr,
    demo: true,
  }
}

// Relatório de Ads fake, coerente com o TACOS/ROAS. Aceita from/to explícito (período
// exato do seletor, inclusive "custom"/calendário) — senão cai na janela nomeada. Sem
// isso, "Ontem"/calendário caíam em '30d' e mostravam o gasto de 30 dias (R$160k) num dia.
export function demoAdsReport(cfg: DemoConfig, window: string, from?: string, to?: string): any {
  const range = (from && to) ? { from, to } : windowRange(window)
  const { revenue } = periodRevenue(cfg, range.from, range.to)
  const spend = coreDre(cfg, revenue).ads   // MESMO gasto da DRE (garante MPA = alvo)
  const sales = r2(spend * cfg.roas)
  const acos = sales > 0 ? r2(spend / sales * 100) : 0
  const roas = spend > 0 ? r2(sales / spend) : 0
  const camps = [
    { campaign: 'SP · Marca — Exato', frac: 0.34 },
    { campaign: 'SP · Genéricos — Amplo', frac: 0.28 },
    { campaign: 'SP · Concorrentes — Frase', frac: 0.22 },
    { campaign: 'SP · Auto — Descoberta', frac: 0.16 },
  ]
  const byCampaign = camps.map(c => ({ campaign: c.campaign, spend: r2(spend * c.frac), sales: r2(sales * c.frac), clicks: Math.round(spend * c.frac / 1.3), impressions: Math.round(spend * c.frac / 1.3 * 22) }))
  return { connected: true, ready: true, cached: true, stale: false, window, updatedAt: new Date().toISOString(), period: { from: range.from, to: range.to }, spend, sales, purchases: Math.round(sales / (avgTicket(cfg) || 1)), clicks: Math.round(spend / 1.3), impressions: Math.round(spend / 1.3 * 22), acos, roas, byCampaign, demo: true }
}

// Estoque FBA fake por produto.
export function demoInventory(cfg: DemoConfig): any {
  const itens = cfg.products.map((p, i) => {
    const fulfillable = 40 + ((i * 37) % 220)
    return { sku: p.sku, asin: `B0DEMO${p.sku.slice(-2)}`, name: p.name, image: '', fulfillable, inbound: (i * 13) % 60, reserved: (i * 7) % 20, unfulfillable: 0 }
  })
  // ⚠️ A chave é `inventario`, não `itens`: é o nome que o backend real devolve
  // e o único que o painel lê (`GestaoHub` linha ~1091 exige
  // Array.isArray(d.inventario), senão marca 'indisponível'). Com `itens` a
  // conta DEMO mostrava Estoque FBA vazio e Curva Z morta — bem na conta usada
  // pra apresentar. Corrigido 21/07.
  return { connected: true, inventario: itens, demo: true }
}

// Faixa de datas equivalente à janela de ads (espelha o backend).
function windowRange(window: string): { from: string; to: string } {
  const now = new Date(); const to = now.toISOString()
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
  const y = new Date(now); y.setDate(y.getDate() - 1)
  switch (window) {
    case 'today':     return { from: startOf(now), to }
    case 'yesterday': return { from: startOf(y), to: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59).toISOString() }
    case '7d':        return { from: new Date(now.getTime() - 7 * 86400000).toISOString(), to }
    case '15d':       return { from: new Date(now.getTime() - 15 * 86400000).toISOString(), to }
    case 'month':     return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to }
    case 'year':      return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to }
    default:          return { from: new Date(now.getTime() - 30 * 86400000).toISOString(), to } // 30d
  }
}
