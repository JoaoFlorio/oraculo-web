/* 28/10 (varredura): sair da conta também tira ESTE aparelho do push da conta. Antes, num aparelho compartilhado (ou
 * quando o João entrava na demo pelo celular), o aparelho seguia recebendo "R$ X na Amazon" da conta anterior até outro
 * login abrir o painel. Remove a inscrição no servidor ANTES do logout (a rota precisa da sessão); o próximo login
 * reinscreve sozinho (AppInstall). Nada aqui pode impedir o logout. */
export async function sairDaConta(): Promise<void> {
  try {
    const reg = typeof navigator !== 'undefined' ? await navigator.serviceWorker?.getRegistration() : undefined
    const sub = await reg?.pushManager?.getSubscription()
    if (sub?.endpoint) {
      await fetch('/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }), signal: AbortSignal.timeout(4000) }).catch(() => {})
    }
  } catch { /* segue pro logout */ }
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
}
