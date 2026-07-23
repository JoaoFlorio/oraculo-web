import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// O que o NEO já guardou na memória. Por padrão, a do próprio usuário logado;
// admin pode passar ?email= pra inspecionar a de qualquer seller (trust/debug).
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const alvo = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  // Só admin lê a memória de OUTRO seller; qualquer usuário lê a própria.
  const email = alvo && user.role === 'admin' ? alvo : user.email
  try {
    const r = await fetch(`${BACKEND}/api/agent/memoria?email=${encodeURIComponent(email)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch (e: any) {
    console.error('[agent/memoria proxy]', e?.message || e)
    return NextResponse.json({ error: 'Erro ao consultar a memória' }, { status: 500 })
  }
}
