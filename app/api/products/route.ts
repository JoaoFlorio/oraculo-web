import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

// Limite de produtos por plano (server-side — não depende do cliente)
const PLAN_LIMIT: Record<string, number> = {
  free:     6,
  monthly:  9999,
  biannual: 9999,
  annual:   9999,
  lifetime: 9999,
}

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type     = searchParams.get('type')     || 'bestsellers'
  const category = searchParams.get('category') || 'electronics'
  const q        = searchParams.get('q')        || ''
  const bust     = searchParams.get('bust')     || ''
  const exclude  = searchParams.get('exclude')  || ''  // ASINs que o usuário já viu

  // Plano gratuito só pode acessar Mais Vendidos
  if (user.plan === 'free' && type !== 'bestsellers' && type !== 'search') {
    return NextResponse.json({ products: [], locked: true })
  }

  try {
    // O e-mail vai da SESSÃO (nunca do cliente): é o que permite ao backend
    // saber o que ESTE usuário já viu e servir do catálogo persistido em vez de
    // pedir produto novo pra Amazon.
    const params = new URLSearchParams({ type, category, q, email: user.email })
    if (bust === '1') params.set('bust', '1')
    if (exclude)     params.set('exclude', exclude)

    const res = await fetch(`${BACKEND}/api/product/search?${params}`, {
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' },
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`Backend ${res.status}`)
    const data = await res.json()

    // Aplica limite de produtos por plano.
    // Plano não mapeado (id novo da Greenn, legado) NUNCA cai no limite free —
    // quem loga é pagante; fallback é o plano pago mais restrito (mensal).
    const limit    = PLAN_LIMIT[user.plan] ?? PLAN_LIMIT.monthly
    const products = (data.products || []).slice(0, limit)

    return NextResponse.json({
      products,
      plan:      user.plan,
      total:     data.products?.length ?? 0,
      poolSize:  data.poolSize  ?? products.length,
      remaining: data.remaining ?? products.length,
    })
  } catch (e: any) {
    console.error('[products]', e.message)
    // Erro transitório do backend NÃO pode parecer "pool vazio" (200 sem
    // `remaining`) — o cliente marcaria fim-dos-dados permanente. Devolve erro.
    return NextResponse.json({ products: [], error: true }, { status: 502 })
  }
}
