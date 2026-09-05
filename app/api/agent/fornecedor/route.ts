import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// Proxy do CATÁLOGO DE FORNECEDOR do NEO (minerador Fase 2, admin-only por ora).
// Mesmo encanamento dos demais proxies: sessão → user.email (nunca da URL),
// BACKEND_URL + INTERNAL_KEY. O corpo do POST é o PDF cru (stream até o backend).
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

// POST /api/agent/fornecedor  (body = PDF)  → sobe o catálogo e dispara a extração
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  // ⚠️ ADMIN-ONLY enquanto o minerador está em teste (decisão do João: "começo só
  // na minha conta sem ninguém ver"). Liberar = tirar esta linha.
  if (user.role !== 'admin') return NextResponse.json({ error: 'minerador de fornecedor em teste (admin only)' }, { status: 403 })
  // ?op=varrer → dispara a varredura completa do catálogo (sem body).
  if (req.nextUrl.searchParams.get('op') === 'varrer') {
    try {
      const res = await fetch(`${BACKEND}/api/fornecedor/varrer?email=${encodeURIComponent(user.email)}`, {
        method: 'POST', headers: { 'x-internal-key': KEY }, signal: AbortSignal.timeout(20_000),
      })
      return NextResponse.json(await res.json().catch(() => ({ error: 'resposta inválida' })), { status: res.status })
    } catch { return NextResponse.json({ error: 'falha ao disparar a varredura' }, { status: 502 }) }
  }
  const nome = encodeURIComponent(req.nextUrl.searchParams.get('nome') || 'catalogo.pdf')
  try {
    const body = Buffer.from(await req.arrayBuffer())
    if (body.length > 200 * 1048576) return NextResponse.json({ error: 'PDF acima de 200MB — comprime ou divide o catálogo' }, { status: 413 })
    const res = await fetch(`${BACKEND}/api/fornecedor/upload?email=${encodeURIComponent(user.email)}&nome=${nome}`, {
      method: 'POST', body,
      headers: { 'content-type': 'application/pdf', 'x-internal-key': KEY },
      signal: AbortSignal.timeout(180_000),
    })
    return NextResponse.json(await res.json().catch(() => ({ error: 'resposta inválida' })), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'falha ao enviar o catálogo' }, { status: 502 })
  }
}

// GET /api/agent/fornecedor → status do catálogo mais recente (polling do card)
export async function GET(_req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ status: 'nenhum' })
  try {
    const res = await fetch(`${BACKEND}/api/fornecedor/status?email=${encodeURIComponent(user.email)}`, {
      cache: 'no-store', headers: { 'x-internal-key': KEY }, signal: AbortSignal.timeout(20_000),
    })
    return NextResponse.json(await res.json().catch(() => ({ error: 'resposta inválida' })), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'falha ao consultar o catálogo' }, { status: 502 })
  }
}
