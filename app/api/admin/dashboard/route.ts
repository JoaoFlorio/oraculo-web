import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

// KPIs + série de faturamento + lista de clientes — TUDO real (User + Sale).
export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const now = new Date()
  const url = new URL(req.url)
  const days = Math.min(365, Math.max(7, Number(url.searchParams.get('days')) || 90))
  const since = new Date(now.getTime() - days * 86400_000)

  const [users, sales] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'client' },
      select: { id: true, name: true, email: true, phone: true, plan: true, active: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sale.findMany({ select: { plan: true, amount: true, status: true, paidAt: true } }),
  ])

  // ── Status por cliente (vitalício conta como ativo) ──────────────────────
  const statusOf = (u: typeof users[number]): 'active' | 'overdue' | 'canceled' | 'none' => {
    if (!u.active) return 'canceled'
    if (u.plan === 'free' || !u.plan) return 'none'
    if (u.plan === 'lifetime') return 'active'
    if (u.expiresAt && new Date(u.expiresAt) < now) return 'overdue'
    return 'active'
  }
  const clients = users.map(u => ({ ...u, status: statusOf(u) }))

  const activeSubs = clients.filter(c => c.status === 'active').length
  const overdue    = clients.filter(c => c.status === 'overdue').length
  const canceled   = clients.filter(c => c.status === 'canceled').length
  const lifetime   = clients.filter(c => c.plan === 'lifetime' && c.status === 'active').length

  // ── Faturamento (Sale, status paid) ──────────────────────────────────────
  const paid = sales.filter(s => s.status === 'paid')
  const revenueTotal = paid.reduce((a, s) => a + (s.amount || 0), 0)
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const revenueMonth = paid.filter(s => new Date(s.paidAt) >= startMonth).reduce((a, s) => a + (s.amount || 0), 0)

  // Série diária de faturamento no período (para o gráfico)
  const bucket: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400_000)
    bucket[d.toISOString().slice(0, 10)] = 0
  }
  for (const s of paid) {
    const k = new Date(s.paidAt).toISOString().slice(0, 10)
    if (k in bucket) bucket[k] += s.amount || 0
  }
  const revenueSeries = Object.entries(bucket).map(([date, amount]) => ({ date, amount }))

  // Distribuição por plano (clientes ativos)
  const planCount: Record<string, number> = {}
  for (const c of clients) if (c.status === 'active') planCount[c.plan] = (planCount[c.plan] || 0) + 1
  const byPlan = Object.entries(planCount).map(([plan, count]) => ({ plan, count }))

  return NextResponse.json({
    kpis: { activeSubs, overdue, canceled, lifetime, revenueTotal, revenueMonth, totalClients: clients.length },
    byPlan, revenueSeries, clients,
  })
}
