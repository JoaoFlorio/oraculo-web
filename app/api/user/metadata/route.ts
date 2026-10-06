import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Reconciliação 23/09: estas chaves guardam o 2FA e a trava de login. Uma sessão roubada
// (janela de 8h do admin) NÃO pode ler o segredo TOTP nem apagar `totp`/`loginLock` por aqui.
// 05/10 (pentest): também são do SERVIDOR — o cliente não grava por aqui:
//  · teste   → marca do teste grátis (webhook via /api/admin/users); forjar = "teste até" falso/créditos
//  · terms   → aceite dos termos (versão+data+IP) gravado por /api/user/accept-terms
//  · demo    → config da conta demo (gravada pelo admin em /api/admin/demo)
//  · partner_* → consentimento LGPD p/ parceiro (Sellion/Mentoria) — só server-to-server
//    (backend /api/partner/consent e /entrar-parceiro); não existe botão do cliente.
const RESERVADAS = new Set(['totp', 'totpPending', 'loginLock', 'teste', 'terms', 'demo'])
const reservada = (k: string) => RESERVADAS.has(k) || k.startsWith('partner_')
const semReservadas = (m: Record<string, unknown>) => Object.fromEntries(Object.entries(m).filter(([k]) => !reservada(k)))

// 05/10 (pentest): teto de tamanho (antes não havia — dava pra inflar o jsonb do User com MBs).
// Maiores usos legítimos medidos pelo código do cliente: profile_avatar ≤100 KB (o cliente reduz
// até isso), ml_minera_salvos ≤60 produtos (~60–90 KB), gestao_cmv/gestao_extras sem teto
// (~35 B por SKU → ~70 KB com 2.000 SKUs), saved_products ≤100 (~35 KB), gestao_snapshots ≤20
// períodos (~30 KB). 64 KB/chave quebraria salvos ML e catálogo grande → 256 KB/chave, 1 MB no total.
const LIMITE_CHAVE = 256 * 1024
const LIMITE_TOTAL = 1024 * 1024
const LIMITE_NOME  = 100

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
    if (reservada(key)) return NextResponse.json({ error: 'chave reservada' }, { status: 403 })
    return NextResponse.json({ value: meta[key] ?? null })
  }
  return NextResponse.json({ value: semReservadas(meta) })
}

/* POST /api/user/metadata  body: { key, value } */
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Lê como texto pra barrar corpo gigante antes do parse (folga de 4 KB pro envelope {key, value}).
  const bruto = await req.text()
  if (Buffer.byteLength(bruto, 'utf8') > LIMITE_CHAVE + 4096)
    return NextResponse.json({ error: 'valor grande demais' }, { status: 413 })
  let body: { key?: unknown; value?: unknown }
  try { body = JSON.parse(bruto) } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }
  const { key, value } = body ?? {}
  if (!key || typeof key !== 'string' || key.length > LIMITE_NOME) return NextResponse.json({ error: 'key required' }, { status: 400 })
  if (reservada(key)) return NextResponse.json({ error: 'chave reservada' }, { status: 403 })

  const json = JSON.stringify(value ?? null)
  if (Buffer.byteLength(json, 'utf8') > LIMITE_CHAVE)
    return NextResponse.json({ error: 'valor grande demais' }, { status: 413 })

  // Merge atômico no Postgres (jsonb ||) — evita que duas gravações quase
  // simultâneas (read-modify-write) apaguem a key uma da outra.
  // Teto TOTAL checado no mesmo UPDATE (atômico): grava se o resultado cabe em 1 MB OU se não
  // cresce (quem já passou do teto ainda consegue enxugar/apagar uma chave).
  const n = await prisma.$executeRaw`
    UPDATE "User"
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(${key}::text, ${json}::jsonb)
    WHERE id = ${user.id}
      AND (
        octet_length((COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(${key}::text, ${json}::jsonb))::text) <= ${LIMITE_TOTAL}::int
        OR octet_length((COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(${key}::text, ${json}::jsonb))::text)
           <= octet_length(COALESCE(metadata, '{}'::jsonb)::text)
      )
  `
  if (n === 0) return NextResponse.json({ error: 'limite de dados da conta atingido' }, { status: 413 })

  return NextResponse.json({ ok: true })
}
