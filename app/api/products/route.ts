import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Limite de produtos por plano (server-side — não depende do cliente)
const PLAN_LIMIT: Record<string, number> = {
  free:     6,
  monthly:  9999,
  annual:   9999,
  lifetime: 9999,
}

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type     = searchParams.get('type')     || 'bestsellers'
  const category = searchParams.get('category') || 'electronics'
  const q        = searchParams.get('q')        || ''
  const bust     = searchParams.get('bust')     || ''

  // Plano gratuito só pode acessar Mais Vendidos
  if (user.plan === 'free' && type !== 'bestsellers' && type !== 'search') {
    return NextResponse.json({ products: [], locked: true })
  }

  try {
    const params = new URLSearchParams({ type, category, q })
    if (bust === '1') params.set('bust', '1')

    const res = await fetch(`${BACKEND}/api/product/search?${params}`, {
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`Backend ${res.status}`)
    const data = await res.json()

    // Aplica limite de produtos por plano
    const limit    = PLAN_LIMIT[user.plan] ?? 6
    const products = (data.products || []).slice(0, limit)

    return NextResponse.json({
      products,
      plan:  user.plan,
      total: data.products?.length ?? 0,
    })
  } catch (e: any) {
    console.error('[products]', e.message)
    return NextResponse.json({ products: [] })
  }
}
