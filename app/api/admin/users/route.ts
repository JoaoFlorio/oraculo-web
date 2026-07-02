import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { prisma } from '@/lib/db'
import { getStaffSession, getAdminSession } from '@/lib/auth'

const ADMIN_KEY    = process.env.INTERNAL_KEY  || ''
const ADMIN_SECRET = process.env.ADMIN_SECRET  || ''
const BACKEND_URL  = process.env.BACKEND_URL   || 'https://central.oraculojf.com.br'
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.oraculojf.com.br'
const resend       = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// POST (criar cliente): admin OU funcionário (staff) OU backend interno.
async function checkAuth(req: NextRequest) {
  if (ADMIN_KEY && req.headers.get('x-admin-key') === ADMIN_KEY) return true  // backend interno
  return !!(await getStaffSession())                                          // admin/staff logado
}
// GET/PATCH/PUT (listar/alterar/reenviar): só admin OU backend interno.
async function checkAdmin(req: NextRequest) {
  if (ADMIN_KEY && req.headers.get('x-admin-key') === ADMIN_KEY) return true
  return !!(await getAdminSession())
}

const DAY_MS = 24 * 60 * 60 * 1000
function calcExpiry(plan: string): Date | null {
  if (plan === 'lifetime') return null
  const d    = new Date()
  const days: Record<string, number> = { monthly: 30, biannual: 180, annual: 365 }
  d.setTime(d.getTime() + (days[plan] ?? 30) * DAY_MS)
  return d
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuito', monthly: 'Mensal', biannual: 'Semestral', annual: 'Anual', lifetime: 'Vitalício',
}

async function sendAccessEmail(opts: {
  to: string; name: string; password: string; key: string; plan: string
}) {
  if (!resend) { console.warn('[admin/users] RESEND_API_KEY não configurado — email não enviado'); return }
  const { to, name, password, key, plan } = opts
  const label = PLAN_LABEL[plan] ?? plan
  await resend.emails.send({
    from:    'ORÁCULO <noreply@oraculojf.com.br>',
    to,
    subject: `🔮 Acesso ORÁCULO ${label} — seus dados de login`,
    html: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:-apple-system,Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#13131F;border-radius:16px;border:1px solid rgba(240,180,41,0.2);overflow:hidden;">
  <div style="background:linear-gradient(135deg,rgba(240,180,41,0.15),rgba(240,180,41,0.04));padding:28px 32px;border-bottom:1px solid rgba(240,180,41,0.15);text-align:center;">
    <div style="font-size:32px;margin-bottom:6px;">🔮</div>
    <div style="font-size:22px;font-weight:900;letter-spacing:0.1em;color:#F0B429;">ORÁCULO</div>
    <div style="font-size:10px;color:#64748B;letter-spacing:0.15em;margin-top:2px;">AMAZON INTELLIGENCE</div>
  </div>
  <div style="padding:28px 32px;">
    <p style="font-size:16px;color:#CBD5E1;margin:0 0 6px;">Olá, <strong style="color:#E2E8F0;">${name.split(' ')[0]}</strong>! 🎉</p>
    <p style="font-size:14px;color:#94A3B8;margin:0 0 24px;line-height:1.6;">Aqui estão seus dados de acesso ao <strong style="color:#F0B429;">ORÁCULO ${label}</strong>. Guarde este e-mail!</p>
    <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:20px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:700;color:#10B981;letter-spacing:0.06em;margin-bottom:14px;">🖥️ ACESSO AO PAINEL WEB</div>
      <div style="background:#0A0A0F;border-radius:8px;padding:12px 16px;margin-bottom:10px;">
        <div style="font-size:10px;color:#475569;margin-bottom:3px;">URL</div>
        <a href="${FRONTEND_URL}" style="color:#10B981;font-weight:700;font-size:13px;">${FRONTEND_URL}</a>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="background:#0A0A0F;border-radius:8px;padding:10px 14px;">
          <div style="font-size:10px;color:#475569;margin-bottom:3px;">E-MAIL</div>
          <div style="font-size:12px;font-weight:700;color:#E2E8F0;">${to}</div>
        </div>
        <div style="background:#0A0A0F;border-radius:8px;padding:10px 14px;">
          <div style="font-size:10px;color:#475569;margin-bottom:3px;">SENHA</div>
          <div style="font-family:monospace;font-size:15px;font-weight:800;color:#10B981;">${password}</div>
        </div>
      </div>
    </div>
    <div style="background:rgba(240,180,41,0.06);border:1px solid rgba(240,180,41,0.2);border-radius:12px;padding:20px;">
      <div style="font-size:12px;font-weight:700;color:#F0B429;letter-spacing:0.06em;margin-bottom:10px;">🧩 CHAVE DA EXTENSÃO CHROME</div>
      <div style="background:#0A0A0F;border:1px solid rgba(240,180,41,0.2);border-radius:8px;padding:14px;text-align:center;">
        <div style="font-family:monospace;font-size:15px;font-weight:800;color:#F0B429;letter-spacing:0.06em;word-break:break-all;">${key}</div>
      </div>
    </div>
    <p style="font-size:11px;color:#64748B;margin:20px 0 0;line-height:1.6;">
      Dúvidas? <a href="mailto:atendimento@oraculojf.com.br" style="color:#F0B429;">atendimento@oraculojf.com.br</a>
    </p>
  </div>
</div></body></html>`,
  })
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
  if (!(await checkAdmin(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, role: true, plan: true, active: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ users })
}

// POST /api/admin/users → cria ou atualiza usuário + gera licença
export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { email, name, plan, phone, skipLicense, licenseKey: providedKey } = await req.json()
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })

  const phoneVal = phone ? String(phone).trim() : null
  const targetPlan = plan || 'monthly'
  const expiry     = calcExpiry(targetPlan)
  const exists     = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  if (exists) {
    // Atualiza plano do usuário existente. Reativa a conta (active=true): uma
    // compra/renovação sempre restaura o acesso de quem estava bloqueado/expirado.
    const updated = await prisma.user.update({
      where: { id: exists.id },
      data:  { plan: targetPlan, expiresAt: expiry, active: true, ...(phoneVal ? { phone: phoneVal } : {}) },
    })
    // Gera licença só se não vier uma pronta (skipLicense = chamada via webhook)
    const licKey = skipLicense ? (providedKey || null) : await createBackendLicense(email, targetPlan)
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
      phone:     phoneVal,
    },
  })

  // Gera licença no backend (só se não vier uma pronta)
  const licKey = skipLicense ? (providedKey || null) : await createBackendLicense(email, targetPlan)

  return NextResponse.json({
    ok: true, action: 'created',
    user:       { email: user.email, plan: user.plan },
    password,   // senha gerada automaticamente
    licenseKey: licKey,
  })
}

// PATCH /api/admin/users → muda plano
export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { email, plan } = await req.json()
  if (!email || !plan) return NextResponse.json({ error: 'email e plan obrigatórios' }, { status: 400 })
  const expiry = calcExpiry(plan)
  const user   = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data:  { plan, expiresAt: expiry },
  })
  return NextResponse.json({ ok: true, user: { email: user.email, plan: user.plan } })
}

// PUT /api/admin/users → reseta senha + reenvia email de acesso
export async function PUT(req: NextRequest) {
  if (!(await checkAdmin(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // Gera nova senha e atualiza no banco
  const password = genPassword()
  const hash     = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { email: user.email },
    data:  { password: hash },
  })

  // Busca chave de licença no backend — se não existir, cria uma nova
  let licKey = '—'
  try {
    const r = await fetch(`${BACKEND_URL}/api/license/by-email?email=${encodeURIComponent(user.email)}`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    if (r.ok) {
      const d = await r.json()
      licKey = d.key || d.license?.key || '—'
    }
  } catch { /* segue */ }

  // Se não tem chave, gera uma nova
  if (!licKey || licKey === '—') {
    const newKey = await createBackendLicense(user.email, user.plan)
    if (newKey) licKey = newKey
  }

  // Envia email com novos dados
  await sendAccessEmail({ to: user.email, name: user.name || user.email, password, key: licKey, plan: user.plan })

  return NextResponse.json({ ok: true, password, licenseKey: licKey })
}
