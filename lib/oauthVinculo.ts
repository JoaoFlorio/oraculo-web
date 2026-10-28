import crypto from 'crypto'
import type { NextResponse } from 'next/server'

/* 🔒 28/10 (varredura) — conexão Amazon / Ads / Mercado Livre PRESA ao navegador de quem clicou "Conectar".
 * Antes, a URL de consentimento podia ser copiada e mandada pra outro seller: ele aprovava e o token dele caía na conta
 * de quem gerou o link. Agora o "Conectar" deixa um segredo num cookie HttpOnly deste navegador e manda só o hash pro
 * backend (vai no `state`). O callback não grava: volta pra /api/oauth/finalizar, que confere a sessão logada + o
 * segredo do cookie. Par no backend: src/lib/oauthPendente.ts. */
export const COOKIE_OAUTH = 'ora_oauth'

export function novoVinculo(): { segredo: string; hash: string } {
  const segredo = crypto.randomBytes(32).toString('hex')
  return { segredo, hash: crypto.createHash('sha256').update(segredo).digest('hex') }
}

/** Cookie só vai pra /api/oauth (a rota que conclui) e vale 15 min — o mesmo prazo do state. */
export function gravarCookieOAuth(res: NextResponse, segredo: string): NextResponse {
  res.cookies.set(COOKIE_OAUTH, segredo, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/oauth', maxAge: 15 * 60 })
  return res
}
