import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// 13/11/2026 — "Já comprei — verificar": o backend busca as vendas recentes na Greenn (até ~20 s) e responde.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function POST() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const res = await fetch(`${BACKEND}/api/rota/verificar`, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(35_000),
      headers: { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({ email: user.email }),
    })
    return NextResponse.json(await res.json().catch(() => ({ error: 'resposta inválida' })), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Não consegui conferir agora. Tente de novo em instantes.' }, { status: 502 })
  }
}
