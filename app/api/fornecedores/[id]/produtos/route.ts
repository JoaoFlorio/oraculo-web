import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// Produtos lidos do site do fornecedor (robô do backend). Só assinante — o backend confere.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  if (!/^\d{1,6}$/.test(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/fornecedores/${id}/produtos?email=${encodeURIComponent(user.email)}`, {
      cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' }, signal: AbortSignal.timeout(15_000),
    })
    return NextResponse.json(await r.json().catch(() => ({ error: 'resposta inválida' })), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'falha ao carregar os produtos' }, { status: 502 })
  }
}
