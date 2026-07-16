import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'
import { demoAdsReport } from '@/lib/demoGestao'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const demo = await demoConfigFor(user)
  if (demo) return NextResponse.json(demoAdsReport(demo, searchParams.get('window') || '30d', searchParams.get('from') || undefined, searchParams.get('to') || undefined))
  const qs = new URLSearchParams({ email: user.email })
  if (searchParams.get('window')) qs.set('window', searchParams.get('window')!)
  // Espelho diário de ads: com from/to o backend serve o período EXATO (inclusive
  // custom do calendário) somando os dias no banco local, em vez da janela aproximada.
  if (searchParams.get('from')) qs.set('from', searchParams.get('from')!)
  if (searchParams.get('to')) qs.set('to', searchParams.get('to')!)
  try {
    const res = await fetch(`${BACKEND}/api/ads/report?${qs.toString()}`, { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao consultar ads' }, { status: 500 })
  }
}
