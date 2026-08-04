import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'
import { prisma } from '@/lib/db'

/* O CMV e a alíquota moram no metadata do usuário AQUI no web — a Amazon não
 * sabe quanto o seller pagou pelo produto. Sem eles o NEO julga o ACoS contra a
 * margem MÉDIA e acusa de prejuízo campanha que está só em atenção: a moto do
 * João vende a R$499 com custo de R$270 (margem real ~33%), e 28% de ACoS ali
 * não é prejuízo. Mesmo carregamento do proxy do chat: as duas chaves somadas
 * (`gestao_cmv` é o produto, `gestao_extras` é prep center, etiqueta, frete de
 * entrada), porque é assim que o painel calcula — o NEO tem que ver o MESMO. */
async function custosDoSeller(userId: string): Promise<{ cmv?: Record<string, number>; aliquota?: number }> {
  try {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } })
    const m = (u?.metadata ?? {}) as Record<string, any>
    const base = m.gestao_cmv && typeof m.gestao_cmv === 'object' ? m.gestao_cmv as Record<string, any> : {}
    const extras = m.gestao_extras && typeof m.gestao_extras === 'object' ? m.gestao_extras as Record<string, any> : {}
    const cmv: Record<string, number> = {}
    for (const sku of new Set([...Object.keys(base), ...Object.keys(extras)])) {
      const soma = (Number(base[sku]) || 0) + (Number(extras[sku]) || 0)
      if (soma > 0) cmv[sku] = soma
    }
    const aliquota = Number(m.gestao_imposto) || undefined
    return { ...(Object.keys(cmv).length ? { cmv } : {}), ...(aliquota ? { aliquota } : {}) }
  } catch { return {} }
}

// Proxy das recomendações de ANÚNCIOS do NEO. Mesmo encanamento do insight do
// dia: sessão → email (nunca do cliente). O cache de 12h vive no backend.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Demo não tem campanha real — devolve vazio em vez de inventar recomendação
  // sobre dinheiro que ninguém investiu.
  if (await demoConfigFor(user)) return NextResponse.json({ demo: true })

  const force = req.nextUrl.searchParams.get('force') === '1' ? '&force=1' : ''
  try {
    const res = await fetch(`${BACKEND}/api/agent/insight-ads?email=${encodeURIComponent(user.email)}${force}`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify(await custosDoSeller(user.id)),
    })
    const data = await res.json().catch(() => ({ error: 'resposta inválida' }))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar as recomendações' }, { status: 500 })
  }
}
