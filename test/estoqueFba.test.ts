import test from 'node:test'
import assert from 'node:assert/strict'
import { totaisDoEstoque, valorDeVenda, valorDeMercadoria, precoDoAnuncio, type ItemEstoque } from '../lib/estoqueFba.ts'

const perto = (a: number | null, b: number, tol = 0.011) =>
  assert.ok(a !== null && Math.abs(a - b) < tol, `esperado ~${b}, deu ${a}`)

/* Estoque REAL da conta do João em 03/08/2026, com o preço de anúncio e o CMV
   que o Gestor Seller mostra no mesmo print. É o caso que motivou a mudança. */
const ESTOQUE: ItemEstoque[] = [
  { sku: 'IR-R089-0VF0',  fulfillable: 132, preco: 39.99 },
  { sku: 'Bel-001',       fulfillable: 87,  preco: 49.90 },
  { sku: 'CL-VVB5-X3JX',  fulfillable: 14,  preco: 79.90 },
  { sku: 'DQ-HCP6-A987',  fulfillable: 15,  preco: 499.00 },
  { sku: 'T7-4Z0J-ZWCX',  fulfillable: 12,  preco: 499.00 },
  { sku: 'motinhaRosa',   fulfillable: 8,   preco: 499.99 },
  { sku: 'IG-TFO0-9WJU',  fulfillable: 4,   preco: 149.90 },
  { sku: 'RT-PD8W-5RN2',  fulfillable: 0,   preco: 89.90 },   // ruptura: não soma nada
]
const CMV: Record<string, number> = {
  'IR-R089-0VF0': 16, 'Bel-001': 17, 'CL-VVB5-X3JX': 42,
  'DQ-HCP6-A987': 270, 'T7-4Z0J-ZWCX': 270, 'motinhaRosa': 270, 'IG-TFO0-9WJU': 95,
}

test('valor de venda é preço do anúncio × disponíveis, igual ao Gestor Seller', () => {
  const r = totaisDoEstoque(ESTOQUE, CMV, false)
  perto(valorDeVenda(ESTOQUE[0]), 5278.68)   // 132 × 39,99
  perto(valorDeVenda(ESTOQUE[1]), 4341.30)   // 87 × 49,90
  perto(valorDeVenda(ESTOQUE[5]), 3999.92)   // 8 × 499,99
  perto(r.valorVenda, 5278.68 + 4341.30 + 1118.60 + 7485 + 5988 + 3999.92 + 599.60)
  assert.equal(r.unidades, 272)
})

test('valor de mercadoria é CMV × disponíveis', () => {
  perto(valorDeMercadoria(ESTOQUE[0], CMV['IR-R089-0VF0']), 2112)   // 132 × 16
  perto(valorDeMercadoria(ESTOQUE[3], CMV['DQ-HCP6-A987']), 4050)   // 15 × 270
  const r = totaisDoEstoque(ESTOQUE, CMV, false)
  perto(r.custoTotal, 2112 + 1479 + 588 + 4050 + 3240 + 2160 + 380)
})

/* 🚨 A janela do deploy: painel novo × backend antigo, que não manda `preco`.
   Somar zero diria ao seller que o estoque dele não vale nada. */
test('estoque cheio e nenhum preço vira "—", nunca R$ 0,00', () => {
  const r = totaisDoEstoque([
    { sku: 'A', fulfillable: 132 },
    { sku: 'B', fulfillable: 87 },
  ], { A: 16 }, false)
  assert.equal(r.valorVenda, null)
  assert.equal(r.unidades, 219)
  perto(r.custoTotal, 2112)   // o custo, que não depende do backend, continua
})

test('sem estoque nenhum o valor é 0 de verdade, não desconhecido', () => {
  const r = totaisDoEstoque([{ sku: 'A', fulfillable: 0 }], {}, true)
  assert.equal(r.valorVenda, 0)
})

test('SKU em ruptura não soma nem venda nem custo, e não é contado como faltante', () => {
  const r = totaisDoEstoque([{ sku: 'X', fulfillable: 0, preco: 99 }], {}, true)
  assert.equal(r.valorVenda, 0)
  assert.equal(r.custoTotal, null)
  assert.equal(r.semPreco, 0)   // sem estoque não há valor a descobrir
  assert.equal(r.semCusto, 0)
})

/* 🚨 O DEFEITO QUE MOTIVOU TUDO, reproduzido: o preço vinha de
   `receita ÷ unidades` da DRE DO PERÍODO. No filtro "Hoje" — o padrão da tela —
   só quem vendeu hoje entrava, e o resto do estoque sumia da conta.

   Aqui só o tapete vendeu hoje. A régua antiga enxerga R$ 5.278 de um estoque de
   R$ 28.811; a nova enxerga o estoque inteiro, porque o preço do anúncio não
   conhece período nenhum. */
test('a régua antiga perdia o estoque que não vendeu no período — a nova não', () => {
  const vendeuHoje: Record<string, { units: number; receita: number }> = {
    'IR-R089-0VF0': { units: 3, receita: 119.97 },
  }
  const reguaAntiga = ESTOQUE.reduce((s, it) => {
    const v = vendeuHoje[it.sku]
    return s + (v ? (it.fulfillable || 0) * (v.receita / v.units) : 0)
  }, 0)
  perto(reguaAntiga, 5278.68)

  const agora = totaisDoEstoque(ESTOQUE, CMV, false)
  perto(agora.valorVenda, 28811.10)
  assert.ok((agora.valorVenda as number) > reguaAntiga * 5, 'a régua antiga escondia a maior parte do estoque')
})

test('anúncio sem oferta ativa fica FORA da soma e é contado — não vale R$ 0,00', () => {
  const r = totaisDoEstoque([
    { sku: 'A', fulfillable: 10, preco: 50 },
    { sku: 'B', fulfillable: 10, preco: null },   // a Amazon não respondeu
    { sku: 'C', fulfillable: 10 },                // sem oferta ativa
  ], {}, true)
  perto(r.valorVenda, 500)
  assert.equal(r.semPreco, 2)
})

test('SKU com estoque e sem CMV não zera o custo dos outros, mas avisa', () => {
  const r = totaisDoEstoque([
    { sku: 'A', fulfillable: 10, preco: 50 },
    { sku: 'B', fulfillable: 10, preco: 50 },
  ], { A: 20 }, true)
  perto(r.custoTotal, 200)
  assert.equal(r.semCusto, 1)
})

test('nenhum custo cadastrado devolve null, não zero', () => {
  const r = totaisDoEstoque(ESTOQUE, {}, true)
  assert.equal(r.custoTotal, null)
})

/* ⚠️ Líquido é TUDO OU NADA. Meia medição vira um número que parece comparável
   com o Gestor e não é — a armadilha do card "total sem frete" de 02/08. */
test('líquido desconta comissão e tarifa FBA medidas', () => {
  const r = totaisDoEstoque([
    { sku: 'A', fulfillable: 10, preco: 100, comissao: 12, tarifaFba: 6 },
  ], {}, true)
  perto(r.liquido, 820)
})

test('líquido é null enquanto a tarifa não cobre todos os SKUs', () => {
  const r = totaisDoEstoque([
    { sku: 'A', fulfillable: 10, preco: 100, comissao: 12, tarifaFba: 6 },
    { sku: 'B', fulfillable: 10, preco: 100 },   // não medido
  ], {}, false)
  assert.equal(r.liquido, null)
})

test('produto cuja tarifa passa do preço mostra líquido NEGATIVO, sem piso em zero', () => {
  const r = totaisDoEstoque([
    { sku: 'A', fulfillable: 10, preco: 20, comissao: 3, tarifaFba: 22 },
  ], {}, true)
  perto(r.liquido, -50)   // 10 × (20 − 3 − 22)
})

test('precoDoAnuncio recusa 0, negativo e ausente', () => {
  assert.equal(precoDoAnuncio({ sku: 'A', preco: 0 }), null)
  assert.equal(precoDoAnuncio({ sku: 'A', preco: -1 }), null)
  assert.equal(precoDoAnuncio({ sku: 'A' }), null)
  assert.equal(precoDoAnuncio({ sku: 'A', preco: 39.99 }), 39.99)
})
