import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const qs = new URLSearchParams({ email: user.email })
  if (searchParams.get('window')) qs.set('window', searchParams.get('window')!)
  try {
    const res = await fetch(`${BACKEND}/api/ads/refresh?${qs.toString()}`, { method: 'POST', cache: 'no-store' })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar ads' }, { status: 500 })
  }
}
