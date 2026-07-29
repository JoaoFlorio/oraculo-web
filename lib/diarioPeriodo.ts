/* ─────────────────────────────────────────────────────────────────────────────
   O DIÁRIO DO PERÍODO — narra o que mudou desde a última vez que o seller olhou.

   O seller abre a Gestão, vê lucro de R$5.800 em junho. Volta três dias depois e
   vê R$5.611. Sem explicação, isso não parece precisão — parece defeito, e ele
   passa a desconfiar de todo o resto.

   O número mudou porque duas devoluções entraram e a tarifa real substituiu a
   estimativa em doze pedidos. Todas as três coisas são verdade, e a segunda
   versão é MAIS exata que a primeira. Só faltava dizer.

   ⭐ Narrar transforma a maior fraqueza percebida na maior prova de precisão.
   Uma ferramenta que sabe explicar por que mudou é uma que está prestando
   atenção; uma que muda calada é uma que erra.

   O que este arquivo NÃO faz: congelar. Congelar seria preferir o número velho
   ao certo — o oposto do que a Gestão existe pra fazer.
   ───────────────────────────────────────────────────────────────────────────── */

export interface SnapshotPeriodo {
  /** Chave do período (from|to) — comparar junho com junho, nunca com julho. */
  chave: string
  /** ISO de quando o seller viu estes números. */
  visto: string
  faturamento: number
  devolucoes: number
  comissao: number
  fba: number
  unidades: number
  /** `null` quando o custo não estava cadastrado — não se narra o que não existia. */
  lucro: number | null
}

export interface LinhaDiario {
  /** Direção no bolso do seller: o que fez o lucro subir, descer, ou nem um nem outro. */
  sinal: 'sobe' | 'desce' | 'neutro'
  texto: string
}

export interface Diario {
  desde: string
  linhas: LinhaDiario[]
  /** Variação do lucro, quando dá pra comparar. */
  deltaLucro: number | null
}

export const chaveDoPeriodo = (p?: { from?: string | null; to?: string | null } | null): string =>
  `${p?.from || ''}|${p?.to || ''}`

/** Diferença abaixo disto é ruído de arredondamento e não vira frase. */
const RUIDO = 0.5

const r2 = (n: number) => Math.round(n * 100) / 100
const brl = (n: number) => `R$ ${Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function snapshotDoPeriodo(
  periodo: { from?: string | null; to?: string | null } | null | undefined,
  dados: { faturamento: number; devolucoes: number; comissao: number; fba: number; unidades: number; lucro: number | null },
  agora: Date = new Date(),
): SnapshotPeriodo {
  return {
    chave: chaveDoPeriodo(periodo),
    visto: agora.toISOString(),
    faturamento: r2(dados.faturamento || 0),
    devolucoes: r2(dados.devolucoes || 0),
    comissao: r2(dados.comissao || 0),
    fba: r2(dados.fba || 0),
    unidades: Math.round(dados.unidades || 0),
    lucro: dados.lucro === null || dados.lucro === undefined ? null : r2(dados.lucro),
  }
}

/**
 * Compara o que o seller está vendo agora com o que ele viu da última vez.
 * Devolve `null` quando não há nada honesto a dizer: sem snapshot anterior, de
 * outro período, ou nada mudou além de centavos.
 */
export function narrarMudancas(anterior: SnapshotPeriodo | null | undefined, atual: SnapshotPeriodo): Diario | null {
  if (!anterior || anterior.chave !== atual.chave) return null

  const linhas: LinhaDiario[] = []
  const d = (campo: keyof SnapshotPeriodo) => r2((Number(atual[campo]) || 0) - (Number(anterior[campo]) || 0))

  const dFat = d('faturamento'), dDev = d('devolucoes'), dCom = d('comissao'), dFba = d('fba')
  const dUni = atual.unidades - anterior.unidades

  if (Math.abs(dFat) > RUIDO) {
    linhas.push(dFat > 0
      ? { sinal: 'sobe', texto: `entraram ${brl(dFat)} de venda${dUni > 0 ? ` (${dUni} unidade${dUni === 1 ? '' : 's'})` : ''}` }
      // Faturamento caindo num período fechado não é venda sumindo: é venda que
      // foi cancelada ou devolvida e deixou de contar como receita.
      : { sinal: 'desce', texto: `saíram ${brl(dFat)} de faturamento — venda cancelada ou devolvida deixou de contar` })
  }
  if (Math.abs(dDev) > RUIDO) {
    linhas.push(dDev > 0
      ? { sinal: 'desce', texto: `chegaram ${brl(dDev)} de devolução` }
      : { sinal: 'sobe', texto: `${brl(dDev)} de devolução foram revertidos` })
  }
  // Comissão e tarifa mudando sem venda nova é a estimativa dando lugar ao valor
  // real do repasse — o motivo mais comum de o lucro "encolher sozinho", e o que
  // mais parecia defeito por não ter nome.
  const semVendaNova = Math.abs(dFat) <= RUIDO
  if (Math.abs(dCom) > RUIDO) {
    linhas.push({
      sinal: dCom > 0 ? 'desce' : 'sobe',
      texto: semVendaNova
        ? `a comissão real do repasse substituiu a estimativa: ${dCom > 0 ? '+' : '−'}${brl(dCom)}`
        : `comissão ${dCom > 0 ? 'subiu' : 'caiu'} ${brl(dCom)}`,
    })
  }
  if (Math.abs(dFba) > RUIDO) {
    linhas.push({
      sinal: dFba > 0 ? 'desce' : 'sobe',
      texto: semVendaNova
        ? `a tarifa FBA real substituiu a estimativa: ${dFba > 0 ? '+' : '−'}${brl(dFba)}`
        : `tarifa FBA ${dFba > 0 ? 'subiu' : 'caiu'} ${brl(dFba)}`,
    })
  }

  if (!linhas.length) return null

  // Só se afirma variação de lucro quando os DOIS lados existiam. Comparar contra
  // um lucro que era null (custo não cadastrado) inventaria um salto que é só o
  // seller ter preenchido o CMV.
  const deltaLucro = (anterior.lucro !== null && atual.lucro !== null) ? r2(atual.lucro - anterior.lucro) : null
  return { desde: anterior.visto, linhas, deltaLucro }
}
