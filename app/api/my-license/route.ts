import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET(_req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const res = await fetch(
      `${BACKEND}/api/license/by-email?email=${encodeURIComponent(user.email)}`,
      {
        headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
        cache: 'no-store',
      }
    )
    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar licença' }, { status: 500 })
  }
}
