import test from 'node:test'
import assert from 'node:assert/strict'
import { margemDoProduto, custosFixosDoPeriodo } from '../lib/margemProduto.ts'

const perto = (a: number | null, b: number, tol = 0.011) =>
  assert.ok(a !== null && Math.abs(a - b) < tol, `esperado ~${b}, deu ${a}`)

/* Período com MIX — é onde o rateio por faturamento se denuncia.
   Donuts: caixa grande e cara de enviar. Meias: leve, mesma receita. */
const LINHAS = {
  receitaBruta: 1000, devolucoes: 0,
  comissao: 120, fba: 60, taxaPrograma: 10, armazenagem: 80, assinatura: 19, outrasTaxas: 5,
}
const DONUTS = { sku: 'CL-VVB5-X3JX', asin: 'B0GMN78Z47', units: 5, receita: 400, comissao: 48, fba: 55, feeMedido: true }
const MEIAS  = { sku: 'MEIA-01', asin: 'B0MEIA01', units: 5, receita: 400, comissao: 32, fba: 5, feeMedido: true }

test('produtos de MESMA receita e caixas opostas pagam FBA diferente', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS })
  const m = margemDoProduto({ linhas: LINHAS, produto: MEIAS })
  assert.equal(d.receitaBruta, m.receitaBruta)
  assert.equal(d.fba, 55); assert.equal(m.fba, 5)
  // o rateio antigo teria dado o mesmo valor pros dois:
  const rateioAntigo = (LINHAS.fba + LINHAS.taxaPrograma) * (400 / 1000)
  perto(rateioAntigo, 28)
  assert.notEqual(d.fba, rateioAntigo)
})

test('comissão é a da categoria do produto, não a média da conta', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS })
  perto(d.comissao! / d.receitaBruta * 100, 12)   // 48/400
  const m = margemDoProduto({ linhas: LINHAS, produto: MEIAS })
  perto(m.comissao! / m.receitaBruta * 100, 8)    // 32/400 — categoria diferente
})

test('assinatura e armazenagem NÃO entram no produto', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS })
  // liq = 400 − 48 − 55 − taxaPrograma(10*0,4=4) − outras(5*0,4=2) = 291
  perto(d.liqMarketplace, 291)
  perto(custosFixosDoPeriodo(LINHAS), 99)   // 80 + 19, mostrados à parte
})

test('a margem do produto não muda porque a mensalidade caiu naquele dia', () => {
  const semAssinatura = { ...LINHAS, assinatura: 0, armazenagem: 0 }
  const a = margemDoProduto({ linhas: LINHAS, produto: DONUTS, custoUnit: 20, ads: 10 })
  const b = margemDoProduto({ linhas: semAssinatura, produto: DONUTS, custoUnit: 20, ads: 10 })
  assert.equal(a.lucro, b.lucro)
  assert.equal(a.margem, b.margem)
})

/* ── Taxa Amazon pra Todos / outras taxas: medidas, não rateadas ───────────── */
test('taxa do repasse é a DO PRODUTO quando vem por SKU', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: { ...DONUTS, taxaPrograma: 3.5, outrasTaxas: 1.2 } })
  assert.equal(d.taxaPrograma, 3.5)   // não 10 × 0,4 = 4 do rateio
  assert.equal(d.outrasTaxas, 1.2)
  assert.equal(d.taxasMedidas, true)
})

test('payload antigo sem os campos volta pro rateio, e se declara', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS })
  assert.equal(d.taxasMedidas, false)
  perto(d.taxaPrograma, 4)            // 10 × (400/1000)
})

test('taxa de SERVIÇO da conta sai do rateio e vira custo fixo', () => {
  // outrasTaxas 5 = 3 de serviço da conta (sem SKU) + 2 por item
  const L = { ...LINHAS, outrasTaxas: 5, outrasConta: 3 }
  const d = margemDoProduto({ linhas: L, produto: DONUTS })
  perto(d.outrasTaxas, 0.8)                       // só os 2 por item, rateados: 2 × 0,4
  perto(custosFixosDoPeriodo(L), 102)             // 80 + 19 + 3
})

/* ── Devolução ─────────────────────────────────────────────────────────────── */
const REEMBOLSOS = [{ sku: 'CL-VVB5-X3JX', units: 2, valor: 160 }]

test('devolução desconta receita E tira o custo das unidades devolvidas', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS, reembolsos: REEMBOLSOS, custoUnit: 20, ads: 10 })
  perto(d.receitaLiquida, 240)      // 400 − 160
  assert.equal(d.unitsLiquidas, 3)  // 5 − 2
  perto(d.cmv, 60)                  // 3 × 20, não 5 × 20
})

test('descontar só a receita criaria prejuízo falso — o teste que prova', () => {
  // 5 un. a R$80, 2 devolvidas, custo R$30/un. Receita líquida 240, taxas 109.
  const certo = margemDoProduto({ linhas: LINHAS, produto: DONUTS, reembolsos: REEMBOLSOS, custoUnit: 30, ads: 0 })
  const errado = certo.lucro! - 2 * 30    // o que daria mantendo o CMV das devolvidas
  assert.ok(errado < 0, `com CMV cheio daria prejuízo (${errado})`)
  assert.ok(certo.lucro! > 0, `com CMV das unidades líquidas dá lucro, deu ${certo.lucro}`)
})

test('imposto não incide sobre venda estornada', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS, reembolsos: REEMBOLSOS, imposto: 4 })
  perto(d.imposto, 9.6)   // 4% de 240, não de 400
})

test('produto sem devolução no período não é afetado', () => {
  const m = margemDoProduto({ linhas: LINHAS, produto: MEIAS, reembolsos: REEMBOLSOS, custoUnit: 20 })
  assert.equal(m.devolucaoValor, 0)
  assert.equal(m.unitsLiquidas, 5)
})

test('a margem cai quando o produto devolve — era isso que escondia o SKU ruim', () => {
  const sem = margemDoProduto({ linhas: LINHAS, produto: DONUTS, custoUnit: 20, ads: 10 })
  const com = margemDoProduto({ linhas: LINHAS, produto: DONUTS, reembolsos: REEMBOLSOS, custoUnit: 20, ads: 10 })
  assert.ok(com.margem! < sem.margem!, `margem tinha que cair: sem=${sem.margem} com=${com.margem}`)
})

/* ── "Não medido" nunca vira zero ───────────────────────────────────────────── */
test('Fees API que não respondeu vira null, não R$0,00', () => {
  const semFee = { ...DONUTS, comissao: null, fba: null, feeMedido: false }
  const d = margemDoProduto({ linhas: LINHAS, produto: semFee, custoUnit: 20, ads: 10 })
  assert.equal(d.comissao, null)
  assert.equal(d.fba, null)
  assert.equal(d.liqMarketplace, null)
  assert.equal(d.lucro, null)
  assert.equal(d.completo, false)
})

test('zero MEDIDO é resposta: FBM não paga FBA', () => {
  const fbm = { ...DONUTS, fba: 0, feeMedido: true }
  const d = margemDoProduto({ linhas: LINHAS, produto: fbm })
  assert.equal(d.fba, 0)
  assert.notEqual(d.fba, null)
  assert.notEqual(d.liqMarketplace, null)
})

test('sem ads medido existe lucro ANTES do ads, mas não lucro final', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS, custoUnit: 20, ads: null })
  assert.notEqual(d.lucroAntesAds, null)
  assert.equal(d.lucro, null)
  assert.equal(d.completo, false)
  assert.notEqual(d.margem, null)   // a margem existe, é a de antes do ads
})

/* ── Reconciliação: a soma dos produtos tem que fechar com a DRE ───────────── */
test('Σ produtos + custos fixos = Líq. do Marketplace da conta', () => {
  const linhas = { ...LINHAS, comissao: 80, fba: 60, taxaPrograma: 10, outrasTaxas: 5 }
  const prods = [
    { sku: 'A', units: 5, receita: 400, comissao: 48, fba: 55, feeMedido: true },
    { sku: 'B', units: 5, receita: 600, comissao: 32, fba: 5, feeMedido: true },
  ]
  const soma = prods.reduce((s, p) => s + (margemDoProduto({ linhas, produto: p }).liqMarketplace || 0), 0)
  const dreConta = linhas.receitaBruta - (linhas.devolucoes || 0)
    - linhas.comissao - linhas.fba - linhas.taxaPrograma - linhas.outrasTaxas
    - linhas.armazenagem - linhas.assinatura
  perto(soma - custosFixosDoPeriodo(linhas), dreConta)
})

/* ⚠️ A INVARIANTE QUE EU QUEBREI EM PRODUÇÃO (28/07): somei o reembolso de estoque
   do FBA dentro do Líq. do Marketplace e ele saiu MAIOR que o faturamento — margem
   de 62,5% num dia de R$389 de venda. O líquido é o que sobra DA VENDA depois da
   parte da Amazon: por definição nunca passa da receita. */
test('Líq. do Marketplace NUNCA passa da receita do produto', () => {
  const casos = [
    { linhas: LINHAS, produto: DONUTS },
    { linhas: LINHAS, produto: MEIAS, reembolsos: REEMBOLSOS },
    { linhas: { ...LINHAS, comissao: 0, fba: 0, taxaPrograma: 0, outrasTaxas: 0 }, produto: { ...DONUTS, comissao: 0, fba: 0 } },
    { linhas: {}, produto: { sku: 'Z', units: 1, receita: 10, comissao: 0, fba: 0, feeMedido: true } },
  ]
  for (const c of casos) {
    const M = margemDoProduto(c)
    if (M.liqMarketplace === null) continue
    assert.ok(M.liqMarketplace <= M.receitaBruta + 0.01,
      `liq ${M.liqMarketplace} > receita ${M.receitaBruta} em ${c.produto.sku}`)
  }
})

test('produto que some do payload não explode', () => {
  const d = margemDoProduto({ linhas: {}, produto: { sku: 'X', units: 0, receita: 0 } })
  assert.equal(d.receitaLiquida, 0)
  assert.equal(d.margem, null)
  assert.equal(d.lucro, null)
})
