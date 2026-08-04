/* ─────────────────────────────────────────────────────────────────────────────
   MÉTRICAS DE ADS — a tabela por campanha e a tabela por produto, lógica pura.

   O painel mostrava por CAMPANHA (gasto, vendas, ACoS, ROAS) e o Gestor Seller
   mostra por PRODUTO (com foto, unidades, TACOS, conversão). O João quis as
   duas: o nome que ELE deu à campanha continua sendo a chave de leitura, e as
   métricas do Gestor entram do lado.

   ⚠️ TACOS ≠ ACOS. ACoS é gasto ÷ venda QUE O ANÚNCIO trouxe — mede o anúncio.
   TACOS é gasto ÷ faturamento INTEIRO — mede quanto da operação o anúncio come.
   Um produto pode ter ACoS 15% (anúncio saudável) e TACOS 2% (quase tudo vende
   orgânico), ou ACoS 15% e TACOS 14% (vive de anúncio). São perguntas
   diferentes, e é por isso que as duas aparecem.
   ───────────────────────────────────────────────────────────────────────────── */

export interface AdsProduto { sku: string; asin: string; spend: number }
export interface AdsCampanha {
  campaign: string; spend: number; sales: number; clicks: number; impressions: number
  purchases?: number | null; unidades?: number | null
  produtos?: AdsProduto[]
}
export interface AdsSku {
  sku: string; asin: string; spend: number; sales: number; clicks: number; impressions: number
  purchases?: number | null; unidades?: number | null
  campanhas?: string[]
}
/** Produto como a DRE o conhece — traz o faturamento TOTAL (Ads + orgânico). */
export interface ProdutoDre { sku: string; asin?: string; name?: string; image?: string; units?: number; receita?: number }

const chave = (x: unknown): string => String(x ?? '').trim().toUpperCase()

/**
 * TACOS — gasto de anúncio sobre o faturamento TOTAL, em %.
 * `null` sem faturamento: dividir por zero devolveria Infinity, e "gastei R$50
 * e não faturei nada" não é uma porcentagem, é uma frase.
 */
export function tacos(gasto: number, faturamentoTotal: number): number | null {
  if (!(faturamentoTotal > 0)) return null
  return (gasto / faturamentoTotal) * 100
}

/**
 * 🚨 TACOS DIVIDE DUAS FONTES — e elas podem estar em períodos diferentes.
 *
 * O relatório de Ads responde pelo `from`/`to` exato quando o espelho diário
 * cobre o intervalo; quando não cobre, ele cai numa JANELA FIXA (7d, 30d, mês) e
 * devolve o período dela. A DRE, essa sempre responde pelo intervalo escolhido.
 * Dividir o gasto de 30 dias pelo faturamento de um dia daria um TACOS de
 * centenas de por cento — um número catastrófico, com cara de medido, saído
 * só do desencontro das datas. ACoS e ROAS não sofrem disso porque gasto e
 * venda saem do MESMO relatório.
 *
 * Sem os dois períodos, ou com eles diferentes, a resposta é "não sei".
 */
export function periodosCasam(
  a: { from?: string; to?: string } | null | undefined,
  b: { from?: string; to?: string } | null | undefined,
): boolean {
  if (!a?.from || !a?.to || !b?.from || !b?.to) return false
  return a.from === b.from && a.to === b.to
}

/** ACoS — gasto sobre a venda que o ANÚNCIO trouxe. `null` sem venda por ads. */
export function acos(gasto: number, vendaAds: number): number | null {
  if (!(vendaAds > 0)) return null
  return (gasto / vendaAds) * 100
}

/** ROAS — retorno por real investido. `null` sem gasto. */
export function roas(gasto: number, vendaAds: number): number | null {
  if (!(gasto > 0)) return null
  return vendaAds / gasto
}

/** Conversão do anúncio — pedidos por clique, em %. `null` sem clique. */
export function conversao(pedidos: number | null | undefined, cliques: number): number | null {
  if (pedidos == null || !(cliques > 0)) return null
  return (pedidos / cliques) * 100
}

/**
 * Unidades que NÃO vieram do anúncio.
 *
 * ⚠️ `null` quando a subtração dá negativo, e isso acontece de verdade: a Amazon
 * atribui a venda ao clique de até 30 dias antes, então num recorte curto o
 * "vendido por Ads" pode passar do total vendido NO PERÍODO. Zerar com
 * `Math.max(0, …)` esconderia que a conta não fecha; devolver negativo diria que
 * existe unidade orgânica negativa. Nenhum dos dois é verdade — a resposta é
 * "não dá pra separar neste recorte".
 */
export function unidadesOrganicas(unidadesTotais: number | null | undefined, unidadesAds: number | null | undefined): number | null {
  if (unidadesTotais == null || unidadesAds == null) return null
  const dif = unidadesTotais - unidadesAds
  return dif < 0 ? null : dif
}

export interface LinhaProduto {
  sku: string; asin: string; name: string; image: string
  custoAds: number; fatAds: number
  unAds: number | null; unOrganicas: number | null
  fatTotal: number | null
  acos: number | null; tacos: number | null; conversao: number | null; roas: number | null
  campanhas: string[]
}

/**
 * Uma linha por produto anunciado, no formato da tabela do Gestor Seller.
 *
 * ⚠️ `cruzarComDre` é o mesmo cuidado do TACOS da conta: faturamento total,
 * unidades orgânicas e TACOS misturam o relatório de Ads com a DRE. Quando os
 * dois não falam do mesmo intervalo, essas três colunas somem — as que saem
 * inteiras do Ads (custo, venda por Ads, ACoS, ROAS, conversão) continuam.
 */
export function linhasPorProduto(bySku: AdsSku[], produtosDre: ProdutoDre[], cruzarComDre = true): LinhaProduto[] {
  const porSku = new Map<string, ProdutoDre>()
  for (const p of (produtosDre || [])) {
    if (p.sku) porSku.set(chave(p.sku), p)
    if (p.asin) porSku.set(chave(p.asin), p)
  }
  return (bySku || []).map(s => {
    // Casa por SKU ou ASIN: o relatório de Sponsored Display às vezes só traz o
    // ASIN, e sem o casamento cruzado o mesmo produto viraria duas linhas.
    const dre = porSku.get(chave(s.sku)) || porSku.get(chave(s.asin))
    // Foto e nome vêm do catálogo mesmo sem cruzar números: identificar o
    // produto não depende de período nenhum.
    const fatTotal = cruzarComDre ? (dre?.receita || 0) : null
    const unAds = s.unidades ?? null
    return {
      sku: s.sku || s.asin, asin: s.asin || '',
      name: dre?.name || s.sku || s.asin, image: dre?.image || '',
      custoAds: s.spend, fatAds: s.sales,
      unAds,
      unOrganicas: cruzarComDre ? unidadesOrganicas(dre?.units ?? null, unAds) : null,
      fatTotal,
      acos: acos(s.spend, s.sales),
      tacos: fatTotal == null ? null : tacos(s.spend, fatTotal),
      conversao: conversao(s.purchases, s.clicks),
      roas: roas(s.spend, s.sales),
      campanhas: s.campanhas || [],
    }
  }).sort((a, b) => b.custoAds - a.custoAds)
}

export interface LinhaCampanha {
  campaign: string
  spend: number; sales: number
  pedidos: number | null
  acos: number | null; roas: number | null; conversao: number | null
  /** Produtos que a campanha anuncia, com foto — MEDIDO pelo relatório. */
  produtos: { sku: string; name: string; image: string }[]
}

/**
 * Uma linha por campanha, com os produtos que ela anuncia.
 *
 * 🚨 Os produtos vêm do RELATÓRIO, nunca do nome da campanha. É tentador ler
 * "Furadeira palavra chave" e concluir que anuncia a furadeira — acerta quase
 * sempre nesta conta e erra em qualquer cliente que chame a campanha de
 * "teste 3", que a renomeie, ou que rode campanha automática com o catálogo
 * inteiro dentro. Nome é escrito por gente; vínculo é medido.
 */
export function linhasPorCampanha(byCampaign: AdsCampanha[], produtosDre: ProdutoDre[]): LinhaCampanha[] {
  const porSku = new Map<string, ProdutoDre>()
  for (const p of (produtosDre || [])) {
    if (p.sku) porSku.set(chave(p.sku), p)
    if (p.asin) porSku.set(chave(p.asin), p)
  }
  return (byCampaign || []).map(c => ({
    campaign: c.campaign,
    spend: c.spend, sales: c.sales,
    pedidos: c.purchases ?? null,
    acos: acos(c.spend, c.sales),
    roas: roas(c.spend, c.sales),
    conversao: conversao(c.purchases, c.clicks),
    produtos: (c.produtos || []).map(p => {
      const dre = porSku.get(chave(p.sku)) || porSku.get(chave(p.asin))
      return { sku: p.sku || p.asin, name: dre?.name || p.sku || p.asin, image: dre?.image || '' }
    }),
  }))
}
