import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './db'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'oraculo-secret-change-in-prod')
export const COOKIE = 'oraculo_session'

const MAX_SESSIONS = 2   // máximo de dispositivos simultâneos

export async function createToken(userId: string): Promise<string> {
  // Remove sessões expiradas primeiro
  await prisma.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  })

  // Se já tem MAX_SESSIONS ativas, remove a mais antiga
  const active = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  if (active.length >= MAX_SESSIONS) {
    const toDelete = active.slice(0, active.length - MAX_SESSIONS + 1)
    await prisma.session.deleteMany({
      where: { id: { in: toDelete.map((s: any) => s.id) } },
    })
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET)

  // Persiste sessão no banco
  await prisma.session.create({
    data: { userId, token, expiresAt },
  })

  return token
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { userId: string }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  // Verifica se sessão ainda está registrada no banco (anti-compartilhamento)
  const session = await prisma.session.findUnique({ where: { token } })
  if (!session || session.expiresAt < new Date()) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, plan: true, active: true, expiresAt: true },
  })
  return user?.active ? user : null
}

export async function invalidateToken(token: string) {
  await prisma.session.deleteMany({ where: { token } })
}
