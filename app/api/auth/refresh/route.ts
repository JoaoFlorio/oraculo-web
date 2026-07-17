import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/db'
import { COOKIE, verifyToken } from '@/lib/auth'

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

  if (Date.now() - session.createdAt.getTime() < RENEW_AFTER_MS) {
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
