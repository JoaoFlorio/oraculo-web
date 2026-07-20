import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// SOMENTE ADMIN. Saúde do processo do backend: lag do event loop, memória e
// pool do Postgres. É a URL pra abrir quando o painel estiver lento — o campo
// eventLoop.veredito já diz se o processo está travado (a causa da lentidão de
// 19/07, que na época só deu pra deduzir por eliminação).
// Mede também o tempo de ida e volta, pra separar "backend lento" de "rede".
export async function GET() {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const t0 = Date.now()
  try {
    const r = await fetch(`${BACKEND}/api/diag/metrics`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    const data = await r.json().catch(() => ({ error: 'resposta inválida' }))
    return NextResponse.json({ ...data, tempoDeRespostaMs: Date.now() - t0 }, { status: r.status })
  } catch (e: any) {
    // O próprio timeout já é diagnóstico: backend não respondeu em 30s.
    return NextResponse.json(
      { error: 'backend não respondeu', tempoDeRespostaMs: Date.now() - t0, detalhe: String(e?.name || e) },
      { status: 504 },
    )
  }
}
