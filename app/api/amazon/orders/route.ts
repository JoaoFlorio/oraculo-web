import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Pedidos de um SKU no período (drill-down da lupinha) — via Espelho Local.
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  // Demo não tem pedidos reais — o modal cai no agregado.
  if (await demoConfigFor(user)) return NextResponse.json({ available: false, reason: 'demo' })

  const sku = searchParams.get('sku')
  if (!sku) return NextResponse.json({ error: 'sku obrigatório' }, { status: 400 })
  const qs = new URLSearchParams({ email: user.email, sku })
  if (searchParams.get('from')) qs.set('from', searchParams.get('from')!)
  if (searchParams.get('to')) qs.set('to', searchParams.get('to')!)
  try {
    const res = await fetch(`${BACKEND}/api/amazon/orders?${qs.toString()}`, { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ available: false, reason: 'error' }, { status: 500 })
  }
}
