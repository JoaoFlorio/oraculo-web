import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// 13/11/2026 — aba Treinamentos: esta conta já tem a Rota 10K? (e-mail da SESSÃO; a lista vem da Greenn no backend)
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const res = await fetch(`${BACKEND}/api/rota/status?email=${encodeURIComponent(user.email)}`, {
      cache: 'no-store', signal: AbortSignal.timeout(15_000), headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await res.json().catch(() => ({ error: 'resposta inválida' })), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Não consegui conferir agora.' }, { status: 502 })
  }
}
