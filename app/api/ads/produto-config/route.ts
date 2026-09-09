import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

// Toggle por produto: "o NEO gerencia esse produto" ou "eu cuido dele". Cada
// cliente controla os seus (é opt-out da própria autonomia, não muda campanha).
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const r = await fetch(`${BACKEND}/api/ads/produto-config?email=${encodeURIComponent(user.email)}`,
      { cache: 'no-store', headers: { 'x-internal-key': KEY }, signal: AbortSignal.timeout(15_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  if (!b?.sku || typeof b?.gerenciar !== 'boolean') return NextResponse.json({ error: 'sku e gerenciar obrigatórios' }, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/ads/produto-config`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': KEY },
      body: JSON.stringify({ email: user.email, sku: b.sku, gerenciar: b.gerenciar }), signal: AbortSignal.timeout(15_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
