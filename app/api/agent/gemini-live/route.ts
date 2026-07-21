import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// SOMENTE ADMIN. Roda o NEO real no Gemini com a conta do próprio admin e
// devolve o erro cru se falhar. Usa o email da sessão (não do cliente).
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const q = req.nextUrl.searchParams.get('q') || ''
  try {
    const r = await fetch(`${BACKEND}/api/agent/gemini-live?email=${encodeURIComponent(user.email)}&q=${encodeURIComponent(q)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(170_000),
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao rodar o teste ao vivo' }, { status: 500 })
  }
}
