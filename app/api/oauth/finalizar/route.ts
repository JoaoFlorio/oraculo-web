import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { COOKIE_OAUTH } from '@/lib/oauthVinculo'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://app.oraculojf.com.br'
const ROTA: Record<string, string> = { amazon: '/api/amazon/finalizar', ads: '/api/ads/finalizar', ml: '/api/ml/gestao/finalizar' }

/* 28/10 (varredura): onde a conexão Amazon / Ads / Mercado Livre é CONCLUÍDA. O callback do backend só guardou o code e
 * mandou o navegador pra cá; aqui vale a sessão logada + o segredo do cookie deixado pelo "Conectar" (lib/oauthVinculo.ts).
 * Quem abre um link de consentimento gerado por OUTRA conta chega aqui sem o cookie (ou logado em outra conta) → recusado. */
export async function GET(req: NextRequest) {
  const prov = req.nextUrl.searchParams.get('prov') || ''
  const id = req.nextUrl.searchParams.get('p') || ''
  const volta = (q: string) => {
    const res = NextResponse.redirect(new URL(`/dashboard?${q}`, APP))
    res.cookies.set(COOKIE_OAUTH, '', { path: '/api/oauth', maxAge: 0 })
    return res
  }
  if (!ROTA[prov] || !/^[A-Za-z0-9_-]{10,40}$/.test(id)) return volta('conexao=error')
  const user = await getSession()
  if (!user) return volta(`${prov}=error&reason=sessao`)
  try {
    const r = await fetch(`${BACKEND}${ROTA[prov]}`, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(60_000),
      headers: { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({ email: user.email, id, segredo: req.cookies.get(COOKIE_OAUTH)?.value || '' }),
    })
    const d = await r.json().catch(() => null)
    const q = String(d?.q || '')
    return volta(new RegExp(`^${prov}=(connected|error(&reason=[a-z0-9-]+)?)$`).test(q) ? q : `${prov}=error&reason=exchange`)
  } catch {
    return volta(`${prov}=error&reason=exchange`)
  }
}
