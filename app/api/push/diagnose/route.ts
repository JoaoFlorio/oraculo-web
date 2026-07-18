import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Raio-x do push de venda do usuário logado: inscrição registrada, conta Amazon,
// estado do vigia e dry-run dos pedidos da janela (o que ele veria/notificaria).
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const hours = new URL(req.url).searchParams.get('hours') || '24'
  try {
    const r = await fetch(`${BACKEND}/api/push/diagnose?email=${encodeURIComponent(user.email)}&hours=${encodeURIComponent(hours)}`, {
      cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao diagnosticar' }, { status: 500 })
  }
}
