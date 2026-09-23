import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { novoSegredoTotp, uriTotp, qrTotp, codigoTotpValido, totpDe } from '@/lib/totp'

/* 2FA da conta (23/09/2026):
 *   GET  → { enabled }
 *   POST {acao:'setup'}          → gera segredo pendente + QR (ainda NÃO ativa)
 *   POST {acao:'enable', code}   → confirma com o 1º código → ativa
 *   POST {acao:'disable', code}  → desativa (exige código válido)
 * Qualquer papel pode ativar; o login passa a exigir o código só para quem ativou. */
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } })
  const t = totpDe(u?.metadata)
  return NextResponse.json({ enabled: !!t, enabledAt: t?.enabledAt || null, role: user.role })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const acao = String(b?.acao || '')
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } })
  const meta = ((u?.metadata ?? {}) as Record<string, any>)

  if (acao === 'setup') {
    const secret = novoSegredoTotp()
    const uri = uriTotp(user.email, secret)
    const qr = await qrTotp(uri)
    await prisma.user.update({ where: { id: user.id }, data: { metadata: { ...meta, totpPending: { secret, at: new Date().toISOString() } } as object } })
    return NextResponse.json({ ok: true, secret, uri, qr })
  }
  if (acao === 'enable') {
    const pend = meta.totpPending as { secret?: string } | undefined
    if (!pend?.secret) return NextResponse.json({ error: 'Gere o QR primeiro' }, { status: 400 })
    if (!(await codigoTotpValido(pend.secret, b?.code))) return NextResponse.json({ error: 'Código inválido — confira o relógio do celular e tente de novo' }, { status: 400 })
    const { totpPending: _p, ...resto } = meta
    await prisma.user.update({ where: { id: user.id }, data: { metadata: { ...resto, totp: { secret: pend.secret, enabledAt: new Date().toISOString() } } as object } })
    return NextResponse.json({ ok: true, enabled: true })
  }
  if (acao === 'disable') {
    const t = totpDe(meta)
    if (!t) return NextResponse.json({ ok: true, enabled: false })
    if (!(await codigoTotpValido(t.secret, b?.code))) return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
    const { totp: _t, totpPending: _p, ...resto } = meta
    await prisma.user.update({ where: { id: user.id }, data: { metadata: resto as object } })
    return NextResponse.json({ ok: true, enabled: false })
  }
  return NextResponse.json({ error: 'ação desconhecida' }, { status: 400 })
}
