import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

// Gestão da equipe (staff) — somente admin.

/** Gera senha aleatória legível: ex. Orc#8f2kL */
function genPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let p = 'Orc#'
  for (let i = 0; i < 6; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p
}

// Papéis de equipe que o admin gerencia por aqui (nunca 'admin' nem 'client').
//  · staff   = só cadastra cliente
//  · support = admin RESTRITO: só vê clientes e reenvia senha (ver SupportClient)
const TEAM_ROLES = ['staff', 'support'] as const
type TeamRole = typeof TEAM_ROLES[number]

// GET /api/admin/team → lista membros da equipe (staff + support + admin)
export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const team = await prisma.user.findMany({
    where: { role: { in: ['staff', 'support', 'admin'] } },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ team })
}

// POST /api/admin/team → cria membro da equipe (staff OU support) com senha gerada
export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { name, email, role } = await req.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })
  }
  // Só staff/support saem daqui — nunca admin/client (evita criar admin pela UI).
  const teamRole: TeamRole = TEAM_ROLES.includes(role) ? role : 'staff'

  const emailNorm = email.toLowerCase().trim()
  const exists = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (exists) return NextResponse.json({ error: 'Já existe um usuário com este email' }, { status: 409 })

  const password = genPassword()
  const hash     = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: {
      name:     (typeof name === 'string' && name.trim()) || emailNorm.split('@')[0],
      email:    emailNorm,
      password: hash,
      role:     teamRole,
      plan:     'free',
      active:   true,
    },
  })

  return NextResponse.json({ ok: true, password, role: teamRole })
}

// PATCH /api/admin/team → ativa/desativa funcionário (nunca admin)
export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { email, active } = await req.json()
  if (!email || typeof email !== 'string' || typeof active !== 'boolean') {
    return NextResponse.json({ error: 'email e active (boolean) obrigatórios' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  if (user.role === 'admin') {
    return NextResponse.json({ error: 'Não é permitido alterar um admin' }, { status: 403 })
  }
  if (!TEAM_ROLES.includes(user.role as TeamRole)) {
    return NextResponse.json({ error: 'Usuário não é membro da equipe' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: user.id }, data: { active } })
  return NextResponse.json({ ok: true })
}
