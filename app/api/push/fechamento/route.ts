import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Testa o push de FECHAMENTO DO DIA sem esperar as 20h: dry-run por padrão
// (mostra o que enviaria), ?send=1 envia de verdade pro aparelho do usuário
// logado. Usa o e-mail da SESSÃO — nunca do cliente.
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const send = new URL(req.url).searchParams.get('send') === '1'
  try {
    const qs = new URLSearchParams({ email: user.email })
    if (send) qs.set('send', '1')
    const r = await fetch(`${BACKEND}/api/diag/fechamento?${qs.toString()}`, {
      cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao testar o fechamento' }, { status: 500 })
  }
}
