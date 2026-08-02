import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * Recompleta o espelho de pedidos SEM apagar nada.
 *
 * O desconto de FRETE só passou a ser gravado separado do desconto de item
 * agora; no pedido antigo os dois vêm somados e não dá pra saber quanto o
 * comprador pagou de frete de verdade — por isso a conciliação se recusa a
 * mostrar o bruto na régua do Gestor nesses pedidos. O sync incremental não
 * conserta sozinho: ele só reprocessa pedido que MUDA, e pedido antigo já
 * entregue nunca mais muda.
 *
 * ⚠️ Aponta pro `mirror-refresh` do backend, NÃO pro `mirror-rebuild`: aquele
 * apaga o espelho antes de refazer e deixaria a Gestão do cliente em branco
 * pelos ~25min do backfill de 24 meses.
 *
 * ⭐ E-mail da SESSÃO, nunca da URL. Admin pode recompletar a conta de um cliente.
 */
export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const alvo = (url.searchParams.get('email') || '').trim().toLowerCase()
  const email = (alvo && user.role === 'admin') ? alvo : user.email

  try {
    const res = await fetch(`${BACKEND}/api/amazon/mirror-refresh?email=${encodeURIComponent(email)}`,
      { method: 'POST', cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao recompletar o espelho', detalhe: String(e?.message || e).slice(0, 200) }, { status: 500 })
  }
}
