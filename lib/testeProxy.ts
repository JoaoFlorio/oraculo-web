// 05/10 — TESTE GRÁTIS: as rotas /api/teste/* são PÚBLICAS (quem se cadastra ainda não tem conta). Elas só repassam
// pro backend com a INTERNAL_KEY, o IP real (último hop do X-Forwarded-For — o Envoy do Railway anexa o real à
// direita; o resto é controlado pelo cliente) e o navegador. As travas (limites, unicidade, códigos) moram no backend.
import { NextRequest } from 'next/server'

export const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export function ipReal(req: NextRequest): string {
  const hops = (req.headers.get('x-forwarded-for') || '').split(',').map(s => s.trim()).filter(Boolean)
  return hops[hops.length - 1] || req.headers.get('x-real-ip') || 'desconhecido'
}

export async function chamarBackend(caminho: string, corpo?: unknown, metodo: 'POST' | 'GET' = 'POST'): Promise<{ status: number; json: any }> {
  const r = await fetch(`${BACKEND}/api/teste${caminho}`, {
    method: metodo, cache: 'no-store', signal: AbortSignal.timeout(30_000),
    headers: { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
    ...(metodo === 'POST' ? { body: JSON.stringify(corpo ?? {}) } : {}),
  })
  return { status: r.status, json: await r.json().catch(() => ({ error: 'resposta inválida' })) }
}

/** Corpo JSON pequeno e com os campos esperados como texto curto (nada de objeto/array injetado). */
export async function lerCorpo(req: NextRequest, campos: string[], max = 200): Promise<Record<string, string> | null> {
  const txt = await req.text().catch(() => '')
  if (txt.length > 4000) return null
  let b: any
  try { b = JSON.parse(txt || '{}') } catch { return null }
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null
  const out: Record<string, string> = {}
  for (const c of campos) {
    const v = b[c]
    if (v == null) { out[c] = ''; continue }
    if (typeof v !== 'string' && typeof v !== 'number') return null
    out[c] = String(v).slice(0, max)
  }
  return out
}
