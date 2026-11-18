'use client'
// 18/11/2026 — aviso de venda NATIVO no app de iPhone (App Store).
// O app (Capacitor, ~/Documents/oraculo-app) abre este mesmo site e injeta `window.Capacitor` com o plugin
// PushNotifications. Dentro dele o Web Push não existe (WKWebView), então o "Ativar notificações" pede a permissão do
// iOS, pega o token do aparelho e manda pra /api/push/nativo (backend: lib/apns.ts). No navegador nada disso roda.

type Ouvinte = { remove: () => Promise<void> | void }
type PluginPush = {
  checkPermissions: () => Promise<{ receive: string }>
  requestPermissions: () => Promise<{ receive: string }>
  register: () => Promise<void>
  addListener: (ev: string, cb: (x: any) => void) => Promise<Ouvinte> | Ouvinte
}

const CHAVE_TOKEN = 'ora_apns_token'

function plugin(): PluginPush | null {
  if (typeof window === 'undefined') return null
  const cap = (window as any).Capacitor
  if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== 'ios') return null
  return (cap.Plugins?.PushNotifications as PluginPush) || null
}

/** Está dentro do app de iPhone com o plugin de notificação disponível. */
export const temPushNativo = () => !!plugin()

/** Pede o token ao iOS e registra no servidor. Resolve com o token (ou null se falhar). */
async function registrar(p: PluginPush): Promise<string | null> {
  const token = await new Promise<string | null>((resolve) => {
    let fim = false
    const ouvintes: Ouvinte[] = []
    const acabar = (t: string | null) => {
      if (fim) return
      fim = true
      ouvintes.forEach(o => { try { o.remove() } catch {} })
      resolve(t)
    }
    Promise.all([
      p.addListener('registration', (x: any) => acabar(String(x?.value || '') || null)),
      p.addListener('registrationError', () => acabar(null)),
    ]).then(os => { ouvintes.push(...os); return p.register() }).catch(() => acabar(null))
    setTimeout(() => acabar(null), 15_000)
  })
  if (!token) return null
  const r = await fetch('/api/push/nativo', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, plataforma: 'ios' }),
  }).catch(() => null)
  if (!r?.ok) return null
  try { localStorage.setItem(CHAVE_TOKEN, token) } catch {}
  return token
}

/** Botão "Ativar notificações" no app: pede a permissão do iOS e registra. */
export async function ativarPushNativo(): Promise<'ok' | 'negado' | 'falhou'> {
  const p = plugin()
  if (!p) return 'falhou'
  try {
    let perm = (await p.checkPermissions()).receive
    if (perm !== 'granted') perm = (await p.requestPermissions()).receive
    if (perm !== 'granted') return 'negado'
    return (await registrar(p)) ? 'ok' : 'falhou'
  } catch { return 'falhou' }
}

/** Ao abrir o painel no app: se a permissão já foi dada, re-registra (o token pode mudar e o login pode ser de outra
 *  conta) e liga o toque na notificação → abre a tela do aviso. Devolve se o aviso está ativo. */
let tocarLigado = false
export async function sincronizarPushNativo(): Promise<boolean> {
  const p = plugin()
  if (!p) return false
  if (!tocarLigado) {
    tocarLigado = true
    try {
      await p.addListener('pushNotificationActionPerformed', (x: any) => {
        const url = String(x?.notification?.data?.url || '')
        if (url.startsWith('/') && !url.startsWith('//')) window.location.href = url
      })
    } catch {}
  }
  try {
    if ((await p.checkPermissions()).receive !== 'granted') return false
    return !!(await registrar(p))
  } catch { return false }
}

/** Sair da conta: tira ESTE iPhone do aviso da conta (mesma regra do Web Push em sairDaConta). */
export async function removerPushNativo(): Promise<void> {
  let token = ''
  try { token = localStorage.getItem(CHAVE_TOKEN) || '' } catch {}
  if (!token) return
  await fetch('/api/push/unsubscribe', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: `apns:${token.toLowerCase()}` }), signal: AbortSignal.timeout(4000),
  }).catch(() => {})
  try { localStorage.removeItem(CHAVE_TOKEN) } catch {}
}
