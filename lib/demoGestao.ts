// ─────────────────────────────────────────────────────────────────────────────
// Conta DEMO da Gestão — dados 100% fictícios, coerentes e configuráveis, para o
// João apresentar a ferramenta a alunos SEM expor sua loja real. Ativado só quando
// o usuário logado tem role='demo'. Os endpoints (finance/ads/status/inventory)
// devolvem esta geração no lugar da SP-API real. Toda a Gestão (Resumo/Vendas/ABC/
// Analítico/Ads/Estoque) deriva desses payloads, então fica tudo fake e consistente.
// ─────────────────────────────────────────────────────────────────────────────

export type DemoProduct = { sku: string; name: string; share: number; price: number; asin?: string; image?: string }

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
  // SKU do produto-ESTRELA da apresentação: fica nítido; os outros a tela pode
  // BORRAR (nome/imagem) — pra plateia focar nele e não escrutinar os demais.
  featuredSku?: string
  // 03/11/2026: faturamento MÉDIO por dia da operação simulada (o dia real fica entre ~0,6× e ~1,5× disto, BF acima).
  // revToday/revYesterday/rev7d/rev30d ficaram só por compatibilidade — não mandam mais na série.
  faturamentoDiaMedio?: number
}

export const DEFAULT_DEMO_CONFIG: DemoConfig = {
  name: 'João Florio',
  revToday: 7042.64,
  revYesterday: 38166.72,
  rev7d: 186666.67,
  rev30d: 800000.00,          // ~R$800k/mês (Amazon) · ~ rev7d/7 × 30
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

// ASIN realista e DETERMINÍSTICO a partir do SKU (formato B0 + 8 alfanuméricos,
// como os reais). Sem isto o demo mostrava "B0DEMO01" — denunciava a conta.
function demoAsin(sku: string): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
  let h = 0
  for (let i = 0; i < sku.length; i++) h = (h * 31 + sku.charCodeAt(i)) >>> 0
  let s = ''
  for (let i = 0; i < 8; i++) { s += A[h % A.length]; h = Math.floor(h / A.length) + (h % 7) * 131 }
  return 'B0' + s
}

// Margem pós-ads ALVO de CADA produto — espalhada e realista, NÃO todas iguais
// (margem idêntica em todo produto era mais um tell). Determinística por SKU, em
// torno da média (marginPct): ~11% a ~25%. O produto-ESTRELA ganha uma margem
// saudável e bonita de propósito, pra brilhar quando o João destaca ele.
function margemAlvoProduto(cfg: DemoConfig, sku: string): number {
  const base = (cfg.marginPct || 16) / 100
  if (cfg.featuredSku && sku === cfg.featuredSku) return Math.min(0.28, base + 0.09)  // estrela: ~25%
  let h = 0
  for (let i = 0; i < sku.length; i++) h = (h * 31 + sku.charCodeAt(i)) >>> 0
  const s = (h % 1000) / 1000                       // 0..1 determinístico por SKU
  return Math.max(0.11, Math.min(0.25, base + 0.13 * (s - 0.5)))  // média ~base, espalhado
}

// Custo por SKU (CMV) — grava no metadata `gestao_cmv` do demo (o front calcula o
// CMV daí). O custo é o que SOBRA depois de comissão + FBA + ads + a margem-alvo
// do produto: custo% = 1 - comissão% - fba% - tacos% - margem_alvo%. Assim cada
// produto exibe uma margem pós-ads diferente e coerente com as taxas.
export function demoCosts(cfg: DemoConfig): Record<string, number> {
  const fixo = (cfg.commissionPct + cfg.fbaPct + cfg.tacosPct) / 100
  const out: Record<string, number> = {}
  for (const p of cfg.products) {
    const cr = Math.max(0.12, Math.min(0.85, 1 - fixo - margemAlvoProduto(cfg, p.sku)))
    out[p.sku] = r2(p.price * cr)
  }
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

/* ═══════════════════════════════════════════════════════════════════════════
   📈 03/11/2026 (pedido do João: "isso tem muita cara de fake") — OPERAÇÃO SIMULADA DIA A DIA.
   Antes a série era montada pra TRÁS a partir de totais fixos (30 dias = R$ 800k sempre): qualquer janela de
   30 dias, hoje ou daqui a 2 meses, dava o mesmo número. Agora CADA DIA DO CALENDÁRIO tem o seu faturamento,
   gerado só pela data (determinístico: o dia 12/10 é sempre o mesmo valor, em qualquer tela, em qualquer dia),
   e o total de um período é a SOMA dos dias dele. Ingredientes de loja de verdade:
     · média configurável (faturamentoDiaMedio, padrão R$ 26,5k) e crescimento lento da operação (~1,5%/mês);
     · dia da semana (segunda forte, sábado fraco), começo de mês (salário) e fim de mês mais fraco;
     · datas do varejo: Black Friday (semana), dezembro, ressaca de janeiro, Dia das Mães, Prime Day;
     · "momento" (o ruído de um dia puxa o dos próximos), dias de oferta relâmpago e dias de ruptura;
     · TACoS e ROAS do Ads mudam por dia (dia de oferta gasta mais) → margem e ACoS variam por período;
     · HOJE cresce ao longo do dia seguindo a curva de vendas por hora (madrugada fraca, pico à noite).
   Nada a rodar todo dia: amanhã é um dia novo do calendário e entra sozinho.
   ═══════════════════════════════════════════════════════════════════════════ */
const DIA_MS = 86400000
const MEDIA_PADRAO = 26500
const diaDoCalendario = (dayStartMs: number) => Math.floor((dayStartMs - BRT_OFFSET_MS) / DIA_MS)
function hash01(n: number, salt: number): number {
  let h = (Math.imul(n | 0, 374761393) + Math.imul(salt | 0, 668265263)) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
// "Momento": o ruído de hoje carrega um pouco do de ontem e anteontem (vendas não pulam aleatórias dia a dia).
const ruido = (d: number, salt: number) => hash01(d, salt) * 0.5 + hash01(d - 1, salt) * 0.3 + hash01(d - 2, salt) * 0.2
const PESO_SEMANA = [0.96, 1.10, 1.07, 1.03, 0.99, 0.92, 0.85]   // Dom..Sáb
function dataBR(d: number) { const x = new Date(d * DIA_MS); return { y: x.getUTCFullYear(), m: x.getUTCMonth(), dia: x.getUTCDate(), dow: x.getUTCDay() } }
// Black Friday = 4ª sexta de novembro; Dia das Mães = 2º domingo de maio.
function nEsimoDiaSemana(y: number, m: number, dow: number, n: number) { const d1 = new Date(Date.UTC(y, m, 1)).getUTCDay(); return 1 + ((dow - d1 + 7) % 7) + 7 * (n - 1) }
function fatorVarejo(d: number): { f: number; evento: boolean } {
  const { y, m, dia } = dataBR(d)
  if (m === 10) {
    const bf = nEsimoDiaSemana(y, 10, 5, 4), k = dia - bf
    if (k === 0) return { f: 1.85, evento: true }
    if (k === 3) return { f: 1.40, evento: true }                       // Cyber Monday
    if (k >= -4 && k <= 2) return { f: 1.30 - 0.04 * Math.abs(k), evento: true }
    if (dia >= bf - 12 && dia < bf - 4) return { f: 1.08, evento: false } // esquenta
  }
  if (m === 11) { if (dia <= 20) return { f: 1.17, evento: false }; if (dia >= 24) return { f: 0.84, evento: false } }
  if (m === 0) return { f: dia <= 15 ? 0.86 : 0.93, evento: false }
  if (m === 4) { const maes = nEsimoDiaSemana(y, 4, 0, 2); if (dia >= maes - 8 && dia < maes) return { f: 1.16, evento: true } }
  if (m === 6 && (dia === 15 || dia === 16)) return { f: 1.45, evento: true }   // Prime Day
  return { f: 1, evento: false }
}
// Crescimento da operação: ~1,5%/mês em torno de nov/2026 (antes era menor, depois maior), com teto.
function fatorCrescimento(d: number): number {
  const meses = (d - diaDoCalendario(Date.UTC(2026, 10, 1) + BRT_OFFSET_MS)) / 30.44
  return Math.max(0.72, Math.min(1.45, 1 + 0.015 * meses))
}
type DiaDemo = { receita: number; tacos: number; roas: number }
function diaDemo(cfg: DemoConfig, d: number): DiaDemo {
  const media = cfg.faturamentoDiaMedio && cfg.faturamentoDiaMedio > 0 ? cfg.faturamentoDiaMedio : MEDIA_PADRAO
  const { dia, dow } = dataBR(d)
  const mes = dia <= 7 ? 1.06 : dia >= 20 && dia <= 27 ? 0.94 : 1
  const varejo = fatorVarejo(d)
  // Ondas lentas (semanas boas e semanas fracas, ±~12%): é o que faz um mês ser diferente do outro.
  const onda = 1 + 0.08 * Math.sin(2 * Math.PI * d / 47 + 1.3) + 0.05 * Math.sin(2 * Math.PI * d / 19 + 0.4)
  let f = PESO_SEMANA[dow] * mes * varejo.f * fatorCrescimento(d) * onda * (0.72 + 0.56 * ruido(d, 11))
  const oferta = hash01(d, 7) < 0.05, ruptura = !oferta && hash01(d, 9) < 0.035
  if (oferta) f *= 1.22 + 0.25 * hash01(d, 8)
  if (ruptura) f *= 0.74 + 0.1 * hash01(d, 10)
  // dia comum fica entre ~0,57× e ~1,5× da média (R$ 15k–40k com a média padrão); data de varejo pode passar
  const teto = varejo.evento || oferta ? 2.2 : 1.5
  const receita = r2(media * Math.max(0.57, Math.min(teto, f)))
  const tacos = (cfg.tacosPct || 8.5) / 100 * (0.8 + 0.4 * ruido(d, 21)) * (oferta || varejo.evento ? 1.25 : 1)
  const roas = (cfg.roas || 6.2) * (0.84 + 0.32 * ruido(d, 23)) * (oferta ? 1.1 : 1)
  return { receita, tacos, roas }
}
// Curva de vendas por hora (BRT): madrugada fraca, manhã subindo, pico à noite. HOJE = dia cheio × fração já vendida.
const PESO_HORA = [1.2, 0.7, 0.4, 0.3, 0.3, 0.4, 0.8, 1.6, 2.8, 4.0, 4.8, 5.2, 5.4, 5.3, 5.2, 5.3, 5.5, 5.7, 6.0, 6.4, 6.6, 6.3, 5.2, 3.2]
const SOMA_HORA = PESO_HORA.reduce((s, v) => s + v, 0)
function fracaoDoDia(agora: number): number {
  const ms = agora - brtDayStartMs(agora), h = Math.floor(ms / 3600000), resto = (ms % 3600000) / 3600000
  let acc = 0; for (let i = 0; i < h && i < 24; i++) acc += PESO_HORA[i]
  if (h < 24) acc += PESO_HORA[h] * resto
  return Math.min(1, acc / SOMA_HORA)
}
/** Faturamento (e Ads) de UM dia do calendário. Futuro = 0; hoje = parcial pela hora. */
function diaEfetivo(cfg: DemoConfig, dayStartMs: number, agora = Date.now()): DiaDemo {
  const hoje = brtDayStartMs(agora)
  if (dayStartMs > hoje) return { receita: 0, tacos: 0, roas: 0 }
  const x = diaDemo(cfg, diaDoCalendario(dayStartMs))
  return dayStartMs === hoje ? { ...x, receita: r2(x.receita * fracaoDoDia(agora)) } : x
}

function seriesDates(): Date[] {
  const todayStart = brtDayStartMs(Date.now())          // meia-noite BRT de hoje
  return Array.from({ length: 30 }, (_, i) => new Date(todayStart - (29 - i) * 86400000))
}

function dailyValues(cfg: DemoConfig): number[] {
  return seriesDates().map(d => diaEfetivo(cfg, d.getTime()).receita)
}

function avgTicket(cfg: DemoConfig): number {
  // ticket médio ponderado pelos preços dos produtos
  const w = cfg.products.reduce((s, p) => s + p.share, 0) || 1
  return cfg.products.reduce((s, p) => s + p.price * p.share, 0) / w
}

type Periodo = { revenue: number; daily: { date: string; receita: number; pedidos: number }[]; ads: number; adsSales: number; semente: number }
// Período [from,to] = SOMA dos dias dele. Conta os dias pelo tamanho do período (nº de dias) terminando no dia do
// `to` — evita o bug de fronteira em que "7 dias" pegava 8 dias de calendário. Dias futuros valem 0.
function periodo(cfg: DemoConfig, from: string, to: string): Periodo {
  const ticket = avgTicket(cfg) || 1
  const fromMs = new Date(from).getTime(), toMs = new Date(to).getTime()
  const nDays = Math.max(1, Math.min(800, Math.round((toMs - fromMs) / DIA_MS)))
  const fimDia = brtDayStartMs(toMs)   // dia futuro vale 0 (diaEfetivo)
  let revenue = 0, ads = 0, adsSales = 0
  const daily: Periodo['daily'] = []
  for (let k = nDays - 1; k >= 0; k--) {
    const dia = fimDia - k * DIA_MS
    const x = diaEfetivo(cfg, dia)
    revenue += x.receita
    const gasto = x.receita * x.tacos
    ads += gasto; adsSales += gasto * x.roas
    daily.push({ date: mmdd(new Date(dia)), receita: x.receita, pedidos: Math.max(x.receita > 0 ? 1 : 0, Math.round(x.receita / ticket)) })
  }
  return { revenue: r2(revenue), daily, ads: r2(ads), adsSales: r2(adsSales), semente: diaDoCalendario(fimDia) * 31 + nDays }
}
// Compat (ML demo usa): só faturamento + série.
function periodRevenue(cfg: DemoConfig, from: string, to: string): { revenue: number; daily: { date: string; receita: number; pedidos: number }[] } {
  const p = periodo(cfg, from, to)
  return { revenue: p.revenue, daily: p.daily }
}

// Núcleo da DRE demo p/ um faturamento R: produtos, taxas, CMV e o ADS que faz a
// margem final (MPA) VARIAR por período, como uma operação real — sem isto,
// MPA/margem/TACoS/ACoS saíam IDÊNTICOS em todo período (o tell que denuncia a
// conta demo). Os valores do config são a MÉDIA; cada período recebe um tilt
// DETERMINÍSTICO derivado do próprio faturamento R (então DRE e Ads do MESMO
// período pegam o MESMO tilt — o "Valor em Ads" do Resumo e da aba Ads batem).

// Tilt determinístico por período (via R). Faz gasto de ads (TACoS), eficiência
// (ACoS/ROAS), mix de comissão e FBA variarem realisticamente em torno da média.
function dreTilt(R: number) {
  const s = (Math.abs(Math.round(R)) % 9973) / 9973                 // 0..1 estável por período
  const w = (ph: number, amp: number) => 1 + amp * Math.sin(s * 6.28318 * ph + ph)
  return {
    ads:  Math.max(0.55, w(1.0, 0.30)),   // gasto de ads: ±30% → TACoS varia
    roas: Math.max(0.7,  w(2.3, 0.16)),   // eficiência do ads: ±16% → ACoS varia
    comm: w(3.1, 0.05),                   // mix de categoria: ±5% na comissão
    fba:  w(1.7, 0.09),                   // ticket/dimensão: ±9% na tarifa FBA
  }
}

function coreDre(cfg: DemoConfig, R: number, per?: Pick<Periodo, 'ads' | 'adsSales' | 'semente'>) {
  const costs = demoCosts(cfg)
  const t = dreTilt(R)
  // 03/11: o MIX de produtos varia por período (o mais vendido de uma semana não é sempre igual); a estrela fica estável.
  const sem = per?.semente ?? Math.round(R)
  const pesos = cfg.products.map((p, i) => p.share * (cfg.featuredSku === p.sku ? 0.95 + 0.1 * hash01(sem, 60 + i) : 0.8 + 0.4 * hash01(sem, 60 + i)))
  const somaShare = cfg.products.reduce((s, p) => s + p.share, 0) || 1, somaPesos = pesos.reduce((s, v) => s + v, 0) || 1
  const produtos = cfg.products.map((p, i) => {
    const receita = r2(pesos[i] / somaPesos * somaShare * R)
    const units = Math.max(0, Math.round(receita / p.price))
    // ⭐ Comissão e FBA POR PRODUTO (mesmo % e mesmo tilt do agregado, então
    // somam no total). `feeMedido: true` é o que faz o painel COMPLETAR o cálculo
    // por produto — sem isso a tabela mostrava "—" em Lucro/Margem/MPA enquanto o
    // agregado mostrava margem, e os dois discordavam.
    return {
      sku: p.sku, asin: p.asin || demoAsin(p.sku), units, receita, name: p.name, image: p.image || '',
      demoBlur: !!cfg.featuredSku && p.sku !== cfg.featuredSku,
      comissao: r2(receita * cfg.commissionPct / 100 * t.comm),
      fba: r2(receita * cfg.fbaPct / 100 * t.fba),
      taxaPrograma: 0, outrasTaxas: 0, feeMedido: true,
    }
  }).filter(p => p.units > 0).sort((a, b) => b.receita - a.receita)
  // Unidades = soma das unidades; VENDAS (pedidos) é um pouco menor — como numa
  // loja real, uns pedidos levam 2+ itens. Sem isto "Nº de Vendas" == "Unidades"
  // (todo pedido com 1 item), que é mais um tell.
  const unidades = produtos.reduce((s, p) => s + p.units, 0)
  const vendas = Math.max(1, Math.round(unidades / 1.09))
  const comissao = r2(R * cfg.commissionPct / 100 * t.comm)
  const fba = r2(R * cfg.fbaPct / 100 * t.fba)
  const liqMarketplace = r2(R - comissao - fba)
  const cmv = produtos.reduce((s, p) => s + p.units * (costs[p.sku] || 0), 0)
  // ⭐ ADS AGORA VARIA (não é mais calculado pra trás pra travar a margem): é o
  // TACoS-alvo × tilt do período. A margem final vira o RESULTADO e oscila em
  // torno do alvo — como numa loja de verdade. A DRE fecha dentro do período.
  // 03/11: com o período vindo da série diária, o Ads é a SOMA dos dias (TACoS/ROAS de cada dia); sem ele, a régua antiga.
  const ads = per ? per.ads : Math.max(0, r2(R * cfg.tacosPct / 100 * t.ads))
  const roasEff = per ? (per.ads > 0 ? r2(per.adsSales / per.ads) : r2(cfg.roas)) : r2(cfg.roas * t.roas)   // eficiência do ads NESTE período
  return { produtos, vendas, unidades, comissao, fba, liqMarketplace, cmv, ads, roasEff }
}

// DRE fake p/ o período. Mesmo shape do backend real (computeOrdersDRE) — a Gestão
// inteira deriva daqui. Só o modo `daily` devolve a série de 30 dias do gráfico.
export function demoFinance(cfg: DemoConfig, from: string, to: string, daily: boolean): any {
  if (daily) {
    const vals = dailyValues(cfg), dates = seriesDates(), ticket = avgTicket(cfg) || 1
    const series = vals.map((v, i) => ({ date: mmdd(dates[i]), receita: v, principal: v, pedidos: Math.max(1, Math.round(v / ticket)) }))
    return { connected: true, period: { from, to }, daily: series, receita: r2(vals.reduce((s, v) => s + v, 0)) }
  }
  const per = periodo(cfg, from, to)
  const { revenue: R, daily: dailyArr } = per
  const c = coreDre(cfg, R, per)
  // DEVOLUÇÕES realistas: ~1,3–2,3% das unidades dos mais vendidos voltam. Loja de
  // milhares de pedidos com ZERO devolução é tell. Determinístico, pequeno.
  const precoDoSku: Record<string, number> = {}
  for (const cp of cfg.products) precoDoSku[cp.sku] = cp.price
  const reembolsos = c.produtos.slice(0, Math.min(6, c.produtos.length)).map((p: any, i: number) => {
    const un = Math.round(p.units * (0.013 + 0.010 * Math.abs(Math.sin(i * 1.7 + 0.4))))
    return un > 0 ? { sku: p.sku, units: un, valor: r2(un * (precoDoSku[p.sku] || 0)) } : null
  }).filter(Boolean) as any[]
  const devolucoes = r2(reembolsos.reduce((s, r) => s + r.valor, 0))
  const receitaLiquida = r2(R - devolucoes)
  const liqMarketplace = r2(receitaLiquida - c.comissao - c.fba)
  return {
    connected: true,
    period: { from, to },
    // ⭐ `principal` = valor da venda (preço do anúncio). Na demo não há frete de
    // comprador, embrulho nem cupom → principal = receita, frete/promo = 0 — a
    // identidade principal + freteReceita + embrulho − promocoes = receitaBruta
    // fecha por construção (mesma régua do payload real, 01/09).
    linhas: { receitaBruta: R, principal: R, freteReceita: 0, embrulho: 0, promocoes: 0, devolucoes, receitaLiquida, comissao: c.comissao, taxaPrograma: 0, fba: c.fba, armazenagem: 0, assinatura: 0, outrasTaxas: 0, ads: c.ads },
    liqMarketplace,
    vendas: c.vendas, unidades: c.unidades,
    faturamento: R,
    ticket: c.vendas > 0 ? r2(R / c.vendas) : 0,
    produtos: c.produtos.map((p: any) => ({ ...p, principal: p.receita, afn: p.units })),
    reembolsos,
    daily: dailyArr.map((d: any) => ({ ...d, principal: d.receita })),
    demo: true,
  }
}

// Relatório de Ads fake, coerente com o TACOS/ROAS. Aceita from/to explícito (período
// exato do seletor, inclusive "custom"/calendário) — senão cai na janela nomeada. Sem
// isso, "Ontem"/calendário caíam em '30d' e mostravam o gasto de 30 dias (R$160k) num dia.
export function demoAdsReport(cfg: DemoConfig, window: string, from?: string, to?: string): any {
  const range = (from && to) ? { from, to } : windowRange(window)
  const per = periodo(cfg, range.from, range.to)
  const core = coreDre(cfg, per.revenue, per)
  const spend = core.ads              // MESMO gasto da DRE (Resumo e Ads batem)
  const sales = r2(spend * core.roasEff)   // eficiência VARIÁVEL do período → ACoS varia
  const acos = sales > 0 ? r2(spend / sales * 100) : 0
  const roas = spend > 0 ? r2(sales / spend) : 0
  const camps = [
    { campaign: 'SP · Marca — Exato', frac: 0.34 },
    { campaign: 'SP · Genéricos — Amplo', frac: 0.28 },
    { campaign: 'SP · Concorrentes — Frase', frac: 0.22 },
    { campaign: 'SP · Auto — Descoberta', frac: 0.16 },
  ]
  const byCampaign = camps.map(c => ({ campaign: c.campaign, spend: r2(spend * c.frac), sales: r2(sales * c.frac), clicks: Math.round(spend * c.frac / 1.3), impressions: Math.round(spend * c.frac / 1.3 * 22) }))
  // Gasto por PRODUTO — o painel usa isto no lugar do rateio por faturamento.
  // De propósito NÃO é proporcional à receita (é o tilt determinístico abaixo):
  // no real também não é, e é justamente essa diferença que a Gestão revela.
  // 8% fica sem atribuição (Sponsored Brands / linha que a Amazon não atribui).
  const prods = core.produtos
  const pesos = prods.map((p: any, i: number) => (p.receita || 0) * (0.7 + 0.15 * ((i * 7) % 5)))
  const somaPesos = pesos.reduce((s: number, w: number) => s + w, 0) || 1
  const bySku = prods.map((p: any, i: number) => ({
    sku: p.sku, asin: p.asin,
    spend: r2(spend * 0.92 * pesos[i] / somaPesos),
    sales: r2(sales * 0.92 * pesos[i] / somaPesos),
    clicks: Math.round(spend * 0.92 * pesos[i] / somaPesos / 1.3),
    impressions: Math.round(spend * 0.92 * pesos[i] / somaPesos / 1.3 * 22),
  })).sort((a: any, b: any) => b.spend - a.spend)
  const adsNaoAtribuido = r2(Math.max(0, spend - bySku.reduce((s: number, x: any) => s + x.spend, 0)))
  return { connected: true, ready: true, cached: true, stale: false, window, updatedAt: new Date().toISOString(), period: { from: range.from, to: range.to }, spend, sales, purchases: Math.round(sales / (avgTicket(cfg) || 1)), clicks: Math.round(spend / 1.3), impressions: Math.round(spend / 1.3 * 22), acos, roas, byCampaign, bySku, adsPorSku: true, adsNaoAtribuido, demo: true }
}

// Estoque FBA fake por produto — REALISTA pela velocidade de venda. Uma loja que
// fatura ~R$1,88M/mês não tem 40 unidades: tem SEMANAS de cobertura por SKU. O
// estoque disponível deriva das unidades vendidas no mês (share × rev30d ÷ preço)
// × uma cobertura determinística de ~3 a 7 semanas, + a caminho e reservado
// proporcionais. Assim o Estoque FBA e a Curva ABC batem com o faturamento.
export function demoInventory(cfg: DemoConfig): any {
  const R = dailyValues(cfg).reduce((s, v) => s + v, 0)   // 03/11: últimos 30 dias reais da série
  const itens = cfg.products.map((p, i) => {
    const unidadesMes = Math.max(1, Math.round((p.share * R) / (p.price || 1)))
    // cobertura determinística por SKU: 0,8 a 1,7 mês de estoque (~3-7 semanas)
    const cobertura = 0.8 + 0.9 * Math.abs(Math.sin(i * 1.7 + 0.6))
    const fulfillable = Math.max(20, Math.round(unidadesMes * cobertura))
    const inbound = Math.round(unidadesMes * (0.2 + 0.3 * Math.abs(Math.sin(i * 2.3 + 1.1))))  // reposição a caminho
    const reserved = Math.round(unidadesMes * 0.04)   // ~1 dia reservado (em separação)
    // velocidadeDia: o /inventory real devolve (getSkuTrend 14d) e o NEO usa pra cobertura. Sem ela a
    // demo parecia "11 SKUs sem venda" (26/09).
    return { sku: p.sku, asin: p.asin || demoAsin(p.sku), name: p.name, image: p.image || '', fulfillable, inbound, reserved, unfulfillable: 0, demoBlur: !!cfg.featuredSku && p.sku !== cfg.featuredSku, velocidadeDia: Math.round(unidadesMes / 30 * 1000) / 1000 }
  })
  // ⚠️ A chave é `inventario`, não `itens`: é o nome que o backend real devolve
  // e o único que o painel lê (`GestaoHub` linha ~1091 exige
  // Array.isArray(d.inventario), senão marca 'indisponível'). Com `itens` a
  // conta DEMO mostrava Estoque FBA vazio e Curva Z morta — bem na conta usada
  // pra apresentar. Corrigido 21/07.
  return { connected: true, inventario: itens, demo: true }
}

// ID de pedido no formato da Amazon (701-NNNNNNN-NNNNNNN), determinístico.
function demoOrderId(seed: number): string {
  const n7 = (x: number) => String(1000000 + (Math.abs(Math.round(x)) % 8999999))
  return `701-${n7(seed * 7919)}-${n7(seed * 104729 + 13)}`
}

// PEDIDOS fictícios (aba Vendas → Pedidos, e o modal da lupa por SKU). Mesma
// forma do backend real (`/orders`): lista de pedidos com itens, preço de tabela
// e desconto. Coerente com o faturamento do período; determinístico. Um teto de
// exibição (não faz sentido listar milhares) — os recentes, como no real.
export function demoOrders(cfg: DemoConfig, from: string, to: string, sku?: string): any {
  const per = periodo(cfg, from, to)
  const core = coreDre(cfg, per.revenue, per)
  const prods = sku ? core.produtos.filter((p: any) => p.sku === sku) : core.produtos
  if (!prods.length) return { available: true, period: { from, to }, pedidos: [] }

  const precoDoSku: Record<string, number> = {}
  for (const cp of cfg.products) precoDoSku[cp.sku] = cp.price
  const CAP = sku ? 40 : 60
  const totalUnits = prods.reduce((s: number, p: any) => s + p.units, 0) || 1
  const agora = Date.now()
  const t0 = brtDayStartMs(agora)
  const janela = Math.min(20, Math.max(1, Math.round((brtDayStartMs(new Date(to).getTime()) - brtDayStartMs(new Date(from).getTime())) / 86400000) + 1))
  const pedidos: any[] = []
  let idx = 0
  for (const p of prods) {
    const nOrders = sku ? Math.min(CAP, Math.max(1, p.units)) : Math.max(1, Math.round(CAP * p.units / totalUnits))
    for (let k = 0; k < nOrders; k++) {
      idx++
      // Horário REAL de venda: horário comercial variado (9h–21h) com minutos, e
      // NUNCA no futuro (pedido de hoje que cairia depois de agora vira "há alguns
      // minutos"). Sem isto vários pedidos caíam na meia-noite exata e, ordenados
      // por data, iam pro topo — a tela mostrava "00:00:00" em tudo.
      const diaOffset = idx % janela
      const hora = 9 + ((idx * 7) % 13)          // 9h a 21h
      const minuto = (idx * 17) % 60
      let ts = t0 - diaOffset * 86400000 + hora * 3600000 + minuto * 60000
      if (ts > agora) ts = agora - (((idx * 11) % 240) + 3) * 60000   // 3..243 min atrás
      const dia = new Date(ts)
      const qty = (idx % 9 === 0) ? 2 : 1
      const preco = precoDoSku[p.sku] || 0; const bruto = r2(preco * qty)
      // ~1 em cada 4 com cupom/oferta pequeno (dá vida à decomposição na tela)
      const desc = (idx % 4 === 0) ? r2(bruto * (0.05 + 0.05 * Math.abs(Math.sin(idx)))) : 0
      const receita = r2(bruto - desc)
      pedidos.push({
        orderId: demoOrderId(idx * 31 + p.sku.length),
        date: dia.toISOString(),
        status: (idx % 13 === 0) ? 'Pending' : 'Shipped',
        channel: 'AFN',
        // precoItem = preço do anúncio (na demo não há frete, então = bruto). É o que
        // faz a nova lupinha mostrar "valor da venda − cupom = recebido".
        itens: [{ sku: p.sku, asin: p.asin, qty, receita, precoItem: bruto, precoTabela: bruto }],
        precoTabela: bruto,
        desconto: { produto: desc, frete: 0, total: desc, pctProduto: desc > 0 ? Math.round(desc / bruto * 1000) / 10 : null },
      })
    }
  }
  pedidos.sort((a, b) => (a.date < b.date ? 1 : -1))
  return { available: true, period: { from, to }, pedidos: pedidos.slice(0, CAP) }
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

// ─────────────────────────────────────────────────────────────────────────────
// REPASSES da conta demo — os pagamentos que a Amazon "depositou", COERENTES com o
// faturamento demo (mesma lógica de uma conta real com esse volume). A Amazon BR
// liquida a cada ~14 dias; cada repasse = faturamento do ciclo − comissão − FBA −
// devoluções (o Ads na BR é cobrado à parte, não sai do repasse). Determinístico
// (varia por ciclo, mas reproduzível) e ancorado a `Date.now()` — igual ao resto
// do demo. Sem isso, a aba Repasses caía em "conta Amazon não conectada".
export function demoRepasses(config: any, meses = 3): any {
  const cfg = mergeDemoConfig(config)
  const DAY = 86400000
  const now = Date.now()
  const CICLO = 14
  const nCiclos = Math.max(2, Math.round((meses * 30) / CICLO))   // ~2 por mês
  const rev15 = (cfg.rev30d || 0) / 2                             // faturamento por ciclo
  const comPct = (cfg.commissionPct || 15) / 100
  const fbaPct = (cfg.fbaPct || 8) / 100
  const devPct = 0.014                                            // ~1,4% devoluções (coerente com o demo)

  const repasses: any[] = []
  for (let i = 0; i < nCiclos; i++) {
    const fimMs = now - (i * CICLO + 6) * DAY                     // fechou ~6 dias após o fim do ciclo
    const iniMs = fimMs - CICLO * DAY
    // 03/11: o repasse é o faturamento REAL do ciclo na série diária (não mais metade de um total fixo)
    const receita = periodo(cfg, new Date(iniMs).toISOString(), new Date(fimMs).toISOString()).revenue || r2(rev15)
    const valor = r2(receita - receita * comPct - receita * fbaPct - receita * devPct)
    const iniISO = new Date(iniMs).toISOString().slice(0, 10)
    const fimISO = new Date(fimMs).toISOString().slice(0, 10)
    repasses.push({
      id: `DEMO-REP-${i}`,
      inicio: iniISO, fim: fimISO,
      status: 'Closed', transferencia: 'Completed',
      valorTransferido: valor, moeda: 'BRL', saldoInicial: 0,
      dataTransferencia: new Date(fimMs + 5 * DAY).toISOString().slice(0, 10),
      contaFinal: '4021',
      numeroLiquidacao: String(90000000 + i * 137),
      ehPagamento: true, foiTransferido: true,
      ciclo: `${iniISO}|${fimISO}`,
    })
  }
  const N = repasses.length
  return {
    repasses, conferido: true, conferencias: [],
    naoConferidos: 0, limiteConferencia: 8,
    repassesConferidos: N, repassesTotal: N, demo: true,
  }
}
