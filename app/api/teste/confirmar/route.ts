import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createToken, COOKIE, ttlMsDe } from '@/lib/auth'
import { chamarBackend, ipReal, lerCorpo } from '@/lib/testeProxy'
export const dynamic = 'force-dynamic'

// Passo 2: confere os 2 códigos no backend (que reserva o teste e cria licença + conta de 7 dias), grava a SENHA que a
// pessoa escolheu (ela nunca sai do web) e já deixa logado.
export async function POST(req: NextRequest) {
  const b = await lerCorpo(req, ['pedidoId', 'codigoZap', 'codigoEmail', 'senha'], 128)
  if (!b || !/^[0-9a-f-]{36}$/i.test(b.pedidoId)) return NextResponse.json({ error: 'Cadastro não encontrado.' }, { status: 400 })
  if (b.senha.length < 8 || b.senha.length > 128) return NextResponse.json({ error: 'A senha precisa ter pelo menos 8 caracteres.' }, { status: 400 })
  if (!/^\d{6}$/.test(b.codigoZap) || !/^\d{6}$/.test(b.codigoEmail)) return NextResponse.json({ error: 'Digite os dois códigos de 6 números.' }, { status: 400 })
  let r: { status: number; json: any }
  try { r = await chamarBackend('/confirmar', { pedidoId: b.pedidoId, codigoZap: b.codigoZap, codigoEmail: b.codigoEmail, ip: ipReal(req) }) }
  catch { return NextResponse.json({ error: 'Não consegui confirmar agora. Tente de novo.' }, { status: 502 }) }
  if (r.status !== 200 || !r.json?.ok) return NextResponse.json(r.json, { status: r.status })
  const user = await prisma.user.findUnique({ where: { email: String(r.json.email).toLowerCase() } })
  if (!user) return NextResponse.json({ error: 'Conta criada, mas não consegui entrar. Use "Esqueci minha senha" na tela de login.' }, { status: 500 })
  await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(b.senha, 12) } })
  const token = await createToken(user.id, user.role)
  const res = NextResponse.json({ ok: true, ate: r.json.ate, creditos: r.json.creditos })
  res.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: Math.floor(ttlMsDe(user.role) / 1000), path: '/' })
  return res
}
