import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Proxy do gerador de imagem (Nano Banana). O Criador de Anúncios dentro do
// Oráculo — o cliente descreve/manda a foto do produto e recebe a imagem, sem
// sair pro ChatGPT. Exige login (é serviço pago que gasta por imagem).
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: any = {}
  try { body = await req.json() } catch {}
  const prompt = String(body?.prompt || '').trim()
  if (!prompt) return NextResponse.json({ error: 'Descreva a imagem que você quer.' }, { status: 400 })

  try {
    const r = await fetch(`${BACKEND}/api/agent/imagem`, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(120_000),
      headers: { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      // 🔒 SEGURANÇA: email/plano/isAdmin vêm da SESSÃO (nunca do cliente) pra o
      // backend cobrar o crédito certo. Antes só ia {prompt, refs} e a imagem
      // saía sem cobrança nenhuma (furo do pentest 06/08).
      body: JSON.stringify({
        prompt,
        refs: Array.isArray(body?.refs) ? body.refs.slice(0, 6) : [],
        email: user.email,
        planoSeller: user.plan,
        ...(user.role === 'admin' ? { isAdmin: true } : {}),
      }),
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch (e: any) {
    const timeout = e?.name === 'TimeoutError' || e?.name === 'AbortError'
    return NextResponse.json(
      { ok: false, erro: timeout ? 'A geração demorou demais. Tente de novo.' : 'Erro ao gerar a imagem.' },
      { status: timeout ? 504 : 500 },
    )
  }
}
