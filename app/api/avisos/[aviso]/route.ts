import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// Avisos do app ("Novidades"): mostrar 1× por CONTA e registrar o "Entendi". O e-mail vem da
// SESSÃO, nunca do cliente — mesma regra dos outros proxies.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const valido = (s: string) => /^[a-z0-9-]{3,60}$/.test(s)

export async function GET(_req: NextRequest, { params }: { params: Promise<{ aviso: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ mostrar: false }, { status: 401 })
  const { aviso } = await params
  if (!valido(aviso)) return NextResponse.json({ mostrar: false }, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/avisos/${aviso}?email=${encodeURIComponent(user.email)}`, {
      cache: 'no-store', signal: AbortSignal.timeout(10_000), headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await r.json().catch(() => ({ mostrar: false })), { status: r.status })
  } catch {
    return NextResponse.json({ mostrar: false }, { status: 502 })   // backend fora: não incomoda o cliente
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ aviso: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { aviso } = await params
  if (!valido(aviso)) return NextResponse.json({ error: 'aviso inválido' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const acao = typeof body?.acao === 'string' ? body.acao.slice(0, 40) : undefined
  try {
    const r = await fetch(`${BACKEND}/api/avisos/${aviso}`, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(10_000),
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '', 'content-type': 'application/json' },
      body: JSON.stringify({ email: user.email, ...(acao ? { acao } : {}) }),
    })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'backend indisponível' }, { status: 502 })
  }
}
