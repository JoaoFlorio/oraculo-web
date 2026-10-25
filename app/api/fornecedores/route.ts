import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

// VITRINE DE FORNECEDORES (20/10/2026) — os 150 fornecedores do João em cards. Proxy padrão: e-mail da SESSÃO
// (nunca do cliente), BACKEND_URL + INTERNAL_KEY. Quem vê a lista completa o BACKEND decide (assinante sim;
// teste grátis e demo veem amostra) — a lista também é vendida avulsa, então não confiamos no navegador.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''

// GET /api/fornecedores → { liberado, total, fornecedores }
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const r = await fetch(`${BACKEND}/api/fornecedores?email=${encodeURIComponent(user.email)}`, {
      cache: 'no-store', headers: { 'x-internal-key': KEY }, signal: AbortSignal.timeout(15_000),
    })
    return NextResponse.json(await r.json().catch(() => ({ error: 'resposta inválida' })), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'falha ao carregar os fornecedores' }, { status: 502 })
  }
}

// POST /api/fornecedores { id, acao } → conta o clique (site / whats / insta / tel)
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  // 25/10: { tipo:'busca', termo, tag, uf, resultados } → o que o aluno procurou (painel admin "O que os alunos procuram")
  if (body?.tipo === 'busca') {
    try {
      const r = await fetch(`${BACKEND}/api/fornecedores/busca`, {
        method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8_000),
        headers: { 'x-internal-key': KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ email: user.email, termo: String(body.termo || '').slice(0, 80), tag: body.tag ? String(body.tag).slice(0, 40) : null,
          uf: body.uf ? String(body.uf).slice(0, 2) : null, resultados: Number(body.resultados) || 0 }),
      })
      return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
    } catch { return NextResponse.json({ error: 'backend indisponível' }, { status: 502 }) }
  }
  try {
    const r = await fetch(`${BACKEND}/api/fornecedores/clique`, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8_000),
      headers: { 'x-internal-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ email: user.email, id: Number(body?.id), acao: String(body?.acao || '').slice(0, 10) }),
    })
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'backend indisponível' }, { status: 502 })
  }
}
