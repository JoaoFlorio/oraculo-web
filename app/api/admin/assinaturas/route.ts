import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// Lista "Cancelar na Greenn" (27/09): assinaturas antigas de quem trocou de plano. Admin E suporte.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET() {
  const user = await getSession()
  if (!user || !['admin', 'support'].includes(user.role)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const r = await fetch(`${BACKEND}/api/assinaturas/cancelar`, { cache: 'no-store', signal: AbortSignal.timeout(15_000), headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await r.json().catch(() => ({ itens: [] })), { status: r.status })
  } catch { return NextResponse.json({ error: 'backend indisponível' }, { status: 502 }) }
}
