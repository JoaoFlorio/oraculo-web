import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// "Já cancelei na Greenn" — tira a assinatura da lista. Registra QUEM marcou (da sessão).
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ sub: string }> }) {
  const user = await getSession()
  if (!user || !['admin', 'support'].includes(user.role)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { sub } = await params
  try {
    const r = await fetch(`${BACKEND}/api/assinaturas/cancelar/${encodeURIComponent(sub)}`, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15_000),
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '', 'content-type': 'application/json' },
      body: JSON.stringify({ quem: user.email }),
    })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'backend indisponível' }, { status: 502 }) }
}
