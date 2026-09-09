import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

/* Aplica UMA recomendação do Copiloto na campanha real (botão "Aplicar" do painel).
 * ⚠️ ADMIN-ONLY enquanto o Piloto NEO está em teste (decisão do João 08/09) — a
 * tela mostra as recomendações pra todos, mas só a conta admin aplica. Liberar =
 * tirar o gate. Traduz a ação do copiloto pra rota de escrita correta (as mesmas
 * que a tool aplicar_ads usa: validar→escrever→conferir→auditar). */
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'
const KEY = process.env.INTERNAL_KEY || ''
const TETO_LANCE = 10

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'aplicar campanha está em teste (admin only)' }, { status: 403 })
  let a: any = {}
  try { a = await req.json() } catch { /* vazio */ }
  const tipo = String(a?.tipo || '')
  const email = user.email
  const lance = Math.min(TETO_LANCE, Number(a?.lance) || 0)
  const chamar = async (path: string, body: any) => {
    const res = await fetch(`${BACKEND}${path}`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-key': KEY },
      body: JSON.stringify({ email, ...body }), signal: AbortSignal.timeout(30_000),
    })
    return { status: res.status, data: await res.json().catch(() => ({})) }
  }
  try {
    let r: { status: number; data: any }
    if (tipo === 'promover') {
      if (!a.campaignId || !a.adGroupId || !a.termo || !(lance > 0)) return NextResponse.json({ error: 'dados incompletos' }, { status: 400 })
      r = await chamar('/api/ads/keyword-create', { campaignId: a.campaignId, adGroupId: a.adGroupId, keywordText: a.termo, bid: lance })
    } else if (tipo === 'negativar') {
      if (!a.campaignId || !a.adGroupId || !a.termo) return NextResponse.json({ error: 'dados incompletos' }, { status: 400 })
      r = await chamar('/api/ads/negative-create', { campaignId: a.campaignId, adGroupId: a.adGroupId, keywordText: a.termo })
    } else if (tipo === 'ajustar-lance') {
      if (!a.keywordId || !(lance > 0)) return NextResponse.json({ error: 'dados incompletos' }, { status: 400 })
      r = await chamar('/api/ads/keyword-update', { keywordId: a.keywordId, bid: lance })
    } else if (tipo === 'pausar-keyword') {
      if (!a.keywordId) return NextResponse.json({ error: 'dados incompletos' }, { status: 400 })
      r = await chamar('/api/ads/keyword-update', { keywordId: a.keywordId, state: 'PAUSED' })
    } else {
      return NextResponse.json({ error: `tipo desconhecido: ${tipo}` }, { status: 400 })
    }
    return NextResponse.json({ ok: r.data?.ok === true, ...r.data }, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'falha ao aplicar' }, { status: 502 })
  }
}
