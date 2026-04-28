import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type     = searchParams.get('type')     || 'bestsellers'
  const category = searchParams.get('category') || 'electronics'
  const q        = searchParams.get('q')        || ''
  const bust     = searchParams.get('bust')     || ''

  try {
    const params = new URLSearchParams({ type, category, q })
    if (bust === '1') params.set('bust', '1')

    const res = await fetch(`${BACKEND}/api/product/search?${params}`, {
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`Backend ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('[products]', e.message)
    return NextResponse.json({ products: [] })
  }
}
