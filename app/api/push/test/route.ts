import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Dispara um push de teste imediato pro usuário logado — prova na hora que a
// entrega funciona (independente do vigia de vendas).
// body { kind:'sale' } → simula o cha-ching real (último pedido do Espelho).
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({} as any))
  // Simular VENDA é exclusivo de admin: um cliente jamais pode receber (nem
  // provocar) um "💰 Nova venda!" falso. Trava no servidor, não só na UI.
  const kind = body?.kind === 'sale' && user.role === 'admin' ? 'sale' : undefined
  const valor = kind === 'sale' ? Number(body?.valor) : undefined
  try {
    const r = await fetch(`${BACKEND}/api/push/test`, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({ email: user.email, kind, ...(isFinite(valor as number) && (valor as number) > 0 ? { valor } : {}) }),
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao enviar teste' }, { status: 500 })
  }
}
