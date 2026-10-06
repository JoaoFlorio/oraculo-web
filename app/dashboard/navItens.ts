// Itens do menu lateral do painel — fonte única (06/10/2026): o DashboardClient monta o menu com eles e a TELA DE
// BLOQUEIO (Paywall) mostra o MESMO menu, todo com cadeado. Item novo no menu? Entra aqui e aparece travado lá também.
export const NAV = [
  { id:'financeiro',  label:'Gestão'            },
  { id:'ads',         label:'Ads Amazon'        },
  { id:'ads-ml',      label:'Ads Mercado Livre' },
  { id:'bestsellers', label:'Mais Vendidos'     },
  { id:'catalogo',    label:'Analisar Catálogo' },
  { id:'saved',       label:'Salvos'            },
  { id:'competitor',  label:'Análise Rival'     },
  { id:'ml-minera',   label:'Mineração ML'      },
  { id:'catalogo-ml', label:'Analisar Catálogo ML' },
  { id:'ml-salvos',   label:'Salvos ML'         },
  { id:'ml-rival',    label:'Análise Rival ML'  },
  { id:'ml-calc',     label:'Calculadora ML'    },
  { id:'agente',      label:'Agente NEO'        },
  { id:'extension',   label:'Extensão'          },
  { id:'tutoriais',   label:'Tutoriais'         },
  { id:'planos',      label:'Planos'            },
  { id:'perfil',      label:'Meu Perfil'        },
]

export const NAV_GROUPS = [
  { group:'Gestão',      ids:['financeiro'] },
  { group:'Ads',         ids:['ads','ads-ml'] },
  { group:'Mineração',   ids:['bestsellers','catalogo','saved','competitor'] },
  { group:'Mercado Livre', ids:['ml-minera','catalogo-ml','ml-salvos','ml-rival','ml-calc'] },
  { group:'Ferramentas', ids:['agente','extension'] },
  { group:'Ajuda',       ids:['tutoriais'] },
  { group:'Conta',       ids:['planos','perfil'] },
]
