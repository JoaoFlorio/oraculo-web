import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TERMS_VERSION } from '@/lib/terms'

// Registra o aceite dos Termos de Uso + Política de Privacidade (versão + data/hora + IP).
// É a prova do aceite eletrônico do contrato de adesão — exigido no 1º acesso ao painel
// (e novamente quando a versão dos termos muda). Guardado em metadata.terms do usuário.
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'desconhecido'
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } })
  const meta = (u?.metadata ?? {}) as Record<string, unknown>
  meta.terms = { version: TERMS_VERSION, acceptedAt: new Date().toISOString(), ip }
  await prisma.user.update({ where: { id: user.id }, data: { metadata: meta as object } })

  return NextResponse.json({ ok: true, version: TERMS_VERSION })
}
