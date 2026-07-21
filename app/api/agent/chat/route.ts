import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'
import { prisma } from '@/lib/db'

// Lê o custo por SKU e a alíquota (gestao_imposto) que o seller cadastrou na
// aba Gerenciamento. Falha vira {} — o NEO ainda funciona sem, só não calcula
// lucro/margem, e é instruído a pedir o custo nesse caso.
//
// ⚠️ O custo do seller mora em DUAS chaves: `gestao_cmv` (o produto) e
// `gestao_extras` (prep center, etiqueta, embalagem, frete de entrada). O
// painel soma as duas antes de calcular qualquer coisa — o NEO tem que receber
// a MESMA soma, senão ele responde uma margem e a tela mostra outra.
async function custosDoSeller(userId: string): Promise<{ cmv?: Record<string, number>; aliquota?: number }> {
  try {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } })
    const m = (u?.metadata ?? {}) as Record<string, any>
    const base = m.gestao_cmv && typeof m.gestao_cmv === 'object' ? m.gestao_cmv as Record<string, any> : {}
    const extras = m.gestao_extras && typeof m.gestao_extras === 'object' ? m.gestao_extras as Record<string, any> : {}
    const cmv: Record<string, number> = {}
    for (const sku of new Set([...Object.keys(base), ...Object.keys(extras)])) {
      const soma = (Number(base[sku]) || 0) + (Number(extras[sku]) || 0)
      if (soma > 0) cmv[sku] = soma
    }
    const aliquota = Number(m.gestao_imposto) || undefined
    return { ...(Object.keys(cmv).length ? { cmv } : {}), ...(aliquota ? { aliquota } : {}) }
  } catch { return {} }
}

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

  // O NEO pode encadear várias ferramentas antes de responder. Timeout explícito
  // e generoso — sem ele, o default do runtime cortava a conexão e o cliente via
  // um "erro de rede" que não explicava nada.
  try {
    const res = await fetch(`${BACKEND}/api/agent/chat`, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(170_000),
      headers: { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      // email vem da sessão (autoritativo) — o cliente não escolhe de quem são os dados.
      // `provider` só é repassado para ADMIN: é a chave da comparação entre
      // motores (claude × gemini) e não pode cair na mão de cliente, que
      // receberia um motor ainda não validado. Cliente sempre usa o default do
      // servidor (AGENT_PROVIDER).
      body: JSON.stringify({
        email: user.email, messages, model: body?.model, agent,
        ...(user.role === 'admin' && body?.provider ? { provider: body.provider } : {}),
        // Admin (o João) não tem teto no criador de anúncio — precisa gerar à
        // vontade pra testar. Vem do role REAL do banco (não do cliente), igual
        // ao `provider` acima. Cliente comum nunca manda isAdmin=true.
        ...(user.role === 'admin' ? { isAdmin: true } : {}),
        // O CMV (custo por SKU) e a alíquota de imposto vivem no metadata do
        // usuário AQUI no web — a Amazon não conhece o que o seller pagou. O
        // NEO roda no backend e não alcança este banco, então o proxy carrega
        // esses dados e repassa. Sem isso, o NEO só via faturamento e ads, e
        // dava "análise completa" sem lucro nem margem reais.
        ...(agent === 'neo' ? await custosDoSeller(user.id) : {}),
      }),
    })
    const data = await res.json().catch(() => ({ error: 'resposta inválida do agente' }))
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    const timeout = e?.name === 'TimeoutError' || e?.name === 'AbortError'
    console.error('[agent/chat proxy]', timeout ? 'timeout' : e?.message || e)
    return NextResponse.json(
      { error: timeout ? 'A consulta demorou demais e foi interrompida. Tente uma pergunta mais específica (ex.: só o faturamento de hoje).' : 'Erro ao falar com o agente.' },
      { status: timeout ? 504 : 500 },
    )
  }
}
