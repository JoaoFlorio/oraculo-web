import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

const ADMIN_KEY = process.env.INTERNAL_KEY || ''

// O dashboard só soma 'paid' — qualquer outro status sai de faturamento, MRR,
// ticket médio e gráfico sozinho, sem tocar no cálculo.
const STATUS = ['paid', 'refunded', 'canceled', 'test']

async function checkAdmin(req: NextRequest) {
  if (ADMIN_KEY && req.headers.get('x-admin-key') === ADMIN_KEY) return true
  return !!(await getAdminSession())
}

/**
 * PATCH /api/admin/sales  body: { id, status }
 *
 * Corrige lançamento que não é receita de verdade — teste de webhook da Greenn
 * (ela dispara evento de teste e o endpoint não sabe distinguir de compra real),
 * estorno, cobrança duplicada.
 *
 * MARCA em vez de APAGAR: o histórico continua mostrando o que aconteceu, e
 * apagar linha de faturamento não tem volta. Mesmo princípio do livro-caixa da
 * carteira — registro não se rasura.
 */
export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id, status } = await req.json()
  if (!id || !STATUS.includes(status))
    return NextResponse.json({ error: `id e status (${STATUS.join('|')}) obrigatórios` }, { status: 400 })

  const existing = await prisma.sale.findUnique({ where: { id: String(id) } })
  if (!existing) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })

  const sale = await prisma.sale.update({ where: { id: existing.id }, data: { status } })
  return NextResponse.json({
    ok: true,
    sale: { id: sale.id, email: sale.email, amount: sale.amount, status: sale.status },
  })
}
