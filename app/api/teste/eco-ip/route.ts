import { NextRequest, NextResponse } from 'next/server'
import { cabecalhosIp } from '@/lib/testeProxy'
export const dynamic = 'force-dynamic'
// TEMPORÁRIO (07/10): conferir qual cabeçalho traz o IP real no Railway (mostra só o IP de quem chama). Apagar depois.
export async function GET(req: NextRequest) { return NextResponse.json(cabecalhosIp(req), { headers: { 'cache-control': 'no-store' } }) }
