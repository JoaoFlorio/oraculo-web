import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Status da conexão ML DESTE cliente (Gestão ML). O email vem SEMPRE da sessão.
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ connected: false }, { status: 401 })
  try {
    const r = await fetch(`${BACKEND}/api/ml/gestao/status?email=${encodeURIComponent(user.email)}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ connected: false }, { status: 500 })
  }
}
