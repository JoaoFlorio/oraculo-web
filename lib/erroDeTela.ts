/* 05/11 (caso ludeluciano10: "Carregando Gestão…" → "Algo travou nesta tela", e nem sair dava). A Gestão é um pedaço
 * de código grande (~480 KB de fonte) baixado sob demanda; numa internet instável o download falha e o next/dynamic
 * GUARDA a falha — o "Tentar de novo" (reset) re-renderizava a mesma promessa falhada, pra sempre. Agora:
 *  · erro de CARGA (pedaço de código que não baixou) → recarrega a página sozinho, uma vez a cada 30 s;
 *  · o botão recarrega de verdade; e o erro vai pro servidor (/api/client-error) pra gente ver a causa exata. */

export function ehErroDeCarga(e: unknown): boolean {
  const err = e as { name?: string; message?: string } | null
  const txt = `${err?.name || ''} ${err?.message || ''}`
  return /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|Importing a module script failed|error loading dynamically|Failed to load chunk/i.test(txt)
}

export function reportarErroDeTela(onde: string, e: unknown): void {
  try {
    const err = e as { name?: string; message?: string; stack?: string; digest?: string } | null
    fetch('/api/client-error', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({
        onde, nome: err?.name || '', msg: `${err?.message || String(e)}${err?.digest ? ` [digest ${err.digest}]` : ''}`,
        stack: err?.stack || '', url: location.pathname + location.search,
      }),
    }).catch(() => {})
  } catch { /* relatório nunca atrapalha a tela */ }
}

/** Recarrega a página, mas no máximo 1× a cada 30 s (evita laço se o erro voltar logo depois de recarregar). */
export function recarregarUmaVez(): boolean {
  try {
    const ultima = Number(sessionStorage.getItem('ora-recarga-erro') || 0)
    if (Date.now() - ultima < 30_000) return false
    sessionStorage.setItem('ora-recarga-erro', String(Date.now()))
  } catch { /* sem storage: recarrega mesmo assim */ }
  location.reload()
  return true
}
