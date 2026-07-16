import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Status do espelho diário de ads (cobertura/backfill) do usuário logado.
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (await demoConfigFor(user)) return NextResponse.json({ status: 'none', demo: true })
  try {
    const res = await fetch(`${BACKEND}/api/ads/daily-status?email=${encodeURIComponent(user.email)}`, { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao consultar o espelho de ads' }, { status: 500 })
  }
}
