import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// SOMENTE ADMIN. Quanto a conversa com o NEO custa, por seller.
//
// Gate no papel e não só no link: a resposta é um ranking de clientes com
// e-mail e quanto cada um consome. É dado de cliente e de custo do negócio —
// nada que possa vazar por URL adivinhada.
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const dias = req.nextUrl.searchParams.get('dias') || '30'
  const limite = req.nextUrl.searchParams.get('limite') || '50'
  try {
    const r = await fetch(`${BACKEND}/api/agent/uso?dias=${encodeURIComponent(dias)}&limite=${encodeURIComponent(limite)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch (e: any) {
    console.error('[agent/uso proxy]', e?.message || e)
    return NextResponse.json({ error: 'Erro ao consultar o uso' }, { status: 500 })
  }
}
