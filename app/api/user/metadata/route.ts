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

  // Merge atômico no Postgres (jsonb ||) — evita que duas gravações quase
  // simultâneas (read-modify-write) apaguem a key uma da outra.
  const json = JSON.stringify(value ?? null)
  await prisma.$executeRaw`
    UPDATE "User"
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(${key}::text, ${json}::jsonb)
    WHERE id = ${user.id}
  `

  return NextResponse.json({ ok: true })
}
