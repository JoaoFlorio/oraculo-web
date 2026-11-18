import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { getSessionOrExpired, COOKIE } from '@/lib/auth'
import { prisma } from '@/lib/db'

// 18/11/2026 — EXCLUIR MINHA CONTA (App Store 5.1.1(v), Google Play "exclusão de conta", LGPD art. 18).
// GET  → o que avisar antes (tem assinatura ativa na Greenn? a cobrança é dela e não para sozinha).
// POST { senha, confirmacao: 'EXCLUIR' } → confere a senha, o backend apaga os dados de operação numa transação
// (guarda só o fiscal — ver oraculo-backend/src/lib/contaExclusao.ts) e aqui apagamos sessões e o usuário.
// Conta demo (a dos revisores das lojas) só simula; equipe não se exclui por aqui.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

export async function GET() {
  const { user } = await getSessionOrExpired()   // vencido também pode excluir a conta
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    const r = await fetch(`${BACKEND}/api/conta/exclusao-info?email=${encodeURIComponent(user.email)}`, { headers: { 'x-internal-key': KEY }, cache: 'no-store', signal: AbortSignal.timeout(10_000) })
    const j = await r.json().catch(() => ({}))
    return NextResponse.json({ email: user.email, assinaturaAtiva: !!j?.assinaturaAtiva, demo: user.role === 'demo' })
  } catch { return NextResponse.json({ email: user.email, assinaturaAtiva: false, demo: user.role === 'demo' }) }
}

export async function POST(req: NextRequest) {
  const { user: sessao } = await getSessionOrExpired()   // vencido também pode excluir a conta
  if (!sessao) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (['admin', 'staff', 'support'].includes(String(sessao.role))) return NextResponse.json({ error: 'Conta da equipe não pode ser excluída por aqui.' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  if (String(b?.confirmacao || '').trim().toUpperCase() !== 'EXCLUIR') return NextResponse.json({ error: 'Digite EXCLUIR para confirmar.' }, { status: 400 })
  if (typeof b?.senha !== 'string' || !b.senha) return NextResponse.json({ error: 'Digite sua senha.' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: sessao.id } })
  if (!user) return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 })
  if (!(await bcrypt.compare(b.senha, user.password))) return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 })

  // Conta demo: os revisores da Apple/Google testam o fluxo — mostra que funciona sem apagar a demo.
  if (user.role === 'demo') return NextResponse.json({ ok: true, simulado: true })

  let r: Response
  try {
    r = await fetch(`${BACKEND}/api/conta/excluir`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': KEY }, body: JSON.stringify({ email: user.email }), signal: AbortSignal.timeout(60_000) })
  } catch { return NextResponse.json({ error: 'Não consegui excluir agora. Tente de novo em alguns minutos.' }, { status: 502 }) }
  const j = await r.json().catch(() => ({}))
  if (!r.ok || !j?.ok) return NextResponse.json({ error: 'Não consegui excluir agora. Tente de novo em alguns minutos — nada foi apagado.' }, { status: 502 })

  await prisma.session.deleteMany({ where: { userId: user.id } })
  await prisma.user.delete({ where: { id: user.id } })
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE)
  return res
}
