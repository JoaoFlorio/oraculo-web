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
  // 07/10/2026 (bug de produção, MEDIDO): no Railway o XFF chega "<cliente>, <borda 46.151.x.x>" e a borda DESCARTA
  // XFF/X-Real-IP forjados pelo navegador (testado mandando valores falsos). O ÚLTIMO hop é a BORDA — compartilhada
  // por muita gente: este balde de 10/min virava um só pra vários clientes (login e cadastro do teste davam "Muitas
  // tentativas" num pico). O cliente é o 1º hop público. (O comentário antigo, de 06/08, supunha que o Envoy anexava.)
  const privado = (ip: string) => /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|::1$|fc|fd|fe80)/i.test(ip)
  const hops = (req.headers.get('x-forwarded-for') || '').split(',').map(s => s.trim()).filter(Boolean)
  const real = (req.headers.get('x-real-ip') || '').trim()
  return hops.find(h => !privado(h)) || (real && !privado(real) ? real : '') || hops[0] || real || 'desconhecido'
}

// 🔒 28/10 (varredura): CSRF. O cookie é SameSite=Lax, que deixa passar formulário de OUTRO site enviado como navegação
// (ex.: <form enctype="text/plain"> fazendo POST em /api/auth/login → a vítima entra logada na conta do atacante e, se
// conectar a Amazon dela ali, os dados vão pra ele). Pedido que MUDA estado só vale vindo do próprio painel: navegador
// manda Sec-Fetch-Site/Origin; servidor-a-servidor (backend → /api/admin/record-sale, curl) não manda nenhum dos dois
// e também não carrega cookie de ninguém, então segue.
const ROTAS_RL = new Set([
  '/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password',
  '/api/user/change-password', '/api/auth/totp',
  '/api/teste/iniciar', '/api/teste/reenviar', '/api/teste/confirmar',
])
const APP_HOST = (() => { try { return new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://app.oraculojf.com.br').host } catch { return 'app.oraculojf.com.br' } })()
function origemEstranha(req: NextRequest): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return false
  if (req.nextUrl.pathname === '/api/csp-report') return false   // relatório do próprio navegador (sem cookie, não muda nada)
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return true
  const origin = req.headers.get('origin')
  if (!origin) return false
  // Sem Sec-Fetch-Site (navegador antigo): a origem tem que ser um dos nomes do próprio app.
  let host = ''
  try { host = new URL(origin).host } catch { return true }
  const meus = [req.headers.get('x-forwarded-host'), req.headers.get('host'), req.nextUrl.host, APP_HOST].filter(Boolean)
  return !meus.includes(host)
}

export function proxy(req: NextRequest) {
  if (origemEstranha(req)) return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
  if (!ROTAS_RL.has(req.nextUrl.pathname.replace(/\/+$/, ''))) return NextResponse.next()
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

// Rate limit: só as rotas de ROTAS_RL (bcrypt/envio de e-mail/WhatsApp/código 2FA — teste grátis desde 05/10, 2FA desde
// 28/10). A checagem de origem (CSRF) vale pra toda a /api.
export const config = {
  matcher: ['/api/:path*'],
}
