import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'

// Proxy do AGENTE de IA. Reaproveita o MESMO encanamento das outras rotas:
// sessão → user.email, BACKEND_URL e INTERNAL_KEY do web. O front manda só
// { messages }; o email vem da sessão (nunca do cliente). Conta demo é barrada
// com uma mensagem clara (o agente lê dados REAIS do backend, não a demo fake).
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: any = {}
  try { body = await req.json() } catch { /* corpo vazio */ }
  const messages = Array.isArray(body?.messages) ? body.messages : []
  const agent = body?.agent === 'suporte' ? 'suporte' : 'neo'

  // Demo: o NEO analisa dados REAIS da Amazon, que a conta demo não tem. Já o
  // suporte responde dúvida de produto — esse funciona normalmente na demo.
  if (agent === 'neo' && (await demoConfigFor(user))) {
    return NextResponse.json({
      reply: 'O NEO analisa os seus números reais da Amazon. Nesta conta de demonstração não existe conexão real, então ele fica indisponível aqui — teste numa conta com a Amazon conectada. Para dúvidas sobre o Oráculo, use o assistente de suporte no canto da tela.',
      demo: true, trace: [], usage: null,
    })
  }
  if (!messages.length) return NextResponse.json({ error: 'messages obrigatório' }, { status: 400 })

  try {
    const res = await fetch(`${BACKEND}/api/agent/chat`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      // email vem da sessão (autoritativo) — o cliente não escolhe de quem são os dados.
      body: JSON.stringify({ email: user.email, messages, model: body?.model, agent }),
    })
    const data = await res.json().catch(() => ({ error: 'resposta inválida do agente' }))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao falar com o assistente' }, { status: 500 })
  }
}
