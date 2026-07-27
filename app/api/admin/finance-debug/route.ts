import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * GET /api/admin/finance-debug?from=2026-07-01&to=2026-07-27&email=
 *
 * Tabula os eventos financeiros CRUS do repasse por `ChargeType` e `FeeType`.
 * O backend já tinha isso (`/api/amazon/finance?debug=1`), mas nenhum proxy
 * passava o `debug` — então era inalcançável pelo navegador.
 *
 * É o que responde com precisão QUAIS linhas o repasse traz — e portanto quais
 * o Oráculo está descartando (hoje só Commission e FBA sobrevivem).
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const q = new URL(req.url).searchParams
  const email = (q.get('email') || admin.email).trim().toLowerCase()
  const to = q.get('to') || new Date().toISOString()
  const from = q.get('from') || new Date(Date.now() - 30 * 86400000).toISOString()
  try {
    const url = `${BACKEND}/api/amazon/finance?debug=1&email=${encodeURIComponent(email)}`
      + `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    const r = await fetch(url, { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Backend indisponível' }, { status: 502 })
  }
}
