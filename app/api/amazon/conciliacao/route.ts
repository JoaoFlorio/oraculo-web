import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * Conciliação pedido a pedido — "este pedido já me pagou?".
 *
 * Cruza o que o seller vendeu (espelho) com o que a Amazon pagou (linhas por
 * pedido, extraídas dos repasses já conferidos). Não custa chamada de API: os
 * pedidos saem das conferências guardadas.
 *
 * ⭐ O e-mail vem da SESSÃO, nunca da URL — a mesma regra do /repasses. Admin
 * pode olhar a conta de outro cliente pra dar suporte.
 */
export async function GET(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const alvo = (url.searchParams.get('email') || '').trim().toLowerCase()
  const email = (alvo && user.role === 'admin') ? alvo : user.email
  const from = url.searchParams.get('from') || ''
  const to = url.searchParams.get('to') || ''
  const meses = Math.min(12, Math.max(1, Number(url.searchParams.get('meses') ?? 3) || 3))

  try {
    const qs = new URLSearchParams({ email, meses: String(meses) })
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    const res = await fetch(`${BACKEND}/api/amazon/conciliacao?${qs}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao consultar a conciliação', detalhe: String(e?.message || e).slice(0, 200) }, { status: 500 })
  }
}
