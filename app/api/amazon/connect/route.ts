import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Redireciona o navegador para o fluxo OAuth do backend (com o email do usuário logado).
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))
  return NextResponse.redirect(`${BACKEND}/api/amazon/connect?email=${encodeURIComponent(user.email)}`)
}
