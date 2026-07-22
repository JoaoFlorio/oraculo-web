import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// Qual motor de IA o servidor usa por padrão. Serve pro seletor do admin já
// nascer marcado no motor certo, em vez de descobrir só depois da 1ª resposta.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const res = await fetch(`${BACKEND}/api/agent/config`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    // Falhar aqui não pode quebrar a aba: o seletor só fica sem marcação.
    return NextResponse.json({}, { status: 200 })
  }
}
