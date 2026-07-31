import test from 'node:test'
import assert from 'node:assert/strict'
import { TABS, GRUPOS, TAB_GRUPO, TELA_INICIAL, grupoDaTab, primeiraDoGrupo, telaAoEntrarNoGrupo } from '../lib/navegacaoGestao.ts'

/* ⚠️ O RISCO QUE ESTE ARQUIVO EXISTE PRA TRAVAR:
   com a navegação em dois níveis, uma tela nova em TABS que ninguém pôs num
   grupo simplesmente NÃO APARECE — sem erro, sem log, sem tela quebrada. O
   `tsc` não pega: o tipo TabId recusa id inventado no grupo, mas não exige que
   todo id esteja em algum. Some em silêncio, que é o pior jeito de sumir. */

test('toda tela está em exatamente um grupo', () => {
  for (const tb of TABS) {
    const donos = GRUPOS.filter(g => (g.tabs as readonly string[]).includes(tb.id))
    assert.equal(donos.length, 1,
      `"${tb.label}" (${tb.id}) está em ${donos.length} grupos — precisa estar em exatamente 1`)
  }
})

test('nenhum grupo aponta pra tela que não existe', () => {
  const ids = new Set(TABS.map(tb => tb.id))
  for (const g of GRUPOS) for (const id of g.tabs) {
    assert.ok(ids.has(id), `grupo "${g.label}" aponta pra tela inexistente: ${id}`)
  }
})

test('ids são únicos nos dois níveis', () => {
  assert.equal(new Set(TABS.map(t => t.id)).size, TABS.length, 'id de tela repetido')
  assert.equal(new Set(GRUPOS.map(g => g.id)).size, GRUPOS.length, 'id de grupo repetido')
  // Grupo e tela vivem em espaços diferentes, mas um id compartilhado ("repasse"
  // grupo × "repasse" tela) confunde quem lê o `goTab(x)` da próxima vez.
  const colisao = GRUPOS.map(g => g.id).filter(id => TABS.some(t => t.id === id))
  assert.deepEqual(colisao, [], `id usado como grupo E como tela: ${colisao.join(', ')}`)
})

test('o mapa tela→grupo cobre todas as telas', () => {
  assert.equal(Object.keys(TAB_GRUPO).length, TABS.length)
  for (const tb of TABS) assert.ok(TAB_GRUPO[tb.id], `${tb.id} fora do mapa`)
})

test('tela desconhecida cai no Resultado em vez de sumir', () => {
  assert.equal(grupoDaTab('tela-que-nao-existe'), 'result')
})

test('cada grupo abre numa tela real', () => {
  for (const g of GRUPOS) {
    const primeira = primeiraDoGrupo(g.id)
    assert.ok(TABS.some(t => t.id === primeira),
      `grupo "${g.label}" abre em "${primeira}", que não é tela`)
  }
})

/* ── VOLTAR PRO GRUPO ─────────────────────────────────────────────────────── */

test('sem memória, o grupo abre na primeira tela', () => {
  assert.equal(telaAoEntrarNoGrupo('venda', {}), 'resumo')
  assert.equal(telaAoEntrarNoGrupo('result', {}), 'abc')
  assert.equal(telaAoEntrarNoGrupo('ajuste', {}), 'gerenc')
})

test('com memória, volta pra onde o cliente estava', () => {
  assert.equal(telaAoEntrarNoGrupo('result', { result: 'ads' }), 'ads')
  assert.equal(telaAoEntrarNoGrupo('venda', { venda: 'fulfil' }), 'fulfil')
})

test('memória de OUTRO grupo não vaza', () => {
  // Lembrar "ads" no grupo Vendas abriria uma tela do Resultado — e como o grupo
  // é DERIVADO da tela, a barra acenderia "Resultado" logo após o clique em
  // "Vendas". Guardar posição não pode virar autoridade sobre onde a tela mora.
  assert.equal(telaAoEntrarNoGrupo('venda', { venda: 'ads' }), 'resumo')
  assert.equal(telaAoEntrarNoGrupo('result', { result: 'repasse' }), 'abc')
})

test('tela que não existe mais na memória não trava a navegação', () => {
  assert.equal(telaAoEntrarNoGrupo('result', { result: 'aba-de-2025' }), 'abc')
})

/* ⭐ A Gestão abre na CAPA, e a capa tem que estar no primeiro botão da barra:
   abrir numa tela do segundo grupo deixaria o primeiro apagado no primeiro
   segundo de uso, e é o primeiro botão que ensina por onde se começa. */
test('a Gestão abre no Resumo, e o Resumo está no primeiro grupo', () => {
  assert.equal(TELA_INICIAL, 'resumo')
  assert.equal(grupoDaTab(TELA_INICIAL), GRUPOS[0].id)
  assert.equal(primeiraDoGrupo(GRUPOS[0].id), TELA_INICIAL)
})

/* ⭐ O CORTE É POR RELÓGIO, e o teste guarda essa decisão contra o próximo que
   for "só arrumar a ordem": Repasses é o único que fecha com o banco e não pode
   dividir grupo com número estimado — foi exatamente essa vizinhança que fazia o
   seller comparar duas respostas certas e concluir que uma estava errada. */
test('Repasses não divide grupo com número estimado', () => {
  const banco = GRUPOS.find(g => g.id === 'banco')!
  assert.deepEqual(banco.tabs, ['repasse'])
})

test('quem tem número estimado mostra o selo; quem não tem, não finge que tem', () => {
  // As telas que carregam lucro/margem estimados, uma a uma. Toda tela dessa
  // lista tem que viver num grupo com selo — senão a barra anuncia um relógio
  // que a tela de dentro desmente.
  const ESTIMAM = ['resumo', 'abc', 'ads', 'analit']
  for (const id of ESTIMAM) {
    const g = GRUPOS.find(x => (x.tabs as readonly string[]).includes(id))!
    assert.equal(g.usaSelo, true, `"${id}" estima lucro mas o grupo "${g.label}" não mostra o selo`)
  }
  // Repasse é medido, não estimado: selo ali sugeriria que o número ainda muda.
  assert.equal(GRUPOS.find(g => g.id === 'banco')!.usaSelo, false)
  assert.equal(GRUPOS.find(g => g.id === 'banco')!.relogio, 'fecha com o banco')
  // Ajustes não consulta número nenhum — relógio ali seria decoração.
  assert.equal(GRUPOS.find(g => g.id === 'ajuste')!.usaSelo, false)
  assert.equal(GRUPOS.find(g => g.id === 'ajuste')!.relogio, null)
})

test('grupo com selo não declara relógio fixo — os dois brigariam', () => {
  for (const g of GRUPOS) {
    if (g.usaSelo) assert.equal(g.relogio, null, `"${g.label}" tem selo E texto fixo`)
  }
})
