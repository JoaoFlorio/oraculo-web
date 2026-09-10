import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

// Define os produtos (SKUs) de uma estratégia — o "grupo de produtos" do m19.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const b = await req.json().catch(() => ({}))
  try {
    const r = await fetch(`${BACKEND}/api/ads/estrategias/${encodeURIComponent(id)}/produtos`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': KEY },
      body: JSON.stringify({ email: user.email, produtos: b?.produtos || [] }), signal: AbortSignal.timeout(15_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
