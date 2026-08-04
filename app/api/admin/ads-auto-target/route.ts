import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * POST /api/admin/ads-auto-target  { targetId, campaignId, bid }
 *
 * Muda o lance de UMA das 4 segmentações da campanha automática.
 * ⚠️ ALTERA O CPC REAL daquela segmentação.
 *
 * SÓ ADMIN e SÓ NA PRÓPRIA CONTA: o e-mail vem da sessão, nunca do corpo.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const targetId = String(body?.targetId || '').trim()
  const campaignId = String(body?.campaignId || '').trim()
  if (!targetId || !campaignId) return NextResponse.json({ error: 'targetId e campaignId obrigatórios' }, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/ads/auto-target-update`, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({ email: admin.email, targetId, campaignId, bid: Number(body?.bid) }),
    })
    const d = await r.json().catch(() => ({ error: 'resposta inválida' }))
    return NextResponse.json(d, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'sem resposta do servidor' }, { status: 500 })
  }
}
