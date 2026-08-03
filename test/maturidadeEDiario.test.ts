import test from 'node:test'
import assert from 'node:assert/strict'
import { maturidadeDoPeriodo, JANELA_DEVOLUCAO_DIAS } from '../lib/maturidadePeriodo.ts'
import { snapshotDoPeriodo, narrarMudancas, reconciliar, decompor, normalizarMarcos, chaveDoPeriodo, type ParcelasPeriodo, type Causa } from '../lib/diarioPeriodo.ts'

/* A Gestão mistura o relógio da OPERAÇÃO (data da compra, provisório) com o do
   REPASSE (data do lançamento, ~6 dias de atraso, final). Número que se mexe é
   física do dado. O defeito era não dizer qual relógio o cliente está olhando,
   nem o que mudou desde a última vez que ele olhou. */

const AGORA = new Date('2026-07-29T15:00:00-03:00')
const p = (from: string, to: string) => ({ from, to })

test('período ainda correndo é ABERTO', () => {
  const s = maturidadeDoPeriodo(p('2026-07-01T00:00:00-03:00', '2026-07-31T23:59:59-03:00'), AGORA)
  assert.equal(s.nivel, 'aberto')
  assert.ok(s.diasDesdeFim < 0)
})

test('fechou ontem: EM LIQUIDAÇÃO, porque devolução ainda chega', () => {
  const s = maturidadeDoPeriodo(p('2026-06-01T00:00:00-03:00', '2026-07-28T23:59:59-03:00'), AGORA)
  assert.equal(s.nivel, 'liquidando')
  assert.equal(s.diasDesdeFim, 0)
  assert.match(s.acao, /cair/)
})

test(`passada a janela de ${JANELA_DEVOLUCAO_DIAS} dias, o período FECHA`, () => {
  const s = maturidadeDoPeriodo(p('2026-05-01T00:00:00-03:00', '2026-05-31T23:59:59-03:00'), AGORA)
  assert.equal(s.nivel, 'fechado')
  assert.match(s.acao, /martelo/)
})

test('a virada acontece no dia exato, não por volta dele', () => {
  const umDiaAntes = new Date(AGORA.getTime() - (JANELA_DEVOLUCAO_DIAS - 1) * 86400000)
  const noLimite = new Date(AGORA.getTime() - JANELA_DEVOLUCAO_DIAS * 86400000)
  assert.equal(maturidadeDoPeriodo({ from: '', to: umDiaAntes.toISOString() }, AGORA).nivel, 'liquidando')
  assert.equal(maturidadeDoPeriodo({ from: '', to: noLimite.toISOString() }, AGORA).nivel, 'fechado')
})

test('sem período informado, assume ABERTO — a leitura conservadora', () => {
  assert.equal(maturidadeDoPeriodo(null, AGORA).nivel, 'aberto')
  assert.equal(maturidadeDoPeriodo({ from: '', to: '' }, AGORA).nivel, 'aberto')
})

/* ── DIÁRIO E RECONCILIAÇÃO ────────────────────────────────────────────────── */

const JUNHO = p('2026-06-01T00:00:00-03:00', '2026-06-30T23:59:59-03:00')
const VISTA_ANTES = new Date('2026-07-26T14:00:00-03:00')

/** O lucro pela decomposição — é a MESMA soma que a reconciliação desfaz. */
const lucroDe = (x: Omit<ParcelasPeriodo, 'lucro'>): number =>
  Math.round((x.receitaBruta - x.devolucoes - x.comissao - x.fba - x.taxaPrograma
    - x.armazenagem - x.assinatura - x.outrasTaxas - x.cmv - x.imposto
    + x.credito - x.custoEventual) * 100) / 100

const PARC: Omit<ParcelasPeriodo, 'lucro'> = {
  receitaBruta: 30000, devolucoes: 300, comissao: 3600, fba: 1800, taxaPrograma: 150,
  armazenagem: 200, assinatura: 19, outrasTaxas: 50, cmv: 15000, imposto: 2400,
  credito: 0, custoEventual: 0, unidades: 210,
  // Identidade: precoTabela − desconto = receitaBruta.
  precoTabela: 30500, desconto: 500,
}
const foto = (mudanca: Partial<Omit<ParcelasPeriodo, 'lucro'>>, mat: 'aberto'|'liquidando'|'fechado' = 'liquidando', quando = AGORA) => {
  const x = { ...PARC, ...mudanca }
  return snapshotDoPeriodo(JUNHO, { ...x, lucro: lucroDe(x) }, mat, quando)
}
const antes = foto({}, 'liquidando', VISTA_ANTES)

test('⭐ o caso que fazia a precisão parecer defeito', () => {
  // Nenhuma venda nova, e mesmo assim o lucro caiu: duas devoluções entraram e a
  // tarifa real substituiu a estimativa. Sem narrar, isso é a ferramenta errando.
  const agora = foto({ devolucoes: 300 + 189, fba: 1800 + 31 })
  const d = narrarMudancas(antes, agora)
  assert.ok(d)
  assert.equal(d!.diferenca, -220)
  // ⭐ A propriedade que importa: o que se anuncia é o que se explica.
  assert.equal(d!.fecha, true, 'anunciar um total e explicar um pedaço era o defeito')
  const frases = d!.causas.map(c => c.frase).join(' | ')
  assert.match(frases, /189,00 de devolução/)
  assert.match(frases, /tarifa FBA real substituiu a estimativa/)
  // ⭐ O sinal da frase é o efeito no LUCRO. A tarifa SUBIU 31, então tirou 31 —
  // e mostrar "+31" ao lado de uma seta vermelha era o que confundia.
  assert.match(frases, /tarifa FBA real substituiu a estimativa: −R\$ 31,00/)
  assert.ok(d!.causas.every(l => l.valor < 0))
})

test('venda nova é narrada como venda, não como estimativa trocada', () => {
  const agora = foto({ receitaBruta: 30340, unidades: 213, comissao: 3641 })
  const d = narrarMudancas(antes, agora)!
  const frases = d.causas.map(c => c.frase).join(' | ')
  assert.match(frases, /entraram R\$ 340,00 de venda \(3 unidades\)/)
  assert.match(frases, /comissão subiu/)
  assert.doesNotMatch(frases, /substituiu a estimativa/)
  assert.equal(d.fecha, true)
})

test('não se narra período contra período diferente', () => {
  const julho = snapshotDoPeriodo(p('2026-07-01T00:00:00-03:00', '2026-07-31T23:59:59-03:00'), { ...PARC, lucro: lucroDe(PARC) }, 'aberto', AGORA)
  assert.equal(narrarMudancas(antes, julho), null)
  assert.equal(reconciliar(antes, julho), null)
})

test('centavos não viram frase', () => {
  const agora = foto({ receitaBruta: 30000.2, fba: 1800.3 })
  assert.equal(narrarMudancas(antes, agora), null)
})

test('sem visita anterior não há o que narrar', () => {
  assert.equal(narrarMudancas(null, foto({})), null)
  assert.equal(reconciliar(null, foto({})), null)
})

test('lucro que era desconhecido não vira variação inventada', () => {
  // O seller cadastrou o CMV entre uma visita e outra: o lucro "apareceu", mas
  // isso não é o período ter mudado.
  const semCusto = snapshotDoPeriodo(JUNHO, { ...PARC, cmv: 0, lucro: null }, 'liquidando', VISTA_ANTES)
  const comCusto = foto({ devolucoes: 489 })
  const d = narrarMudancas(semCusto, comCusto)!
  assert.equal(d.diferenca, null, 'não existe "variação" contra um lucro que não existia')
  // E a reconciliação recusa: sem lucro dos dois lados não há o que decompor.
  assert.equal(reconciliar(semCusto, comCusto), null)
})

test('devolução revertida sobe o lucro e é narrada assim', () => {
  const agora = foto({ devolucoes: 100 })
  const d = narrarMudancas(antes, agora)!
  assert.ok(d.causas[0].valor > 0)
  assert.match(d.causas[0].frase, /revertidos/)
  assert.equal(d.fecha, true)
})

test('a chave do período é from|to', () => {
  assert.equal(chaveDoPeriodo(JUNHO), '2026-06-01T00:00:00-03:00|2026-06-30T23:59:59-03:00')
  assert.equal(chaveDoPeriodo(null), '|')
})

/* ═══ RECONCILIAÇÃO ═══════════════════════════════════════════════════════════
   O requisito absoluto: as causas SOMAM a diferença. Uma reconciliação que não
   fecha é pior que nenhuma — quem confere descobre dinheiro sem explicação e
   conclui que a ferramenta esconde coisa. */

test('⭐⭐ A RECONCILIAÇÃO FECHA — a soma das causas é a diferença do lucro', () => {
  // O cenário do handoff: estimou, fechou menor, e a diferença tem nome.
  const agora = foto({ devolucoes: 300 + 120, fba: 1800 + 45, outrasTaxas: 50 + 24 })
  const rec = reconciliar(antes, agora)!
  assert.equal(rec.diferenca, -189)
  assert.equal(rec.fecha, true)
  assert.equal(rec.residuo, 0)
  assert.equal(r2(rec.causas.reduce((s, c) => s + c.valor, 0)), rec.diferenca)
  assert.equal(rec.causas.length, 3)
  assert.ok(rec.causas.every(c => c.autor === 'amazon'), 'nada disso foi o seller')
  // Ordenado pelo que mais doeu.
  assert.equal(rec.causas[0].valor, -120)
})

test('⭐⭐ FECHA mesmo quando TUDO muda de uma vez', () => {
  const agora = foto({
    receitaBruta: 31500, devolucoes: 780, comissao: 3780, fba: 1955, taxaPrograma: 168,
    armazenagem: 240, assinatura: 38, outrasTaxas: 91, cmv: 15900, imposto: 2496,
    credito: 30, custoEventual: 12, unidades: 219,
  })
  const rec = reconciliar(antes, agora)!
  assert.equal(rec.fecha, true, `resíduo de ${rec.residuo} — a decomposição perdeu uma parcela`)
  assert.equal(r2(rec.causas.reduce((s, c) => s + c.valor, 0)), rec.diferenca)
  assert.equal(rec.lucroEstimado, lucroDe(PARC))
})

test('⭐ o que o SELLER mudou não é creditado à Amazon', () => {
  // Só o CMV mudou: o lucro caiu porque ele informou o custo, não porque a Amazon
  // cobrou algo. Dizer "o repasse fechou menor" aqui seria mentira.
  const agora = foto({ cmv: 15900 })
  const rec = reconciliar(antes, agora)!
  assert.equal(rec.causas.length, 1)
  assert.equal(rec.causas[0].autor, 'voce')
  assert.match(rec.causas[0].rotulo, /você informou/)
  assert.equal(rec.causas[0].valor, -900)
  assert.equal(rec.fecha, true)
})

test('⭐ resíduo é DECLARADO, nunca somado a uma causa', () => {
  // Snapshot inconsistente de propósito: o lucro não corresponde às parcelas.
  // A função tem que admitir que não explicou tudo em vez de forçar o fechamento.
  const torto = snapshotDoPeriodo(JUNHO, { ...PARC, lucro: lucroDe(PARC) - 500 }, 'liquidando', AGORA)
  const rec = reconciliar(antes, torto)!
  assert.equal(rec.diferenca, -500)
  assert.equal(rec.causas.length, 0, 'nenhuma parcela mudou')
  assert.equal(rec.residuo, -500)
  assert.equal(rec.fecha, false)
})

test('estimativa tirada de período JÁ FECHADO não é estimativa', () => {
  const jaFechado = snapshotDoPeriodo(JUNHO, { ...PARC, lucro: lucroDe(PARC) }, 'fechado', VISTA_ANTES)
  assert.equal(reconciliar(jaFechado, foto({ devolucoes: 500 })), null)
})

test('snapshot do formato antigo é recusado, não interpretado como zero', () => {
  // Sem as parcelas, atribuir a diferença a qualquer causa seria invenção.
  const v1: any = { chave: chaveDoPeriodo(JUNHO), visto: VISTA_ANTES.toISOString(), faturamento: 30000, devolucoes: 300, comissao: 3600, fba: 1800, unidades: 210, lucro: 5800 }
  assert.equal(reconciliar(v1, foto({ devolucoes: 500 })), null)
  // Mas o DIÁRIO continua funcionando com ele — foto velha ainda serve pra narrar.
  assert.ok(narrarMudancas(v1, foto({ devolucoes: 500 })))
})

test('nada mudou: reconcilia com zero causas e fecha', () => {
  const rec = reconciliar(antes, foto({}))!
  assert.equal(rec.diferenca, 0)
  assert.equal(rec.causas.length, 0)
  assert.equal(rec.fecha, true)
})

const r2 = (n: number) => Math.round(n * 100) / 100

/* ── MIGRAÇÃO DO QUE JÁ ESTÁ GRAVADO ─────────────────────────────────────── */

test('foto solta do formato antigo vira os dois marcos', () => {
  const solta = { chave: chaveDoPeriodo(JUNHO), visto: VISTA_ANTES.toISOString(), faturamento: 30000, lucro: 5800 }
  const m = normalizarMarcos({ [solta.chave]: solta })
  assert.equal(m[solta.chave].primeiro.visto, solta.visto)
  assert.equal(m[solta.chave].ultimo.visto, solta.visto)
})

test('formato novo passa intacto', () => {
  const a = foto({}, 'aberto', VISTA_ANTES), b = foto({}, 'liquidando')
  const m = normalizarMarcos({ [a.chave]: { primeiro: a, ultimo: b } })
  assert.equal(m[a.chave].primeiro.visto, a.visto)
  assert.equal(m[a.chave].ultimo.visto, b.visto)
})

test('metadata corrompido não derruba a Gestão', () => {
  assert.deepEqual(normalizarMarcos(null), {})
  assert.deepEqual(normalizarMarcos('lixo'), {})
  assert.deepEqual(normalizarMarcos({ x: 42, y: null, z: {} }), {})
})

/* ═══════════════════════════════════════════════════════════════════════════
   🚨 CORREÇÃO DE DESCONTO NÃO É VENDA CANCELADA (03/08/2026)

   O Oráculo passou a enxergar o CUPOM, que nunca tinha sido lido — o relatório
   da Amazon é cego a ele. A receita de julho caiu R$439 na conta do dono, e o
   diário, que só via `receitaBruta`, narrava:
       "saíram R$439 de faturamento — venda cancelada ou devolvida deixou de contar"
   Nenhuma venda foi cancelada. Acusar a Amazon de desfazer venda que ela nunca
   desfez é o pior erro que este arquivo pode cometer.
   ═══════════════════════════════════════════════════════════════════════════ */

test('🚨 desconto que passou a ser contado NÃO vira "venda cancelada"', () => {
  // O caso real: o desconto sobe 689, o preço de tabela sobe 249 (frete e
  // embrulho que vieram na mesma leitura), a receita cai 440. Nada foi cancelado.
  const antes = foto({})
  const depois = foto({ precoTabela: 30749, desconto: 1189, receitaBruta: 29560 })
  const dec = decompor(antes, depois)

  const cancelou = dec.causas.find((c: Causa) => c.rotulo === 'Vendas que deixaram de contar')
  assert.equal(cancelou, undefined, 'nenhuma venda saiu — não pode aparecer essa causa')

  const desc = dec.causas.find((c: Causa) => c.rotulo === 'Desconto que passou a ser contado')!
  assert.ok(desc, 'a causa certa tem que aparecer')
  assert.equal(desc.valor, -689, 'e com o efeito real no lucro')
  assert.equal(desc.autor, 'voce', 'o desconto é do seller, não da Amazon')

  const venda = dec.causas.find((c: Causa) => c.rotulo === 'Vendas que entraram depois')!
  assert.equal(venda.valor, 249, 'o que entrou de venda de verdade, separado')
  assert.equal(dec.fecha, true, 'e a decomposição continua fechando')
})

test('venda cancelada de VERDADE continua sendo narrada como tal', () => {
  // Sem mexer no desconto: a tabela cai junto com a receita.
  const dec = decompor(foto({}), foto({ precoTabela: 30000, receitaBruta: 29500 }))
  const c = dec.causas.find((x: Causa) => x.rotulo === 'Vendas que deixaram de contar')!
  assert.ok(c, 'aqui a venda saiu mesmo')
  assert.equal(c.valor, -500)
  assert.equal(c.autor, 'amazon')
})

test('snapshot ANTIGO (sem as parcelas) volta ao comportamento de antes', () => {
  // Sem `precoTabela`/`desconto` dos dois lados não dá pra separar — e inventar
  // a separação seria pior que a narrativa antiga.
  const antes: any = { ...foto({}) }; delete antes.precoTabela; delete antes.desconto
  const depois: any = { ...foto({ receitaBruta: 29560 }) }; delete depois.precoTabela; delete depois.desconto
  const dec = decompor(antes, depois)
  assert.ok(dec.causas.find((c: Causa) => c.rotulo === 'Vendas que deixaram de contar'))
  assert.equal(dec.causas.find((c: Causa) => c.rotulo === 'Desconto que passou a ser contado'), undefined)
})

test('🚨 na virada de formato a causa de VENDA cala — e só ela', () => {
  // v2 (sem as parcelas) × v3: a variação da receita não é separável, e a queda
  // de uma correção de dado sairia como "venda cancelada". Uma vez por período.
  const antes: any = { ...foto({}) }
  antes.v = 2; delete antes.precoTabela; delete antes.desconto
  const depois = foto({ precoTabela: 30749, desconto: 1189, receitaBruta: 29560, comissao: 3900 })
  const dec = decompor(antes, depois)
  assert.equal(dec.causas.find((c: Causa) => c.rotulo.startsWith('Vendas')), undefined,
    'não se acusa a Amazon de desfazer venda que ela não desfez')
  assert.ok(dec.causas.find((c: Causa) => c.rotulo.includes('Comissão')),
    'mas as OUTRAS causas seguem narradas — a guarda é estreita')
  assert.equal(dec.fecha, false, 'e a diferença vai pro resíduo, declarada')
  // Da segunda visita em diante os dois lados são v3 e a separação volta.
  const dec2 = decompor(foto({}), depois)
  assert.ok(dec2.causas.find((c: Causa) => c.rotulo === 'Desconto que passou a ser contado'))
})

test('a reconciliação ACEITA o formato novo (v3), não só o v2', () => {
  // `completo` testava `v === 2`: bumpar a versão faria a reconciliação sumir da
  // tela de todo mundo justamente no deploy que melhorou o dado.
  const r = reconciliar(foto({}, 'aberto'), foto({ comissao: 3900 }, 'fechado'))
  assert.ok(r, 'v3 tem que reconciliar')
})
