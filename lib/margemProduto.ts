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

   2. CUSTO FIXO NÃO É CUSTO DE PRODUTO. Assinatura (~R$19/mês) é do PERÍODO.
      Rateá-la por faturamento fazia a margem do produto mudar conforme o dia que
      o usuário escolhia no filtro — se a mensalidade caiu naquele dia, o produto
      absorvia a mensalidade inteira. Fica fora, e a tela a mostra como custo fixo.

      ⭐ A ARMAZENAGEM SAIU DESSA REGRA: ela é MEDIDA por produto pelo relatório
      mensal da Amazon (ver backend `lib/storageFees.ts`). Deixou de ser custo
      fixo porque deixou de ser não-medível — e a diferença importa: armazenagem
      é custo de ESTOQUE, não de venda, então o produto que dorme no armazém é
      quem mais paga. Como custo fixo, ele saía de graça e a conta caía em cima
      de quem gira rápido. O que NÃO for medido continua fora do produto.

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
  /**
   * Quanto da `armazenagem` já foi atribuído a produtos (medido por SKU).
   * ⚠️ É o que impede a DUPLA CONTAGEM: sem isto, o valor entraria no card do
   * produto E no custo fixo do período, e o lucro sairia menor que o real.
   */
  armazenagemAtribuida?: number
  /** Desconto concedido pelo seller no período (cupom/promoção/frete grátis). */
  promocoes?: number
  /** Receita de embrulho para presente, que o comprador paga. */
  embrulho?: number
}
export interface ProdutoDre {
  sku: string; asin?: string; units: number; receita: number
  /**
   * ⭐ VALOR DA VENDA = Σ preço do ANÚNCIO (sem frete/embrulho, ANTES do cupom).
   * É o número que o seller reconhece ("vendo a R$11,99") — a `receita` acima é o
   * RECEBIDO da venda (price + frete + embrulho − promo), que num FBA não-Prime
   * chega a somar frete que nem é do seller. Ausente = payload antigo.
   */
  principal?: number
  comissao?: number | null; fba?: number | null
  taxaPrograma?: number | null; outrasTaxas?: number | null
  feeMedido?: boolean
  /**
   * Armazenagem MEDIDA deste produto no período (relatório mensal da Amazon).
   * `null`/ausente = não medida → não entra no produto e continua custo fixo.
   * Nunca rateio: ver `atribuirArmazenagem` no backend.
   */
  armazenagem?: number | null
  /** Desconto que o SELLER concedeu (cupom/promoção). Já está fora da `receita`. */
  promo?: number
  /** Receita de embrulho pra presente deste produto (o comprador paga). */
  embrulho?: number
  /** A decomposição do desconto (ver backend): parte de produto, de frete e a indivisa. */
  descontoProduto?: number
  descontoFrete?: number
  descontoIndiviso?: number
}
export interface Reembolso { sku: string; units: number; valor: number }

/**
 * Lançamento avulso de UM pedido — crédito extra (a Amazon te devolveu algo) ou
 * custo eventual (frete de devolução, reembalagem, avaria).
 *
 * ⚠️ NÃO mexe no custo unitário do produto, de propósito: é dinheiro daquele
 * pedido, não do SKU. Cadastrar como CMV faria o custo valer pras próximas
 * vendas todas e distorceria a margem de tudo que vem depois.
 *
 * `data` é a data do PEDIDO (não a de cadastro) — é ela que coloca o lançamento
 * no período certo quando o seller filtra "junho" três meses depois.
 */
export interface AjustePedido {
  id: string; orderId: string; sku: string
  tipo: 'credito' | 'custo'
  nome: string; valor: number
  data: string
}

/** Lançamentos de um pedido específico (o cartão da aba Vendas). */
export function ajustesDoPedido(ajustes: AjustePedido[] | undefined, orderId: string): AjustePedido[] {
  return (ajustes || []).filter(a => a.orderId === orderId)
}

/** Soma os lançamentos de um SKU dentro do período (o card do produto e a DRE). */
export function ajustesDoProduto(
  ajustes: AjustePedido[] | undefined, sku: string, from?: string, to?: string,
): { credito: number; custo: number; itens: AjustePedido[] } {
  const ini = from ? Date.parse(from) : -Infinity
  const fim = to ? Date.parse(to) : Infinity
  const itens = (ajustes || []).filter(a => {
    if (chave(a.sku) !== chave(sku)) return false
    const d = Date.parse(a.data)
    return !isFinite(d) || (d >= ini && d <= fim)
  })
  const r2 = (n: number) => Math.round(n * 100) / 100
  return {
    credito: r2(itens.filter(a => a.tipo === 'credito').reduce((s, a) => s + (Number(a.valor) || 0), 0)),
    custo: r2(itens.filter(a => a.tipo === 'custo').reduce((s, a) => s + (Number(a.valor) || 0), 0)),
    itens,
  }
}

export interface MargemProduto {
  receitaBruta: number
  /**
   * ⭐ A CADEIA DO VALOR DA VENDA (régua do Gestor, decidida pelo João 01/09):
   * `principal` = preço do anúncio (o que o seller reconhece) — vem PRIMEIRO na
   * tela; frete/embrulho/cupom são LINHAS até chegar no `receitaBruta` (recebido).
   * `null` = payload antigo sem a decomposição → a tela cai no formato velho.
   * Identidade: principal − descontos + freteComprador(líq.) + embrulho = receitaBruta.
   */
  principal: number | null
  /** Frete pago pelo comprador, LÍQUIDO do desconto de frete (no frete grátis ≈ 0). */
  freteComprador: number | null
  /** O frete BRUTO cobrado, antes do desconto de frete (pra nota explicativa). */
  freteBruto: number | null
  embrulhoReceita: number
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
  /** Armazenagem MEDIDA deste produto no período. `null` = não medida (fica no custo fixo). */
  armazenagem: number | null
  unitsLiquidas: number; cmv: number; temCusto: boolean
  /** Crédito extra e custo eventual lançados nos pedidos deste SKU no período. */
  credito: number; custoEventual: number
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
  /**
   * Alíquota de imposto em % sobre a receita. **OBRIGATÓRIO de propósito.**
   * Era opcional, e a Curva ABC esqueceu de passar: o compilador não reclamou,
   * o valor virou 0 em silêncio e o MESMO produto aparecia com lucro maior lá
   * do que no Top 15 e no modal. Quem não quiser imposto passa 0 explicitamente.
   */
  imposto: number
  /** Gasto de ads MEDIDO do produto, ou null. Nunca rateio — ver lib/adsProduto. */
  ads?: number | null
  /** Lançamentos avulsos daquele SKU no período (já somados por `ajustesDoProduto`). */
  ajustes?: { credito: number; custo: number }
}

const chave = (x: unknown): string => String(x ?? '').trim().toUpperCase()

/**
 * Totais do período somando PRODUTO A PRODUTO, com a mesma conta da tela de
 * detalhe. ⚠️ Existe porque o Resumo calculava por fora: o CMV dele era
 * `Σ units × custo` com unidade BRUTA (cobrando o custo do que foi devolvido) e
 * o imposto simplesmente não entrava no Lucro Bruto — enquanto o modal do
 * produto descontava os dois. O KPI da capa discordava do detalhe, e a
 * ferramenta de referência do seller estava certa e a nossa errada.
 */
export function totaisDoPeriodo(
  linhas: LinhasDre,
  produtos: ProdutoDre[],
  reembolsos: Reembolso[] | undefined,
  custoUnit: Record<string, number>,
  imposto = 0,
  ajustes?: AjustePedido[],
  periodo?: { from?: string; to?: string },
): { cmv: number; imposto: number; unidadesLiquidas: number; semCusto: number; receitaSemCusto: number; credito: number; custoEventual: number; armazenagem: number } {
  let cmv = 0, impostoTotal = 0, unidadesLiquidas = 0, semCusto = 0, receitaSemCusto = 0
  let credito = 0, custoEventual = 0, armazenagem = 0
  for (const p of (produtos || [])) {
    const aj = ajustesDoProduto(ajustes, p.sku, periodo?.from, periodo?.to)
    const M = margemDoProduto({ linhas, produto: p, reembolsos, custoUnit: custoUnit[p.sku] || 0, imposto, ajustes: aj })
    cmv += M.cmv; impostoTotal += M.imposto; unidadesLiquidas += M.unitsLiquidas
    credito += M.credito; custoEventual += M.custoEventual
    // ⭐ Armazenagem MEDIDA por SKU (custo de estoque). Somada AQUI pra o agregado
    // descontar a MESMA coisa que cada card de produto desconta — sem isto o
    // agregado ignorava a armazenagem medida e discordava da soma dos produtos.
    armazenagem += (M.armazenagem || 0)
    // ⚠️ Produto sem custo cadastrado entra no lucro com CMV ZERO: a receita dele
    // conta inteira e o custo não. O agregado fica otimista e nada na tela avisa.
    // Contamos aqui pra a capa poder declarar de quanto é o buraco.
    if (M.receitaLiquida > 0 && !M.temCusto) { semCusto++; receitaSemCusto += M.receitaLiquida }
  }
  const r2 = (n: number) => Math.round(n * 100) / 100
  return { cmv: r2(cmv), imposto: r2(impostoTotal), unidadesLiquidas, semCusto, receitaSemCusto: r2(receitaSemCusto), credito: r2(credito), custoEventual: r2(custoEventual), armazenagem: r2(armazenagem) }
}

/**
 * LUCRO DO PERÍODO, antes do ads. A fórmula, num lugar só.
 *
 * ⚠️ Existia escrita à mão na capa da Gestão e no resumo que alimenta o push das
 * 20h e o NEO. Duas cópias da mesma soma é como o imposto ficou de fora de um
 * lado por semanas, e depois o crédito/custo eventual de outro: some uma parcela
 * em qualquer uma das cópias e nada quebra — os números só passam a discordar.
 *
 * Não decide se o lucro EXISTE: quem sabe se há custo cadastrado é quem chama
 * (sem CMV o certo é dizer "—", não exibir a receita inteira como lucro).
 */
export function lucroDoPeriodo(
  liqMarketplace: number,
  t: { cmv: number; imposto: number; credito?: number; custoEventual?: number; armazenagem?: number },
): number {
  // ⚠️ A armazenagem MEDIDA (custo de estoque por SKU) entra AQUI, depois do
  // líquido — porque o `liqMarketplace` agora é só a parte da VENDA (comissão,
  // FBA, taxas), SEM armazenagem nem assinatura. Isso casa com o card de cada
  // produto, que já descontava a armazenagem medida depois do líquido dele.
  const v = (liqMarketplace || 0) - (t.cmv || 0) - (t.imposto || 0) - (t.armazenagem || 0) + (t.credito || 0) - (t.custoEventual || 0)
  return Math.round(v * 100) / 100
}

/** Custos do PERÍODO que não pertencem a produto nenhum. A tela mostra separado.
 *  Inclui a taxa de SERVIÇO da conta (`outrasConta`): ela vem do
 *  ServiceFeeEventList, sem pedido nem SKU atrelado — não há a quem atribuir.
 *
 *  ⚠️ A armazenagem entra aqui só na parte que NÃO foi atribuída a produto.
 *  Somar o total faria a parte medida ser cobrada duas vezes: uma no card do
 *  produto e outra aqui. E é justamente o resto que pertence a este bloco —
 *  armazenagem de produto que não vendeu no período, ou de ASIN com SKU
 *  duplicado, que não tem a quem ser atribuída sem virar rateio. */
export function custosFixosDoPeriodo(linhas: LinhasDre): number {
  const armazenagemSobrando = Math.max(0, (linhas?.armazenagem || 0) - (linhas?.armazenagemAtribuida || 0))
  return armazenagemSobrando + (linhas?.assinatura || 0) + (linhas?.outrasConta || 0)
}

export function margemDoProduto(e: EntradaMargem): MargemProduto {
  const L = e.linhas || {}
  const p = e.produto
  const receitaBruta = p?.receita || 0
  const units = p?.units || 0
  const r2m = (n: number) => Math.round(n * 100) / 100

  // ⭐ A decomposição do VALOR DA VENDA (só quando o payload traz `principal`).
  // receita = principal + frete + embrulho − promo  →  frete = receita − principal
  // − embrulho + promo. O exibível é o frete LÍQUIDO (bruto − desconto de frete):
  // no "frete grátis" a Amazon cobra e devolve — o líquido fica ~0, como deve.
  const temDecomp = p?.principal !== undefined && p?.principal !== null
  const principal = temDecomp ? r2m(Number(p.principal) || 0) : null
  const embrulhoReceita = r2m(Number(p?.embrulho) || 0)
  const promoTotal = Number(p?.promo) || 0
  const freteBruto = temDecomp ? r2m(receitaBruta - (principal as number) - embrulhoReceita + promoTotal) : null
  const freteComprador = freteBruto !== null ? r2m(Math.max(0, freteBruto - (Number(p?.descontoFrete) || 0))) : null

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

  // Armazenagem MEDIDA do produto. ⚠️ Custo de ESTOQUE, não de venda: não escala
  // com unidade vendida, e é isso que faz o produto parado finalmente aparecer
  // como o que ele é. Não medida → null → segue como custo fixo do período.
  const armazenagem = (p?.armazenagem === undefined || p?.armazenagem === null) ? null : Number(p.armazenagem)

  const ads = e.ads ?? null
  // Lançamentos avulsos do pedido entram DEPOIS do CMV, em linha própria. É
  // dinheiro real do período; ficar de fora faria a soma dos pedidos não bater
  // com o card do produto — o defeito que essa base inteira existe pra impedir.
  const credito = Number(e.ajustes?.credito) || 0
  const custoEventual = Number(e.ajustes?.custo) || 0
  const lucroAntesAds = liqMarketplace === null ? null
    : liqMarketplace - imposto - cmv - (armazenagem || 0) + credito - custoEventual
  const lucro = (lucroAntesAds === null || ads === null) ? null : lucroAntesAds - ads
  const base = lucro ?? lucroAntesAds
  const margem = (base !== null && receitaLiquida > 0) ? base / receitaLiquida * 100 : null

  return {
    receitaBruta, principal, freteComprador, freteBruto, embrulhoReceita,
    devolucaoValor, devolucaoUnits, receitaLiquida,
    comissao, fba, taxaPrograma, outrasTaxas, taxasMedidas: medePrograma && medeOutras, feeMedido,
    liqMarketplace, ads, imposto, armazenagem, unitsLiquidas, cmv, temCusto, credito, custoEventual,
    lucroAntesAds, lucro, margem,
    completo: feeMedido && ads !== null,
  }
}
