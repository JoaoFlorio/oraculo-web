import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// SOMENTE ADMIN. Diagnóstico do adaptador Gemini com o erro cru do Google.
export async function GET() {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const r = await fetch(`${BACKEND}/api/agent/gemini-test`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(70_000),
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao testar o Gemini' }, { status: 500 })
  }
}
