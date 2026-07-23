import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getSession, COOKIE } from '@/lib/auth'
import { prisma } from '@/lib/db'

/* POST /api/user/change-password  body: { currentPassword, newPassword } */
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSession()
    if (!sessionUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })

    if (newPassword.length < 8)
      return NextResponse.json({ error: 'A nova senha deve ter pelo menos 8 caracteres' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid)
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 })

    const same = await bcrypt.compare(newPassword, user.password)
    if (same)
      return NextResponse.json({ error: 'A nova senha deve ser diferente da atual' }, { status: 400 })

    const hashed = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    // Por segurança, encerra as demais sessões (outros dispositivos) — mantém a atual
    const cookieStore = await cookies()
    const currentToken = cookieStore.get(COOKIE)?.value
    await prisma.session.deleteMany({
      where: { userId: user.id, token: { not: currentToken ?? '' } },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[change-password]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
