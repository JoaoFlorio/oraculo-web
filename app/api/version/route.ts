import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

// Versão do build ATUALMENTE no ar. O app compara com a versão que ele carregou;
// se divergir, ele se recarrega sozinho (ver VersionGuard). Sem isso, um PWA que
// ficou com o HTML em cache roda código antigo por dias — foi o que aconteceu no
// iPhone do João (corrigimos o menu e ele continuou vendo o bug da versão velha).
export async function GET() {
  return NextResponse.json(
    { v: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.RAILWAY_DEPLOYMENT_ID || 'dev' },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
