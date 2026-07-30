/* ─────────────────────────────────────────────────────────────────────────────
   O REGISTRO TEMPORAL DO PERÍODO — duas perguntas, UM motor.

   1. DIÁRIO — "o que mudou desde a última vez que eu olhei?"
   2. RECONCILIAÇÃO — "eu estimei R$5.800 em junho; fechou R$5.611. Por quê?"

   O seller abre a Gestão, vê lucro de R$5.800 em junho. Volta três dias depois e
   vê R$5.611. Sem explicação, isso não parece precisão — parece defeito, e ele
   passa a desconfiar de todo o resto.

   O número mudou porque duas devoluções entraram e a tarifa real substituiu a
   estimativa em doze pedidos. Tudo verdade, e a segunda versão é MAIS exata que a
   primeira. Só faltava dizer.

   ⭐ Narrar transforma a maior fraqueza percebida na maior prova de precisão.

   ⭐ E SÓ VALE SE FECHAR. Anunciar "−R$1.089" e listar causas que somam −165 é
   PIOR que não listar nada: quem confere descobre dinheiro sem explicação e
   conclui que a ferramenta esconde algo. Foi exatamente o que a primeira versão
   deste arquivo fazia — o diário conhecia 4 parcelas do lucro e anunciava a
   variação de TODAS as 12. Por isso agora existe UM motor (`decompor`) e as duas
   telas são apresentações dele. Duas decomposições da mesma diferença é a
   doença-mãe deste projeto com outro nome.

   ⚠️ Nem toda mudança é da Amazon. Se o lucro caiu porque o SELLER cadastrou o
   custo que faltava, dizer "o repasse fechou menor" seria mentira. As causas vêm
   separadas por quem as provocou.

   ⚠️ Parcela que não existe nos DOIS lados não vira zero: vira resíduo declarado.
   Snapshot antigo sem `cmv` comparado com um que tem inventaria "custo que você
   informou" onde ninguém informou nada.

   O que este arquivo NÃO faz: congelar. Congelar seria preferir o número velho ao
   certo — o oposto do que a Gestão existe pra fazer.
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * TODAS as parcelas do lucro do período. Obrigatórias de propósito: parcela que
 * falta é diferença atribuída ao motivo errado — ou pior, resíduo silencioso.
 * Quem chama tem os números; o compilador garante que passou.
 */
export interface ParcelasPeriodo {
  receitaBruta: number
  devolucoes: number
  comissao: number
  fba: number
  taxaPrograma: number
  armazenagem: number
  assinatura: number
  outrasTaxas: number
  cmv: number
  imposto: number
  credito: number
  custoEventual: number
  unidades: number
  /** `null` quando não há custo cadastrado — não se narra o que não existia. */
  lucro: number | null
}

export interface SnapshotPeriodo extends Partial<ParcelasPeriodo> {
  /** Chave do período (from|to) — comparar junho com junho, nunca com julho. */
  chave: string
  /** ISO de quando o seller viu estes números. */
  visto: string
  /**
   * 2 = tem todas as parcelas e serve pra reconciliar. Snapshot gravado antes
   * disso existir continua valendo pro diário, com as parcelas que faltam indo
   * pro resíduo em vez de virarem causa inventada.
   */
  v?: 2
  /** Maturidade no momento da foto — é o que identifica "quando era estimativa". */
  maturidade?: 'aberto' | 'liquidando' | 'fechado'
  /** Compatibilidade com o primeiro formato, onde receitaBruta se chamava assim. */
  faturamento?: number
}

/** Os dois marcos que ficam guardados por período. */
export interface MarcosPeriodo {
  /** A PROMESSA: a foto mais antiga, de quando o período não tinha fechado. Nunca é sobrescrita. */
  primeiro: SnapshotPeriodo
  /** A última visita — é contra ela que o diário compara. */
  ultimo: SnapshotPeriodo
}

/** Quem provocou a mudança. Misturar seria culpar a Amazon pelo que o seller fez. */
export type Autor = 'amazon' | 'voce'

export interface Causa {
  rotulo: string
  /** Efeito no LUCRO, com sinal: negativo = tirou dinheiro. */
  valor: number
  autor: Autor
  /** Por que isso acontece — o texto do card de fechamento. */
  explicacao: string
  /** A mesma causa em uma linha coloquial — o texto do diário. */
  frase: string
}

export interface Decomposicao {
  causas: Causa[]
  /** Variação do lucro. `null` quando um dos lados não tinha lucro conhecido. */
  diferenca: number | null
  /** O que a decomposição não explicou. Fica DECLARADO, nunca diluído numa causa. */
  residuo: number
  /** true = as causas somam a diferença (tolerância de centavos). */
  fecha: boolean
}

export interface Diario extends Decomposicao {
  desde: string
}

export interface Reconciliacao extends Decomposicao {
  estimadoEm: string
  maturidadeNaEstimativa: 'aberto' | 'liquidando' | 'fechado'
  lucroEstimado: number
  lucroAtual: number
  /** Aqui a diferença sempre existe: `reconciliar` exige lucro dos dois lados. */
  diferenca: number
}

export const chaveDoPeriodo = (p?: { from?: string | null; to?: string | null } | null): string =>
  `${p?.from || ''}|${p?.to || ''}`

/**
 * Lê o que está gravado tolerando o formato anterior (um snapshot por período, sem
 * os dois marcos). Foto solta vira os dois marcos apontando pra ela — é a única
 * leitura honesta: aquela foto é, ao mesmo tempo, a mais antiga e a mais recente
 * que existe. Lixo é descartado em silêncio; metadata corrompido não pode derrubar
 * a Gestão inteira.
 */
export function normalizarMarcos(bruto: unknown): Record<string, MarcosPeriodo> {
  const out: Record<string, MarcosPeriodo> = {}
  if (!bruto || typeof bruto !== 'object') return out
  for (const [k, v] of Object.entries(bruto as Record<string, any>)) {
    if (!v || typeof v !== 'object') continue
    if (v.primeiro?.visto && v.ultimo?.visto) { out[k] = { primeiro: v.primeiro, ultimo: v.ultimo }; continue }
    if (typeof v.visto === 'string') out[k] = { primeiro: v, ultimo: v }
  }
  return out
}

/** Diferença abaixo disto é ruído de arredondamento e não vira frase. */
const RUIDO = 0.5

const r2 = (n: number) => Math.round(n * 100) / 100
const brl = (n: number) => `R$ ${Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const sinalBrl = (n: number) => `${n < 0 ? '−' : '+'}${brl(n)}`

export function snapshotDoPeriodo(
  periodo: { from?: string | null; to?: string | null } | null | undefined,
  p: ParcelasPeriodo,
  maturidade: 'aberto' | 'liquidando' | 'fechado' = 'aberto',
  agora: Date = new Date(),
): SnapshotPeriodo {
  return {
    chave: chaveDoPeriodo(periodo),
    visto: agora.toISOString(),
    v: 2,
    maturidade,
    receitaBruta: r2(p.receitaBruta || 0),
    // Mantido pelo nome antigo também: foto gravada antes disto continua comparável.
    faturamento: r2(p.receitaBruta || 0),
    devolucoes: r2(p.devolucoes || 0),
    comissao: r2(p.comissao || 0),
    fba: r2(p.fba || 0),
    taxaPrograma: r2(p.taxaPrograma || 0),
    armazenagem: r2(p.armazenagem || 0),
    assinatura: r2(p.assinatura || 0),
    outrasTaxas: r2(p.outrasTaxas || 0),
    cmv: r2(p.cmv || 0),
    imposto: r2(p.imposto || 0),
    credito: r2(p.credito || 0),
    custoEventual: r2(p.custoEventual || 0),
    unidades: Math.round(p.unidades || 0),
    lucro: p.lucro === null || p.lucro === undefined ? null : r2(p.lucro),
  }
}

/* ═══════════════ O MOTOR — uma decomposição, duas telas ════════════════════ */

const conhecido = (v: unknown): boolean => v !== undefined && v !== null && isFinite(Number(v))

/**
 * Decompõe a variação do lucro entre duas fotos do MESMO período nas parcelas que
 * a causaram. O que não se explica sai como resíduo — declarado, nunca diluído.
 */
export function decompor(antes: SnapshotPeriodo, depois: SnapshotPeriodo): Decomposicao {
  /** `null` = a parcela não é conhecida nos dois lados. Não é zero: é "não sei". */
  const d = (campo: keyof ParcelasPeriodo): number | null => {
    const a = antes[campo], b = depois[campo]
    if (!conhecido(a) || !conhecido(b)) return null
    return r2(Number(b) - Number(a))
  }
  const dRec = (() => {
    const a = antes.receitaBruta ?? antes.faturamento, b = depois.receitaBruta ?? depois.faturamento
    if (!conhecido(a) || !conhecido(b)) return null
    return r2(Number(b) - Number(a))
  })()
  const dUni = (conhecido(antes.unidades) && conhecido(depois.unidades))
    ? Number(depois.unidades) - Number(antes.unidades) : 0

  // "Sem venda nova" é o que distingue tarifa REAL substituindo estimativa de
  // tarifa acompanhando venda que entrou. Se não sei a receita, não afirmo nem um.
  const semVendaNova = dRec !== null && Math.abs(dRec) <= RUIDO

  const causas: Causa[] = []
  const põe = (valor: number | null, c: Omit<Causa, 'valor'>) => {
    if (valor === null || Math.abs(valor) <= RUIDO) return
    causas.push({ ...c, valor })
  }

  // ── O que a Amazon fez com as vendas ──
  if (dRec !== null && Math.abs(dRec) > RUIDO) {
    põe(dRec, dRec > 0 ? {
      rotulo: 'Vendas que entraram depois', autor: 'amazon',
      explicacao: 'Pedidos que a Amazon indexou depois da sua última olhada e passaram a contar no período.',
      frase: `entraram ${brl(dRec)} de venda${dUni > 0 ? ` (${dUni} unidade${dUni === 1 ? '' : 's'})` : ''}`,
    } : {
      rotulo: 'Vendas que deixaram de contar', autor: 'amazon',
      explicacao: 'Pedido cancelado ou devolvido deixa de contar como receita — a venda não existiu.',
      frase: `saíram ${brl(dRec)} de faturamento — venda cancelada ou devolvida deixou de contar`,
    })
  }
  const dDev = d('devolucoes')
  if (dDev !== null && Math.abs(dDev) > RUIDO) {
    põe(-dDev, dDev > 0 ? {
      rotulo: 'Devoluções que chegaram depois', autor: 'amazon',
      explicacao: 'Uma venda contada pode voltar por até 30 dias. Quando volta, sai da receita — e o custo dela sai junto.',
      frase: `chegaram ${brl(dDev)} de devolução`,
    } : {
      rotulo: 'Devoluções revertidas', autor: 'amazon',
      explicacao: 'Devolução que havia sido contada foi desfeita e o dinheiro voltou pro período.',
      frase: `${brl(dDev)} de devolução foram revertidos`,
    })
  }

  // ── Tarifas: o coração disto. Estimativa dando lugar ao valor real. ──
  const explTarifa = semVendaNova
    ? 'Enquanto o pedido não liquida, a tarifa é calculada pela tabela. Quando a Amazon fecha o repasse, entra o valor que ela cobrou de fato.'
    : 'A tarifa acompanhou a mudança nas vendas do período.'
  // `curto` vem escrito à mão, não de `toLowerCase()`: FBA é sigla e virava
  // "tarifa fba" no meio da frase.
  const tarifa = (campo: keyof ParcelasPeriodo, nome: string, curto: string) => {
    const v = d(campo); if (v === null) return
    põe(-v, {
      rotulo: semVendaNova ? `${nome} real substituiu a estimativa` : `${nome} mudou`, autor: 'amazon',
      explicacao: explTarifa,
      frase: semVendaNova
        ? `a ${curto} real substituiu a estimativa: ${sinalBrl(v)}`
        : `${curto} ${v > 0 ? 'subiu' : 'caiu'} ${brl(v)}`,
    })
  }
  tarifa('comissao', 'Comissão', 'comissão')
  tarifa('fba', 'Tarifa FBA', 'tarifa FBA')
  tarifa('taxaPrograma', 'Taxa Amazon pra Todos', 'Taxa Amazon pra Todos')

  const dOut = d('outrasTaxas')
  põe(dOut === null ? null : -dOut, {
    rotulo: 'Outras taxas do repasse', autor: 'amazon',
    explicacao: 'Taxas que só aparecem quando o repasse fecha: embrulho, chargeback, taxa por pedido, ajuste de reembolso.',
    frase: `outras taxas do repasse: ${sinalBrl(dOut === null ? 0 : -dOut)}`,
  })
  const dArm = d('armazenagem')
  põe(dArm === null ? null : -dArm, {
    rotulo: 'Armazenagem', autor: 'amazon',
    explicacao: 'Cobrada por mês, com lançamento atrasado — costuma entrar depois do período que ela cobre.',
    frase: `armazenagem: ${sinalBrl(dArm === null ? 0 : -dArm)}`,
  })
  const dAss = d('assinatura')
  põe(dAss === null ? null : -dAss, {
    rotulo: 'Assinatura', autor: 'amazon',
    explicacao: 'A mensalidade do plano entra na data em que a Amazon lança, que pode não ser a do período que ela cobre.',
    frase: `assinatura: ${sinalBrl(dAss === null ? 0 : -dAss)}`,
  })

  // ── O que o SELLER mudou. Separado de propósito. ──
  const dCmv = d('cmv')
  if (dCmv !== null && Math.abs(dCmv) > RUIDO) {
    põe(-dCmv, {
      rotulo: dCmv > 0 ? 'Custo do produto que você informou' : 'Custo do produto que você reduziu', autor: 'voce',
      explicacao: 'O CMV cadastrado na aba Gerenciamento mudou. Não é a Amazon: é a sua informação de custo ficando mais exata.',
      frase: `você ${dCmv > 0 ? 'informou' : 'reduziu'} custo de produto: ${sinalBrl(-dCmv)} no lucro`,
    })
  }
  const dImp = d('imposto')
  põe(dImp === null ? null : -dImp, {
    rotulo: 'Imposto', autor: semVendaNova ? 'voce' : 'amazon',
    explicacao: 'O imposto acompanha a receita líquida. Se a receita não mudou, o que mudou foi a alíquota que você informou.',
    frase: `imposto: ${sinalBrl(dImp === null ? 0 : -dImp)}`,
  })
  const dCred = d('credito')
  põe(dCred, {
    rotulo: 'Crédito extra que você lançou', autor: 'voce',
    explicacao: 'Lançamento avulso de pedido, na aba Vendas.',
    frase: `crédito extra que você lançou: ${sinalBrl(dCred || 0)}`,
  })
  const dCev = d('custoEventual')
  põe(dCev === null ? null : -dCev, {
    rotulo: 'Custo eventual que você lançou', autor: 'voce',
    explicacao: 'Lançamento avulso de pedido, na aba Vendas: frete de devolução, reembalagem, avaria.',
    frase: `custo eventual que você lançou: ${sinalBrl(dCev === null ? 0 : -dCev)}`,
  })

  const temLucro = conhecido(antes.lucro) && conhecido(depois.lucro)
  const diferenca = temLucro ? r2(Number(depois.lucro) - Number(antes.lucro)) : null
  const somaCausas = r2(causas.reduce((s, c) => s + c.valor, 0))
  // Sem lucro dos dois lados não há total a fechar — e aí não se declara resíduo
  // nenhum, porque não existe alvo. As causas valem por si.
  const residuo = diferenca === null ? 0 : r2(diferenca - somaCausas)

  return {
    // Do que mais tirou pro que menos tirou: o seller quer ver primeiro o que doeu.
    causas: causas.sort((a, b) => a.valor - b.valor),
    diferenca,
    residuo,
    fecha: Math.abs(residuo) <= RUIDO,
  }
}

/* ═══════════════ DIÁRIO — o que mudou desde a última visita ════════════════ */

/**
 * Devolve `null` quando não há nada honesto a dizer: sem foto anterior, de outro
 * período, ou nada mudou além de centavos.
 */
export function narrarMudancas(anterior: SnapshotPeriodo | null | undefined, atual: SnapshotPeriodo): Diario | null {
  if (!anterior || anterior.chave !== atual.chave) return null
  const dec = decompor(anterior, atual)
  // Sem causa E sem resíduo, nada aconteceu. Resíduo sozinho também merece ser
  // dito: o lucro mudou e a ferramenta não sabe explicar — calar seria pior.
  if (!dec.causas.length && dec.fecha) return null
  return { ...dec, desde: anterior.visto }
}

/* ═══════════════ RECONCILIAÇÃO — a estimativa contra o fechamento ══════════ */

const completo = (s?: SnapshotPeriodo | null): boolean =>
  !!s && s.v === 2 && conhecido(s.lucro)

/**
 * A peça que ninguém tem: por que o número que você viu não é o número que
 * fechou. `estimativa` é a foto de quando o período ainda não tinha fechado — a
 * promessa que a ferramenta fez. `atual` é o que ela entrega.
 */
export function reconciliar(
  estimativa: SnapshotPeriodo | null | undefined,
  atual: SnapshotPeriodo,
): Reconciliacao | null {
  if (!estimativa || estimativa.chave !== atual.chave) return null
  // Sem as parcelas dos dois lados não dá pra prometer fechamento. Recusar é a
  // resposta certa — o diário ainda narra o que der, com resíduo declarado.
  if (!completo(estimativa) || !completo(atual)) return null
  // Nada a reconciliar se a foto antiga já era de período fechado.
  if (estimativa.maturidade === 'fechado') return null

  const dec = decompor(estimativa, atual)
  return {
    ...dec,
    diferenca: dec.diferenca ?? 0,
    estimadoEm: estimativa.visto,
    maturidadeNaEstimativa: estimativa.maturidade || 'aberto',
    lucroEstimado: r2(Number(estimativa.lucro)),
    lucroAtual: r2(Number(atual.lucro)),
  }
}
