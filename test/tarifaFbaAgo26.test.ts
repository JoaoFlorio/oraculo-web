import test from 'node:test'
import assert from 'node:assert/strict'
import { impactoTarifaAgo26, VIRADA_AGO26 } from '../lib/tarifaFbaAgo26.ts'

const perto = (a: number | null, b: number, tol = 0.011) =>
  assert.ok(a !== null && Math.abs(a - b) < tol, `esperado ~${b}, deu ${a}`)

const ANTES = new Date('2026-07-29T10:00:00-03:00')
const DEPOIS = new Date('2026-08-02T10:00:00-03:00')

/* Uma conta com os quatro casos que existem de verdade:
   - FURADEIRA: cara e isenta hoje  → é quem paga a conta nova
   - CANECA:    entre 79 e 100      → já pagava R$6, não muda nada
   - CHAVEIRO:  abaixo de R$79      → a campanha nunca valeu, não muda nada
   - TAPETE:    caro e JÁ pagando   → não está na campanha, não muda nada */
const FURADEIRA = { sku: 'FUR-01', nome: 'Furadeira', precoMedio: 189, units: 46, fbaUnit: 0, comissaoPct: 0.15 }
const CANECA    = { sku: 'CAN-01', nome: 'Caneca',    precoMedio: 89,  units: 30, fbaUnit: 6, comissaoPct: 0.15 }
const CHAVEIRO  = { sku: 'CHA-01', nome: 'Chaveiro',  precoMedio: 39,  units: 90, fbaUnit: 5.85, comissaoPct: 0.15 }
const TAPETE    = { sku: 'TAP-01', nome: 'Tapete',    precoMedio: 149, units: 20, fbaUnit: 15.45, comissaoPct: 0.15 }

test('só entra na conta quem é isento HOJE e vende acima de R$79', () => {
  const r = impactoTarifaAgo26([FURADEIRA, CANECA, CHAVEIRO, TAPETE], 8, ANTES)
  assert.deepEqual(r.afetados.map(a => a.sku), ['FUR-01'])
  assert.equal(r.jaPagavam, 2, 'caneca e tapete já pagam tarifa — não mudam')
})

test('⭐ a furadeira: R$0 vira R$6 e são R$276 no volume do mês', () => {
  const [f] = impactoTarifaAgo26([FURADEIRA], 8, ANTES).afetados
  assert.equal(f.fbaHoje, 0)
  assert.equal(f.fbaDepois, 6)
  assert.equal(f.impactoPeriodo, 276)
})

test('o reajuste não é R$6 — comissão e imposto comem parte do aumento', () => {
  // 15% de comissão + 8% de imposto: de cada real de reajuste sobram R$0,77.
  // Subir R$6 devolveria só R$4,62 e o seller sairia perdendo mesmo "tendo repassado".
  const [f] = impactoTarifaAgo26([FURADEIRA], 8, ANTES).afetados
  perto(f.reajusteSugerido, 6 / 0.77)   // R$7,79
  perto(f.precoSugerido, 189 + 6 / 0.77)
})

test('quem já paga tarifa parcial só sente a diferença', () => {
  // Tarifa medida de R$2 num produto de R$120: sobe R$4, não R$6.
  const meio = { sku: 'M-1', precoMedio: 120, units: 10, fbaUnit: 2, comissaoPct: 0.12 }
  const [m] = impactoTarifaAgo26([meio], 0, ANTES).afetados
  assert.equal(m.deltaUnit, 4)
  assert.equal(m.impactoPeriodo, 40)
})

test('tarifa NÃO MEDIDA não vira zero — vira ressalva', () => {
  // O FBM não paga tarifa FBA de verdade; "não sei" entrando como zero
  // inventaria um impacto que não existe.
  const semDado = { sku: 'X-1', precoMedio: 150, units: 5, fbaUnit: null, comissaoPct: 0.15 }
  const r = impactoTarifaAgo26([semDado], 8, ANTES)
  assert.equal(r.afetados.length, 0)
  assert.equal(r.semMedicao, 1)
})

test('a virada é na meia-noite exata, e o aviso troca de tempo verbal', () => {
  const umMsAntes = new Date(VIRADA_AGO26.getTime() - 1)
  assert.equal(impactoTarifaAgo26([FURADEIRA], 8, umMsAntes).jaVirou, false)
  assert.equal(impactoTarifaAgo26([FURADEIRA], 8, VIRADA_AGO26).jaVirou, true)
  assert.equal(impactoTarifaAgo26([FURADEIRA], 8, DEPOIS).jaVirou, true)
})

test('ordena pelo que dói mais, não por preço', () => {
  const caroPoucoGiro = { sku: 'A', precoMedio: 500, units: 2, fbaUnit: 0, comissaoPct: 0.15 }
  const baratoMuitoGiro = { sku: 'B', precoMedio: 105, units: 80, fbaUnit: 0, comissaoPct: 0.15 }
  const r = impactoTarifaAgo26([caroPoucoGiro, baratoMuitoGiro], 8, ANTES)
  assert.deepEqual(r.afetados.map(a => a.sku), ['B', 'A'])
  assert.equal(r.totalPeriodo, 492)
  assert.equal(r.unidadesAfetadas, 82)
})

test('sem preço ou sem venda no período não entra', () => {
  const r = impactoTarifaAgo26([
    { sku: 'S1', precoMedio: 0, units: 10, fbaUnit: 0, comissaoPct: 0.15 },
    { sku: 'S2', precoMedio: 150, units: 0, fbaUnit: 0, comissaoPct: 0.15 },
  ], 8, ANTES)
  assert.equal(r.afetados.length, 0)
  assert.equal(r.totalPeriodo, 0)
})

test('comissão + imposto acima de 100% não inventam preço mágico', () => {
  const impossivel = { sku: 'I-1', precoMedio: 120, units: 1, fbaUnit: 0, comissaoPct: 0.95 }
  const [i] = impactoTarifaAgo26([impossivel], 10, ANTES).afetados
  assert.equal(i.reajusteSugerido, null)
  assert.equal(i.precoSugerido, null)
  assert.equal(i.impactoPeriodo, 6, 'o impacto continua real mesmo sem preço que resolva')
})
