import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// Logo do fornecedor (guardada no banco do backend em webp — sem hotlink no site dele). Cache de 7 dias no navegador.
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return new NextResponse(null, { status: 401 })
  const { id } = await params
  if (!/^\d{1,6}$/.test(id)) return new NextResponse(null, { status: 400 })
  try {
    const r = await fetch(`${BACKEND}/api/fornecedores/logo/${id}`, {
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' }, signal: AbortSignal.timeout(10_000),
    })
    if (!r.ok) return new NextResponse(null, { status: r.status })
    return new NextResponse(Buffer.from(await r.arrayBuffer()), {
      // 28/10 (varredura): o tipo vinha do banco sem filtro — um SVG ali viraria script rodando no domínio do app.
      headers: { 'content-type': /^image\/(webp|png|jpeg|gif)$/i.test(r.headers.get('content-type') || '') ? r.headers.get('content-type')! : 'image/webp',
                 'x-content-type-options': 'nosniff', 'cache-control': 'private, max-age=604800' },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
