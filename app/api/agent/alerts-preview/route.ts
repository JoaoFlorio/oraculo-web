import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// SOMENTE ADMIN. Mostra o que os alertas do NEO dispariam agora, em toda a base
// — é a ferramenta de calibragem dos limiares antes de ligar o envio. Envio real
// (dry=0) também passa por aqui, então a trava é no servidor, não só na UI.
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const dry = sp.get('dry') === '0' ? '0' : '1'
  const email = (sp.get('email') || '').trim()
  const buybox = sp.get('buybox') === '1' ? '1' : ''
  // Buy Box é LENTO (API de preços por seller). Só inclui com buybox=1, e de
  // preferência com email= (uma conta). Timeout evita ficar "carregando pra sempre".
  const qs = new URLSearchParams({ dry })
  if (email) qs.set('email', email)
  if (buybox) qs.set('buybox', '1')
  try {
    const r = await fetch(`${BACKEND}/api/agent/alerts-preview?${qs.toString()}`, {
      cache: 'no-store',
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
      signal: AbortSignal.timeout(60_000),
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch (e: any) {
    const lento = e?.name === 'TimeoutError' || e?.name === 'AbortError'
    return NextResponse.json({ error: lento
      ? 'Demorou demais (provável Buy Box na base toda). Tente com &email=SEU_EMAIL, e só adicione &buybox=1 junto de um email.'
      : 'Erro ao avaliar alertas' }, { status: lento ? 504 : 500 })
  }
}
