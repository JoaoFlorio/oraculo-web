// Visual novo do painel: liberado pra todos em 06/10/2026, então é sempre true. Mantido como hook pra não mexer
// nas telas (cada uma ainda tem os dois ramos, novo e antigo). Sempre true também no servidor: a página já nasce
// no layout novo, sem piscar o antigo na hidratação. Pra aposentar o ramo antigo, remover o `if (novo)` tela a tela.
export function useVisualNovo(): boolean {
  return true
}
