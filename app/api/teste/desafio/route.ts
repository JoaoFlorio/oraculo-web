import { NextResponse } from 'next/server'
import { novoDesafio } from '@/lib/desafioTeste'
export const dynamic = 'force-dynamic'

// Desafio anti-robô do cadastro do teste grátis (lib/desafioTeste.ts). Público, sem estado no servidor.
export async function GET() {
  return NextResponse.json({ desafio: novoDesafio() }, { headers: { 'cache-control': 'no-store' } })
}
