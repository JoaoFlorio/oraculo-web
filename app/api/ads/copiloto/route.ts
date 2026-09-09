import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// Proxy do Copiloto de Ads (painel "Piloto NEO", estilo m19). Sessão → email;
// a margem (pra derivar o ACoS-alvo do breakeven) vem do que a tela já calculou.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const margem = req.nextUrl.searchParams.get('margem') || ''
  try {
    const res = await fetch(
      `${BACKEND}/api/ads/copiloto?email=${encodeURIComponent(user.email)}${margem ? `&margem=${encodeURIComponent(margem)}` : ''}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' }, signal: AbortSignal.timeout(30_000) },
    )
    return NextResponse.json(await res.json().catch(() => ({ error: 'resposta inválida' })), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'falha ao falar com o servidor' }, { status: 502 })
  }
}
