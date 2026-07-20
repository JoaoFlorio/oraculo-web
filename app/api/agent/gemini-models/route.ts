import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// SOMENTE ADMIN. Lista os modelos que a chave do Google enxerga — o catálogo
// muda de nome com frequência, então é melhor perguntar que chutar o ID.
export async function GET() {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const r = await fetch(`${BACKEND}/api/agent/gemini-models`, {
      cache: 'no-store',
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao listar modelos' }, { status: 500 })
  }
}
