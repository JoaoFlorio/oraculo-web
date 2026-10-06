import { NextRequest, NextResponse } from 'next/server'
import { chamarBackend } from '@/lib/testeProxy'
export const dynamic = 'force-dynamic'

// Situação do envio no WhatsApp (a tela mostra "enviado" ou "não consegui enviar — reenvie").
export async function GET(req: NextRequest) {
  const id = String(req.nextUrl.searchParams.get('pedidoId') || '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'pedido inválido' }, { status: 400 })
  try { const r = await chamarBackend(`/status?pedidoId=${encodeURIComponent(id)}`, undefined, 'GET'); return NextResponse.json(r.json, { status: r.status }) }
  catch { return NextResponse.json({ error: 'indisponível' }, { status: 502 }) }
}
