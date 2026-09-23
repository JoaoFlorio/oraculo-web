import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

// Pausa/religa os anúncios de UM produto do próprio seller (botão do card sem estoque / modo "eu cuido").
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const sku = String(b?.sku || '').trim()
  const state = String(b?.state || 'PAUSED').toUpperCase()
  if (!sku || !['ENABLED', 'PAUSED'].includes(state)) return NextResponse.json({ error: 'sku e state (ENABLED|PAUSED) obrigatórios' }, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/ads/pausar-produto`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': KEY },
      body: JSON.stringify({ email: user.email, sku, state }), signal: AbortSignal.timeout(40_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
