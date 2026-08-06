import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── RATE LIMIT DAS ROTAS DE AUTH (auditoria de lançamento, 23/07/2026) ────────
// O app web não tinha NENHUMA trava no login. Dois estragos ao mesmo tempo:
//   1. brute force / credential stuffing sem barreira (a lista de e-mails dos
//      100 clientes é alvo previsível);
//   2. DoS por CPU: cada tentativa força um bcrypt pesado — um flood satura o
//      core do Node no Railway e DERRUBA o app pros 100 clientes de uma vez.
// O proxy roda ANTES da rota (antes do bcrypt), então corta o flood na porta.
//
// ⚠️ No Next 16 o `proxy` roda em runtime NODEJS (não edge) e, no `next start`
// do Railway (1 processo), o estado de módulo abaixo PERSISTE entre requisições.
// A doc alerta contra depender de globals SE for deploy em CDN/edge — não é o
// nosso caso (Railway, self-hosted, instância única). Se um dia migrar pra
// edge/multi-instância, trocar este mapa por um store compartilhado (Redis/Postgres).
//
// Balde único por IP cobrindo TODAS as rotas sensíveis juntas — assim o atacante
// não escapa espalhando entre login/registro/reset. Ajustável por env, sem deploy.
const JANELA_MS = parseInt(process.env.AUTH_RL_WINDOW_MS || '60000')  // 1 min
const MAX = parseInt(process.env.AUTH_RL_MAX || '10')                 // 10 tentativas/min/IP

interface Balde { count: number; resetAt: number }
const baldes = new Map<string, Balde>()

function ipDe(req: NextRequest): string {
  // ⚠️ SEGURANÇA (pentest 06/08/2026): o IP real é o ÚLTIMO hop do X-Forwarded-For,
  // não o primeiro. O Envoy do Railway ANEXA o IP do cliente à DIREITA — o que
  // vem à esquerda é controlado pelo atacante (ele manda `X-Forwarded-For: <fake>`
  // e o Envoy vira `<fake>, <ip-real>`). Ler o [0] deixava o atacante trocar de
  // "IP" a cada requisição e furar o limite. Ler o último bate com o backend
  // (`trust proxy: 1`, que lê o hop da direita). Sem hop, x-real-ip (setado pelo
  // proxy, não pelo cliente).
  const xff = req.headers.get('x-forwarded-for') || ''
  const hops = xff.split(',').map(s => s.trim()).filter(Boolean)
  return hops[hops.length - 1] || req.headers.get('x-real-ip') || 'desconhecido'
}

export function proxy(req: NextRequest) {
  const ip = ipDe(req)
  const agora = Date.now()
  const b = baldes.get(ip)

  if (!b || b.resetAt < agora) {
    baldes.set(ip, { count: 1, resetAt: agora + JANELA_MS })
  } else if (++b.count > MAX) {
    const retry = Math.max(1, Math.ceil((b.resetAt - agora) / 1000))
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um minuto e tente de novo.' },
      { status: 429, headers: { 'Retry-After': String(retry) } },
    )
  }

  // Limpeza preguiçosa dos baldes expirados quando o mapa cresce (memória sob
  // controle num ataque de muitos IPs, sem timer rodando à toa).
  if (baldes.size > 5000) {
    for (const [k, v] of baldes) if (v.resetAt < agora) baldes.delete(k)
  }

  return NextResponse.next()
}

// Só as rotas que fazem bcrypt/envio de e-mail — o resto do app não paga o custo.
export const config = {
  matcher: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/user/change-password',
  ],
}
