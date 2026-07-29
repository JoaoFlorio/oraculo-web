import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Pedidos do período — a lista inteira (aba Vendas) ou só a de um SKU
// (drill-down da lupa). Sempre do Espelho Local, zero chamada à Amazon.
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  // Demo não tem pedidos reais — o modal cai no agregado.
  if (await demoConfigFor(user)) return NextResponse.json({ available: false, reason: 'demo' })

  // `sku` é OPCIONAL: com ele, os pedidos daquele produto (modal da lupa);
  // sem ele, a lista de pedidos do período item a item (aba Vendas).
  const sku = searchParams.get('sku')
  const qs = new URLSearchParams({ email: user.email })
  if (sku) qs.set('sku', sku)
  if (searchParams.get('from')) qs.set('from', searchParams.get('from')!)
  if (searchParams.get('to')) qs.set('to', searchParams.get('to')!)
  try {
    const res = await fetch(`${BACKEND}/api/amazon/orders?${qs.toString()}`, { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ available: false, reason: 'error' }, { status: 500 })
  }
}
