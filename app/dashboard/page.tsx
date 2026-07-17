import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TERMS_VERSION } from '@/lib/terms'
import DashboardClient from './DashboardClient'
import TermsGate from './TermsGate'
import AppInstall from './AppInstall'
import AssistenteFab from './AssistenteFab'

export default async function DashboardPage() {
  const user = await getSession()
  if (!user) redirect('/login')
  // Gate da Gestão: visível só p/ a allowlist enquanto o app SP-API não está em Production.
  // Default: João + testers convidados. Liberar geral = setar GESTAO_ALLOWLIST=* (ou remover o gate).
  // ⚠️ Se GESTAO_ALLOWLIST estiver setado no Railway, ele VENCE este default (env > código).
  const DEFAULT_ALLOW = 'joaoflorio1023@gmail.com,theethereashop@gmail.com' // theethereashop = aluna em teste da Gestão
  const allow = (process.env.GESTAO_ALLOWLIST || DEFAULT_ALLOW)
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  // Conta demo sempre vê a Gestão (é o ponto dela — apresentar a Gestão fake).
  const gestaoEnabled = user.role === 'demo' || allow.includes('*') || allow.includes(String(user.email || '').toLowerCase())

  // Aceite dos Termos de Uso: cliente precisa ter aceitado a VERSÃO vigente (registrado
  // em metadata.terms via /api/user/accept-terms). Admin/staff/demo são isentos (equipe
  // e conta de apresentação — não são consumidores do contrato de adesão).
  let needsTerms = false
  if (!user.role || user.role === 'client') {
    const u = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } })
    const terms = ((u?.metadata ?? {}) as Record<string, any>).terms
    needsTerms = terms?.version !== TERMS_VERSION
  }

  return (
    <>
      <DashboardClient user={user} gestaoEnabled={gestaoEnabled} />
      <AppInstall />
      {gestaoEnabled && <AssistenteFab />}
      {needsTerms && <TermsGate />}
    </>
  )
}
