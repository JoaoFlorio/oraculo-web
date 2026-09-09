import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

// Roda o autopilot. ADMIN-ONLY (executa/preveê mudança real). ?dry=1 = só prevê.
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'autopilot em teste (admin only)' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  try {
    const r = await fetch(`${BACKEND}/api/ads/autopilot/run`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': KEY },
      body: JSON.stringify({ email: user.email, dry: b?.dry !== false, margem: b?.margem }), signal: AbortSignal.timeout(120_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
