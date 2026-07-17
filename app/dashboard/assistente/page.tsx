import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AssistenteChat from './AssistenteChat'

// Tela cheia do Assistente (também acessível pelo botão flutuante do dashboard).
export default async function AssistentePage() {
  const user = await getSession()
  if (!user) redirect('/login')
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '20px 16px', height: '100dvh' }}>
      <AssistenteChat />
    </div>
  )
}
