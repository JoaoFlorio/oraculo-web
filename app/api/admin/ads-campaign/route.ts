import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * POST /api/admin/ads-campaign  { campaignId, state?, budget? }
 *
 * Pausa/reativa e muda orçamento diário. ⚠️ ALTERA GASTO REAL DE ANÚNCIO.
 *
 * SÓ ADMIN e SÓ NA PRÓPRIA CONTA: o e-mail vem da sessão, nunca do corpo —
 * enquanto está em teste, não existe caminho pra mexer em campanha de cliente.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const campaignId = String(body?.campaignId || '').trim()
  if (!campaignId) return NextResponse.json({ error: 'campaignId obrigatório' }, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/ads/campaign-update`, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({
        email: admin.email, campaignId,
        ...(body?.state ? { state: body.state } : {}),
        ...(body?.budget != null ? { budget: body.budget } : {}),
      }),
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Backend indisponível' }, { status: 502 })
  }
}
