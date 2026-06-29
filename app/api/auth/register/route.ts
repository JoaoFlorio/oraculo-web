import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

// Cadastro público DESATIVADO. O Oráculo não tem plano grátis nem auto-cadastro:
// contas são criadas exclusivamente pela compra (webhook Greenn → /api/admin/users).
export async function POST() {
  return NextResponse.json(
    { error: 'Cadastro indisponível. Adquira o Oráculo em /planos para receber seu acesso.' },
    { status: 403 },
  )
}
