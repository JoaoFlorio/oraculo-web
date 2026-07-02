import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './db'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'oraculo-secret-change-in-prod')
export const COOKIE = 'oraculo_session'

const MAX_SESSIONS = 1   // 1 acesso simultâneo: novo login encerra o anterior

export async function createToken(userId: string): Promise<string> {
  // Remove sessões expiradas primeiro
  await prisma.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  })

  // Se já atingiu MAX_SESSIONS, encerra a(s) sessão(ões) anterior(es) antes de abrir a nova
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

// Folga após o vencimento (evita travar exatamente na hora da renovação recorrente).
const GRACE_MS = 2 * 24 * 60 * 60 * 1000

type AccessUser = { active?: boolean; plan?: string; expiresAt?: Date | null; role?: string }
// Regra de acesso do Oráculo: NÃO existe plano grátis. Sem pagamento = sem acesso.
// Retorna o motivo da negação, ou null se o acesso está liberado.
export function accessDenied(user: AccessUser | null): 'notfound' | 'inactive' | 'free' | 'expired' | null {
  if (!user) return 'notfound'
  if (!user.active) return 'inactive'
  if (user.role === 'admin' || user.role === 'staff') return null // equipe entra independente de plano
  if (user.plan === 'free' || !user.plan) return 'free'           // sem plano pago = bloqueado
  if (user.plan === 'lifetime') return null                       // vitalício nunca expira
  if (user.expiresAt && new Date(user.expiresAt).getTime() + GRACE_MS < Date.now()) return 'expired'
  return null
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
    select: { id: true, name: true, email: true, plan: true, active: true, expiresAt: true, role: true, phone: true },
  })
  return user && !accessDenied(user) ? user : null
}

// Sessão de equipe (admin/staff) — usada pelas rotas /api/admin e pela página /admin.
export async function getStaffSession() {
  const user = await getSession()
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) return null
  return user
}

// Sessão só de admin — para dados sensíveis (dashboard/faturamento, licenças).
export async function getAdminSession() {
  const user = await getSession()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function invalidateToken(token: string) {
  await prisma.session.deleteMany({ where: { token } })
}
