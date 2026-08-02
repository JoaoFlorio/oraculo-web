import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * Repara pedidos que estão no espelho sem preço.
 *
 * O backfill (relatório flat-file) não traz `item-price` de pedido pendente; a
 * Orders API traz. Este endpoint pergunta de novo pra Amazon e completa o que
 * dá — o que ela também não tiver continua "a faturar", que é a verdade.
 *
 * ⭐ E-mail da SESSÃO, nunca da URL. Admin pode reparar a conta de um cliente.
 */
export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const alvo = (url.searchParams.get('email') || '').trim().toLowerCase()
  const email = (alvo && user.role === 'admin') ? alvo : user.email
  const limite = Math.min(500, Math.max(1, Number(url.searchParams.get('limite') ?? 200) || 200))

  try {
    const res = await fetch(`${BACKEND}/api/amazon/mirror-repair?email=${encodeURIComponent(email)}&limite=${limite}`,
      { method: 'POST', cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao reparar o espelho', detalhe: String(e?.message || e).slice(0, 200) }, { status: 500 })
  }
}
