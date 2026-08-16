import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { createToken, COOKIE } from '@/lib/auth'

// Consome o link de acesso único gerado pelo Sellion (backend /api/partner/impersonate)
// e loga o operador COMO o cliente. O token é de uso único e curta duração; o
// consentimento (User.metadata.partner_sellion) é reconferido aqui. Nada disso é
// visível na área do cliente do Oráculo — é uma URL que o parceiro abre.
// Redirect com Location RELATIVO — o backend do Railway enxerga o host interno
// (localhost:8080), então montar URL absoluta a partir de req.url manda o browser
// pro lugar errado. Location relativo o navegador resolve no domínio público.
function redirect(path: string, cookie?: { value: string }): NextResponse {
  const res = new NextResponse(null, { status: 307, headers: { Location: path } })
  if (cookie) {
    res.cookies.set(COOKIE, cookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
  }
  return res
}

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t') || ''
  const falhar = (msg: string) =>
    redirect(`/login?erro=${encodeURIComponent(msg)}`)

  if (!t) return falhar('Link inválido.')

  const hash = createHash('sha256').update(t).digest('hex')

  // Token de uso único, não expirado.
  const rows = await prisma.$queryRaw<{ email: string }[]>`
    SELECT email FROM partner_login
    WHERE token_hash = ${hash} AND used_at IS NULL AND expires_at > now()
    LIMIT 1`
  const email = rows[0]?.email
  if (!email) return falhar('Link expirado ou já usado.')

  // Reconfere o consentimento e acha o cliente.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, active: true, metadata: true },
  })
  const consentiu = (user?.metadata as { partner_sellion?: boolean } | null)?.partner_sellion === true
  if (!user || !user.active || !consentiu) return falhar('Cliente não autorizou o acesso.')

  // Uso único: marca consumido ANTES de criar a sessão.
  await prisma.$executeRaw`UPDATE partner_login SET used_at = now() WHERE token_hash = ${hash}`

  const token = await createToken(user.id)
  return redirect('/', { value: token })
}
