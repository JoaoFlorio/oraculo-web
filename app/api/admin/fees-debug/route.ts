import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * GET /api/admin/fees-debug?asin=&price=&fba=1&email=
 *
 * Resposta CRUA da Fees API (FeeAmount / FeePromotion / FinalFee) ao lado do que
 * o Oráculo passou a usar. Serve pra conferir contra o Seller Central antes de
 * confiar na correção de 25/07.
 *
 * `email` opcional: sem ele olha a conta do próprio admin. Com ele, a de um
 * cliente — é como se investiga "o número dele não bate". Só admin.
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const q = new URL(req.url).searchParams
  const asin = (q.get('asin') || '').trim()
  const price = (q.get('price') || '').trim()
  if (!asin || !price) return NextResponse.json({ error: 'asin e price obrigatórios' }, { status: 400 })
  const email = (q.get('email') || admin.email).trim().toLowerCase()
  try {
    const url = `${BACKEND}/api/amazon/fees-debug?email=${encodeURIComponent(email)}`
      + `&asin=${encodeURIComponent(asin)}&price=${encodeURIComponent(price)}&fba=${encodeURIComponent(q.get('fba') || '1')}`
    const r = await fetch(url, { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Backend indisponível' }, { status: 502 })
  }
}
