import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// Proxy do MULTI-CHAT do NEO (barra lateral). Mesmo encanamento do chat:
// sessão → user.email (nunca do cliente), BACKEND_URL + INTERNAL_KEY do web.
//
// ⚠️ UMA rota só, SEM segmento dinâmico [id]: este Next é modificado e não há
// rota [id] no repo — o id vem por query (GET) ou no body (POST), e a gente monta
// a URL REST do backend (Express, que aceita :id normalmente).
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const HEADERS = { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' }

// GET /api/agent/conversas            → lista as conversas do seller
// GET /api/agent/conversas?id=X&mensagens=1 → histórico de UMA conversa
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const email = encodeURIComponent(user.email)
  const id = req.nextUrl.searchParams.get('id')
  const url = id
    ? `${BACKEND}/api/agent/conversas/${encodeURIComponent(id)}/mensagens?email=${email}`
    : `${BACKEND}/api/agent/conversas?email=${email}`
  try {
    const res = await fetch(url, { cache: 'no-store', headers: HEADERS, signal: AbortSignal.timeout(20_000) })
    return NextResponse.json(await res.json().catch(() => ({ error: 'resposta inválida' })), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'falha ao falar com o servidor' }, { status: 502 })
  }
}

// POST /api/agent/conversas  { op: 'criar'|'resumir'|'renomear'|'apagar', id?, titulo? }
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  let body: any = {}
  try { body = await req.json() } catch { /* vazio */ }
  const op = String(body?.op || 'criar')
  const id = body?.id ? encodeURIComponent(String(body.id)) : ''
  const email = user.email

  let url = `${BACKEND}/api/agent/conversas`
  let method = 'POST'
  let payload: any = { email }
  if (op === 'criar') { payload = { email, titulo: body?.titulo || '' } }
  else if (op === 'resumir') { url = `${BACKEND}/api/agent/conversas/${id}/resumir`; payload = { email } }
  else if (op === 'renomear') { url = `${BACKEND}/api/agent/conversas/${id}`; method = 'PATCH'; payload = { email, titulo: body?.titulo || '' } }
  else if (op === 'apagar') { url = `${BACKEND}/api/agent/conversas/${id}`; method = 'DELETE'; payload = { email } }
  else return NextResponse.json({ error: 'op inválida' }, { status: 400 })

  if ((op === 'resumir' || op === 'renomear' || op === 'apagar') && !id) {
    return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  }
  try {
    const res = await fetch(url, { method, cache: 'no-store', headers: HEADERS, body: JSON.stringify(payload), signal: AbortSignal.timeout(30_000) })
    return NextResponse.json(await res.json().catch(() => ({ error: 'resposta inválida' })), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'falha ao falar com o servidor' }, { status: 502 })
  }
}
