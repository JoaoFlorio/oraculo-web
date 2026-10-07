// 05/10 — TESTE GRÁTIS: as rotas /api/teste/* são PÚBLICAS (quem se cadastra ainda não tem conta). Elas só repassam
// pro backend com a INTERNAL_KEY, o IP real (último hop do X-Forwarded-For — o Envoy do Railway anexa o real à
// direita; o resto é controlado pelo cliente) e o navegador. As travas (limites, unicidade, códigos) moram no backend.
import { NextRequest } from 'next/server'

export const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// 07/10 (bug de produção): o ÚLTIMO hop do X-Forwarded-For é um proxy INTERNO do Railway — os 7 primeiros testes
// caíram em só 2 "conexões" e, depois de 3, todo mundo que passava por aquele proxy levava "vários testes a partir
// desta conexão". O Railway documenta o X-Real-IP como a fonte do IP de quem conecta (e o 1º valor do XFF como o real).
// IP privado/interno (100.64/10 do Railway, 10/8, 172.16/12, 192.168/16, loopback) nunca é aceito como "o cliente".
const privado = (ip: string) => /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|::1$|fc|fd|fe80)/i.test(ip)
// Medido em produção 07/10: XFF = "<cliente>, <borda do Railway 46.151.x.x>"; X-Real-IP = cliente; cabeçalhos
// forjados pelo navegador (XFF/X-Real-IP falsos) são DESCARTADOS pela borda — o 1º do XFF é confiável. Fica como 1ª
// escolha (o fórum do Railway relata X-Real-IP virando IP da Fastly em algumas rotas; o 1º do XFF segue o cliente).
export function ipReal(req: NextRequest): string {
  const hops = (req.headers.get('x-forwarded-for') || '').split(',').map(s => s.trim()).filter(Boolean)
  const real = (req.headers.get('x-real-ip') || '').trim()
  return hops.find(h => !privado(h)) || (real && !privado(real) ? real : '') || hops[0] || real || 'desconhecido'
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
