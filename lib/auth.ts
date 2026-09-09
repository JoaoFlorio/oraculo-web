import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './db'

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET ausente em produção — defina no Railway (oraculo-web).')
}
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'oraculo-secret-dev-only')
export const COOKIE = 'oraculo_session'

// Sessões simultâneas por usuário. Subiu pra 3 (João, 06/08/2026): com 2, se o
// dono logava DUAS vezes no PC (o web cria sessão nova a cada login), a 3ª
// empurrava a sessão do CELULAR pra fora e ele perdia a notificação push do app.
// Com 3 há folga pra PC + celular sem derrubar o telefone. Anti-compartilhamento
// continua: o 4º aparelho derruba o mais antigo. Ajustável por env.
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || '3')

export async function createToken(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET)

  await prisma.$transaction(async (tx) => {
    await tx.session.create({ data: { userId, token, expiresAt } })
    const keep = await tx.session.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' }, take: MAX_SESSIONS, select: { id: true },
    })
    await tx.session.deleteMany({ where: { userId, id: { notIn: keep.map(k => k.id) } } })
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

// Folga após o vencimento. ZERO (09/09/2026, decisão do João): venceu, bloqueia
// NA HORA. A proteção contra "cortar quem está renovando" agora é outra: o
// vencido não é DESLOGADO — ele entra e vê a tela "seu acesso venceu + pagar"
// (getSessionOrExpired), e o pagamento libera na hora via webhook. Antes o grace
// de 2 dias mascarava o vencimento e o overlay de renovação nem aparecia.
const GRACE_MS = 0

type AccessUser = { active?: boolean; plan?: string; expiresAt?: Date | null; role?: string }
// Regra de acesso do Oráculo: NÃO existe plano grátis. Sem pagamento = sem acesso.
// Retorna o motivo da negação, ou null se o acesso está liberado.
export function accessDenied(user: AccessUser | null): 'notfound' | 'inactive' | 'free' | 'expired' | null {
  if (!user) return 'notfound'
  if (!user.active) return 'inactive'
  if (user.role === 'admin' || user.role === 'staff' || user.role === 'support' || user.role === 'demo') return null // equipe/demo entram independente de plano
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

/* Como getSession, MAS deixa o VENCIDO entrar (marcado `expired: true`) pra ver a
 * tela "seu acesso venceu + pagar" — em vez de ser jogado pro /login sem entender
 * por quê (09/09/2026). Só 'expired' entra; sem conta / inativo (reembolso) / sem
 * plano / sessão inválida continuam barrados (user: null → login).
 * ⚠️ NÃO usar isto pra servir DADOS: as APIs seguem no getSession() (o vencido
 * leva 401). Isto é só pra a CASCA do dashboard renderizar o overlay bloqueante. */
export async function getSessionOrExpired(): Promise<{ user: Awaited<ReturnType<typeof getSession>>; expired: boolean }> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return { user: null, expired: false }
  const payload = await verifyToken(token)
  if (!payload) return { user: null, expired: false }
  const session = await prisma.session.findUnique({ where: { token } })
  if (!session || session.expiresAt < new Date()) return { user: null, expired: false }
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, plan: true, active: true, expiresAt: true, role: true, phone: true },
  })
  if (!user) return { user: null, expired: false }
  const deny = accessDenied(user)
  if (!deny) return { user, expired: false }
  if (deny === 'expired') return { user, expired: true }   // entra só pra ver a tela de pagar
  return { user: null, expired: false }                     // notfound/inactive/free → login
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

// Sessão com acesso à GESTÃO DE CLIENTES (listar + reenviar senha): admin OU
// support. O papel `support` é um admin RESTRITO — enxerga só a tela de clientes
// e reenvia senha; NUNCA vê vendas/faturamento/equipe (essas usam getAdminSession).
export async function getClientsSession() {
  const user = await getSession()
  if (!user || (user.role !== 'admin' && user.role !== 'support')) return null
  return user
}

export async function invalidateToken(token: string) {
  await prisma.session.deleteMany({ where: { token } })
}
