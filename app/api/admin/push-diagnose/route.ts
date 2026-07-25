import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * GET /api/admin/push-diagnose?email=...  — raio-x do push de QUALQUER cliente.
 *
 * O proxy /api/push/diagnose existente só olha o próprio usuário logado (usa a
 * sessão). Este aceita o e-mail: é o fluxo real de suporte — o cliente reclama
 * que não recebe notificação e a resposta tem que sair sem pedir nada a ele.
 *
 * Só admin: expõe estado de conta alheia.
 */
export async function GET(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const email = (searchParams.get('email') || '').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })
  const hours = searchParams.get('hours') || '24'
  try {
    const r = await fetch(
      `${BACKEND}/api/push/diagnose?email=${encodeURIComponent(email)}&hours=${encodeURIComponent(hours)}`,
      { cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } },
    )
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Backend indisponível' }, { status: 502 })
  }
}
