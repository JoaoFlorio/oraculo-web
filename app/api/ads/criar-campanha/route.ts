import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

// Cria uma campanha automática pra um produto sem anúncio. GASTA dinheiro real na
// conta → ADMIN-ONLY enquanto está em teste (padrão da casa: valida na conta do
// João primeiro, depois libera). O cliente vê o botão como "em breve".
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'criação de campanha está em teste (admin only)' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  if (!b?.sku) return NextResponse.json({ error: 'sku obrigatório' }, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/ads/criar-campanha`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': KEY },
      body: JSON.stringify({ email: user.email, sku: b.sku, asin: b.asin, nome: b.nome, budget: b.budget, bid: b.bid }),
      signal: AbortSignal.timeout(60_000),
    })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
