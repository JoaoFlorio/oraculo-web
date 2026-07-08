import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'
import { demoInventory } from '@/lib/demoGestao'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const demo = await demoConfigFor(user)
  if (demo) return NextResponse.json(demoInventory(demo))
  try {
    const res = await fetch(`${BACKEND}/api/amazon/inventory?email=${encodeURIComponent(user.email)}`, { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao consultar estoque' }, { status: 500 })
  }
}
