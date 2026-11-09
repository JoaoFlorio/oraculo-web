import type { NextRequest } from 'next/server'

// 🔒 CSRF (varredura 28/10). Pedido que MUDA estado só vale vindo do próprio painel: o navegador manda Sec-Fetch-Site/Origin;
// servidor-a-servidor (backend → /api/admin/record-sale, curl) não manda nenhum dos dois e não carrega cookie de ninguém.
// Usado pelo proxy.ts (toda a /api) e pelas rotas que ficam FORA do proxy (upload grande, ver o matcher do proxy.ts).
const APP_HOST = (() => { try { return new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://app.oraculojf.com.br').host } catch { return 'app.oraculojf.com.br' } })()
export function origemEstranha(req: NextRequest): boolean {
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
