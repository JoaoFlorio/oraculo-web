import { NextRequest, NextResponse } from 'next/server'

const ADMIN_COOKIE = 'oraculo_adm_access'
const ADMIN_TOKEN  = process.env.ADMIN_ACCESS_TOKEN || ''

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Protege /admin ───────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const cookie = req.cookies.get(ADMIN_COOKIE)?.value ?? ''

    // Sem cookie válido → 404 (não 403, para não revelar que a rota existe)
    if (!ADMIN_TOKEN || cookie !== ADMIN_TOKEN) {
      return new NextResponse(null, { status: 404 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
