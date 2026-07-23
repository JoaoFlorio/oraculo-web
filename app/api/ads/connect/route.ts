import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Inicia o fluxo OAuth de Ads. Busca a URL de consentimento server-to-server
// (com a chave interna e o e-mail da SESSÃO) e redireciona o navegador direto
// pro consent — o e-mail nunca aparece na URL do cliente, e o backend /connect
// agora exige a chave (fecha o achado 13: atrelar Ads de terceiro a um cliente).
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))
  try {
    const r = await fetch(
      `${BACKEND}/api/ads/connect?email=${encodeURIComponent(user.email)}&format=json`,
      { headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' }, cache: 'no-store' },
    )
    const data = await r.json().catch(() => null)
    if (r.ok && data?.url) return NextResponse.redirect(data.url)
  } catch { /* cai no fallback abaixo */ }
  return NextResponse.redirect(new URL('/dashboard?ads=error&reason=connect', req.url))
}
