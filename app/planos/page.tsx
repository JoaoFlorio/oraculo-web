import { redirect } from 'next/navigation'

// 05/10/2026: a página de planos do app foi aposentada — "conheça os planos" (login, teste grátis, /register e links
// antigos) leva direto aos planos do site novo, que é a vitrine oficial. A versão antiga está no histórico do git
// (commit anterior a esta mudança). Os planos DENTRO do painel (aba Planos / Paywall) não passam por aqui.
const PLANOS_DO_SITE = 'https://oraculojf.com/#planos'

export default function PlanosPage() {
  redirect(PLANOS_DO_SITE)
}
