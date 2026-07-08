import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import DashboardClient from './DashboardClient'

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
  return <DashboardClient user={user} gestaoEnabled={gestaoEnabled} />
}
