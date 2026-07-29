import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { totaisDoPeriodo, type AjustePedido } from '../lib/margemProduto.ts'

/* ⚠️ ESTE ARQUIVO TEM UM GÊMEO NO BACKEND.

   `lib/margemProduto.ts` daqui e `src/lib/margemProduto.ts` do `oraculo-backend`
   são o MESMO arquivo, byte a byte — é o que faz o push das 20h, o NEO e esta
   tela responderem o mesmo lucro. Antes o backend "espelhava a regra a regra", e
   espelho envelhece: quando o lançamento avulso de pedido nasceu aqui, o espelho
   não soube dele e o push passou a anunciar um lucro que a tela não confirmava.

   Se você mudou a regra de um lado, copie o arquivo por cima do outro e rode
   `npm test` nos DOIS antes de subir. No servidor de build o irmão não existe e
   o teste se declara pulado. */

const aqui = dirname(fileURLToPath(import.meta.url))
const MEU = resolve(aqui, '../lib/margemProduto.ts')
const IRMAO = resolve(aqui, '../../oraculo-backend/src/lib/margemProduto.ts')

test('o margemProduto.ts dos dois repos é o MESMO arquivo', (t) => {
  if (!existsSync(IRMAO)) {
    t.skip(`oraculo-backend não está neste computador (${IRMAO}) — nada a comparar`)
    return
  }
  assert.equal(readFileSync(MEU, 'utf8'), readFileSync(IRMAO, 'utf8'),
    'A regra de margem divergiu entre os repos. Copie o arquivo alterado por cima do outro ' +
    'e rode `npm test` nos DOIS antes de subir.')
})

/* Os totais que a CAPA consome. O crédito e o custo eventual saíam daqui e a capa
   não os usava: cada card de produto contava o lançamento e o KPI logo acima
   deles não. A soma dos produtos não fechava com o total, que é exatamente o
   defeito que esta base existe pra tornar impossível. */
const LINHAS = { receitaBruta: 1000, comissao: 120, fba: 60, taxaPrograma: 10, armazenagem: 80, assinatura: 19 }
const PRODUTOS = [
  { sku: 'DONUTS', units: 5, receita: 400, comissao: 48, fba: 55, feeMedido: true },
  { sku: 'MEIAS', units: 5, receita: 400, comissao: 32, fba: 5, feeMedido: true },
]
const AJUSTES: AjustePedido[] = [
  { id: '1', orderId: 'P-1', sku: 'DONUTS', tipo: 'credito', nome: 'Reembolso de avaria', valor: 30, data: '2026-07-10T12:00:00Z' },
  { id: '2', orderId: 'P-2', sku: 'MEIAS', tipo: 'custo', nome: 'Frete de devolução', valor: 12, data: '2026-07-15T12:00:00Z' },
]
const PERIODO = { from: '2026-07-01T00:00:00-03:00', to: '2026-07-31T23:59:59-03:00' }

test('os lançamentos avulsos chegam nos totais do período', () => {
  const T = totaisDoPeriodo(LINHAS, PRODUTOS, undefined, { DONUTS: 20, MEIAS: 15 }, 8, AJUSTES, PERIODO)
  assert.equal(T.credito, 30)
  assert.equal(T.custoEventual, 12)
  assert.equal(T.cmv, 175)
})

test('lançamento de outro mês não entra no total do período', () => {
  const fora: AjustePedido[] = [{ ...AJUSTES[0], data: '2026-06-10T12:00:00Z' }]
  const T = totaisDoPeriodo(LINHAS, PRODUTOS, undefined, { DONUTS: 20, MEIAS: 15 }, 8, fora, PERIODO)
  assert.equal(T.credito, 0)
})
