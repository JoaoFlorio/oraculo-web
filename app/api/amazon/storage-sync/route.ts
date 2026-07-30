import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

/**
 * Baixa o relatório mensal de tarifa de armazenagem e grava por SKU.
 *
 * Existe como proxy porque o backend exige a chave interna, e a chave não pode
 * sair do servidor: pedir pro dono colar o segredo num terminal é transformar um
 * diagnóstico de rotina em manuseio de credencial. Aqui a sessão logada já prova
 * quem é, e ⭐ o e-mail vem da SESSÃO, nunca da URL — foi assim que o `/connect`
 * deixava atrelar a conta Amazon de um atacante ao e-mail de um cliente.
 *
 * ⚠️ Só admin. Não é uma leitura: dispara `createReport` na Amazon, que é 1/min
 * oficial e compartilhado pela conta inteira.
 *
 * A resposta traz `colunasNaoReconhecidas` — o antídoto pro defeito do
 * `ship-price`. Se vier preenchida, o relatório chegou com dados e nenhuma coluna
 * de tarifa foi reconhecida: o nome real está naquela lista.
 */
export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Só admin' }, { status: 403 })

  const url = new URL(req.url)
  // Admin pode pedir de outra conta (suporte); o padrão é a própria.
  const email = (url.searchParams.get('email') || user.email).trim().toLowerCase()
  const meses = Math.min(12, Math.max(0, Number(url.searchParams.get('meses') ?? 3) || 3))

  try {
    const res = await fetch(
      `${BACKEND}/api/amazon/storage-sync?email=${encodeURIComponent(email)}&meses=${meses}`,
      { method: 'POST', cache: 'no-store', headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' } },
    )
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao sincronizar armazenagem', detalhe: String(e?.message || e).slice(0, 200) }, { status: 500 })
  }
}
