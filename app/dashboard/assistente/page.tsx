import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AssistenteChat from './AssistenteChat'

// Tela do Assistente de IA (protótipo). Guard de sessão igual ao dashboard;
// o chat conversa com /api/agent/chat (proxy → backend, email da sessão).
export default async function AssistentePage() {
  const user = await getSession()
  if (!user) redirect('/login')
  return <AssistenteChat userName={user.name || 'você'} />
}
