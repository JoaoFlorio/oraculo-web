// PLANOS DO ORÁCULO — fonte única de preço, ciclo e link de checkout (24/09/2026).
// Antes cada tela tinha a sua tabela (landing 127/597/997, painel 79,90/397/597) e
// divergiam. Os valores aqui são os das ofertas ATIVAS na Greenn (ver landing/Planos.tsx).
// Mudou preço na Greenn? Muda AQUI e em nenhum outro lugar.
export type PlanoId = 'free' | 'monthly' | 'biannual' | 'annual' | 'lifetime'

export interface Plano {
  id: PlanoId
  nome: string
  preco: number            // R$ cobrados por ciclo
  ciclo: string            // texto do ciclo
  dias: number | null      // duração do ciclo (null = vitalício)
  porMes: number | null    // equivalente mensal
  link: string             // checkout Greenn (o webhook reconhece pelo offer_code)
  frase: string            // o argumento de 1 linha
  destaques: string[]
}

export const GREENN_LINKS: Record<Exclude<PlanoId, 'free'>, string> = {
  monthly:  'https://payfast.greenn.com.br/pm36pq4/offer/B0febG',
  biannual: 'https://payfast.greenn.com.br/pm36pq4/offer/rpgHFd',
  annual:   'https://payfast.greenn.com.br/pm36pq4/offer/WBkId3',
  lifetime: 'https://payfast.greenn.com.br/b2s4g9x',
}

export const PLANOS: Plano[] = [
  { id: 'monthly',  nome: 'Mensal',    preco: 127,  ciclo: '/mês',      dias: 30,   porMes: 127,   link: GREENN_LINKS.monthly,
    frase: 'Pra começar agora e enxergar a operação com controle.',
    destaques: ['Gestão com DRE real da sua conta Amazon', 'Mineração + Calculadora + Extensão', 'Agente NEO com 150 créditos/mês', 'Cancela quando quiser'] },
  { id: 'biannual', nome: 'Semestral', preco: 597,  ciclo: '/6 meses',  dias: 180,  porMes: 99.5,  link: GREENN_LINKS.biannual,
    frase: 'Seis meses de consistência pagando menos por mês.',
    destaques: ['Tudo do Mensal', 'Equivale a R$ 99,50/mês', 'Economia de 22% vs mensal', 'Exportação de relatórios'] },
  { id: 'annual',   nome: 'Anual',     preco: 997,  ciclo: '/ano',      dias: 365,  porMes: 83.08, link: GREENN_LINKS.annual,
    frase: 'Um ano inteiro pelo preço de 8 meses no mensal.',
    destaques: ['Tudo do Semestral', 'Equivale a R$ 83/mês', 'Economia de 35% vs mensal', 'Suporte prioritário no WhatsApp'] },
  { id: 'lifetime', nome: 'Fundador Vitalício', preco: 1497, ciclo: 'pagamento único', dias: null, porMes: null, link: GREENN_LINKS.lifetime,
    frase: 'Nunca mais pague mensalidade. Todas as atualizações futuras incluídas.',
    destaques: ['Tudo do Oráculo, para sempre', 'Atualizações futuras sem pagar a mais', 'Sem mensalidade. Nunca mais.', 'Suporte prioritário direto no WhatsApp', 'Condição de lançamento — não volta depois'] },
]

export const RANK: Record<PlanoId, number> = { free: 0, monthly: 1, biannual: 2, annual: 3, lifetime: 4 }
export const planoDe = (id: string): Plano | null => PLANOS.find(p => p.id === id) || null
export const fmt = (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })
/** Link de checkout com o e-mail da conta (o webhook casa a compra pela conta; comprar com outro e-mail cria outra conta). */
export const checkout = (id: Exclude<PlanoId, 'free'>, email: string) => `${GREENN_LINKS[id]}?email=${encodeURIComponent(email)}`

/** O DEGRAU RECOMENDADO — a regra do upsell (pedido do João, 24/09):
 *  mensal → anual (e antes de vencer, com urgência) · semestral → anual/vitalício · anual → vitalício · vitalício → topo. */
export function recomendacao(plan: string, daysLeft: number | null): { alvo: Plano | null; titulo: string; texto: string; urgente: boolean } {
  const anual = planoDe('annual')!, vit = planoDe('lifetime')!
  const vence = daysLeft != null && daysLeft <= 7
  if (plan === 'lifetime') return { alvo: null, titulo: 'Você está no topo: Fundador Vitalício', texto: 'Acesso a tudo, para sempre, com todas as atualizações incluídas. Não existe degrau acima deste.', urgente: false }
  if (plan === 'annual') return { alvo: vit, titulo: 'Próximo degrau: Fundador Vitalício', texto: `Você paga ${fmt(anual.preco)} por ano. O vitalício custa ${fmt(vit.preco)} uma vez só — em menos de 2 anos ele já se pagou, e as atualizações futuras vão junto.`, urgente: vence }
  if (plan === 'biannual') return { alvo: anual, titulo: vence ? `Seu semestral vence em ${daysLeft} dia${daysLeft === 1 ? '' : 's'}` : 'Próximo degrau: Anual', texto: `Dois semestres custam ${fmt(597 * 2)}; o anual custa ${fmt(anual.preco)} — ${fmt(597 * 2 - anual.preco)} a menos pelo mesmo ano. Ou vá direto ao vitalício e pare de pagar.`, urgente: vence }
  if (plan === 'monthly') return { alvo: anual, titulo: vence ? `Seu mensal renova em ${daysLeft} dia${daysLeft === 1 ? '' : 's'}` : 'Próximo degrau: Anual', texto: `12 meses no mensal = ${fmt(127 * 12)}. O anual custa ${fmt(anual.preco)}: você economiza ${fmt(127 * 12 - anual.preco)} no ano e paga o equivalente a R$ 83/mês.${vence ? ' Troque antes da renovação e a próxima mensalidade não é cobrada.' : ''}`, urgente: vence }
  return { alvo: planoDe('monthly'), titulo: 'Comece pelo Mensal', texto: 'Acesso completo por 30 dias. Cancele quando quiser.', urgente: false }
}
