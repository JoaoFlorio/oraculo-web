/* ─────────────────────────────────────────────────────────────────────────────
   MARGEM POR PRODUTO — fonte única da verdade.

   Esta conta estava COPIADA em quatro lugares do GestaoHub (modal da lupa,
   Top 15, Curva ABC, Analítico), cada cópia com uma variação. É por isso que as
   telas discordavam entre si. Aqui é uma implementação só, sem React, testável.

   Três decisões que valem mais que o código:

   1. NÃO SE RATEIA O QUE SE PODE MEDIR. Comissão e tarifa FBA vêm POR PRODUTO
      do backend. Antes a tela pegava o total da conta e rachava por faturamento
      — e tarifa FBA é R$ fixos por unidade (peso e dimensão da caixa), sem
      nenhuma relação com preço: uma máquina de donuts e um par de meias de
      R$79,90 recebiam a MESMA tarifa.

   2. CUSTO FIXO NÃO É CUSTO DE PRODUTO. Assinatura (~R$19/mês) e armazenagem
      são do PERÍODO. Rateá-las por faturamento fazia a margem do produto mudar
      conforme o dia que o usuário escolhia no filtro — se a mensalidade caiu
      naquele dia, o produto absorvia a mensalidade inteira. Ficam fora, e a tela
      as mostra como custo fixo do período.

   3. "NÃO MEDIDO" ≠ ZERO. Quando a Fees API não responde, o backend manda
      `feeMedido:false`. Aqui isso vira `null` e a tela mostra "—". Zero medido é
      resposta legítima: FBM não paga tarifa FBA e a campanha vigente isenta a
      tarifa acima de certo preço.
   ───────────────────────────────────────────────────────────────────────────── */

export interface LinhasDre {
  receitaBruta?: number; devolucoes?: number; comissao?: number; fba?: number
  taxaPrograma?: number; armazenagem?: number; assinatura?: number; outrasTaxas?: number
  /** Parte de `outrasTaxas` que é taxa de SERVIÇO da conta (sem pedido/SKU). */
  outrasConta?: number
}
export interface ProdutoDre {
  sku: string; asin?: string; units: number; receita: number
  comissao?: number | null; fba?: number | null
  taxaPrograma?: number | null; outrasTaxas?: number | null
  feeMedido?: boolean
}
export interface Reembolso { sku: string; units: number; valor: number }

export interface MargemProduto {
  receitaBruta: number
  devolucaoValor: number; devolucaoUnits: number
  receitaLiquida: number
  comissao: number | null; fba: number | null
  taxaPrograma: number; outrasTaxas: number
  /** As duas linhas acima foram MEDIDAS por produto (true) ou rateadas (false). */
  taxasMedidas: boolean
  feeMedido: boolean
  liqMarketplace: number | null
  ads: number | null
  imposto: number
  unitsLiquidas: number; cmv: number; temCusto: boolean
  /** Lucro sem o ads (existe assim que as taxas foram medidas). */
  lucroAntesAds: number | null
  /** Lucro final. `null` enquanto faltar taxa medida OU gasto de ads do produto. */
  lucro: number | null
  margem: number | null
  /** true = nada nesta linha é estimativa de rateio nem dado faltando. */
  completo: boolean
}

export interface EntradaMargem {
  linhas: LinhasDre
  produto: ProdutoDre
  reembolsos?: Reembolso[]
  /** Custo unitário informado pelo seller (CMV + custos extras). */
  custoUnit?: number
  /** Alíquota de imposto em % sobre a receita. */
  imposto?: number
  /** Gasto de ads MEDIDO do produto, ou null. Nunca rateio — ver lib/adsProduto. */
  ads?: number | null
}

const chave = (x: unknown): string => String(x ?? '').trim().toUpperCase()

/** Custos do PERÍODO que não pertencem a produto nenhum. A tela mostra separado.
 *  Inclui a taxa de SERVIÇO da conta (`outrasConta`): ela vem do
 *  ServiceFeeEventList, sem pedido nem SKU atrelado — não há a quem atribuir. */
export function custosFixosDoPeriodo(linhas: LinhasDre): number {
  return (linhas?.armazenagem || 0) + (linhas?.assinatura || 0) + (linhas?.outrasConta || 0)
}

export function margemDoProduto(e: EntradaMargem): MargemProduto {
  const L = e.linhas || {}
  const p = e.produto
  const receitaBruta = p?.receita || 0
  const units = p?.units || 0

  // Devolução REAL por SKU (vem do repasse, não é estimativa). Sem isto o SKU que
  // mais destrói caixa lidera o Top 15 com o lucro do faturamento bruto.
  const dev = (e.reembolsos || []).find(r => chave(r.sku) === chave(p?.sku))
  const devolucaoValor = Math.abs(dev?.valor || 0)
  const devolucaoUnits = Math.abs(dev?.units || 0)
  const receitaLiquida = receitaBruta - devolucaoValor

  // "Taxa Amazon pra Todos" e demais taxas do repasse vêm POR ITEM (o ItemFeeList
  // traz o SellerSKU), então também são MEDIDAS por produto — nada de rateio.
  // O rateio só sobra pro payload antigo, que não trazia esses campos.
  const fatTot = L.receitaBruta || 0
  const share = fatTot > 0 ? receitaBruta / fatTot : 0
  const medePrograma = p?.taxaPrograma !== undefined && p?.taxaPrograma !== null
  const medeOutras = p?.outrasTaxas !== undefined && p?.outrasTaxas !== null
  const taxaPrograma = medePrograma ? (p.taxaPrograma as number) : (L.taxaPrograma || 0) * share
  // A taxa de SERVIÇO da conta (outrasConta) sai daqui: vira custo fixo do período.
  const outrasTaxas = medeOutras
    ? (p.outrasTaxas as number)
    : Math.max(0, (L.outrasTaxas || 0) - (L.outrasConta || 0)) * share

  const feeMedido = !!p?.feeMedido
  const comissao = feeMedido ? (p.comissao ?? 0) : null
  const fba = feeMedido ? (p.fba ?? 0) : null

  const liqMarketplace = feeMedido
    ? receitaLiquida - (comissao as number) - (fba as number) - taxaPrograma - outrasTaxas
    : null

  // Imposto sobre a receita LÍQUIDA: não se paga imposto sobre venda estornada.
  const imposto = receitaLiquida * ((e.imposto || 0) / 100)

  // ⚠️ CMV das unidades LÍQUIDAS. Descontar a receita da devolução e manter o
  // custo cheio transformaria o produto devolvido num prejuízo FALSO — troca de
  // um erro por outro. Assume que a unidade devolvida volta pro estoque
  // vendável, que é o caso comum no FBA. Perda total é política do seller e
  // precisa de interruptor próprio (não dá pra deduzir deste payload).
  const custoUnit = e.custoUnit || 0
  const unitsLiquidas = Math.max(0, units - devolucaoUnits)
  const cmv = custoUnit * unitsLiquidas
  const temCusto = custoUnit > 0

  const ads = e.ads ?? null
  const lucroAntesAds = liqMarketplace === null ? null : liqMarketplace - imposto - cmv
  const lucro = (lucroAntesAds === null || ads === null) ? null : lucroAntesAds - ads
  const base = lucro ?? lucroAntesAds
  const margem = (base !== null && receitaLiquida > 0) ? base / receitaLiquida * 100 : null

  return {
    receitaBruta, devolucaoValor, devolucaoUnits, receitaLiquida,
    comissao, fba, taxaPrograma, outrasTaxas, taxasMedidas: medePrograma && medeOutras, feeMedido,
    liqMarketplace, ads, imposto, unitsLiquidas, cmv, temCusto,
    lucroAntesAds, lucro, margem,
    completo: feeMedido && ads !== null,
  }
}
