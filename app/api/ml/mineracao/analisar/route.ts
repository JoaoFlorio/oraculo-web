import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Análise Rival do ML: link/id de um anúncio → o pacote do garimpo (dados reais).
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const q = req.nextUrl.searchParams.get('q') || ''
  try {
    const r = await fetch(`${BACKEND}/api/ml/mineracao/analisar?q=${encodeURIComponent(q)}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao analisar o anúncio' }, { status: 500 })
  }
}
