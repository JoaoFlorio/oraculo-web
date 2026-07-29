/* ─────────────────────────────────────────────────────────────────────────────
   QUAL RELÓGIO O CLIENTE ESTÁ OLHANDO.

   A Gestão mistura dois relógios e não tinha como dizer isso:

     · OPERAÇÃO — data da compra. Tempo real, provisório. A venda de agora já
       aparece; a tarifa real dela ainda não existe.
     · REPASSE — data do lançamento. Chega com ~6 dias de atraso e é final.

   Uma tela que mistura os dois TEM que ter número que se mexe. Isso é física do
   dado, não defeito nosso. O defeito é não dizer qual relógio está sendo olhado
   — o seller conclui que a ferramenta é imprecisa quando ela está sendo exata
   sobre um período que ainda não acabou de acontecer.

   ⭐ A cura pra número que muda não é congelar: é NARRAR (ver lib/diarioPeriodo).
   Este arquivo responde a primeira metade: quanto dá pra confiar HOJE.

   Os cortes não são chute:
     · o período ainda correndo → entram vendas até o último minuto
     · 30 dias é a janela de devolução da Amazon BR — até lá, uma venda contada
       pode virar devolução e levar receita, comissão e tarifa embora
   ───────────────────────────────────────────────────────────────────────────── */

export type Maturidade = 'aberto' | 'liquidando' | 'fechado'

export interface SeloMaturidade {
  nivel: Maturidade
  rotulo: string
  /** Por que o número ainda se mexe (ou por que parou). */
  motivo: string
  /** O que dá pra fazer com este número agora. */
  acao: string
  /** Dias desde o fim do período. Negativo = ainda não terminou. */
  diasDesdeFim: number
}

/** Janela de devolução da Amazon BR: até aqui, venda contada ainda pode voltar. */
export const JANELA_DEVOLUCAO_DIAS = 30

const DIA = 86400000

export function maturidadeDoPeriodo(
  periodo: { from?: string | null; to?: string | null } | null | undefined,
  agora: Date = new Date(),
): SeloMaturidade {
  const fim = periodo?.to ? Date.parse(periodo.to) : NaN
  // Sem período não se afirma maturidade nenhuma — trata como aberto, que é a
  // leitura conservadora (o pior caso é o número ainda mexer).
  const diasDesdeFim = isFinite(fim) ? Math.floor((agora.getTime() - fim) / DIA) : -1

  if (diasDesdeFim < 0) {
    return {
      nivel: 'aberto', rotulo: 'Período aberto', diasDesdeFim,
      motivo: 'O período ainda está correndo: entram vendas até o último minuto, e a tarifa real de cada pedido só chega quando a Amazon fecha o repasse, uns 6 dias depois.',
      acao: 'Serve pra acompanhar o ritmo do dia. Não use pra bater o martelo em preço ou compra — o número ainda vai subir e descer sozinho.',
    }
  }
  if (diasDesdeFim < JANELA_DEVOLUCAO_DIAS) {
    return {
      nivel: 'liquidando', rotulo: 'Em liquidação', diasDesdeFim,
      motivo: `As vendas deste período já pararam, mas ele fechou há ${diasDesdeFim} dia${diasDesdeFim === 1 ? '' : 's'}: dentro dos ${JANELA_DEVOLUCAO_DIAS} dias de devolução da Amazon, uma venda contada aqui ainda pode voltar e levar receita, comissão e tarifa junto. Tarifa estimada também vai sendo trocada pela real.`,
      acao: 'Já dá pra decidir com ele, sabendo que o lucro tende a cair um pouco — não a subir. Pra fechar mês com o contador, espere o selo virar verde.',
    }
  }
  return {
    nivel: 'fechado', rotulo: 'Período fechado', diasDesdeFim,
    motivo: `Fechou há ${diasDesdeFim} dias: passou a janela de devolução e o repasse já liquidou tudo. O que está aqui é o que a Amazon pagou.`,
    acao: 'Pode bater o martelo. É este o número que fecha com o extrato e serve pra contabilidade.',
  }
}
