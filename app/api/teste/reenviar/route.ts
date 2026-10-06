import { NextRequest, NextResponse } from 'next/server'
import { chamarBackend, lerCorpo } from '@/lib/testeProxy'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const b = await lerCorpo(req, ['pedidoId'], 64)
  if (!b || !/^[0-9a-f-]{36}$/i.test(b.pedidoId)) return NextResponse.json({ error: 'Cadastro não encontrado.' }, { status: 400 })
  try { const r = await chamarBackend('/reenviar', { pedidoId: b.pedidoId }); return NextResponse.json(r.json, { status: r.status }) }
  catch { return NextResponse.json({ error: 'Não consegui reenviar agora.' }, { status: 502 }) }
}
