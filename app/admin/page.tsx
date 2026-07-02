import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminClient from './AdminClient'

// Gate por papel: só admin/staff entra. Qualquer outro (ou deslogado) → 404,
// pra não revelar que a rota existe (camada extra além do login email+senha).
export default async function AdminPage() {
  const user = await getSession()
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) notFound()
  return <AdminClient role={user.role} name={user.name} />
}
