import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

/* CORREÇÃO DE VENCIMENTOS (limpeza do double-count, 08/09/2026).
 *
 * Seta o expiresAt REAL de cada conta (último pagamento + período, fonte: CSV da
 * Greenn) nos DOIS sistemas: User.expiresAt (site/app) + licenses.expires_at
 * (extensão). Contas cuja data corrigida já passou ficam vencidas → a tela
 * "seu acesso venceu" + botão renovar aparece (site+extensão+app).
 *
 * 🚨 TRAVAS: nunca toca lifetime, admin, staff, support ou demo (a conta do João
 * é lifetime → pulada). `dry=1` mostra o que faria sem gravar. Corpo:
 *   { correcoes: [{ email, expiresAt(ISO) }], dry?: boolean }
 */
const ADMIN_KEY = process.env.ADMIN_KEY || ''
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const INTERNAL = process.env.INTERNAL_KEY || ''

async function admin(req: NextRequest) {
  if (ADMIN_KEY && req.headers.get('x-admin-key') === ADMIN_KEY) return true
  return !!(await getAdminSession())
}

export async function POST(req: NextRequest) {
  if (!(await admin(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const dry = body?.dry === true || body?.dry === 1
  const correcoes: Array<{ email: string; expiresAt: string }> = Array.isArray(body?.correcoes) ? body.correcoes : []
  if (!correcoes.length) return NextResponse.json({ error: 'correcoes[] obrigatório' }, { status: 400 })

  const INTOCAVEL = new Set(['admin', 'staff', 'support', 'demo'])
  const out: any[] = []
  for (const c of correcoes) {
    const email = String(c.email || '').trim().toLowerCase()
    const nova = new Date(c.expiresAt)
    if (!email || isNaN(nova.getTime())) { out.push({ email, acao: 'pulado', motivo: 'dados inválidos' }); continue }
    const u = await prisma.user.findUnique({ where: { email }, select: { plan: true, role: true, expiresAt: true } })
    if (!u) { out.push({ email, acao: 'pulado', motivo: 'sem conta no site' }); continue }
    if (u.plan === 'lifetime' || INTOCAVEL.has(String(u.role || ''))) {
      out.push({ email, acao: 'INTOCÁVEL', motivo: `${u.plan}/${u.role}` }); continue
    }
    const vencido = nova.getTime() < Date.now()
    if (dry) { out.push({ email, acao: vencido ? 'BLOQUEARIA' : 'ajustaria', de: u.expiresAt, para: nova.toISOString() }); continue }
    // 1) site/app
    await prisma.user.update({ where: { email }, data: { expiresAt: nova } })
    // 2) extensão (backend licenses) — best-effort, mesma data
    let ext = 'ok'
    try {
      const r = await fetch(`${BACKEND}/api/license/set-expiry`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': INTERNAL },
        body: JSON.stringify({ email, expiresAt: nova.toISOString() }), signal: AbortSignal.timeout(15_000),
      })
      const j = await r.json().catch(() => ({}))
      ext = j?.ok ? 'ok' : (j?.motivo || 'falhou')
    } catch { ext = 'erro-rede' }
    out.push({ email, acao: vencido ? 'BLOQUEADO' : 'ajustado', para: nova.toISOString(), extensao: ext })
  }
  return NextResponse.json({ dry, total: correcoes.length, resultado: out })
}
