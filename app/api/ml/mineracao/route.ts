import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Garimpo de uma categoria do ML (ranking BEST_SELLER enriquecido, cache 6h no backend).
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const sp = req.nextUrl.searchParams
  // ⚠️ `page` (scroll infinito) e `bust` (botão Atualizar) precisam ATRAVESSAR o
  // proxy — o bust vinha sendo engolido aqui, então "Atualizar" só relia o cache.
  const qs = new URLSearchParams({ category: sp.get('category') || '' })
  if (sp.get('page')) qs.set('page', sp.get('page') as string)
  if (sp.get('bust') === '1') qs.set('bust', '1')
  try {
    const r = await fetch(`${BACKEND}/api/ml/mineracao/?${qs.toString()}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro no garimpo' }, { status: 500 })
  }
}
