import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password)
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    if (password.length < 8)
      return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { resetToken: token } })

    if (!user || !user.resetTokenExpAt || user.resetTokenExpAt < new Date())
      return NextResponse.json({ error: 'Link expirado ou inválido. Solicite um novo.' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpAt: null,
      },
    })

    // Invalida todas as sessões ativas por segurança
    await prisma.session.deleteMany({ where: { userId: user.id } })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[reset-password]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
