import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Registra a inscrição de push de venda do usuário logado (e-mail vem da sessão).
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const subscription = await req.json().catch(() => null)
  if (!subscription?.endpoint) return NextResponse.json({ error: 'subscription inválida' }, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/push/subscribe`, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({ email: user.email, subscription }),
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao registrar notificações' }, { status: 500 })
  }
}
