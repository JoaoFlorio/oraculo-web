import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// DRE do Mercado Livre — números REAIS cobrados (tarifa do pedido + custo do envio).
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const sp = req.nextUrl.searchParams
  const qs = new URLSearchParams({ email: user.email, from: sp.get('from') || '', to: sp.get('to') || '' })
  try {
    const r = await fetch(`${BACKEND}/api/ml/gestao/dre?${qs}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar a DRE ML' }, { status: 500 })
  }
}
