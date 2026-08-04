import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * GET /api/admin/ads-auto-targets?campaignId=...
 *
 * As 4 segmentações de uma campanha automática e o lance de cada uma. Campanha
 * automática não tem palavra-chave — tem estas quatro, e cada uma se comporta
 * como uma campanha diferente.
 *
 * SÓ ADMIN e SÓ NA PRÓPRIA CONTA: o e-mail vem da sessão, nunca do cliente.
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const campaignId = String(req.nextUrl.searchParams.get('campaignId') || '').trim()
  if (!campaignId) return NextResponse.json({ error: 'campaignId obrigatório' }, { status: 400 })
  try {
    const r = await fetch(
      `${BACKEND}/api/ads/auto-targets?email=${encodeURIComponent(admin.email)}&campaignId=${encodeURIComponent(campaignId)}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } },
    )
    const d = await r.json().catch(() => ({ ok: false, erro: 'resposta inválida' }))
    return NextResponse.json(d, { status: r.status })
  } catch {
    return NextResponse.json({ ok: false, erro: 'sem resposta do servidor' }, { status: 500 })
  }
}
