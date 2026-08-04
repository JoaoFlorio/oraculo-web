import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * POST /api/agent/aplicar  { tipo: 'pausar' | 'baixar-lance', campaignId }
 *
 * Executa a recomendação do NEO na campanha. ⚠️ ALTERA GASTO REAL DE ANÚNCIO.
 *
 * O e-mail vem da SESSÃO, nunca do corpo: mesmo que alguém forje o campaignId,
 * ele só alcança campanha da própria conta — a Amazon responde pelo token do
 * dono da sessão.
 *
 * ⚠️ O que o cliente escolhe é o TIPO, não o valor. "baixar-lance" é sempre 10%
 * e a rota do backend recusa fator ≥ 1: não existe caminho, daqui, pra
 * multiplicar lance em lote. Reduzir é reversível na prática (é só subir de
 * novo); multiplicar por engano queima orçamento antes de alguém notar.
 */
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (await demoConfigFor(user)) {
    return NextResponse.json({ ok: false, erro: 'A conta de demonstração não altera campanha de verdade.' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const campaignId = String(body?.campaignId || '').trim()
  const tipo = String(body?.tipo || '')
  if (!campaignId) return NextResponse.json({ error: 'campaignId obrigatório' }, { status: 400 })
  if (tipo !== 'pausar' && tipo !== 'baixar-lance') {
    return NextResponse.json({ error: 'tipo inválido' }, { status: 400 })
  }

  const alvo = tipo === 'pausar'
    ? { url: `${BACKEND}/api/ads/campaign-update`, corpo: { email: user.email, campaignId, state: 'PAUSED' } }
    : { url: `${BACKEND}/api/ads/campaign-bid-scale`, corpo: { email: user.email, campaignId, fator: 0.9 } }

  try {
    const r = await fetch(alvo.url, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify(alvo.corpo),
    })
    const d = await r.json().catch(() => ({ ok: false, erro: 'resposta inválida' }))
    return NextResponse.json(d, { status: r.status })
  } catch {
    return NextResponse.json({ ok: false, erro: 'sem resposta do servidor' }, { status: 500 })
  }
}
