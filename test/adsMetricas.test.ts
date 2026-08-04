import test from 'node:test'
import assert from 'node:assert/strict'
import { tacos, acos, roas, conversao, unidadesOrganicas, periodosCasam, linhasPorProduto, linhasPorCampanha, type AdsSku, type AdsCampanha, type ProdutoDre } from '../lib/adsMetricas.ts'

const perto = (a: number | null, b: number, tol = 0.011) =>
  assert.ok(a !== null && Math.abs(a - b) < tol, `esperado ~${b}, deu ${a}`)

/* O TACOS do print do Gestor Seller que motivou a mudança: R$75,25 de custo de
   Ads sobre R$649,69 de faturamento total = 11,58%. */
test('TACOS é gasto sobre o faturamento TOTAL, não sobre a venda por Ads', () => {
  perto(tacos(75.25, 649.69), 11.58)
})

test('TACOS e ACoS respondem perguntas diferentes sobre o mesmo produto', () => {
  // Vendeu R$1.000 no total, R$200 vieram do anúncio, gastou R$30.
  perto(acos(30, 200), 15)    // o anúncio está saudável
  perto(tacos(30, 1000), 3)   // e come pouco da operação: quase tudo é orgânico
})

test('sem faturamento não há porcentagem — null, nunca Infinity nem 0', () => {
  assert.equal(tacos(50, 0), null)
  assert.equal(acos(50, 0), null)
  assert.equal(roas(0, 100), null)
  assert.equal(conversao(3, 0), null)
})

/* 🚨 O TACOS divide o relatório de Ads pela DRE. Quando o espelho diário não
   cobre o intervalo, o Ads cai numa JANELA FIXA e responde por outro período —
   gasto de 30 dias ÷ faturamento de 1 dia daria um TACOS de centenas de %,
   com cara de medido. */
test('períodos diferentes não se dividem', () => {
  const dia = { from: '2026-08-03', to: '2026-08-03' }
  assert.equal(periodosCasam(dia, dia), true)
  assert.equal(periodosCasam({ from: '2026-07-05', to: '2026-08-03' }, dia), false)
  assert.equal(periodosCasam(dia, null), false)
  assert.equal(periodosCasam(dia, { from: '2026-08-03' }), false)   // sem `to` não dá pra afirmar
})

test('sem período casado, as colunas que cruzam Ads e DRE somem — as do Ads ficam', () => {
  const [furadeira] = linhasPorProduto(BYSKU, DRE, false)
  assert.equal(furadeira.name, 'Furadeira e Parafusadeira')   // identificar não depende de período
  assert.equal(furadeira.image, 'furadeira.jpg')
  assert.equal(furadeira.custoAds, 917.60)                    // sai inteiro do Ads
  perto(furadeira.acos, 917.60 / 4646.90 * 100)
  assert.equal(furadeira.fatTotal, null)                      // vem da DRE: some
  assert.equal(furadeira.tacos, null)
  assert.equal(furadeira.unOrganicas, null)
})

test('conversão é pedidos por clique', () => {
  perto(conversao(12, 400), 3)
})

test('pedidos não medidos não viram conversão 0%', () => {
  assert.equal(conversao(null, 400), null)
  assert.equal(conversao(undefined, 400), null)
})

/* 🚨 A Amazon atribui a venda ao clique de até 30 dias antes. Num recorte curto
   o "vendido por Ads" passa do total vendido NO PERÍODO, e a subtração fica
   negativa — não existe unidade orgânica negativa, nem são zero. */
test('unidades orgânicas: total menos Ads, e null quando a conta não fecha', () => {
  assert.equal(unidadesOrganicas(10, 4), 6)
  assert.equal(unidadesOrganicas(10, 10), 0)   // zero legítimo: tudo veio de Ads
  assert.equal(unidadesOrganicas(3, 8), null)  // atribuição de fora do período
  assert.equal(unidadesOrganicas(10, null), null)
  assert.equal(unidadesOrganicas(null, 4), null)
})

/* Dado real da conta do João (30 dias, medido no espelho em 03/08/2026). */
const BYSKU: AdsSku[] = [
  { sku: 'IG-TFO0-9WJU', asin: 'B0G821HRJ9', spend: 917.60, sales: 4646.90, clicks: 1104, impressions: 0, purchases: 31, unidades: 33, campanhas: ['Furadeira palavra chave', 'Furadeira Automatica'] },
  { sku: 'ON-U4M5-HXDE', asin: 'B0GW8PCM4S', spend: 251.08, sales: 119.60, clicks: 263, impressions: 0, purchases: 2, unidades: 2, campanhas: ['pele de rainha PC'] },
]
const DRE: ProdutoDre[] = [
  { sku: 'IG-TFO0-9WJU', asin: 'B0G821HRJ9', name: 'Furadeira e Parafusadeira', image: 'furadeira.jpg', units: 40, receita: 5996.00 },
  { sku: 'ON-U4M5-HXDE', asin: 'B0GW8PCM4S', name: 'Pele de Rainha', image: 'pele.jpg', units: 2, receita: 119.60 },
]

test('a linha do produto traz foto, nome e as duas porcentagens', () => {
  const [furadeira] = linhasPorProduto(BYSKU, DRE)
  assert.equal(furadeira.name, 'Furadeira e Parafusadeira')
  assert.equal(furadeira.image, 'furadeira.jpg')
  perto(furadeira.acos, 917.60 / 4646.90 * 100)    // 19,75% — o anúncio
  perto(furadeira.tacos, 917.60 / 5996.00 * 100)   // 15,30% — a operação
  assert.equal(furadeira.unAds, 33)
  assert.equal(furadeira.unOrganicas, 7)           // 40 vendidas − 33 por Ads
})

test('produto que só vende por Ads tem TACOS igual ao ACoS', () => {
  const [, pele] = linhasPorProduto(BYSKU, DRE)
  perto(pele.acos, 209.93)
  perto(pele.tacos, 209.93)   // faturamento total = faturamento do Ads
  assert.equal(pele.unOrganicas, 0)
})

test('produto anunciado que não vendeu no período: TACOS null, gasto continua', () => {
  const [linha] = linhasPorProduto(
    [{ sku: 'X', asin: 'BX', spend: 217.44, sales: 0, clicks: 227, impressions: 0, purchases: 0 }],
    [],
  )
  assert.equal(linha.custoAds, 217.44)
  assert.equal(linha.tacos, null)
  assert.equal(linha.acos, null)
  assert.equal(linha.roas, 0)   // gastou e não vendeu: retorno zero é medido
})

test('produto casa por ASIN quando o relatório não traz o SKU', () => {
  const [linha] = linhasPorProduto(
    [{ sku: '', asin: 'B0G821HRJ9', spend: 10, sales: 100, clicks: 5, impressions: 0 }],
    DRE,
  )
  assert.equal(linha.name, 'Furadeira e Parafusadeira')
})

test('a lista sai ordenada por quem custa mais', () => {
  const linhas = linhasPorProduto(BYSKU, DRE)
  assert.deepEqual(linhas.map(l => l.sku), ['IG-TFO0-9WJU', 'ON-U4M5-HXDE'])
})

/* 🚨 O vínculo campanha→produto é MEDIDO. Aqui a campanha se chama "teste 3" e
   anuncia a furadeira: qualquer leitura pelo nome erraria. */
const CAMPANHAS: AdsCampanha[] = [
  { campaign: 'teste 3', spend: 598.64, sales: 3447.70, clicks: 664, impressions: 0, purchases: 23,
    produtos: [{ sku: 'IG-TFO0-9WJU', asin: 'B0G821HRJ9', spend: 598.64 }] },
  { campaign: 'Campanha automática', spend: 100, sales: 500, clicks: 200, impressions: 0, purchases: 4,
    produtos: [{ sku: 'IG-TFO0-9WJU', asin: 'B0G821HRJ9', spend: 60 }, { sku: 'ON-U4M5-HXDE', asin: 'B0GW8PCM4S', spend: 40 }] },
]

test('a campanha mostra o produto que o relatório diz, não o que o nome sugere', () => {
  const [t3] = linhasPorCampanha(CAMPANHAS, DRE)
  assert.equal(t3.campaign, 'teste 3')
  assert.deepEqual(t3.produtos.map(p => p.name), ['Furadeira e Parafusadeira'])
  assert.equal(t3.produtos[0].image, 'furadeira.jpg')
})

test('campanha com vários produtos devolve todos — nenhum some da tela', () => {
  const [, auto] = linhasPorCampanha(CAMPANHAS, DRE)
  assert.equal(auto.produtos.length, 2)
  perto(auto.conversao, 2)   // 4 pedidos ÷ 200 cliques
})

test('campanha sem vínculo medido não inventa produto', () => {
  const [linha] = linhasPorCampanha([{ campaign: 'SB banner', spend: 50, sales: 0, clicks: 10, impressions: 0 }], DRE)
  assert.deepEqual(linha.produtos, [])
  assert.equal(linha.pedidos, null)
  assert.equal(linha.acos, null)
})
