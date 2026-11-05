import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

/* 05/11 (caso ludeluciano10): o card "Algo travou nesta tela" só fazia console.error NO NAVEGADOR do cliente — a gente
 * ficava deduzindo a causa por foto do notebook. Agora o card manda o erro pra cá e ele fica numa tabela consultável
 * (client_errors): mensagem, tipo, onde, página e navegador. Sem senha, sem dado de venda; corpo pequeno; o mesmo erro do
 * mesmo aparelho entra uma vez a cada 5 min; linhas com mais de 30 dias saem sozinhas. */
let tabelaPronta: Promise<unknown> | null = null
const garantirTabela = () => tabelaPronta ??= prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS client_errors (
    id    BIGSERIAL PRIMARY KEY,
    em    TIMESTAMPTZ NOT NULL DEFAULT now(),
    email TEXT,
    onde  TEXT,
    nome  TEXT,
    msg   TEXT,
    stack TEXT,
    url   TEXT,
    ua    TEXT
  )`).catch(e => { tabelaPronta = null; throw e })

const vistos = new Map<string, number>()
const corta = (v: unknown, n: number) => String(v ?? '').slice(0, n)

export async function POST(req: NextRequest) {
  try {
    const j = JSON.parse((await req.text()).slice(0, 8000) || '{}')
    const user = await getSession().catch(() => null)
    const ua = corta(req.headers.get('user-agent'), 300)
    const msg = corta(j.msg, 500)
    const chave = `${user?.id || req.headers.get('x-forwarded-for')?.split(',')[0] || '?'}|${msg}`
    const agora = Date.now()
    if ((vistos.get(chave) || 0) > agora - 5 * 60_000) return new NextResponse(null, { status: 204 })
    vistos.set(chave, agora); if (vistos.size > 2000) vistos.clear()

    await garantirTabela()
    await prisma.$executeRaw`INSERT INTO client_errors (email, onde, nome, msg, stack, url, ua)
      VALUES (${user?.email ?? null}, ${corta(j.onde, 40)}, ${corta(j.nome, 80)}, ${msg}, ${corta(j.stack, 2000)}, ${corta(j.url, 200)}, ${ua})`
    if (Math.random() < 0.02) await prisma.$executeRaw`DELETE FROM client_errors WHERE em < now() - interval '30 days'`.catch(() => {})
    console.warn(`[client-error] ${j.onde || '?'}: ${corta(j.nome, 40)} ${msg.slice(0, 160)}`)
  } catch { /* relatório malformado: ignora */ }
  return new NextResponse(null, { status: 204 })
}
