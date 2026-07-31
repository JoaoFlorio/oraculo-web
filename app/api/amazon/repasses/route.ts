import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * Repasses do seller logado — "quanto a Amazon me pagou".
 *
 * ⭐ O e-mail vem da SESSÃO, nunca da URL: foi confiando no `?email` que o
 * `/connect` deixava atrelar a conta Amazon de um atacante ao e-mail de um cliente.
 *
 * `conferir=1` faz a conta que prova a leitura (soma dos eventos vs valor
 * transferido). Custa paginação por repasse, então a tela pede sob demanda.
 */
export async function GET(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const meses = Math.min(12, Math.max(1, Number(url.searchParams.get('meses') ?? 3) || 3))
  const conferir = url.searchParams.get('conferir') === '1' ? '&conferir=1' : ''
  // Diagnóstico: campos crus do grupo. Só admin — é dado de depuração, não de tela.
  const cru = (url.searchParams.get('cru') === '1' && user.role === 'admin') ? '&cru=1' : ''

  try {
    const res = await fetch(
      `${BACKEND}/api/amazon/repasses?email=${encodeURIComponent(user.email)}&meses=${meses}${conferir}${cru}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } },
    )
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao consultar os repasses', detalhe: String(e?.message || e).slice(0, 200) }, { status: 500 })
  }
}
