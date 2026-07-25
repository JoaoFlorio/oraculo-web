import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * GET /api/admin/ads-campaigns  — sonda da API de campaign management do Ads.
 *
 * ⚠️ SÓ ADMIN, de propósito (pedido do João: testar antes de liberar pra todos).
 * O gate mora aqui e não no backend porque é aqui que existe sessão/papel; a rota
 * do backend segue atrás do requireInternal, como o resto do Ads.
 *
 * Usa o e-mail da SESSÃO do admin — não aceita e-mail por parâmetro. Enquanto é
 * experimento, ninguém consegue apontá-lo pra conta de outro anunciante.
 */
export async function GET(_req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const r = await fetch(`${BACKEND}/api/ads/campaigns?email=${encodeURIComponent(admin.email)}`, {
      cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Backend indisponível' }, { status: 502 })
  }
}
