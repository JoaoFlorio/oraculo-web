import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// 13/11/2026 — "Comprei com outro e-mail": liga a compra da Rota feita com outro e-mail a esta conta.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  let body: any = {}
  try { body = await req.json() } catch { /* vazio */ }
  const outro = String(body?.outro || '').trim().slice(0, 200)
  if (!outro) return NextResponse.json({ error: 'Digite o e-mail usado na compra.' }, { status: 400 })
  try {
    const res = await fetch(`${BACKEND}/api/rota/vincular`, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(35_000),
      headers: { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({ email: user.email, outro }),
    })
    return NextResponse.json(await res.json().catch(() => ({ error: 'resposta inválida' })), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Não consegui conferir agora. Tente de novo em instantes.' }, { status: 502 })
  }
}
