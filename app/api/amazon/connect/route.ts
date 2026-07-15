import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Inicia o fluxo OAuth. Em vez de mandar o browser pro backend com o e-mail na URL
// (padrão que o Chrome interpretava como phishing → flag "página enganosa"), busca a
// URL de consentimento server-to-server e redireciona o browser DIRETO pro login oficial
// da Amazon. O e-mail nunca aparece na navegação do usuário.
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))
  try {
    const r = await fetch(
      `${BACKEND}/api/amazon/connect?email=${encodeURIComponent(user.email)}&format=json`,
      { headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' }, cache: 'no-store' },
    )
    const data = await r.json().catch(() => null)
    if (r.ok && data?.url) return NextResponse.redirect(data.url)
  } catch { /* cai no fallback abaixo */ }
  return NextResponse.redirect(new URL('/dashboard?amazon=error&reason=connect', req.url))
}
