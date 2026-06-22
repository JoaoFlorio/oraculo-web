import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const qs = new URLSearchParams({ email: user.email })
  if (searchParams.get('from')) qs.set('from', searchParams.get('from')!)
  if (searchParams.get('to')) qs.set('to', searchParams.get('to')!)
  if (searchParams.get('daily')) qs.set('daily', searchParams.get('daily')!)
  try {
    const res = await fetch(`${BACKEND}/api/amazon/finance?${qs.toString()}`, { cache: 'no-store' })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao consultar a Amazon' }, { status: 500 })
  }
}
