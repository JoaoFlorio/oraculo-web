import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// Diagnóstico da carteira do NEO — ADMIN ONLY.
//
// Expõe estado de configuração de pagamento (ambiente do Asaas, se a chave é
// válida, pontas do token do webhook). Nada disso é segredo por si só, mas
// junto vira mapa pra quem quiser atacar a recarga — daí o gate no papel, e não
// só o "link difícil de adivinhar".
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const res = await fetch(`${BACKEND}/api/carteira/diag`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    const data = await res.json().catch(() => ({ error: 'resposta inválida do backend' }))
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    console.error('[carteira/diag proxy]', e?.message || e)
    return NextResponse.json({ error: 'Erro ao consultar o backend.' }, { status: 500 })
  }
}
