import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Debug temporário: mostra o email da sessão e o que o backend devolve para ele.
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'sem sessão (não logado)' }, { status: 401 })
  const email = user.email
  const out: any = { sessionEmail: email, backendBase: BACKEND }
  const grab = async (path: string) => {
    try { const r = await fetch(`${BACKEND}${path}`, { cache: 'no-store' }); return { status: r.status, body: await r.json() } }
    catch (e: any) { return { error: String(e?.message || e) } }
  }
  out.adsStatus = await grab(`/api/ads/status?email=${encodeURIComponent(email)}`)
  out.adsReport30d = await grab(`/api/ads/report?email=${encodeURIComponent(email)}&window=30d`)
  out.adsReportToday = await grab(`/api/ads/report?email=${encodeURIComponent(email)}&window=today`)
  return NextResponse.json(out)
}
