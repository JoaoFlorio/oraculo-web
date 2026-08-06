// Persistência das IMAGENS GERADAS do NEO — fora do localStorage.
//
// O localStorage guarda o TEXTO da conversa (cota ~5MB). Base64 de imagem
// (~1,5MB cada, 5 por anúncio) estoura na hora — por isso as imagens sumiam
// quando o seller trocava de aba e voltava. O IndexedDB aguenta centenas de MB
// e persiste entre navegações/reloads, então as imagens ficam guardadas.
// Guardamos por alguns dias e podamos o resto, pra não crescer sem limite.

export interface GeradaSalva { rotulo: string; mediaType: string; data: string }

const DB = 'oraculo_neo'
const STORE = 'geradas'
const TTL_MS = 7 * 24 * 60 * 60 * 1000  // 7 dias

function abrir(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null)
      const req = indexedDB.open(DB, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'k' })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch { resolve(null) }
  })
}

const chaveDe = (conversa: string, id: string) => `${conversa}::${id}`

/** Guarda as imagens geradas de uma mensagem (por conversa + id da mensagem). */
export async function salvarGeradas(conversa: string, id: string, geradas: GeradaSalva[]): Promise<void> {
  const db = await abrir(); if (!db) return
  try {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ k: chaveDe(conversa, id), conversa, id, geradas, ts: Date.now() })
  } catch { /* cota/estado — imagem é acessório, não pode quebrar o chat */ }
}

/** Mapa id → imagens desta conversa, podando de passagem o que expirou. */
export async function carregarGeradas(conversa: string): Promise<Record<string, GeradaSalva[]>> {
  const db = await abrir(); if (!db) return {}
  return new Promise((resolve) => {
    const out: Record<string, GeradaSalva[]> = {}
    try {
      const tx = db.transaction(STORE, 'readwrite')
      const req = tx.objectStore(STORE).openCursor()
      const agora = Date.now()
      req.onsuccess = () => {
        const cur = req.result
        if (!cur) return resolve(out)
        const v = cur.value as { conversa: string; id: string; geradas: GeradaSalva[]; ts: number }
        if (agora - (v.ts || 0) > TTL_MS) cur.delete()           // expirou: poda
        else if (v.conversa === conversa) out[v.id] = v.geradas
        cur.continue()
      }
      req.onerror = () => resolve(out)
    } catch { resolve(out) }
  })
}

/** Apaga as imagens de uma conversa (chamado no "Nova conversa"). */
export async function limparGeradas(conversa: string): Promise<void> {
  const db = await abrir(); if (!db) return
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).openCursor()
    req.onsuccess = () => {
      const cur = req.result
      if (!cur) return
      if ((cur.value as { conversa: string }).conversa === conversa) cur.delete()
      cur.continue()
    }
  } catch { /* silencioso */ }
}
