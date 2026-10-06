import { NextRequest, NextResponse } from 'next/server'
import { chamarBackend, ipReal, lerCorpo } from '@/lib/testeProxy'
export const dynamic = 'force-dynamic'

// Passo 1 do teste grátis: valida e dispara os 2 códigos (WhatsApp + e-mail). Público, com limite por IP no proxy.ts.
export async function POST(req: NextRequest) {
  const b = await lerCorpo(req, ['nome', 'email', 'telefone', 'documento'])
  if (!b) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  try {
    const r = await chamarBackend('/iniciar', { ...b, ip: ipReal(req), ua: (req.headers.get('user-agent') || '').slice(0, 300) })
    return NextResponse.json(r.json, { status: r.status })
  } catch { return NextResponse.json({ error: 'Não consegui iniciar o cadastro agora. Tente de novo.' }, { status: 502 }) }
}
