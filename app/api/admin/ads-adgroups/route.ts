import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * GET /api/admin/ads-adgroups?campaignId=...
 *
 * Os grupos de anúncio de uma campanha e o lance atual de cada um. Na Amazon o
 * lance não existe no nível da campanha: o `defaultBid` do grupo é o valor que
 * vale pra todo target sem lance próprio — é essa a alavanca de "baixar o lance
 * dessa campanha" sem abrir palavra por palavra.
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
      `${BACKEND}/api/ads/adgroups?email=${encodeURIComponent(admin.email)}&campaignId=${encodeURIComponent(campaignId)}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } },
    )
    const d = await r.json().catch(() => ({ error: 'resposta inválida' }))
    return NextResponse.json(d, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'sem resposta do servidor' }, { status: 500 })
  }
}
