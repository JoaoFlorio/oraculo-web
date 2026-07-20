import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// SOMENTE ADMIN. Quanto do garimpo já é nosso (mined_products) e quantos
// clientes estão consumindo o catálogo — é o painel pra decidir se o pool e a
// janela de 45 dias estão bem calibrados.
export async function GET() {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const r = await fetch(`${BACKEND}/api/product/search/catalog-status`, {
      cache: 'no-store',
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao consultar o catálogo' }, { status: 500 })
  }
}
