import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createToken, COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password)
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })

    if (password.length < 6)
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (exists)
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })

    const hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), password: hash }
    })

    const token = await createToken(user.id)
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, plan: user.plan } })
    res.cookies.set(COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' })
    return res
  } catch (e: any) {
    console.error('[register]', e.message, e.stack)
    return NextResponse.json({ error: e.message || 'Erro interno' }, { status: 500 })
  }
}
