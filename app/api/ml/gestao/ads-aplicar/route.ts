import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Aplica uma recomendação do Piloto NEO do Mercado Ads (pausar/ativar/baixar-meta/
// subir-orcamento). Mexe em dinheiro real → ADMIN-ONLY (ML em teste). Blindagem
// (caps, direção segura, relê-e-confere, auditoria) mora no backend.
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'aplicar no ML está em teste (admin only)' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  try {
    const r = await fetch(`${BACKEND}/api/ml/gestao/ads-aplicar`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({ email: user.email, campaignId: b?.campaignId, acao: b?.acao, valor: b?.valor }),
      signal: AbortSignal.timeout(60_000),
    })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch {
    return NextResponse.json({ ok: false, erro: 'falha' }, { status: 502 })
  }
}
