import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

const ADMIN_KEY = process.env.INTERNAL_KEY || ''

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('key') || ''
  return key === ADMIN_KEY
}

function calcExpiry(plan: string): Date | null {
  if (plan === 'lifetime') return null
  const d = new Date()
  if (plan === 'annual')  d.setFullYear(d.getFullYear() + 1)
  if (plan === 'monthly') d.setMonth(d.getMonth() + 1)
  return d
}

// GET  /api/admin/users?key=XXX  → lista todos os usuários
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, plan: true, active: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ users })
}

// POST /api/admin/users  → cria ou atualiza usuário
// Body: { key, email, name?, password?, plan? }
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { email, name, password, plan } = await req.json()
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })

  const targetPlan = plan || 'monthly'
  const expiry     = calcExpiry(targetPlan)
  const exists     = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  if (exists) {
    const data: any = { plan: targetPlan, expiresAt: expiry }
    if (name) data.name = name
    if (password) data.password = await bcrypt.hash(password, 12)
    const updated = await prisma.user.update({ where: { id: exists.id }, data })
    return NextResponse.json({ ok: true, action: 'updated', user: { id: updated.id, email: updated.email, plan: updated.plan, expiresAt: updated.expiresAt } })
  }

  const hash = await bcrypt.hash(password || 'oraculo123', 12)
  const user = await prisma.user.create({
    data: {
      name:      name || email.split('@')[0],
      email:     email.toLowerCase(),
      password:  hash,
      plan:      targetPlan,
      active:    true,
      expiresAt: expiry,
    },
  })
  return NextResponse.json({ ok: true, action: 'created', user: { id: user.id, email: user.email, plan: user.plan }, defaultPassword: password ? undefined : 'oraculo123' })
}

// PATCH /api/admin/users  → muda plano de um usuário existente
// Body: { key, email, plan }
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { email, plan } = await req.json()
  if (!email || !plan) return NextResponse.json({ error: 'email e plan obrigatórios' }, { status: 400 })
  const expiry = calcExpiry(plan)
  const user = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data:  { plan, expiresAt: expiry },
  })
  return NextResponse.json({ ok: true, user: { email: user.email, plan: user.plan, expiresAt: user.expiresAt } })
}
