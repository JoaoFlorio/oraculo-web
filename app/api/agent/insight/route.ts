import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'

// Proxy do "insight do dia" do NEO. Mesmo encanamento das outras rotas: sessão →
// email (nunca do cliente). O cache de 12h vive no backend.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Demo não tem dados reais — devolve vazio em vez de inventar um insight.
  if (await demoConfigFor(user)) return NextResponse.json({ demo: true })

  const force = req.nextUrl.searchParams.get('force') === '1' ? '&force=1' : ''
  try {
    const res = await fetch(`${BACKEND}/api/agent/insight?email=${encodeURIComponent(user.email)}${force}`, {
      cache: 'no-store',
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    const data = await res.json().catch(() => ({ error: 'resposta inválida' }))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar o insight' }, { status: 500 })
  }
}
