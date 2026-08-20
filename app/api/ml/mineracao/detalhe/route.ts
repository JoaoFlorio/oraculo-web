import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Detalhe do anúncio do ML pro modal de análise da Mineração (fotos, data real,
// ficha técnica, título) — dado cru do /items, nada estimado.
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const sp = req.nextUrl.searchParams
  const qs = new URLSearchParams({ product: sp.get('product') || '' })
  if (sp.get('item')) qs.set('item', sp.get('item') as string)
  try {
    const r = await fetch(`${BACKEND}/api/ml/mineracao/detalhe?${qs.toString()}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar o anúncio' }, { status: 500 })
  }
}
