import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// Saldo + extrato da carteira do NEO. O e-mail vem da SESSÃO, nunca do cliente
// — mesma regra dos outros proxies: ninguém lê a carteira de outra pessoa.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    // plano vem da SESSÃO (define a franquia mensal, hoje 150 pra todos) — não do cliente.
    const qs = `email=${encodeURIComponent(user.email)}${user.plan ? `&plano=${encodeURIComponent(user.plan)}` : ''}`
    const res = await fetch(`${BACKEND}/api/carteira/status?${qs}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    const data = await res.json().catch(() => ({ error: 'resposta inválida do backend' }))
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    console.error('[carteira/status proxy]', e?.message || e)
    return NextResponse.json({ error: 'Erro ao consultar a carteira.' }, { status: 500 })
  }
}
