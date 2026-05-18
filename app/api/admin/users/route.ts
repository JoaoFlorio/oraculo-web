import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

const ADMIN_KEY    = process.env.INTERNAL_KEY  || ''
const ADMIN_SECRET = process.env.ADMIN_SECRET  || ''
const BACKEND_URL  = process.env.BACKEND_URL   || 'https://central.oraculojf.com.br'

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-key') === ADMIN_KEY
}

function calcExpiry(plan: string): Date | null {
  if (plan === 'lifetime') return null
  const d = new Date()
  // Usar ms exatos evita bugs de meses/anos com dias diferentes
  if (plan === 'annual')  d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000)
  if (plan === 'monthly') d.setTime(d.getTime() +  30 * 24 * 60 * 60 * 1000)
  return d
}

/** Gera senha aleatória legível: ex. Orc#8f2kL */
function genPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let p = 'Orc#'
  for (let i = 0; i < 6; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p
}

/** Cria licença no backend. Retorna a chave gerada ou null em caso de falha. */
async function createBackendLicense(email: string, plan: string): Promise<string | null> {
  try {
    const backendPlan = plan === 'free' ? 'monthly' : plan  // free não existe no backend
    const url = `${BACKEND_URL}/api/license/generate`
    console.log(`[admin/users] createBackendLicense → POST ${url} | plan=${backendPlan} | secret=${ADMIN_SECRET ? ADMIN_SECRET.slice(0,4)+'…' : '(vazio!)'}`)
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body:    JSON.stringify({ email: email.toLowerCase(), plan: backendPlan }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[admin/users] backend retornou ${res.status}: ${body}`)
      return null
    }
    const data = await res.json()
    console.log(`[admin/users] licença gerada: ${data.key}`)
    return data.key || null
  } catch (err: any) {
    console.error(`[admin/users] falha ao chamar backend:`, err?.message ?? err)
    return null
  }
}

// GET /api/admin/users → lista todos os usuários
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, plan: true, active: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ users })
}

// POST /api/admin/users → cria ou atualiza usuário + gera licença
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { email, name, plan } = await req.json()
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })

  const targetPlan = plan || 'monthly'
  const expiry     = calcExpiry(targetPlan)
  const exists     = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  if (exists) {
    // Atualiza plano do usuário existente
    const updated = await prisma.user.update({
      where: { id: exists.id },
      data:  { plan: targetPlan, expiresAt: expiry },
    })
    // Tenta renovar/gerar licença no backend também
    const licKey = await createBackendLicense(email, targetPlan)
    return NextResponse.json({
      ok: true, action: 'updated',
      user: { email: updated.email, plan: updated.plan },
      licenseKey: licKey,
    })
  }

  // Novo usuário: gera senha automática
  const password = genPassword()
  const hash     = await bcrypt.hash(password, 12)
  const user     = await prisma.user.create({
    data: {
      name:      name || email.split('@')[0],
      email:     email.toLowerCase(),
      password:  hash,
      plan:      targetPlan,
      active:    true,
      expiresAt: expiry,
    },
  })

  // Gera licença no backend
  const licKey = await createBackendLicense(email, targetPlan)

  return NextResponse.json({
    ok: true, action: 'created',
    user:       { email: user.email, plan: user.plan },
    password,   // senha gerada automaticamente
    licenseKey: licKey,
  })
}

// PATCH /api/admin/users → muda plano
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { email, plan } = await req.json()
  if (!email || !plan) return NextResponse.json({ error: 'email e plan obrigatórios' }, { status: 400 })
  const expiry = calcExpiry(plan)
  const user   = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data:  { plan, expiresAt: expiry },
  })
  return NextResponse.json({ ok: true, user: { email: user.email, plan: user.plan } })
}
