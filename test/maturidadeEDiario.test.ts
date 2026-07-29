import test from 'node:test'
import assert from 'node:assert/strict'
import { maturidadeDoPeriodo, JANELA_DEVOLUCAO_DIAS } from '../lib/maturidadePeriodo.ts'
import { snapshotDoPeriodo, narrarMudancas, chaveDoPeriodo } from '../lib/diarioPeriodo.ts'

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

/* ── DIÁRIO ────────────────────────────────────────────────────────────────── */

const JUNHO = p('2026-06-01T00:00:00-03:00', '2026-06-30T23:59:59-03:00')
const base = { faturamento: 20000, devolucoes: 500, comissao: 2400, fba: 1200, unidades: 210, lucro: 5800 }
const antes = snapshotDoPeriodo(JUNHO, base, new Date('2026-07-26T14:00:00-03:00'))

test('⭐ o caso que fazia a precisão parecer defeito', () => {
  // Nenhuma venda nova, e mesmo assim o lucro caiu: duas devoluções entraram e a
  // tarifa real substituiu a estimativa. Sem narrar, isso é a ferramenta errando.
  const agora = snapshotDoPeriodo(JUNHO, { ...base, devolucoes: 689, fba: 1231, lucro: 5611 }, AGORA)
  const d = narrarMudancas(antes, agora)
  assert.ok(d)
  assert.equal(d!.deltaLucro, -189)
  assert.equal(d!.linhas.length, 2)
  assert.match(d!.linhas[0].texto, /189,00 de devolução/)
  assert.match(d!.linhas[1].texto, /tarifa FBA real substituiu a estimativa/)
  assert.ok(d!.linhas.every(l => l.sinal === 'desce'))
})

test('venda nova é narrada como venda, não como estimativa trocada', () => {
  const agora = snapshotDoPeriodo(JUNHO, { ...base, faturamento: 20340, unidades: 213, comissao: 2441, lucro: 6050 }, AGORA)
  const d = narrarMudancas(antes, agora)!
  assert.match(d.linhas[0].texto, /entraram R\$ 340,00 de venda \(3 unidades\)/)
  assert.match(d.linhas[1].texto, /comissão subiu/)
  assert.doesNotMatch(d.linhas[1].texto, /substituiu a estimativa/)
  assert.equal(d.deltaLucro, 250)
})

test('não se narra período contra período diferente', () => {
  const julho = snapshotDoPeriodo(p('2026-07-01T00:00:00-03:00', '2026-07-31T23:59:59-03:00'), base, AGORA)
  assert.equal(narrarMudancas(antes, julho), null)
})

test('centavos não viram frase', () => {
  const agora = snapshotDoPeriodo(JUNHO, { ...base, faturamento: 20000.2, fba: 1200.3 }, AGORA)
  assert.equal(narrarMudancas(antes, agora), null)
})

test('sem visita anterior não há o que narrar', () => {
  assert.equal(narrarMudancas(null, snapshotDoPeriodo(JUNHO, base, AGORA)), null)
})

test('lucro que era desconhecido não vira variação inventada', () => {
  // O seller cadastrou o CMV entre uma visita e outra: o lucro "apareceu", mas
  // isso não é o período ter mudado.
  const semCusto = snapshotDoPeriodo(JUNHO, { ...base, lucro: null }, new Date('2026-07-26T14:00:00-03:00'))
  const comCusto = snapshotDoPeriodo(JUNHO, { ...base, devolucoes: 689, lucro: 5611 }, AGORA)
  const d = narrarMudancas(semCusto, comCusto)!
  assert.equal(d.deltaLucro, null, 'não existe "variação" contra um lucro que não existia')
  assert.equal(d.linhas.length, 1)
})

test('devolução revertida sobe o lucro e é narrada assim', () => {
  const agora = snapshotDoPeriodo(JUNHO, { ...base, devolucoes: 300, lucro: 6000 }, AGORA)
  const d = narrarMudancas(antes, agora)!
  assert.equal(d.linhas[0].sinal, 'sobe')
  assert.match(d.linhas[0].texto, /revertidos/)
})

test('a chave do período é from|to', () => {
  assert.equal(chaveDoPeriodo(JUNHO), '2026-06-01T00:00:00-03:00|2026-06-30T23:59:59-03:00')
  assert.equal(chaveDoPeriodo(null), '|')
})
