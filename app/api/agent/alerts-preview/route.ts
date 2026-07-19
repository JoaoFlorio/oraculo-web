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

  const dry = req.nextUrl.searchParams.get('dry') === '0' ? '0' : '1'
  try {
    const r = await fetch(`${BACKEND}/api/agent/alerts-preview?dry=${dry}`, {
      cache: 'no-store',
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao avaliar alertas' }, { status: 500 })
  }
}
