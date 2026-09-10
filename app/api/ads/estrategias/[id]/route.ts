import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const b = await req.json().catch(() => ({}))
  try {
    const r = await fetch(`${BACKEND}/api/ads/estrategias/${encodeURIComponent(id)}`, {
      method: 'PUT', headers: { 'content-type': 'application/json', 'x-internal-key': KEY },
      body: JSON.stringify({ ...b, email: user.email }), signal: AbortSignal.timeout(15_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  try {
    const r = await fetch(`${BACKEND}/api/ads/estrategias/${encodeURIComponent(id)}?email=${encodeURIComponent(user.email)}`, {
      method: 'DELETE', headers: { 'x-internal-key': KEY }, signal: AbortSignal.timeout(15_000) })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch { return NextResponse.json({ error: 'falha' }, { status: 502 }) }
}
