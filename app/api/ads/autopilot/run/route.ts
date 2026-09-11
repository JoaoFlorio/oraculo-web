import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

// Roda o autopilot. dry (só simula, não gasta) = qualquer cliente pode ver o preview;
// real (aplica de verdade) = ADMIN-ONLY.
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const dry = b?.dry !== false
  if (!dry && user.role !== 'admin') return NextResponse.json({ error: 'aplicar de verdade está em teste (admin only)' }, { status: 403 })
  try {
    const r = await fetch(`${BACKEND}/api/ads/autopilot/run`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': KEY },
      body: JSON.stringify({ email: user.email, dry: b?.dry !== false, margem: b?.margem }), signal: AbortSignal.timeout(120_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
