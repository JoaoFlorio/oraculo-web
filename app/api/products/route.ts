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

  try {
    const params = new URLSearchParams({ type, category, q })
    const res = await fetch(`${BACKEND}/api/product/search?${params}`, {
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
      cache: 'no-store', // sem cache no Next.js — o backend já faz cache de 5 min
    })

    if (!res.ok) throw new Error(`Backend ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('[products]', e.message)
    return NextResponse.json({ products: [] })
  }
}
