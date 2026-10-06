import { NextRequest, NextResponse } from 'next/server'
import { chamarBackend, ipReal, lerCorpo } from '@/lib/testeProxy'
import { conferirDesafio, conferirTurnstile } from '@/lib/desafioTeste'
export const dynamic = 'force-dynamic'

// Passo 1 do teste grátis: valida e dispara os 2 códigos (WhatsApp + e-mail). Público, com limite por IP no proxy.ts.
// 05/10: só passa com o desafio anti-robô resolvido (+ Turnstile, se as chaves estiverem no Railway) e campo-isca vazio.
export async function POST(req: NextRequest) {
  const b = await lerCorpo(req, ['nome', 'email', 'telefone', 'documento', 'desafio', 'nonce', 'site', 'turnstile'], 2100)
  if (!b) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  if (b.site) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })   // campo-isca preenchido = robô
  if (!conferirDesafio(b.desafio, b.nonce))
    return NextResponse.json({ error: 'A verificação anti-robô expirou. Clique de novo em "Começar meu teste grátis".' }, { status: 400 })
  const ip = ipReal(req)
  if (!(await conferirTurnstile(b.turnstile, ip)))
    return NextResponse.json({ error: 'Confirme que você não é um robô e tente de novo.' }, { status: 400 })
  try {
    const r = await chamarBackend('/iniciar', { nome: b.nome, email: b.email, telefone: b.telefone, documento: b.documento, ip, ua: (req.headers.get('user-agent') || '').slice(0, 300) })
    return NextResponse.json(r.json, { status: r.status })
  } catch { return NextResponse.json({ error: 'Não consegui iniciar o cadastro agora. Tente de novo.' }, { status: 502 }) }
}
