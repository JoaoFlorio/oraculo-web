import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Reconciliação 23/09: estas chaves guardam o 2FA e a trava de login. Uma sessão roubada
// (janela de 8h do admin) NÃO pode ler o segredo TOTP nem apagar `totp`/`loginLock` por aqui.
const RESERVADAS = new Set(['totp', 'totpPending', 'loginLock'])
const semReservadas = (m: Record<string, unknown>) => Object.fromEntries(Object.entries(m).filter(([k]) => !RESERVADAS.has(k)))

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
    if (RESERVADAS.has(key)) return NextResponse.json({ error: 'chave reservada' }, { status: 403 })
    return NextResponse.json({ value: meta[key] ?? null })
  }
  return NextResponse.json({ value: semReservadas(meta) })
}

/* POST /api/user/metadata  body: { key, value } */
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key, value } = await req.json()
  if (!key || typeof key !== 'string') return NextResponse.json({ error: 'key required' }, { status: 400 })
  if (RESERVADAS.has(key)) return NextResponse.json({ error: 'chave reservada' }, { status: 403 })

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
