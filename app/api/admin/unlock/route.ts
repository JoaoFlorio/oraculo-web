import { NextRequest, NextResponse } from 'next/server'

const ADMIN_COOKIE = 'oraculo_adm_access'
const ADMIN_TOKEN  = process.env.ADMIN_ACCESS_TOKEN || ''

/**
 * GET /api/admin/unlock?token=SEU_TOKEN_SECRETO
 *
 * Se o token bater com ADMIN_ACCESS_TOKEN (env var):
 *   → define cookie httpOnly + redirectiona para /admin
 *
 * Se errar:
 *   → 404 (não revela que o endpoint existe)
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    // Retorna 404 — como se a rota não existisse
    return new NextResponse(null, { status: 404 })
  }

  // Usa o host real (x-forwarded-host no Railway) para montar o redirect
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host  = req.headers.get('x-forwarded-host')  || req.headers.get('host') || 'app.oraculojf.com.br'
  const res = NextResponse.redirect(new URL('/admin', `${proto}://${host}`))

  // Cookie httpOnly: JavaScript do browser não consegue ler nem roubar
  res.cookies.set(ADMIN_COOKIE, ADMIN_TOKEN, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path:     '/admin',
    maxAge:   60 * 60 * 8, // expira em 8 horas
  })

  return res
}

/**
 * DELETE /api/admin/unlock  → logout do admin (limpa o cookie)
 */
export async function DELETE(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host  = req.headers.get('x-forwarded-host')  || req.headers.get('host') || 'app.oraculojf.com.br'
  const res = NextResponse.redirect(new URL('/', `${proto}://${host}`))
  res.cookies.delete(ADMIN_COOKIE)
  return res
}
