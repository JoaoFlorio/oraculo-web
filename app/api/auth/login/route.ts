import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createToken, COOKIE, accessDenied } from '@/lib/auth'

// ⚠️ SEGURANÇA (pentest 06/08/2026): hash "isca" de custo 12 pra igualar o TEMPO
// de resposta quando o e-mail NÃO existe. Sem isso, e-mail inexistente respondia
// rápido (sem bcrypt) e e-mail de cliente respondia ~200ms — um atacante media o
// tempo e descobria quais e-mails são clientes (enumeração). Agora os dois
// caminhos rodam um bcrypt.compare equivalente.
const HASH_ISCA = '$2b$12$ZUNqUoaHoA.7urkvufERLuUXm2gEDx1O/4enNAx4ah2JM4vn2ivcq'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password)
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      await bcrypt.compare(String(password), HASH_ISCA)   // gasta o mesmo tempo do caminho real
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })

    const denied = accessDenied(user)
    if (denied === 'inactive')
      return NextResponse.json({ error: 'Conta inativa. Entre em contato com o suporte.' }, { status: 403 })
    if (denied === 'expired')
      return NextResponse.json({ error: 'Seu acesso expirou. Renove seu plano para voltar a usar o Oráculo.' }, { status: 403 })
    if (denied)  // 'free' / 'notfound' → sem plano pago ativo
      return NextResponse.json({ error: 'Você não tem um plano ativo. Adquira o Oráculo para acessar.' }, { status: 403 })

    const token = await createToken(user.id)
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role } })
    res.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' })
    return res
  } catch (e: any) {
    console.error('[login]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
