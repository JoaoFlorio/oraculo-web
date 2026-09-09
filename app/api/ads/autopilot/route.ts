import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

// Config do Autopilot (objetivo + automático). O OBJETIVO qualquer cliente escolhe;
// LIGAR o automático (o NEO executa sozinho) é admin-only enquanto está em teste.
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const margem = req.nextUrl.searchParams.get('margem') || ''
  try {
    const r = await fetch(`${BACKEND}/api/ads/autopilot?email=${encodeURIComponent(user.email)}${margem?`&margem=${margem}`:''}`,
      { cache: 'no-store', headers: { 'x-internal-key': KEY }, signal: AbortSignal.timeout(15_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  // Ligar o automático só admin (executa mudança real sozinho).
  if (b?.automatico === true && user.role !== 'admin') return NextResponse.json({ error: 'o piloto automático está em teste (admin only)' }, { status: 403 })
  try {
    const r = await fetch(`${BACKEND}/api/ads/autopilot`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': KEY },
      body: JSON.stringify({ email: user.email, objetivo: b?.objetivo, automatico: b?.automatico }), signal: AbortSignal.timeout(15_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
