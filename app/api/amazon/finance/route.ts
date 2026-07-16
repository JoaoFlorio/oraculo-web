import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'
import { demoFinance } from '@/lib/demoGestao'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)

  // Conta DEMO → dados fictícios coerentes (nunca toca a SP-API real).
  const demo = await demoConfigFor(user)
  if (demo) {
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 86400000).toISOString()
    const to   = searchParams.get('to')   || new Date().toISOString()
    return NextResponse.json(demoFinance(demo, from, to, !!searchParams.get('daily')))
  }

  const qs = new URLSearchParams({ email: user.email })
  if (searchParams.get('from')) qs.set('from', searchParams.get('from')!)
  if (searchParams.get('to')) qs.set('to', searchParams.get('to')!)
  if (searchParams.get('daily')) qs.set('daily', searchParams.get('daily')!)
  // Espelho Local: força a fonte (mirror|live) — validação lado a lado dos números.
  if (searchParams.get('source')) qs.set('source', searchParams.get('source')!)
  try {
    const res = await fetch(`${BACKEND}/api/amazon/finance?${qs.toString()}`, { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao consultar a Amazon' }, { status: 500 })
  }
}
