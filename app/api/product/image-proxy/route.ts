import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'

/**
 * GET /api/product/image-proxy?url=AMAZON_URL&filename=nome.jpg
 *
 * Faz proxy da imagem da Amazon server-side (contorna CORS)
 * e retorna com Content-Disposition: attachment para download direto.
 * Exige sessão — não é um proxy aberto para terceiros usarem o nosso IP.
 */
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = req.nextUrl.searchParams.get('url') || ''
  // Sanitiza o filename (evita injeção no header Content-Disposition).
  const filename = (req.nextUrl.searchParams.get('filename') || 'imagem.jpg').replace(/[^\w.\-]+/g, '_').slice(0, 80) || 'imagem.jpg'

  if (!url) return NextResponse.json({ error: 'url obrigatória' }, { status: 400 })

  // Só aceita URLs da Amazon e do Mercado Livre (segurança)
  const allowed = [
    'images-na.ssl-images-amazon.com',
    'images-fe.ssl-images-amazon.com',
    'images-eu.ssl-images-amazon.com',
    'm.media-amazon.com',
    // Imagens do ML (o modal de análise da Mineração ML baixa por aqui também)
    'mlstatic.com',
  ]
  const hostOk = (h: string) => allowed.some(a => h === a || h.endsWith('.' + a))
  let u: URL
  try {
    u = new URL(url)
    // 23/09: `endsWith('mlstatic.com')` deixava passar `evilmlstatic.com` (SSRF) — agora igual ou subdomínio.
    if (!/^https?:$/.test(u.protocol) || !hostOk(u.hostname)) {
      return NextResponse.json({ error: 'URL não permitida' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }

  // Troca resolução para máxima disponível — SÓ no pathname. A versão antiga reescrevia a
  // string inteira e `\._.*?_\.` podia engolir o host (`https://a._.m.media-amazon.com/_.evil.com/x`
  // passava na allowlist e virava `https://a.evil.com/x` = SSRF). Mexer no pathname não muda o host.
  const ehML = /mlstatic\.com$/.test(u.hostname)
  const hi = new URL(u.toString())
  hi.pathname = ehML
    // ML: sufixo -I/-S = thumbnail, -O = original em tamanho cheio
    ? hi.pathname.replace(/-[IS]\.(jpg|webp|png)$/i, '-O.$1')
    : hi.pathname
        .replace(/_AC_SR\d+,\d+_/,  '_AC_SL2000_')
        .replace(/_AC_UL\d+_/,      '_AC_SL2000_')
        .replace(/_AC_SL\d+_/,      '_AC_SL2000_')
        .replace(/_SL\d+_/,         '_SL2000_')
        .replace(/\._.*?_\./,       '.')   // fallback: remove todos os modificadores
  if (!hostOk(hi.hostname)) return NextResponse.json({ error: 'URL não permitida' }, { status: 403 })
  const hiResUrl = hi.toString()

  try {
    const res = await fetch(hiResUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OraculoBot/1.0)' },
      redirect: 'manual', signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) throw new Error(`Status ${res.status}`)

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) throw new Error('não é imagem')
    const buffer      = await res.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'public, max-age=86400',
      },
    })
  } catch {
    // Tenta URL original como fallback
    try {
      const res2 = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OraculoBot/1.0)' },
        redirect: 'manual', signal: AbortSignal.timeout(10_000),
      })
      if (!res2.ok) throw new Error(`Status ${res2.status}`)
      const ct  = res2.headers.get('content-type') || 'image/jpeg'
      if (!ct.startsWith('image/')) throw new Error('não é imagem')
      const buf = await res2.arrayBuffer()
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type':        ct,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch {
      return NextResponse.json({ error: 'Falha ao buscar imagem' }, { status: 502 })
    }
  }
}
