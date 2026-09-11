import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

// Estratégias de Ads (v2, o coração do m19). CRUD da config do próprio cliente —
// não executa nada sozinho ainda (o autopilot só migra pra cá numa fase seguinte),
// então qualquer cliente pago gerencia as suas.
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const mkt = req.nextUrl.searchParams.get('marketplace') || 'amazon'
  try {
    const r = await fetch(`${BACKEND}/api/ads/estrategias?email=${encodeURIComponent(user.email)}&marketplace=${mkt}`,
      { cache: 'no-store', headers: { 'x-internal-key': KEY }, signal: AbortSignal.timeout(15_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  // Ligar execução automática (gasta dinheiro sozinho) é admin-only — mesmo gate do
  // /autopilot. Latente hoje (o loop ainda lê ads_autopilot_config), mas fecha o furo
  // ANTES de a v2 migrar o loop pra ler ads_estrategia.automatico. (auditoria 11/09)
  if (b?.automatico === true && user.role !== 'admin') return NextResponse.json({ error: 'ligar o automático está em teste (admin only)' }, { status: 403 })
  try {
    const r = await fetch(`${BACKEND}/api/ads/estrategias`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': KEY },
      body: JSON.stringify({ ...b, email: user.email }), signal: AbortSignal.timeout(15_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
