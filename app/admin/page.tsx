import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { classeFontes } from '../(auth)/fontes'
import AdminClient from './AdminClient'
import SupportClient from './SupportClient'

// Gate por papel: só admin/staff/support entra. Qualquer outro (ou deslogado) →
// 404, pra não revelar que a rota existe (camada extra além do login email+senha).
export default async function AdminPage() {
  const user = await getSession()
  if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'support')) notFound()
  // support = admin RESTRITO: tela própria, só clientes + reenviar senha.
  // 05/10: fontes do site (Archivo/Instrument Sans/JetBrains Mono) — o visual novo usa as variáveis --tg-*.
  if (user.role === 'support') return <div className={classeFontes}><SupportClient name={user.name} /></div>
  return <div className={classeFontes}><AdminClient role={user.role} name={user.name} /></div>
}
