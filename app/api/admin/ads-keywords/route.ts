import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = () => ({ 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' })

/**
 * Palavras-chave de uma campanha. SÓ ADMIN e SÓ na própria conta — o e-mail vem
 * da sessão, nunca do cliente. ⚠️ O PATCH altera lance real de anúncio.
 *
 *  GET   ?campaignId=  → desempenho (cache) + lance ao vivo
 *  POST                → regenera o relatório de palavras (LENTO, minutos)
 *  PATCH { keywordId, bid } → muda o lance
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const campaignId = (new URL(req.url).searchParams.get('campaignId') || '').trim()
  if (!campaignId) return NextResponse.json({ error: 'campaignId obrigatório' }, { status: 400 })
  try {
    const r = await fetch(
      `${BACKEND}/api/ads/keywords?email=${encodeURIComponent(admin.email)}&campaignId=${encodeURIComponent(campaignId)}`,
      { cache: 'no-store', headers: KEY() },
    )
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Backend indisponível' }, { status: 502 })
  }
}

export async function POST(_req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    // O relatório da Amazon pode levar minutos — timeout largo de propósito.
    const r = await fetch(`${BACKEND}/api/ads/keywords-refresh`, {
      method: 'POST', cache: 'no-store', headers: KEY(),
      body: JSON.stringify({ email: admin.email }),
      signal: AbortSignal.timeout(240000),
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ ok: false, erro: 'a geração passou do tempo — tente de novo em alguns minutos' }, { status: 200 })
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  if (!b?.keywordId || b?.bid == null) return NextResponse.json({ error: 'keywordId e bid obrigatórios' }, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/ads/keyword-update`, {
      method: 'POST', cache: 'no-store', headers: KEY(),
      body: JSON.stringify({ email: admin.email, keywordId: b.keywordId, bid: Number(b.bid) }),
    })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Backend indisponível' }, { status: 502 })
  }
}
