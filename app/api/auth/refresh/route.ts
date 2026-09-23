import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/db'
import { COOKIE, verifyToken, accessDenied } from '@/lib/auth'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'oraculo-secret-dev-only')
const RENEW_AFTER_MS = 7 * 24 * 60 * 60 * 1000   // renova quando a sessão tem >7 dias
const TTL_MS = 30 * 24 * 60 * 60 * 1000

// Renovação DESLIZANTE da sessão: o painel/app chama no carregamento; se a sessão
// atual tem mais de 7 dias, re-emite o JWT por +30d e atualiza a MESMA row
// (não cria sessão — não mexe no cap de 2 dispositivos). Resultado: o app PWA em
// uso nunca expira; só desloga quem ficou 30 dias sem abrir.
export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return NextResponse.json({ ok: false }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ ok: false }, { status: 401 })

  const session = await prisma.session.findUnique({ where: { token } })
  if (!session || session.expiresAt < new Date()) return NextResponse.json({ ok: false }, { status: 401 })

  // 🚨 BLINDAGEM (14/09): não DESLIZA a sessão de quem está bloqueado (mensal vencido
  // que não pagou, inativo, etc.). Sem isto, o vencido mantinha a sessão viva +30d a
  // cada abertura do PWA. Os dados já são barrados no getSession, mas manter a sessão
  // de um não-pagante rodando é justamente o "assina e não paga" que a gente quer cortar.
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { active: true, plan: true, expiresAt: true, role: true },
  })
  if (!user || accessDenied(user)) return NextResponse.json({ ok: false, blocked: true }, { status: 401 })

  if (Date.now() - session.createdAt.getTime() < RENEW_AFTER_MS) {
    return NextResponse.json({ ok: true, renewed: false })
  }
  // 23/09: conta privilegiada não desliza — 8h e acabou (loga de novo).
  if (['admin', 'support', 'staff'].includes(String(user.role || ''))) {
    return NextResponse.json({ ok: true, renewed: false })
  }

  const fresh = await new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET)

  await prisma.session.update({
    where: { token },
    data: { token: fresh, expiresAt: new Date(Date.now() + TTL_MS), createdAt: new Date() },
  })

  const res = NextResponse.json({ ok: true, renewed: true })
  res.cookies.set(COOKIE, fresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: TTL_MS / 1000, path: '/' })
  return res
}
