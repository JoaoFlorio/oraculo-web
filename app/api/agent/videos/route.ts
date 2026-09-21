import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// Proxy dos VÍDEOS do NEO (Veo, assíncrono). O chat faz polling leve aqui
// enquanto um vídeo está "em produção" e encaixa o player quando fica pronto.
// Mesmo encanamento dos demais proxies: sessão → user.email (nunca da URL),
// BACKEND_URL + INTERNAL_KEY. `desde` = maior id já mostrado (evita reenviar o
// base64 pesado).
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

// GET /api/agent/videos?desde=<id> → { gerando, prontos:[{id,rotulo,mediaType,data}], erros:[...] }
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const desde = String(parseInt(req.nextUrl.searchParams.get('desde') || '0') || 0)
  try {
    const res = await fetch(`${BACKEND}/api/agent/videos?email=${encodeURIComponent(user.email)}&desde=${desde}`, {
      cache: 'no-store', headers: { 'x-internal-key': KEY }, signal: AbortSignal.timeout(30_000),
    })
    return NextResponse.json(await res.json().catch(() => ({ error: 'resposta inválida' })), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'falha ao consultar vídeos' }, { status: 502 })
  }
}
