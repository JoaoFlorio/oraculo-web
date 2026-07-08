import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ connected: false }, { status: 401 })
  if (await demoConfigFor(user)) return NextResponse.json({ connected: true, sellerId: 'DEMO', demo: true })
  try {
    const res = await fetch(`${BACKEND}/api/amazon/status?email=${encodeURIComponent(user.email)}`, { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ connected: false }, { status: 500 })
  }
}
