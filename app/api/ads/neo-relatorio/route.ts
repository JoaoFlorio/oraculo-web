import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

// "O que o NEO fez" nos Ads: rodadas, ações executadas, economia estimada, pausas por estoque.
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const dias = req.nextUrl.searchParams.get('dias') || '7'
  try {
    const r = await fetch(`${BACKEND}/api/ads/neo-relatorio?email=${encodeURIComponent(user.email)}&dias=${encodeURIComponent(dias)}`,
      { cache: 'no-store', headers: { 'x-internal-key': KEY }, signal: AbortSignal.timeout(20_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
