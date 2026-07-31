/* ─────────────────────────────────────────────────────────────────────────────
   OS TRÊS RELÓGIOS DA GESTÃO, NA BARRA DE NAVEGAÇÃO.

   A Gestão responde três perguntas diferentes, cada uma com o SEU relógio:

     · VENDAS    — "como está indo". Relógio da operação (data da compra). Abre
                   no Resumo, que é a capa da Gestão, e segue nos pedidos um a um
                   e no estoque. Carrega o SELO DE MATURIDADE por causa do Resumo.
     · RESULTADO — "quais produtos rendem". Mesmo relógio, olhado por produto:
                   Curva ABC, Ads e Analítico. Também provisório, também com selo.
     · REPASSES  — "quanto caiu na conta". Data do lançamento, ~6 dias de atraso,
                   final. É o único que fecha com o extrato do banco.

   ⭐ O contraste que resolve a confusão do seller é ESTIMADO × BANCO. Vendas e
   Resultado dividem o mesmo relógio e o dizem com o mesmo selo; Repasses é o
   que se compara com o extrato — e é por isso que ele vive sozinho.

   ⚠️ Até aqui as dez telas viviam numa fila só. O seller via "Resumo" (lucro
   estimado, que muda) e "Repasses" (dinheiro pago, que não muda) como dois
   botões idênticos lado a lado, comparava os dois, achava números diferentes e
   concluía que um estava errado — quando os dois estavam certos, respondendo
   perguntas diferentes. `lib/maturidadePeriodo.ts` já dizia isso DENTRO da tela;
   a barra continuava dizendo que tudo ali era a mesma coisa.

   ⭐ Agora o relógio aparece ANTES do clique.

   AJUSTES é o quarto grupo e de propósito NÃO tem relógio: ali não se consulta
   número nenhum — se informa custo, se exporta CSV, se sobe planilha.
   ───────────────────────────────────────────────────────────────────────────── */

/** As telas. A ordem aqui é a ordem dentro do grupo. */
export const TABS = [
  { id: 'resumo',  label: 'Resumo',        icon: 'ti-layout-dashboard' },
  { id: 'vendas',  label: 'Pedidos',       icon: 'ti-cash' },
  { id: 'abc',     label: 'Curva ABC',     icon: 'ti-chart-bar' },
  { id: 'ads',     label: 'Ads',           icon: 'ti-speakerphone' },
  { id: 'analit',  label: 'Analítico',     icon: 'ti-chart-dots' },
  { id: 'gerenc',  label: 'Gerenciamento', icon: 'ti-adjustments' },
  { id: 'fulfil',  label: 'Estoque FBA',   icon: 'ti-truck-delivery' },
  { id: 'relat',   label: 'Relatório',     icon: 'ti-file-text' },
  { id: 'repasse', label: 'Repasses',      icon: 'ti-arrow-bar-to-down' },
  { id: 'dre',     label: 'DRE por planilha', icon: 'ti-building-bank' },
] as const

export type TabId = (typeof TABS)[number]['id']

export interface GrupoGestao {
  id: string
  label: string
  icon: string
  /** Legenda fixa do relógio, quando ele não depende do período. */
  relogio: string | null
  /** O grupo mostra o SELO do período (número que ainda se mexe)?
   *  ⚠️ Flag, não `id==='result'` chumbado na tela: mover uma tela de grupo já
   *  mudou quem carrega número estimado uma vez, e a barra tem que acompanhar. */
  usaSelo: boolean
  /** Uma frase: o que se responde aqui. Aparece abaixo da barra. */
  pergunta: string
  /** ⭐ O tipo TabId faz o compilador recusar id que não existe em TABS. */
  tabs: TabId[]
}

export const GRUPOS: GrupoGestao[] = [
  {
    id: 'venda', label: 'Vendas', icon: 'ti-shopping-cart',
    // O Resumo mora aqui: é a capa da Gestão e a tela que abre. Como ele traz
    // lucro estimado, o grupo carrega o selo — dizer "tempo real" com o Resumo
    // dentro seria a barra mentindo sobre o próprio conteúdo.
    relogio: null, usaSelo: true,
    pergunta: 'Como está indo: o panorama do período, os pedidos um a um e o estoque.',
    tabs: ['resumo', 'vendas', 'fulfil'],
  },
  {
    id: 'result', label: 'Resultado', icon: 'ti-chart-pie',
    relogio: null, usaSelo: true,
    pergunta: 'Quais produtos rendem de verdade — e quais só parecem render.',
    tabs: ['abc', 'ads', 'analit'],
  },
  {
    id: 'banco', label: 'Repasses', icon: 'ti-building-bank',
    relogio: 'fecha com o banco', usaSelo: false,
    pergunta: 'Quanto a Amazon realmente depositou, por repasse.',
    tabs: ['repasse'],
  },
  {
    id: 'ajuste', label: 'Ajustes', icon: 'ti-settings',
    relogio: null, usaSelo: false,
    pergunta: 'Seus custos, suas exportações e a DRE por planilha.',
    tabs: ['gerenc', 'relat', 'dre'],
  },
]

/** A tela que a Gestão abre. É a capa: o panorama do período. */
export const TELA_INICIAL: TabId = 'resumo'

/** Tela → grupo. Derivado, nunca escrito à mão: duas listas divergem. */
export const TAB_GRUPO: Record<string, string> = {}
for (const g of GRUPOS) for (const id of g.tabs) TAB_GRUPO[id] = g.id

/** Grupo em que a tela vive. Cai no Resultado se a tela for desconhecida —
 *  ela é a capa da Gestão, e sumir da navegação seria pior que abrir errado. */
export function grupoDaTab(tabId: string): string {
  return TAB_GRUPO[tabId] || 'result'
}

export function grupoPorId(id: string): GrupoGestao | undefined {
  return GRUPOS.find(g => g.id === id)
}

/** A tela padrão do grupo: a primeira da lista. */
export function primeiraDoGrupo(id: string): string {
  return grupoPorId(id)?.tabs[0] || 'resumo'
}

export function tabPorId(id: string) {
  return TABS.find(tb => tb.id === id)
}

/** Que tela abrir ao clicar num GRUPO.
 *
 *  Volta pra última tela visitada ali — quem estava mexendo no Ads, foi conferir
 *  um pedido e voltou pro Resultado cai de novo no Ads, não no Resumo.
 *
 *  ⚠️ A memória é validada contra o corte ATUAL. Uma tela lembrada que mudou de
 *  grupo abriria o grupo errado: o cliente clica em "Resultado" e a barra acende
 *  "Vendas", porque o grupo é derivado da tela. Guardar posição não pode virar
 *  autoridade sobre onde a tela mora. */
export function telaAoEntrarNoGrupo(gid: string, ultimas: Record<string, string>): string {
  const lembrada = ultimas[gid]
  if (lembrada && TAB_GRUPO[lembrada] === gid) return lembrada
  return primeiraDoGrupo(gid)
}
