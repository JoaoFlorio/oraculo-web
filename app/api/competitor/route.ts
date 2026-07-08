import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.plan === 'free') return NextResponse.json({ error: 'Recurso disponível apenas para planos pagos' }, { status: 403 })

  const asin = req.nextUrl.searchParams.get('asin') || ''
  if (!asin) return NextResponse.json({ error: 'ASIN obrigatório' }, { status: 400 })

  try {
    const res = await fetch(`${BACKEND}/api/product/competitor?asin=${encodeURIComponent(asin)}`, {
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
      cache: 'no-store',
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}
