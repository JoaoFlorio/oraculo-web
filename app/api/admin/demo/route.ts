import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'
import { mergeDemoConfig, demoCosts, DEFAULT_DEMO_CONFIG } from '@/lib/demoGestao'

// Conta DEMO da Gestão — só admin cria/configura. Uma conta com role='demo' cujo
// metadata guarda a config (números fake) + os custos por SKU (gestao_cmv).
const DEMO_EMAIL_DEFAULT = 'demo@oraculojf.com.br'

function genPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let p = 'Demo#'
  for (let i = 0; i < 6; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p
}

// GET → conta demo atual (se houver) + config vigente
export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const u = await prisma.user.findFirst({ where: { role: 'demo' }, select: { email: true, metadata: true } })
  const config = u ? mergeDemoConfig((u.metadata as any)?.demo) : DEFAULT_DEMO_CONFIG
  return NextResponse.json({ exists: !!u, email: u?.email || DEMO_EMAIL_DEFAULT, config })
}

// POST → cria/atualiza a conta demo com a config recebida
export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body   = await req.json().catch(() => ({} as any))
  const email  = String(body.email || DEMO_EMAIL_DEFAULT).toLowerCase().trim()
  const config = mergeDemoConfig(body.config)
  const metadata = { demo: config, gestao_cmv: demoCosts(config) }

  const existing = await prisma.user.findUnique({ where: { email } })
  let plainPassword: string | null = null
  const data: any = { role: 'demo', active: true, plan: 'lifetime', name: 'Conta Demo (apresentação)', metadata }

  if (body.password) { plainPassword = String(body.password); data.password = await bcrypt.hash(plainPassword, 12) }
  else if (!existing) { plainPassword = genPassword(); data.password = await bcrypt.hash(plainPassword, 12) }

  if (existing) await prisma.user.update({ where: { email }, data })
  else          await prisma.user.create({ data: { email, ...data } })

  return NextResponse.json({ ok: true, email, password: plainPassword, config })
}
