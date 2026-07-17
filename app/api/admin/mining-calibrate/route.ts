import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Diagnóstico (admin): dado ?asins=B0..,B0.. mostra rank sub/root + estimativa de
// vendas do minerador — pra calibrar a curva contra vendas REAIS conhecidas.
export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const asins = new URL(req.url).searchParams.get('asins') || ''
  if (!asins) return NextResponse.json({ error: 'asins obrigatório' }, { status: 400 })
  try {
    const res = await fetch(`${BACKEND}/api/product/search/calibrate?asins=${encodeURIComponent(asins)}`, {
      cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'falha ao calibrar' }, { status: 502 })
  }
}
