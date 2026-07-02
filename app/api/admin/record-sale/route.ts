import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/db'

// Chamado APENAS pelo backend (webhook Greenn) — registra a venda real e
// atualiza o telefone do cliente. Protegido pela chave interna web↔backend.
const ADMIN_KEY = process.env.INTERNAL_KEY || ''

export async function POST(req: NextRequest) {
  if (!ADMIN_KEY || req.headers.get('x-admin-key') !== ADMIN_KEY)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const b = await req.json().catch(() => ({}))
  const email = String(b.email || '').toLowerCase().trim()
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })

  const amount = Number(b.amount) || 0
  const plan = String(b.plan || 'monthly')
  const phone = b.phone ? String(b.phone).trim() : null
  const name = b.name ? String(b.name).trim() : null
  const status = ['paid', 'refunded', 'canceled'].includes(b.status) ? b.status : 'paid'
  const expiresAt = b.expiresAt ? new Date(b.expiresAt) : null

  // 1) Registra a venda (fonte de verdade do faturamento)
  const sale = await prisma.sale.create({
    data: { email, name, phone, plan, amount, status, greennId: b.greennId ? String(b.greennId) : null, expiresAt },
  })

  // 2) Denormaliza o telefone no cliente (pra contato no admin), se veio
  if (phone) {
    await prisma.user.updateMany({ where: { email }, data: { phone } }).catch(() => {})
  }

  return NextResponse.json({ ok: true, saleId: sale.id })
}
