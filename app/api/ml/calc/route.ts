import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Proxy da Calculadora Mercado Livre. O motor da tarifa fica no backend
// (routes/ml.ts): comissão REAL via listing_prices quando vem categoria/itemId,
// senão estimativa marcada. Aqui só encaminhamos o corpo pro usuário logado — a
// calculadora não toca dado de seller nenhum (é decisão de anúncio, não Gestão),
// então serve inclusive pra conta demo. O endpoint /api/ml/calc/fees é público no
// backend; o gate de sessão aqui evita expor a superfície a quem não entrou.
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({} as any))
  try {
    const r = await fetch(`${BACKEND}/api/ml/calc/fees`, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify(body),
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao calcular' }, { status: 500 })
  }
}
