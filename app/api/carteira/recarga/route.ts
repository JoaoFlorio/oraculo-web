import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { demoConfigFor } from '@/lib/demo'

// Gera a cobrança PIX da recarga. O e-mail vem da SESSÃO; do corpo só vêm o
// pacote escolhido e, na PRIMEIRA recarga, nome e CPF/CNPJ (que o backend
// manda pro Asaas e NÃO guarda).
const BACKEND = process.env.BACKEND_URL || 'https://oraculo-backend-production.up.railway.app'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Conta demo é fictícia — cobrar de verdade nela seria um baita mal-entendido
  // numa apresentação pra alunos.
  if (await demoConfigFor(user)) {
    return NextResponse.json({ error: 'Esta é uma conta de demonstração — a recarga não está disponível aqui.' }, { status: 400 })
  }

  let body: any = {}
  try { body = await req.json() } catch { /* corpo vazio */ }

  try {
    const res = await fetch(`${BACKEND}/api/carteira/recarga`, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(60_000),
      headers: { 'content-type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({
        email: user.email,
        valor: body?.valor,
        // Nome cai pro da conta se ele não digitar — o Asaas exige um.
        nome: String(body?.nome || user.name || '').trim(),
        cpfCnpj: body?.cpfCnpj,
      }),
    })
    const data = await res.json().catch(() => ({ error: 'resposta inválida do backend' }))
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    console.error('[carteira/recarga proxy]', e?.message || e)
    return NextResponse.json({ error: 'Erro ao gerar a cobrança.' }, { status: 500 })
  }
}
