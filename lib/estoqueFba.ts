/* Valor do estoque FBA — fonte ÚNICA das contas da aba Estoque FBA.
 *
 * 🚨 POR QUE ISTO EXISTE (03/08/2026)
 *
 * A "Venda projetada do estoque" era o preço MÉDIO DO PERÍODO da DRE
 * (receita ÷ unidades vendidas) multiplicado pelas unidades em estoque. Dois
 * defeitos num número só:
 *
 *   1. Dependia do FILTRO. No padrão "Hoje", só quem vendeu hoje tinha preço —
 *      o resto do estoque saía da conta em silêncio, com um rodapé dizendo
 *      "7 SKUs sem preço no período não somados" como se fosse detalhe. Na conta
 *      do João eram R$ 8.341 de um estoque de R$ 30.141.
 *   2. Não era o preço do produto. Era a média de quanto ele SAIU — com cupom,
 *      com frete grátis, com o preço de antes da última reprecificação.
 *
 * A pergunta que a tela faz é "quanto vale o que está no armazém se vender pelo
 * preço de hoje?". Quem responde isso é o preço do ANÚNCIO, que o backend lê da
 * Listings API e não depende de recorte nenhum — igual à cobertura, que saiu do
 * período pelo mesmo motivo.
 *
 * ⚠️ `preco: null` é "não deu pra perguntar à Amazon"; `0`/ausente é "não há
 * oferta ativa". Nos dois casos o SKU fica FORA da soma e é contado em
 * `semPreco` — o valor previsto de um anúncio pausado não é R$ 0,00, é
 * desconhecido, e somar zero mentiria pra baixo com cara de número medido.
 */

export type ItemEstoque = {
  sku: string
  fulfillable?: number
  /** Preço do anúncio (Listings API). `null` = a Amazon não respondeu. */
  preco?: number | null
  /** Comissão POR UNIDADE, medida pela Product Fees API com o token do seller. */
  comissao?: number
  /** Tarifa FBA POR UNIDADE, mesma fonte. */
  tarifaFba?: number
}

/** Preço do anúncio, ou `null` quando não há um preço utilizável. */
export function precoDoAnuncio(it: ItemEstoque): number | null {
  return typeof it.preco === 'number' && it.preco > 0 ? it.preco : null
}

/** Preço do anúncio × disponíveis. `null` sem preço — nunca R$ 0,00. */
export function valorDeVenda(it: ItemEstoque): number | null {
  const p = precoDoAnuncio(it)
  return p == null ? null : (it.fulfillable || 0) * p
}

/** CMV informado × disponíveis. `null` sem custo cadastrado. */
export function valorDeMercadoria(it: ItemEstoque, custoUnit: number): number | null {
  return custoUnit > 0 ? (it.fulfillable || 0) * custoUnit : null
}

export type TotaisEstoque = {
  unidades: number
  /** Σ CMV × disponíveis. `null` quando nenhum custo foi cadastrado. */
  custoTotal: number | null
  /** Σ preço do anúncio × disponíveis. `null` quando NENHUM item com estoque tem preço. */
  valorVenda: number | null
  /** Σ (preço − comissão − tarifa FBA) × disponíveis. `null` se a medição não cobriu tudo. */
  liquido: number | null
  /** SKUs COM estoque que ficaram fora do valor de venda por não ter preço. */
  semPreco: number
  /** SKUs COM estoque que ficaram fora do custo por não ter CMV cadastrado. */
  semCusto: number
}

export function totaisDoEstoque(
  itens: ItemEstoque[],
  custos: Record<string, number>,
  taxasCompletas: boolean,
): TotaisEstoque {
  let unidades = 0, valorVenda = 0, custoTotal = 0, liquido = 0
  let semPreco = 0, semCusto = 0, temCusto = false, temPreco = false

  for (const it of itens) {
    const qtd = it.fulfillable || 0
    unidades += qtd
    const preco = precoDoAnuncio(it)
    const custo = custos[it.sku] || 0

    if (preco != null) {
      if (qtd > 0) temPreco = true
      valorVenda += qtd * preco
      // ⚠️ SEM piso em zero: produto cuja comissão + tarifa passa do preço tem
      // líquido NEGATIVO, e é exatamente o que o seller precisa enxergar.
      // Clampar em 0 esconderia o prejuízo a favor da tela.
      liquido += qtd * (preco - (it.comissao || 0) - (it.tarifaFba || 0))
    } else if (qtd > 0) semPreco++

    if (custo > 0) { custoTotal += qtd * custo; temCusto = true }
    else if (qtd > 0) semCusto++
  }

  return {
    unidades,
    custoTotal: temCusto ? custoTotal : null,
    /* 🚨 FALHA FECHADA. Estoque cheio e NENHUM preço só acontece quando a fonte
     * do preço não chegou — backend antigo servindo o painel novo na janela do
     * deploy, ou a Listings API fora do ar. Aí o valor previsto é DESCONHECIDO,
     * e mostrá-lo como R$ 0,00 seria pior que o defeito que isto veio corrigir:
     * o seller leria "meu estoque não vale nada". */
    valorVenda: unidades > 0 && !temPreco ? null : valorVenda,
    // ⚠️ Líquido é tudo ou nada. Somar o líquido de uns e o bruto de outros dá
    // um número que PARECE comparável com o Gestor Seller e não é — a mesma
    // armadilha do card "total sem frete" de 02/08.
    liquido: taxasCompletas ? liquido : null,
    semPreco,
    semCusto,
  }
}
