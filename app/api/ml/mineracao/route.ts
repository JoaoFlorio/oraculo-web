import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Garimpo de uma categoria do ML (ranking BEST_SELLER enriquecido, cache 6h no backend).
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const category = req.nextUrl.searchParams.get('category') || ''
  try {
    const r = await fetch(`${BACKEND}/api/ml/mineracao/?category=${encodeURIComponent(category)}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro no garimpo' }, { status: 500 })
  }
}
