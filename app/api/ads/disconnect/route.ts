import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function POST() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const res = await fetch(`${BACKEND}/api/ads/disconnect?email=${encodeURIComponent(user.email)}`, { method: 'POST', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 })
  }
}
