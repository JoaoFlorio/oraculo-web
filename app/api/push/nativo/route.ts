import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// 18/11/2026 — registra o token do app de iPhone (APNs) do usuário logado (e-mail vem da sessão). Ver lib/pushNativo.ts.
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { token, plataforma } = await req.json().catch(() => ({}))
  if (!token || typeof token !== 'string') return NextResponse.json({ error: 'token obrigatório' }, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/push/nativo`, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({ email: user.email, token, plataforma: plataforma || 'ios' }),
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao registrar notificações' }, { status: 500 })
  }
}
