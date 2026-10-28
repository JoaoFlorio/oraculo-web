import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

/* 28/10 (varredura): recebe as violações da CSP em Report-Only (next.config.ts) e registra no log, AGRUPADAS — pra
 * saber o que quebraria antes de promover a CSP a bloqueante. Público por natureza (o navegador manda sem cookie),
 * então: corpo pequeno, nada guardado além de diretiva + host bloqueado, e cada par só uma vez por hora. */
const vistos = new Map<string, number>()
export async function POST(req: NextRequest) {
  try {
    const txt = (await req.text()).slice(0, 8000)
    const j = JSON.parse(txt || '{}')
    const r = j['csp-report'] || (Array.isArray(j) ? j[0]?.body : j?.body) || {}
    const dir = String(r['effective-directive'] || r['violated-directive'] || r.effectiveDirective || '').slice(0, 40)
    let host = String(r['blocked-uri'] || r.blockedURL || '').slice(0, 200)
    try { if (/^https?:/.test(host)) host = new URL(host).host } catch { /* mantém */ }
    const pagina = (() => { try { return new URL(String(r['document-uri'] || r.documentURL || '')).pathname.slice(0, 60) } catch { return '' } })()
    const chave = `${dir}|${host}`
    const agora = Date.now()
    if (dir && (vistos.get(chave) || 0) < agora - 3600_000) {
      vistos.set(chave, agora); if (vistos.size > 2000) vistos.clear()
      console.warn(`[csp] report-only: ${dir} bloquearia ${host || '(inline)'} em ${pagina}`)
    }
  } catch { /* report malformado: ignora */ }
  return new NextResponse(null, { status: 204 })
}
