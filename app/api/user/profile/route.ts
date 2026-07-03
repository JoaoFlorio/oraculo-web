import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

/* POST /api/user/profile  body: { name } — atualiza o nome de exibição do usuário */
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSession()
    if (!sessionUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : ''

    if (name.length < 2 || name.length > 60)
      return NextResponse.json({ error: 'O nome deve ter entre 2 e 60 caracteres' }, { status: 400 })

    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data: { name },
      select: { name: true },
    })

    return NextResponse.json({ ok: true, name: updated.name })
  } catch (e) {
    console.error('[user/profile]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
