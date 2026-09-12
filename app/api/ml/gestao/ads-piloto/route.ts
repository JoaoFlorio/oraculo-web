import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Piloto NEO do Mercado Ads — campanhas + recomendação de ROI (MPA = margem − ACOS).
// Read-only (recomenda-primeiro). ML segue admin-only até o João liberar.
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Piloto NEO do ML está em teste (admin only)' }, { status: 403 })
  const sp = req.nextUrl.searchParams
  const qs = new URLSearchParams({ email: user.email, from: sp.get('from') || '', to: sp.get('to') || '' })
  try {
    const r = await fetch(`${BACKEND}/api/ml/gestao/ads-piloto?${qs}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar o Piloto NEO do ML' }, { status: 500 })
  }
}
