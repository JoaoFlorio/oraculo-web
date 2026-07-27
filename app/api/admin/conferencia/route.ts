import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * GET /api/admin/conferencia?from=2026-06-01&to=2026-06-30&email=
 *
 * Põe as linhas da DRE lado a lado com o repasse cru e mostra a diferença.
 * É o teste de "está certo" — enquanto não fechar num MÊS FECHADO, tem furo.
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const q = new URL(req.url).searchParams
  const email = (q.get('email') || admin.email).trim().toLowerCase()
  const from = q.get('from'), to = q.get('to')
  if (!from || !to) return NextResponse.json({ error: 'from e to obrigatórios (ex: 2026-06-01 / 2026-06-30)' }, { status: 400 })
  try {
    const url = `${BACKEND}/api/amazon/conferencia?email=${encodeURIComponent(email)}`
      + `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    // A paginação completa da Finances de um mês inteiro leva tempo.
    const r = await fetch(url, { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' }, signal: AbortSignal.timeout(300000) })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Backend indisponível ou demorou demais' }, { status: 502 })
  }
}
