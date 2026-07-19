'use client'
import { useEffect, useRef } from 'react'

// Auto-atualização do app: compara a versão que ESTA página carregou (injetada
// pelo servidor no render) com a versão que está no ar (/api/version, no-store).
// Diferente = build velho em cache → recarrega. Verifica ao abrir e toda vez que
// o app volta pro primeiro plano (o caso típico do PWA que fica dias aberto).
//
// ⚠️ Anti-loop: só recarrega UMA vez por versão detectada (sessionStorage). Se
// algo der errado e a divergência persistir, ele para em vez de ficar em ciclo.
const KEY = 'ora_reloaded_for'

export default function VersionGuard({ v }: { v: string }) {
  const checking = useRef(false)

  useEffect(() => {
    if (!v || v === 'dev') return   // local/sem Railway: não faz nada

    async function check() {
      if (checking.current || document.visibilityState !== 'visible') return
      checking.current = true
      try {
        const r = await fetch('/api/version', { cache: 'no-store' })
        const { v: live } = await r.json()
        if (live && live !== 'dev' && live !== v) {
          let already = ''
          try { already = sessionStorage.getItem(KEY) || '' } catch {}
          if (already !== live) {
            try { sessionStorage.setItem(KEY, live) } catch {}
            location.reload()
          }
        }
      } catch { /* offline/instável: tenta na próxima */ }
      checking.current = false
    }

    check()
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis)
    // Rede de segurança pra quem deixa o app aberto o dia todo
    const iv = setInterval(check, 30 * 60 * 1000)
    return () => { document.removeEventListener('visibilitychange', onVis); clearInterval(iv) }
  }, [v])

  return null
}
