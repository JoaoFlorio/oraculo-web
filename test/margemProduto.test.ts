import test from 'node:test'
import assert from 'node:assert/strict'
import { margemDoProduto, custosFixosDoPeriodo, totaisDoPeriodo, ajustesDoProduto, ajustesDoPedido } from '../lib/margemProduto.ts'

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
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS, imposto: 0 })
  const m = margemDoProduto({ linhas: LINHAS, produto: MEIAS, imposto: 0 })
  assert.equal(d.receitaBruta, m.receitaBruta)
  assert.equal(d.fba, 55); assert.equal(m.fba, 5)
  // o rateio antigo teria dado o mesmo valor pros dois:
  const rateioAntigo = (LINHAS.fba + LINHAS.taxaPrograma) * (400 / 1000)
  perto(rateioAntigo, 28)
  assert.notEqual(d.fba, rateioAntigo)
})

test('comissão é a da categoria do produto, não a média da conta', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS, imposto: 0 })
  perto(d.comissao! / d.receitaBruta * 100, 12)   // 48/400
  const m = margemDoProduto({ linhas: LINHAS, produto: MEIAS, imposto: 0 })
  perto(m.comissao! / m.receitaBruta * 100, 8)    // 32/400 — categoria diferente
})

test('assinatura e armazenagem NÃO entram no produto', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS, imposto: 0 })
  // liq = 400 − 48 − 55 − taxaPrograma(10*0,4=4) − outras(5*0,4=2) = 291
  perto(d.liqMarketplace, 291)
  perto(custosFixosDoPeriodo(LINHAS), 99)   // 80 + 19, mostrados à parte
})

test('a margem do produto não muda porque a mensalidade caiu naquele dia', () => {
  const semAssinatura = { ...LINHAS, assinatura: 0, armazenagem: 0 }
  const a = margemDoProduto({ linhas: LINHAS, produto: DONUTS, custoUnit: 20, ads: 10, imposto: 0 })
  const b = margemDoProduto({ linhas: semAssinatura, produto: DONUTS, custoUnit: 20, ads: 10, imposto: 0 })
  assert.equal(a.lucro, b.lucro)
  assert.equal(a.margem, b.margem)
})

/* ── Taxa Amazon pra Todos / outras taxas: medidas, não rateadas ───────────── */
test('taxa do repasse é a DO PRODUTO quando vem por SKU', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: { ...DONUTS, taxaPrograma: 3.5, outrasTaxas: 1.2 }, imposto: 0 })
  assert.equal(d.taxaPrograma, 3.5)   // não 10 × 0,4 = 4 do rateio
  assert.equal(d.outrasTaxas, 1.2)
  assert.equal(d.taxasMedidas, true)
})

test('payload antigo sem os campos volta pro rateio, e se declara', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS, imposto: 0 })
  assert.equal(d.taxasMedidas, false)
  perto(d.taxaPrograma, 4)            // 10 × (400/1000)
})

test('taxa de SERVIÇO da conta sai do rateio e vira custo fixo', () => {
  // outrasTaxas 5 = 3 de serviço da conta (sem SKU) + 2 por item
  const L = { ...LINHAS, outrasTaxas: 5, outrasConta: 3 }
  const d = margemDoProduto({ linhas: L, produto: DONUTS, imposto: 0 })
  perto(d.outrasTaxas, 0.8)                       // só os 2 por item, rateados: 2 × 0,4
  perto(custosFixosDoPeriodo(L), 102)             // 80 + 19 + 3
})

/* ── Devolução ─────────────────────────────────────────────────────────────── */
const REEMBOLSOS = [{ sku: 'CL-VVB5-X3JX', units: 2, valor: 160 }]

test('devolução desconta receita E tira o custo das unidades devolvidas', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS, reembolsos: REEMBOLSOS, custoUnit: 20, ads: 10, imposto: 0 })
  perto(d.receitaLiquida, 240)      // 400 − 160
  assert.equal(d.unitsLiquidas, 3)  // 5 − 2
  perto(d.cmv, 60)                  // 3 × 20, não 5 × 20
})

test('descontar só a receita criaria prejuízo falso — o teste que prova', () => {
  // 5 un. a R$80, 2 devolvidas, custo R$30/un. Receita líquida 240, taxas 109.
  const certo = margemDoProduto({ linhas: LINHAS, produto: DONUTS, reembolsos: REEMBOLSOS, custoUnit: 30, ads: 0, imposto: 0 })
  const errado = certo.lucro! - 2 * 30    // o que daria mantendo o CMV das devolvidas
  assert.ok(errado < 0, `com CMV cheio daria prejuízo (${errado})`)
  assert.ok(certo.lucro! > 0, `com CMV das unidades líquidas dá lucro, deu ${certo.lucro}`)
})

test('imposto não incide sobre venda estornada', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS, reembolsos: REEMBOLSOS, imposto: 4 })
  perto(d.imposto, 9.6)   // 4% de 240, não de 400
})

test('produto sem devolução no período não é afetado', () => {
  const m = margemDoProduto({ linhas: LINHAS, produto: MEIAS, reembolsos: REEMBOLSOS, custoUnit: 20, imposto: 0 })
  assert.equal(m.devolucaoValor, 0)
  assert.equal(m.unitsLiquidas, 5)
})

test('a margem cai quando o produto devolve — era isso que escondia o SKU ruim', () => {
  const sem = margemDoProduto({ linhas: LINHAS, produto: DONUTS, custoUnit: 20, ads: 10, imposto: 0 })
  const com = margemDoProduto({ linhas: LINHAS, produto: DONUTS, reembolsos: REEMBOLSOS, custoUnit: 20, ads: 10, imposto: 0 })
  assert.ok(com.margem! < sem.margem!, `margem tinha que cair: sem=${sem.margem} com=${com.margem}`)
})

/* ── "Não medido" nunca vira zero ───────────────────────────────────────────── */
test('Fees API que não respondeu vira null, não R$0,00', () => {
  const semFee = { ...DONUTS, comissao: null, fba: null, feeMedido: false }
  const d = margemDoProduto({ linhas: LINHAS, produto: semFee, custoUnit: 20, ads: 10, imposto: 0 })
  assert.equal(d.comissao, null)
  assert.equal(d.fba, null)
  assert.equal(d.liqMarketplace, null)
  assert.equal(d.lucro, null)
  assert.equal(d.completo, false)
})

test('zero MEDIDO é resposta: FBM não paga FBA', () => {
  const fbm = { ...DONUTS, fba: 0, feeMedido: true }
  const d = margemDoProduto({ linhas: LINHAS, produto: fbm, imposto: 0 })
  assert.equal(d.fba, 0)
  assert.notEqual(d.fba, null)
  assert.notEqual(d.liqMarketplace, null)
})

test('sem ads medido existe lucro ANTES do ads, mas não lucro final', () => {
  const d = margemDoProduto({ linhas: LINHAS, produto: DONUTS, custoUnit: 20, ads: null, imposto: 0 })
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
  const soma = prods.reduce((s, p) => s + (margemDoProduto({ linhas, produto: p, imposto: 0 }).liqMarketplace || 0), 0)
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
    { linhas: LINHAS, produto: DONUTS, imposto: 4 },
    { linhas: LINHAS, produto: MEIAS, reembolsos: REEMBOLSOS, imposto: 4 },
    { linhas: { ...LINHAS, comissao: 0, fba: 0, taxaPrograma: 0, outrasTaxas: 0 }, produto: { ...DONUTS, comissao: 0, fba: 0 }, imposto: 0 },
    { linhas: {}, produto: { sku: 'Z', units: 1, receita: 10, comissao: 0, fba: 0, feeMedido: true }, imposto: 9 },
  ]
  for (const c of casos) {
    const M = margemDoProduto(c)
    if (M.liqMarketplace === null) continue
    assert.ok(M.liqMarketplace <= M.receitaBruta + 0.01,
      `liq ${M.liqMarketplace} > receita ${M.receitaBruta} em ${c.produto.sku}`)
  }
})

/* ⚠️ O KPI DA CAPA TEM QUE SER A SOMA DO DETALHE (28/07, pego pelo João comparando
   com o Gestor Seller): o Resumo calculava o CMV por fora com unidade BRUTA e não
   descontava o imposto no "Lucro Bruto". Deu margem 27,8% onde a referência dele
   dava 23,8% — a diferença era exatamente os 4% de alíquota. */
test('totaisDoPeriodo soma o MESMO que cada produto mostra', () => {
  const prods = [DONUTS, MEIAS]
  const custo = { [DONUTS.sku]: 20, [MEIAS.sku]: 30 }
  const T = totaisDoPeriodo(LINHAS, prods, REEMBOLSOS, custo, 4)
  const somaCmv = prods.reduce((s, p) =>
    s + margemDoProduto({ linhas: LINHAS, produto: p, reembolsos: REEMBOLSOS, custoUnit: custo[p.sku], imposto: 4 }).cmv, 0)
  const somaImp = prods.reduce((s, p) =>
    s + margemDoProduto({ linhas: LINHAS, produto: p, reembolsos: REEMBOLSOS, custoUnit: custo[p.sku], imposto: 4 }).imposto, 0)
  perto(T.cmv, somaCmv); perto(T.imposto, somaImp)
})

test('o CMV do total NÃO cobra a unidade devolvida', () => {
  const T = totaisDoPeriodo(LINHAS, [DONUTS], REEMBOLSOS, { [DONUTS.sku]: 20 }, 0)
  assert.equal(T.cmv, 60)               // 3 líquidas × 20, não 5 × 20 = 100
  assert.equal(T.unidadesLiquidas, 3)
})

test('Lucro Bruto da capa = Σ lucro dos produtos − custos fixos', () => {
  // Fixture FECHADA de propósito: o total da conta é exatamente a soma dos dois
  // produtos (800 de receita, comissão 48+32, FBA 55+5). Só assim a reconciliação
  // é testável — com produto faltando na lista, a diferença é o produto ausente.
  const L = { receitaBruta: 800, comissao: 80, fba: 60, taxaPrograma: 10, outrasTaxas: 5, armazenagem: 80, assinatura: 19 }
  const prods = [DONUTS, MEIAS]
  const custo = { [DONUTS.sku]: 20, [MEIAS.sku]: 30 }
  const T = totaisDoPeriodo(L, prods, undefined, custo, 4)
  // Como a capa monta: líquido da CONTA − cmv − imposto
  const liqConta = L.receitaBruta - L.comissao - L.fba - L.taxaPrograma - L.outrasTaxas - L.armazenagem - L.assinatura
  const capa = liqConta - T.cmv - T.imposto
  // Como o detalhe monta, produto a produto
  const detalhe = prods.reduce((s, p) =>
    s + (margemDoProduto({ linhas: L, produto: p, custoUnit: custo[p.sku], imposto: 4 }).lucroAntesAds || 0), 0)
  // Batem a menos dos custos fixos, que não são atribuídos a produto nenhum.
  perto(capa, detalhe - custosFixosDoPeriodo(L))
})

/* ── Lançamento avulso por pedido (crédito extra / custo eventual) ─────────── */
const AJUSTES = [
  { id: 'a1', orderId: 'P-1', sku: 'CL-VVB5-X3JX', tipo: 'credito' as const, nome: 'Reembolso de avaria', valor: 25, data: '2026-07-10T12:00:00.000Z' },
  { id: 'a2', orderId: 'P-1', sku: 'CL-VVB5-X3JX', tipo: 'custo' as const, nome: 'Frete de devolução', valor: 40, data: '2026-07-10T12:00:00.000Z' },
  { id: 'a3', orderId: 'P-9', sku: 'MEIA-01', tipo: 'custo' as const, nome: 'Reembalagem', valor: 8, data: '2026-06-02T12:00:00.000Z' },
]

test('lançamento entra no lucro mas NÃO no custo unitário', () => {
  const aj = ajustesDoProduto(AJUSTES, 'CL-VVB5-X3JX')
  const sem = margemDoProduto({ linhas: LINHAS, produto: DONUTS, custoUnit: 20, imposto: 0 })
  const com = margemDoProduto({ linhas: LINHAS, produto: DONUTS, custoUnit: 20, imposto: 0, ajustes: aj })
  assert.equal(com.cmv, sem.cmv, 'o CMV do produto não pode mudar')
  perto(com.lucroAntesAds, (sem.lucroAntesAds as number) + 25 - 40)
  assert.equal(com.credito, 25); assert.equal(com.custoEventual, 40)
})

test('lançamento fica no PERÍODO do pedido, não no de hoje', () => {
  const julho = ajustesDoProduto(AJUSTES, 'MEIA-01', '2026-07-01T00:00:00Z', '2026-07-31T23:59:59Z')
  assert.equal(julho.custo, 0, 'o de junho não pode aparecer em julho')
  const junho = ajustesDoProduto(AJUSTES, 'MEIA-01', '2026-06-01T00:00:00Z', '2026-06-30T23:59:59Z')
  assert.equal(junho.custo, 8)
})

test('lançamento de um SKU não vaza pro outro', () => {
  assert.equal(ajustesDoProduto(AJUSTES, 'MEIA-01').credito, 0)
  assert.equal(ajustesDoProduto(AJUSTES, 'CL-VVB5-X3JX').custo, 40)
})

test('ajustesDoPedido devolve só os daquele pedido', () => {
  assert.equal(ajustesDoPedido(AJUSTES, 'P-1').length, 2)
  assert.equal(ajustesDoPedido(AJUSTES, 'P-9').length, 1)
  assert.equal(ajustesDoPedido(AJUSTES, 'NAO-EXISTE').length, 0)
})

test('o total do período soma os lançamentos dos produtos', () => {
  const T = totaisDoPeriodo(LINHAS, [DONUTS, MEIAS], undefined, { [DONUTS.sku]: 20, [MEIAS.sku]: 30 }, 0, AJUSTES)
  assert.equal(T.credito, 25)
  assert.equal(T.custoEventual, 48)   // 40 do donuts + 8 das meias
})

test('produto que some do payload não explode', () => {
  const d = margemDoProduto({ linhas: {}, produto: { sku: 'X', units: 0, receita: 0 }, imposto: 0 })
  assert.equal(d.receitaLiquida, 0)
  assert.equal(d.margem, null)
  assert.equal(d.lucro, null)
})
