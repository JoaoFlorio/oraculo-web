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

  // Demo: o agente puxa dados reais do backend, que a conta demo não tem.
  if (await demoConfigFor(user)) {
    return NextResponse.json({
      reply: 'O assistente de IA responde com os seus dados reais da Amazon. Nesta conta de demonstração não há conexão real, então ele fica indisponível — teste numa conta com a Amazon conectada de verdade.',
      demo: true, trace: [], usage: null,
    })
  }

  let body: any = {}
  try { body = await req.json() } catch { /* corpo vazio */ }
  const messages = Array.isArray(body?.messages) ? body.messages : []
  if (!messages.length) return NextResponse.json({ error: 'messages obrigatório' }, { status: 400 })

  try {
    const res = await fetch(`${BACKEND}/api/agent/chat`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      // email vem da sessão (autoritativo) — o cliente não escolhe de quem são os dados.
      body: JSON.stringify({ email: user.email, messages, model: body?.model }),
    })
    const data = await res.json().catch(() => ({ error: 'resposta inválida do agente' }))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao falar com o assistente' }, { status: 500 })
  }
}
