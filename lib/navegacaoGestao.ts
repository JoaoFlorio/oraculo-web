/* ─────────────────────────────────────────────────────────────────────────────
   OS TRÊS RELÓGIOS DA GESTÃO, NA BARRA DE NAVEGAÇÃO.

   ⚠️ Até aqui as dez telas viviam numa FILA SÓ, com scroll horizontal: dez
   pílulas iguais, sem hierarquia, metade delas fora da tela no celular.

   Agora são quatro grupos, cada um com uma pergunta:

     · VENDAS    — "como está indo". Abre no Resumo, que é a capa da Gestão, e
                   segue nos pedidos um a um e no estoque.
     · RESULTADO — "o que sobrou". Curva ABC e Analítico (o período por produto)
                   mais os Repasses (o que a Amazon depositou de fato).
     · ADS       — tela única, de propósito: o anúncio é frente de trabalho
                   própria e vai crescer. Enterrá-lo como quarta sub-aba de
                   Resultado esconderia justamente o que mais vai mudar.
     · AJUSTES   — onde se INFORMA em vez de consultar: custo, CSV, planilha.

   ⚠️ A barra mostra só os NOMES. A maturidade do período (🟡 aberto · 🟠 em
   liquidação · 🟢 fechado) continua viva onde ela explica o que significa: no
   selo do Resumo, clicável, com o motivo e o que dá pra fazer com o número.
   Repetir o rótulo em dois botões da barra virava ruído — dizia "em liquidação"
   duas vezes lado a lado sem nunca dizer o que isso quer dizer.
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
  /** Uma frase: o que se responde aqui. Aparece abaixo da barra. */
  pergunta: string
  /** ⭐ O tipo TabId faz o compilador recusar id que não existe em TABS. */
  tabs: TabId[]
}

export const GRUPOS: GrupoGestao[] = [
  {
    id: 'venda', label: 'Vendas', icon: 'ti-shopping-cart',
    // O Resumo mora aqui: é a capa da Gestão e a tela que abre.
    pergunta: 'Como está indo: o panorama do período, os pedidos um a um e o estoque.',
    tabs: ['resumo', 'vendas', 'fulfil'],
  },
  {
    id: 'result', label: 'Resultado', icon: 'ti-chart-pie',
    pergunta: 'Quais produtos rendem de verdade — e quanto a Amazon depositou.',
    tabs: ['abc', 'analit', 'repasse'],
  },
  {
    // ⚠️ id 'anuncio', não 'ads': 'ads' já é o id da TELA, e grupo com o mesmo
    // id de uma tela confunde quem for ler o `goTab(x)` da próxima vez.
    id: 'anuncio', label: 'Ads', icon: 'ti-speakerphone',
    pergunta: 'Quanto o anúncio custou e o que ele trouxe de volta.',
    tabs: ['ads'],
  },
  {
    id: 'ajuste', label: 'Ajustes', icon: 'ti-settings',
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
