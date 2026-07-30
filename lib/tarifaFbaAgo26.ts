/* ─────────────────────────────────────────────────────────────────────────────
   A TARIFA FBA MUDA EM 01/08/2026 — quem vai pagar, e quanto.

   Até 31/07/2026 a campanha "Experimente FBA" isenta a tarifa a partir de R$100
   e cobra R$6 abaixo disso. De 01/08 em diante ela cobra **R$6 fixos a partir de
   R$79**, sem isenção nenhuma. Não é reajuste de tarifa: é uma isenção que acaba.

   Quem vende acima de R$100 sai de ZERO para R$6 por unidade. Num produto de
   R$189 que gira 46 unidades no mês, são R$276 que não existiam.

   ⭐ QUEM ESTÁ NA CAMPANHA A GENTE NÃO CHUTA — MEDE.
   A campanha não é automática: depende de conta elegível e renova mensal com
   ≥3,5% em Ads. Presumir que todo cliente está nela erraria em dois sentidos —
   assustaria quem já paga a tarifa cheia e calaria para quem não está isento.
   Como o repasse traz a tarifa FBA REAL por produto, a resposta está no dado:
   tarifa medida perto de zero num produto acima de R$79 = isento hoje = vai
   passar a pagar. Tarifa medida de R$15 = nunca esteve isento = nada muda.

   Produto sem tarifa MEDIDA fica de fora, não vira zero — "não sei" e "zero"
   não podem virar o mesmo pixel (o FBM não paga tarifa FBA de verdade).
   ───────────────────────────────────────────────────────────────────────────── */

export const VIRADA_AGO26 = new Date('2026-08-01T00:00:00-03:00')
export const FIM_CAMPANHA_FBA = new Date('2027-01-31T23:59:59-03:00')
/** Tarifa fixa que a campanha passa a cobrar a partir de 01/08/2026. */
export const TARIFA_AGO26 = 6
/** Preço a partir do qual a campanha de ago/26 se aplica. */
export const PISO_AGO26 = 79
/**
 * Depois disto o aviso sai da tela: um mês é tempo de sobra pra reagir, e aviso
 * que fica pra sempre vira paisagem — na próxima vez que algo importante
 * aparecer ali, ninguém lê.
 */
export const FIM_DO_AVISO_AGO26 = new Date('2026-08-31T23:59:59-03:00')

export interface ProdutoTarifa {
  sku: string
  nome?: string
  /** Preço médio praticado no período = receita bruta ÷ unidades vendidas. */
  precoMedio: number
  /** Unidades líquidas do período (já sem as devolvidas). */
  units: number
  /** Tarifa FBA MEDIDA por unidade no período. `null` = não medida → fica de fora. */
  fbaUnit: number | null
  /** Comissão como fração da receita (0.15 = 15%), medida no período. */
  comissaoPct: number
}

export interface ImpactoProduto {
  sku: string
  nome?: string
  precoMedio: number
  units: number
  /** O que paga hoje por unidade (medido). */
  fbaHoje: number
  /** O que passa a pagar por unidade em 01/08. */
  fbaDepois: number
  /** Quanto sobe por unidade. */
  deltaUnit: number
  /** Quanto teria custado no volume DESTE período. */
  impactoPeriodo: number
  /**
   * Quanto somar no preço pra sair no mesmo lucro em REAIS.
   * Não é `+R$6`: sobre o aumento incidem comissão e imposto, então parte do
   * reajuste volta pra Amazon e pro fisco. `null` quando comissão + imposto
   * passam de 100% e não existe preço que resolva.
   *
   * ⭐ DECISÃO DO JOÃO (29/07/2026): a régua é o LUCRO EM REAIS, não a margem %.
   * Manter a margem percentual pediria um reajuste MAIOR — a margem é uma razão,
   * e quando o preço sobe o denominador sobe com ele, então recuperar o percentual
   * exige subir mais do que o custo que apareceu. Isso empurra o seller a aumentar
   * preço além do necessário pra defender um indicador, e preço é a variável que
   * ele tem menos liberdade pra mexer sem perder Buy Box e conversão.
   * ⚠️ NÃO "corrigir" isto pra margem % achando que é descuido.
   */
  reajusteSugerido: number | null
  precoSugerido: number | null
}

export interface ImpactoTarifa {
  /** true depois de 01/08/2026 — o aviso muda de "vai mudar" pra "mudou". */
  jaVirou: boolean
  /** false quando a mudança já foi absorvida e o aviso só ocuparia espaço. */
  relevante: boolean
  /** Produtos que hoje são isentos e passam a pagar, do maior impacto pro menor. */
  afetados: ImpactoProduto[]
  /** Soma do impacto no volume do período. */
  totalPeriodo: number
  /** Unidades que estavam isentas no período. */
  unidadesAfetadas: number
  /** Produtos que vendem acima de R$79 e JÁ pagam tarifa — não mudam nada. */
  jaPagavam: number
  /** Produtos sem tarifa medida: não dá pra dizer se mudam. Aparecem como ressalva. */
  semMedicao: number
}

const r2 = (n: number) => Math.round(n * 100) / 100

/**
 * @param imposto alíquota de imposto sobre a receita, em % (a mesma da Gestão).
 * @param quando  data de referência — parâmetro pra o teste poder viajar no tempo.
 */
export function impactoTarifaAgo26(
  produtos: ProdutoTarifa[],
  imposto: number,
  quando: Date = new Date(),
): ImpactoTarifa {
  const jaVirou = quando >= VIRADA_AGO26
  const afetados: ImpactoProduto[] = []
  let jaPagavam = 0, semMedicao = 0

  for (const p of produtos || []) {
    if (!(p.precoMedio > 0) || !(p.units > 0)) continue
    // Abaixo de R$79 a campanha não se aplica nem antes nem depois: nada muda.
    if (p.precoMedio < PISO_AGO26) continue
    if (p.fbaUnit === null || p.fbaUnit === undefined) { semMedicao++; continue }
    // Quem já paga R$6 ou mais por unidade não sente a virada: ou está fora da
    // campanha (tarifa cheia por peso), ou já vende na faixa que cobrava R$6.
    // ⚠️ A comparação é com a tarifa NOVA, não com zero: a tarifa medida é uma
    // MÉDIA do período. Um produto que vendeu metade acima de R$100 (isento) e
    // metade abaixo (R$6) aparece com R$3 por unidade — e vai convergir pros R$6.
    // Descartar quem paga "quase nada" esconderia justamente esse caso.
    if (p.fbaUnit >= TARIFA_AGO26) { jaPagavam++; continue }

    const fbaHoje = p.fbaUnit
    const deltaUnit = r2(TARIFA_AGO26 - fbaHoje)
    // Sobra do preço depois de comissão e imposto — é o que de fato entra no bolso
    // a cada real de reajuste. Se não sobra nada, não existe preço que compense.
    const sobra = 1 - (p.comissaoPct || 0) - (imposto || 0) / 100
    const reajusteSugerido = sobra > 0.01 ? r2(deltaUnit / sobra) : null

    afetados.push({
      sku: p.sku,
      nome: p.nome,
      precoMedio: r2(p.precoMedio),
      units: p.units,
      fbaHoje: r2(fbaHoje),
      fbaDepois: TARIFA_AGO26,
      deltaUnit,
      impactoPeriodo: r2(deltaUnit * p.units),
      reajusteSugerido,
      precoSugerido: reajusteSugerido === null ? null : r2(p.precoMedio + reajusteSugerido),
    })
  }

  afetados.sort((a, b) => b.impactoPeriodo - a.impactoPeriodo)
  return {
    jaVirou,
    relevante: quando <= FIM_DO_AVISO_AGO26,
    afetados,
    totalPeriodo: r2(afetados.reduce((s, a) => s + a.impactoPeriodo, 0)),
    unidadesAfetadas: afetados.reduce((s, a) => s + a.units, 0),
    jaPagavam,
    semMedicao,
  }
}
