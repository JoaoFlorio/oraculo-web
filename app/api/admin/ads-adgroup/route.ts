import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * POST /api/admin/ads-adgroup  { adGroupId, campaignId, bid }
 *
 * Muda o LANCE do grupo de anúncios. ⚠️ ALTERA O CPC REAL DA CAMPANHA.
 *
 * SÓ ADMIN e SÓ NA PRÓPRIA CONTA: o e-mail vem da sessão, nunca do corpo —
 * enquanto está em teste, não existe caminho pra mexer em campanha de cliente.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const adGroupId = String(body?.adGroupId || '').trim()
  const campaignId = String(body?.campaignId || '').trim()
  if (!adGroupId || !campaignId) return NextResponse.json({ error: 'adGroupId e campaignId obrigatórios' }, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/ads/adgroup-update`, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({ email: admin.email, adGroupId, campaignId, bid: Number(body?.bid) }),
    })
    const d = await r.json().catch(() => ({ error: 'resposta inválida' }))
    return NextResponse.json(d, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'sem resposta do servidor' }, { status: 500 })
  }
}
