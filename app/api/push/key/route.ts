import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Chave pública VAPID (necessária pro browser assinar a inscrição de push).
export async function GET() {
  try {
    const r = await fetch(`${BACKEND}/api/push/public-key`, { cache: 'no-store' })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ key: '' }, { status: 500 })
  }
}
