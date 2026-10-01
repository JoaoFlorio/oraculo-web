import { redirect } from 'next/navigation'
import { getSessionOrExpired } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TERMS_VERSION } from '@/lib/terms'
import DashboardClient from './DashboardClient'
import TermsGate from './TermsGate'
import Paywall from './Paywall'
import AppInstall from './AppInstall'
import AppSplash from './AppSplash'
import VersionGuard from './VersionGuard'
import AssistenteFab from './AssistenteFab'

export default async function DashboardPage() {
  // Vencido ENTRA (pra ver o overlay "venceu + pagar") em vez de ir pro /login;
  // sem conta/inativo/sem plano → login. As APIs seguem barrando o vencido (401).
  const { user, motivo } = await getSessionOrExpired()
  if (!user) redirect('/login')
  // 01/10: sem acesso pago (vencido, bloqueado, sem plano) → SÓ a tela de pagamento. Nada do painel é renderizado
  // (nem termos, nem app, nem assistente) — "se não pagar, não acessa nada".
  if (motivo) return (
    <>
      <VersionGuard v={process.env.RAILWAY_GIT_COMMIT_SHA || process.env.RAILWAY_DEPLOYMENT_ID || 'dev'} />
      <Paywall email={user.email} plan={user.plan ?? null} expiresAt={user.expiresAt ? new Date(user.expiresAt).toISOString() : null} motivo={motivo} />
    </>
  )
  // Gate da Gestão: LIBERADO PARA TODOS (19/07/2026). O gate existia enquanto o
  // app SP-API estava em Draft; com as aprovações da Amazon saídas e sem plano
  // grátis no produto (quem não pagou nem chega aqui — ver accessDenied), todo
  // cliente tem direito à Gestão. O mecanismo fica no lugar caso precise
  // restringir de novo: basta trocar o '*' por uma lista de e-mails.
  // ⚠️ Se GESTAO_ALLOWLIST estiver setado no Railway, ele VENCE este default
  // (env > código) — pra liberar geral, ela precisa estar ausente ou valer '*'.
  const DEFAULT_ALLOW = '*'
  const allow = (process.env.GESTAO_ALLOWLIST || DEFAULT_ALLOW)
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  // Conta demo sempre vê a Gestão (é o ponto dela — apresentar a Gestão fake).
  const gestaoEnabled = user.role === 'demo' || allow.includes('*') || allow.includes(String(user.email || '').toLowerCase())

  // Aceite dos Termos de Uso: cliente precisa ter aceitado a VERSÃO vigente (registrado
  // em metadata.terms via /api/user/accept-terms). Admin/staff/demo são isentos (equipe
  // e conta de apresentação — não são consumidores do contrato de adesão).
  let needsTerms = false
  let teste: { ate: string; creditos: number } | null = null   // 01/10: teste grátis de 7 dias (Greenn)
  if (!user.role || user.role === 'client') {
    const u = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } })
    const meta = (u?.metadata ?? {}) as Record<string, any>
    needsTerms = meta.terms?.version !== TERMS_VERSION
    if (meta.teste?.ate && Date.parse(meta.teste.ate) > Date.now()) teste = { ate: String(meta.teste.ate), creditos: Number(meta.teste.creditos) || 10 }
  }

  return (
    <>
      {/* Abertura animada — só no app instalado, 1x por sessão */}
      <AppSplash />
      {/* Recarrega sozinho quando há build novo (PWA guarda HTML em cache) */}
      <VersionGuard v={process.env.RAILWAY_GIT_COMMIT_SHA || process.env.RAILWAY_DEPLOYMENT_ID || 'dev'} />
      <DashboardClient user={user} gestaoEnabled={gestaoEnabled} teste={teste} />
      {/* isAdmin libera o simulador de venda no guia do app (o servidor também
          exige admin — o cliente nunca deve receber um "💰 Nova venda!" falso). */}
      <AppInstall isAdmin={user.role === 'admin'} />
      {gestaoEnabled && <AssistenteFab />}
      {needsTerms && <TermsGate />}
    </>
  )
}
