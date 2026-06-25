import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const user = await getSession()
  if (!user) redirect('/login')
  // Gate da Gestão: visível só p/ a allowlist enquanto o app SP-API não está em Production.
  // Default: só o João. Liberar geral depois = setar GESTAO_ALLOWLIST=* (ou remover o gate).
  const allow = (process.env.GESTAO_ALLOWLIST || 'joaoflorio1023@gmail.com')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const gestaoEnabled = allow.includes('*') || allow.includes(String(user.email || '').toLowerCase())
  return <DashboardClient user={user} gestaoEnabled={gestaoEnabled} />
}
