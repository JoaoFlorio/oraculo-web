import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// Pedir avaliação automático (30/09): estado + liga/desliga. O e-mail vem da SESSÃO, nunca do cliente.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const H = () => ({ 'x-internal-key': process.env.INTERNAL_KEY || '', 'content-type': 'application/json' })

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const r = await fetch(`${BACKEND}/api/avaliacoes?email=${encodeURIComponent(user.email)}`, { cache: 'no-store', signal: AbortSignal.timeout(15_000), headers: H() })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'backend indisponível' }, { status: 502 }) }
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (typeof body?.ligado !== 'boolean') return NextResponse.json({ error: 'ligado obrigatório' }, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/avaliacoes`, { method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15_000), headers: H(),
      body: JSON.stringify({ email: user.email, ligado: body.ligado }) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'backend indisponível' }, { status: 502 }) }
}
