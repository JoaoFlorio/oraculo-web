import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createToken, COOKIE, accessDenied, ttlMsDe } from '@/lib/auth'
import { codigoTotpValido, totpDe } from '@/lib/totp'

// ⚠️ SEGURANÇA (pentest 06/08/2026): hash "isca" de custo 12 pra igualar o TEMPO
// de resposta quando o e-mail NÃO existe. Sem isso, e-mail inexistente respondia
// rápido (sem bcrypt) e e-mail de cliente respondia ~200ms — um atacante media o
// tempo e descobria quais e-mails são clientes (enumeração). Agora os dois
// caminhos rodam um bcrypt.compare equivalente.
const HASH_ISCA = '$2b$12$ZUNqUoaHoA.7urkvufERLuUXm2gEDx1O/4enNAx4ah2JM4vn2ivcq'

export async function POST(req: NextRequest) {
  try {
    const { email, password, code } = await req.json()

    if (!email || !password)
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      await bcrypt.compare(String(password), HASH_ISCA)   // gasta o mesmo tempo do caminho real
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    // 🔒 23/09: TRAVA POR CONTA (o rate limit do proxy era só por IP): 5 erros seguidos
    // bloqueiam 15 min (dobrando a cada 5), com a MESMA resposta genérica — não revela
    // nem que a conta existe nem que está travada. Guardado em User.metadata.loginLock.
    const metaLogin = ((user as any).metadata ?? {}) as Record<string, any>
    const lock = (metaLogin.loginLock || {}) as { n?: number; until?: number }
    if (lock.until && lock.until > Date.now()) {
      await bcrypt.compare(String(password), HASH_ISCA)
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      const n = (Number(lock.n) || 0) + 1
      const until = n >= 5 ? Date.now() + Math.min(24 * 3600_000, 15 * 60_000 * Math.pow(2, n - 5)) : 0
      await prisma.user.update({ where: { id: user.id }, data: { metadata: { ...metaLogin, loginLock: { n, until } } as object } }).catch(() => {})
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }
    // 🔐 23/09: 2ª etapa (TOTP) pra quem ativou. Código errado conta na mesma trava por conta.
    const totp = totpDe(metaLogin)
    if (totp) {
      const cod = String(code || '').trim()
      if (!cod) return NextResponse.json({ error: 'Digite o código do seu app autenticador', totpRequired: true }, { status: 401 })
      if (!(await codigoTotpValido(totp.secret, cod))) {
        const n = (Number(lock.n) || 0) + 1
        const until = n >= 5 ? Date.now() + Math.min(24 * 3600_000, 15 * 60_000 * Math.pow(2, n - 5)) : 0
        await prisma.user.update({ where: { id: user.id }, data: { metadata: { ...metaLogin, loginLock: { n, until } } as object } }).catch(() => {})
        return NextResponse.json({ error: 'Código inválido', totpRequired: true }, { status: 401 })
      }
    }
    if (lock.n) {
      const { loginLock: _l, ...resto } = metaLogin
      await prisma.user.update({ where: { id: user.id }, data: { metadata: resto as object } }).catch(() => {})
    }

    const denied = accessDenied(user)
    if (denied === 'inactive')
      return NextResponse.json({ error: 'Conta inativa. Entre em contato com o suporte.' }, { status: 403 })
    if (denied === 'expired')
      return NextResponse.json({ error: 'Seu acesso expirou. Renove seu plano para voltar a usar o Oráculo.' }, { status: 403 })
    if (denied)  // 'free' / 'notfound' → sem plano pago ativo
      return NextResponse.json({ error: 'Você não tem um plano ativo. Adquira o Oráculo para acessar.' }, { status: 403 })

    const token = await createToken(user.id, user.role)
    // 🔔 23/09: acesso a conta PRIVILEGIADA avisa o dono por e-mail (IP/hora/navegador).
    if (['admin', 'support', 'staff'].includes(String(user.role || ''))) {
      try {
        const { Resend } = await import('resend')
        const hops = (req.headers.get('x-forwarded-for') || '').split(',').map(s => s.trim()).filter(Boolean)
        const ip = hops[hops.length - 1] || req.headers.get('x-real-ip') || 'desconhecido'
        const ua = (req.headers.get('user-agent') || '').slice(0, 160)
        if (process.env.RESEND_API_KEY) await new Resend(process.env.RESEND_API_KEY).emails.send({
          from: 'ORÁCULO <noreply@oraculojf.com.br>', to: user.email,
          subject: 'Novo acesso à sua conta (' + user.role + ')',
          text: `Um login foi feito na sua conta ${user.role} do Oráculo.\n\nQuando: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\nIP: ${ip}\nNavegador: ${ua}\n\nSe não foi você, troque a senha agora pelo perfil e avise o suporte.`,
        })
      } catch { /* alerta é best-effort */ }
    }
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role } })
    res.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: Math.floor(ttlMsDe(user.role) / 1000), path: '/' })
    return res
  } catch (e: any) {
    console.error('[login]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
