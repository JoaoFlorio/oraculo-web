import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

// KPIs + faturamento + MRR + listas operacionais — TUDO real (User + Sale).
const round2 = (n: number) => Math.round(n * 100) / 100

// Valor mensal recorrente por plano ativo (lifetime não recorre).
const MRR_BY_PLAN: Record<string, number> = {
  monthly:  79.9,
  biannual: 397 / 6,
  annual:   597 / 12,
  lifetime: 0,
}

export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const now = new Date()
  const url = new URL(req.url)
  const days = Math.min(365, Math.max(7, Number(url.searchParams.get('days')) || 90))
  // Últimos N dias INCLUINDO hoje (senão as vendas do dia somem do gráfico).
  const since = new Date(now.getTime() - (days - 1) * 86400_000)

  const [users, sales, recentSalesRaw] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'client' },
      select: { id: true, name: true, email: true, phone: true, plan: true, active: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sale.findMany({ select: { plan: true, amount: true, status: true, paidAt: true } }),
    prisma.sale.findMany({
      select: { id: true, email: true, name: true, plan: true, amount: true, status: true, paidAt: true },
      orderBy: { paidAt: 'desc' },
      take: 12,
    }),
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

  const activeClients = clients.filter(c => c.status === 'active')
  const activeSubs = activeClients.length
  const overdue    = clients.filter(c => c.status === 'overdue').length
  const canceled   = clients.filter(c => c.status === 'canceled').length
  const lifetime   = activeClients.filter(c => c.plan === 'lifetime').length

  // ── Faturamento (Sale, status paid) ──────────────────────────────────────
  const paid = sales.filter(s => s.status === 'paid')
  const revenueTotal = round2(paid.reduce((a, s) => a + (s.amount || 0), 0))

  const startMonth     = new Date(now.getFullYear(), now.getMonth(), 1)
  const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const revenueMonth = round2(
    paid.filter(s => new Date(s.paidAt) >= startMonth).reduce((a, s) => a + (s.amount || 0), 0)
  )
  const revenuePrevMonth = round2(
    paid
      .filter(s => { const d = new Date(s.paidAt); return d >= startPrevMonth && d < startMonth })
      .reduce((a, s) => a + (s.amount || 0), 0)
  )
  const growthPct = revenuePrevMonth > 0
    ? round2(((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
    : null

  // MRR: soma do valor mensal recorrente dos clientes ATIVOS pagantes.
  const mrr = round2(activeClients.reduce((a, c) => a + (MRR_BY_PLAN[c.plan] ?? 0), 0))

  // Ticket médio das vendas pagas (todas as datas).
  const avgTicket = paid.length > 0 ? round2(revenueTotal / paid.length) : null

  // ── Série diária de faturamento no período (para o gráfico) ──────────────
  const bucket: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400_000)
    bucket[d.toISOString().slice(0, 10)] = 0
  }
  for (const s of paid) {
    const k = new Date(s.paidAt).toISOString().slice(0, 10)
    if (k in bucket) bucket[k] += s.amount || 0
  }
  const revenueSeries = Object.entries(bucket).map(([date, amount]) => ({ date, amount: round2(amount) }))

  // ── Distribuição por plano: ativos + receita paga do plano (todas as datas)
  const planCount: Record<string, number> = {}
  for (const c of activeClients) planCount[c.plan] = (planCount[c.plan] || 0) + 1
  const planRevenue: Record<string, number> = {}
  for (const s of paid) planRevenue[s.plan] = (planRevenue[s.plan] || 0) + (s.amount || 0)
  const planKeys = Array.from(new Set([...Object.keys(planCount), ...Object.keys(planRevenue)]))
  const byPlan = planKeys.map(plan => ({
    plan,
    count:   planCount[plan] || 0,
    revenue: round2(planRevenue[plan] || 0),
  }))

  // ── Listas operacionais ───────────────────────────────────────────────────
  const in7days = new Date(now.getTime() + 7 * 86400_000)
  const contact = (c: typeof clients[number]) => ({
    id: c.id, name: c.name, email: c.email, phone: c.phone, plan: c.plan, expiresAt: c.expiresAt,
  })
  const expiringSoon = activeClients
    .filter(c => c.plan !== 'lifetime' && c.expiresAt && new Date(c.expiresAt) > now && new Date(c.expiresAt) <= in7days)
    .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())
    .map(contact)
  const overdueList = clients.filter(c => c.status === 'overdue').map(contact)

  return NextResponse.json({
    kpis: {
      activeSubs, overdue, canceled, lifetime, totalClients: clients.length,
      revenueTotal, revenueMonth, revenuePrevMonth, growthPct, mrr, avgTicket,
    },
    byPlan,
    revenueSeries,
    expiringSoon,
    overdueList,
    recentSales: recentSalesRaw,
    clients,
  })
}
