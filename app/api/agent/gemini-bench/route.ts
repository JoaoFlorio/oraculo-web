import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// SOMENTE ADMIN. Testa vários modelos Gemini com o prompt e as ferramentas
// REAIS do NEO e diz qual o mais barato que dá conta.
export async function GET() {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const r = await fetch(`${BACKEND}/api/agent/gemini-bench`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(120_000),
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao rodar o benchmark' }, { status: 500 })
  }
}
