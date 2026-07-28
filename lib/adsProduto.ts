/* ─────────────────────────────────────────────────────────────────────────────
   ADS POR PRODUTO — lógica pura (sem React), pra poder ser testada sozinha.

   Na Amazon o gasto de anúncio é POR PRODUTO, e o espelho diário agora traz o
   relatório de produto anunciado (`bySku`). Antes o painel pegava o TOTAL da
   conta e espalhava por faturamento: o produto que vendia absorvia o gasto do
   que só queimava — e o que queimava, sem receita, saía de graça (share 0).
   Caso real do João em 27-28/07: Tapete gastou R$9,52 nas campanhas dele e
   aparecia com R$49,19, margem 10,2% no lugar de 36,7%, porque carregava os
   R$83,68 das campanhas de Avespa que não venderam nada.

   Regra: gasto REAL do SKU quando o espelho tem; rateio só como último recurso
   e SEMPRE marcado como estimativa na tela.
   ───────────────────────────────────────────────────────────────────────────── */

export interface AdsSkuRow { sku: string; asin?: string; spend: number; sales?: number; clicks?: number; impressions?: number }
export interface AdsReport { ready?: boolean; spend?: number; bySku?: AdsSkuRow[]; adsPorSku?: boolean }

const chave = (x: unknown): string => String(x ?? '').trim().toUpperCase()

/** O relatório traz gasto por produto? (só então dá pra afirmar de quem é o gasto) */
export function temAdsPorSku(adsReal: AdsReport | null | undefined): boolean {
  return !!(adsReal?.ready && adsReal?.adsPorSku && Array.isArray(adsReal?.bySku))
}

/**
 * Gasto de ads de UM produto — ou `null` quando não dá pra saber.
 *
 * ⚠️ NÃO EXISTE RATEIO AQUI, DE PROPÓSITO. Espalhar o gasto da conta por
 * participação na receita faz a margem de um produto depender de quanto os
 * OUTROS gastaram: o que vende absorve o desperdício do que só queima, e o que
 * queima sai de graça (sem receita, share 0). É afirmação falsa sobre o produto,
 * e a tela não tem como avisar que é chute. Sem dado por SKU, a resposta certa
 * é "não sei" — quem chama exibe "—" e rotula o lucro como ANTES do ads.
 *
 * `0` é resposta legítima e diferente de `null`: produto sem campanha gastou zero.
 */
export function adsDoProduto(adsReal: AdsReport | null | undefined, sku: string, asin?: string): { valor: number | null } {
  if (!temAdsPorSku(adsReal)) return { valor: null }
  const linhas = adsReal!.bySku!
  const hit = linhas.find(l => chave(l.sku) === chave(sku))
    || (asin ? linhas.find(l => chave(l.asin) === chave(asin)) : undefined)
  return { valor: hit ? Number(hit.spend) || 0 : 0 }
}

/**
 * Ads gasto em produto que NÃO vendeu no período — a sangria que o rateio
 * escondia (ele empurrava esse custo pra cima de quem vendeu, e o produto que
 * queimava aparecia com custo de ads ZERO). Só existe com dado real por SKU.
 */
export function adsSemVenda(
  adsReal: AdsReport | null | undefined,
  produtos: { sku: string; asin?: string; receita?: number }[],
): { total: number; itens: { sku: string; spend: number }[] } {
  if (!temAdsPorSku(adsReal)) return { total: 0, itens: [] }
  const vendeu = new Set<string>()
  for (const p of (produtos || [])) {
    if ((p?.receita || 0) > 0) { vendeu.add(chave(p.sku)); if (p.asin) vendeu.add(chave(p.asin)) }
  }
  const itens = adsReal!.bySku!
    .filter(l => !vendeu.has(chave(l.sku)) && !vendeu.has(chave(l.asin)) && (Number(l.spend) || 0) > 0)
    .map(l => ({ sku: l.sku || l.asin || '—', spend: Number(l.spend) || 0 }))
    .sort((a, b) => b.spend - a.spend)
  return { total: Math.round(itens.reduce((a, x) => a + x.spend, 0) * 100) / 100, itens }
}
