import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

/* GET /api/user/metadata?key=financeiro_costs */
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = req.nextUrl.searchParams.get('key')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { metadata: true },
  })

  const meta = (dbUser?.metadata ?? {}) as Record<string, unknown>

  if (key) {
    return NextResponse.json({ value: meta[key] ?? null })
  }
  return NextResponse.json({ value: meta })
}

/* POST /api/user/metadata  body: { key, value } */
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key, value } = await req.json()
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { metadata: true },
  })

  const current = (dbUser?.metadata ?? {}) as Record<string, unknown>
  const updated = { ...current, [key]: value }

  await prisma.user.update({
    where: { id: user.id },
    data: { metadata: updated },
  })

  return NextResponse.json({ ok: true })
}
