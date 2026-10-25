import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// "O que os alunos procuram" (25/10) — só ADMIN (tem termos de busca dos alunos; catálogos entram só no agregado).
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const dias = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get('dias')) || 30))
  try {
    const r = await fetch(`${BACKEND}/api/fornecedores/relatorio?dias=${dias}`, { cache: 'no-store', signal: AbortSignal.timeout(20_000), headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await r.json().catch(() => ({ error: 'resposta inválida' })), { status: r.status })
  } catch { return NextResponse.json({ error: 'backend indisponível' }, { status: 502 }) }
}
