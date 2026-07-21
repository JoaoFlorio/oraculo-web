import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Criador de Anúncio Completo: URL/ASIN → 6 imagens profissionais + dados do
// produto (a copy o NEO escreve na conversa). Exige login; a demo é barrada
// (gasta geração de imagem real). email vem da sessão.
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (await demoConfigFor(user)) return NextResponse.json({ error: 'Indisponível na conta de demonstração.' }, { status: 403 })

  let body: any = {}
  try { body = await req.json() } catch {}
  const link = String(body?.link || '').trim()
  if (!link) return NextResponse.json({ error: 'Cole o link do produto na Amazon (ou o ASIN).' }, { status: 400 })

  try {
    const r = await fetch(`${BACKEND}/api/agent/criar-anuncio`, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(170_000),   // 6 imagens sequenciais leva tempo
      headers: { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({ email: user.email, link }),
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch (e: any) {
    const timeout = e?.name === 'TimeoutError' || e?.name === 'AbortError'
    return NextResponse.json(
      { error: timeout ? 'A criação demorou demais. As imagens levam alguns minutos — tente de novo.' : 'Erro ao criar o anúncio.' },
      { status: timeout ? 504 : 500 },
    )
  }
}
