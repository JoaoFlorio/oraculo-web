import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// 01/10: reputacao do Mercado Livre DESTE cliente (Gestão ML). O e-mail vem SEMPRE da sessão.
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const forcar = req.nextUrl.searchParams.get('forcar') === '1' ? '&forcar=1' : ''
  try {
    const r = await fetch(`${BACKEND}/api/ml/gestao/reputacao?email=${encodeURIComponent(user.email)}${forcar}`,
      { cache: 'no-store', signal: AbortSignal.timeout(90_000), headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'backend indisponível' }, { status: 502 })
  }
}
