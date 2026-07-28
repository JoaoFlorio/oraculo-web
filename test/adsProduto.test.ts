import test from 'node:test'
import assert from 'node:assert/strict'
import { adsDoProduto, temAdsPorSku, adsSemVenda } from '../lib/adsProduto.ts'

// Conta do João, 27–28/07/2026 — gasto real da Ads API por campanha.
// Total da conta: R$130,09. O Tapete (SKU Bel-001) gastou R$7,74 + R$1,78.
const RELATORIO = {
  ready: true, adsPorSku: true, spend: 130.09,
  bySku: [
    { sku: 'Avespa-Rosa',   asin: 'B0AVROSA', spend: 22.28 },
    { sku: 'Avespa-Branca', asin: 'B0AVBRAN', spend: 23.65 },
    { sku: 'Avespa-Verde',  asin: 'B0AVVERD', spend: 37.75 },
    { sku: 'Fura-001',      asin: 'B0FURA01', spend: 28.15 },
    { sku: 'Pele-001',      asin: 'B0PELE01', spend: 8.74 },
    { sku: 'Bel-001',       asin: 'B0DV9T8TPP', spend: 9.52 },
  ],
}
// A DRE do mesmo período: só Tapete e Furadeira venderam.
const PRODUTOS = [
  { sku: 'Bel-001', asin: 'B0DV9T8TPP', receita: 149.70 },
  { sku: 'Fura-001', asin: 'B0FURA01', receita: 149.90 },
]

test('o produto paga o ads DELE, não o da conta inteira', () => {
  assert.equal(adsDoProduto(RELATORIO, 'Bel-001', 'B0DV9T8TPP').valor, 9.52)
})

test('margem do Tapete sai de 10,2% pra 36,7%', () => {
  const receita = 149.70, comissao = 17.38, fba = 7.89, imposto = 5.99, cmv = 54.00
  const ads = adsDoProduto(RELATORIO, 'Bel-001', 'B0DV9T8TPP').valor as number
  const margem = (receita - comissao - fba - ads - imposto - cmv) / receita * 100
  assert.ok(Math.abs(margem - 36.7) < 0.2, `esperado ~36,7%, deu ${margem.toFixed(1)}%`)
})

test('casa por ASIN quando o SKU do anúncio difere do SKU do pedido', () => {
  assert.equal(adsDoProduto(RELATORIO, 'SKU-QUE-NAO-EXISTE', 'B0DV9T8TPP').valor, 9.52)
})

test('produto sem campanha custa ZERO — e zero é resposta, não ausência', () => {
  const r = adsDoProduto(RELATORIO, 'Bel-999', 'B0NADA')
  assert.equal(r.valor, 0)
  assert.notEqual(r.valor, null)
})

/* ⭐ O CONTRATO QUE O JOÃO PEDIU: sem dado por produto, a resposta é "não sei".
   Rateio faria a margem de um produto depender do gasto dos OUTROS. */
test('sem dado por SKU devolve null — NUNCA um rateio', () => {
  const semSku = { ready: true, spend: 130.09 }
  assert.equal(temAdsPorSku(semSku), false)
  assert.equal(adsDoProduto(semSku, 'Bel-001', 'B0DV9T8TPP').valor, null)
})

test('relatório sem a flag adsPorSku não é usado nem se tiver bySku', () => {
  const meio = { ready: true, spend: 130.09, bySku: RELATORIO.bySku }
  assert.equal(adsDoProduto(meio, 'Bel-001').valor, null)
})

test('espelho ainda gerando: não inventa número', () => {
  for (const r of [{ ready: false }, null, undefined, {}]) {
    assert.equal(adsDoProduto(r as any, 'Bel-001', 'B0X').valor, null)
  }
})

test('a sangria: ads em produto que não vendeu', () => {
  const s = adsSemVenda(RELATORIO, PRODUTOS)
  // Avespas (22,28+23,65+37,75) + Pele (8,74) = 92,42
  assert.equal(s.total, 92.42)
  assert.equal(s.itens[0].sku, 'Avespa-Verde')          // maior sangria primeiro
  assert.ok(!s.itens.some(i => i.sku === 'Bel-001'))    // quem vendeu não entra
})

test('sem dado por SKU não afirma sangria de ninguém', () => {
  assert.deepEqual(adsSemVenda({ ready: true, spend: 130.09 }, PRODUTOS), { total: 0, itens: [] })
})

test('produto que vendeu casado por ASIN não é acusado de sangria', () => {
  const s = adsSemVenda(RELATORIO, [{ sku: 'OUTRO-SKU', asin: 'B0DV9T8TPP', receita: 149.7 }])
  assert.ok(!s.itens.some(i => i.sku === 'Bel-001'), 'casou por ASIN, não é sangria')
})

test('a soma por produto nunca estoura o total da conta', () => {
  const soma = RELATORIO.bySku.reduce((a, x) => a + x.spend, 0)
  assert.ok(soma <= RELATORIO.spend + 0.01, `soma ${soma} > total ${RELATORIO.spend}`)
})
