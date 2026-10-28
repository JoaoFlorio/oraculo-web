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

/** Erro de código no 2FA conta no mesmo contador da trava de login (5 erros → trava) — sem isso, quem tivesse a
 *  sessão chutava os 6 dígitos do `disable` à vontade. Com a conta travada, a rota recusa antes de conferir. */
async function registrarErroCodigo(userId: string): Promise<void> {
  try {
    const rows = await prisma.$queryRaw<{ n: number }[]>`
      UPDATE "User" SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('loginLock',
             jsonb_build_object('n', COALESCE((metadata->'loginLock'->>'n')::int, 0) + 1,
                                'until', COALESCE((metadata->'loginLock'->>'until')::bigint, 0)))
       WHERE id = ${userId} RETURNING (metadata->'loginLock'->>'n')::int AS n`
    const n = Number(rows?.[0]?.n || 0)
    if (n >= 5) {
      const until = String(Date.now() + Math.min(3600_000, 15 * 60_000 * Math.pow(2, n - 5)))
      await prisma.$executeRaw`UPDATE "User" SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('loginLock', jsonb_build_object('n', ${n}::int, 'until', ${until}::bigint)) WHERE id = ${userId}`
    }
  } catch (e) { console.error('[totp] contador de erro falhou:', e) }
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const acao = String(b?.acao || '')
  const travaAte = await prisma.$queryRaw<{ ate: bigint | null }[]>`SELECT (metadata->'loginLock'->>'until')::bigint AS ate FROM "User" WHERE id = ${user.id}`.catch(() => [])
  if (Number(travaAte?.[0]?.ate || 0) > Date.now()) return NextResponse.json({ error: 'Muitas tentativas. Tente de novo mais tarde.' }, { status: 429 })
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true, role: true } })
  const meta = ((u?.metadata ?? {}) as Record<string, any>)
  // 28/10 (varredura): a demo tem senha conhecida por quem assiste às apresentações — ativar 2FA nela trancaria a equipe.
  if (u?.role === 'demo') return NextResponse.json({ error: 'A conta demo não usa 2FA.' }, { status: 403 })
  // 28/10 (varredura): com o 2FA JÁ ativo, gerar/ativar outro exigia nada — uma sessão roubada trocava o autenticador do
  // dono (e ele ficava de fora). Agora trocar exige o código do autenticador ATUAL; e erro de código conta na trava de login.
  const ativo = totpDe(meta)
  if (ativo && (acao === 'setup' || acao === 'enable') && !(await codigoTotpValido(ativo.secret, b?.codigoAtual))) {
    await registrarErroCodigo(user.id)
    return NextResponse.json({ error: 'O 2FA já está ativo — informe o código do autenticador atual para trocar.', precisaCodigoAtual: true }, { status: 400 })
  }

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
    if (!(await codigoTotpValido(pend.secret, b?.code))) { await registrarErroCodigo(user.id); return NextResponse.json({ error: 'Código inválido — confira o relógio do celular e tente de novo' }, { status: 400 }) }
    const { totpPending: _p, ...resto } = meta
    await prisma.user.update({ where: { id: user.id }, data: { metadata: { ...resto, totp: { secret: pend.secret, enabledAt: new Date().toISOString() } } as object } })
    return NextResponse.json({ ok: true, enabled: true })
  }
  if (acao === 'disable') {
    const t = totpDe(meta)
    if (!t) return NextResponse.json({ ok: true, enabled: false })
    if (!(await codigoTotpValido(t.secret, b?.code))) { await registrarErroCodigo(user.id); return NextResponse.json({ error: 'Código inválido' }, { status: 400 }) }
    const { totp: _t, totpPending: _p, ...resto } = meta
    await prisma.user.update({ where: { id: user.id }, data: { metadata: resto as object } })
    return NextResponse.json({ ok: true, enabled: false })
  }
  return NextResponse.json({ error: 'ação desconhecida' }, { status: 400 })
}
