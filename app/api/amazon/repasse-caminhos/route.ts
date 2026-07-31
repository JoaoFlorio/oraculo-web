import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * O mapa do dinheiro de um repasse — cada campo monetário que a Amazon mandou,
 * somado pelo caminho, com a marca de quais a conferência já lê.
 *
 * Só admin: é ferramenta de diagnóstico, e o e-mail vem da SESSÃO, nunca da URL.
 */
export async function GET(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Só admin' }, { status: 403 })

  const url = new URL(req.url)
  const groupId = (url.searchParams.get('groupId') || '').trim()
  if (!groupId) return NextResponse.json({ error: 'groupId obrigatório' }, { status: 400 })

  try {
    const res = await fetch(
      `${BACKEND}/api/amazon/repasse-caminhos?email=${encodeURIComponent(user.email)}&groupId=${encodeURIComponent(groupId)}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } },
    )
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao mapear o repasse', detalhe: String(e?.message || e).slice(0, 200) }, { status: 500 })
  }
}
