'use client'
import { useEffect, useState } from 'react'

// PWA + push de venda — a parte que o CLIENTE vê:
// • registra o service worker (public/sw.js);
// • banner no MOBILE (≤920px, via CSS) convidando a instalar o app e ativar o
//   aviso de venda; some se já instalou E ativou, ou se dispensar (30 dias);
// • modal-guia: Android instala com 1 toque (beforeinstallprompt); iPhone ganha o
//   passo a passo (Compartilhar → Adicionar à Tela de Início); botão de ativar push.
const GOLD = '#F0B429'
const DISMISS_KEY = 'ora_app_banner_until'

function b64ToUint8(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export default function AppInstall() {
  const [open, setOpen] = useState(false)
  const [banner, setBanner] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [installEvt, setInstallEvt] = useState<any>(null)
  const [pushOn, setPushOn] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Service worker (push + instalabilidade)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    const alone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    setStandalone(alone)
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvt(e) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    // push já ativo NESTE dispositivo?
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(r => r.pushManager.getSubscription()).then(s => setPushOn(!!s)).catch(() => setPushOn(false))
    } else setPushOn(false)
    // banner: só se falta instalar OU falta push, e não foi dispensado
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0)
      if (Date.now() > until) setBanner(true)
    } catch { setBanner(true) }
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const done = standalone && pushOn === true
  useEffect(() => { if (done) setBanner(false) }, [done])

  function dismiss() {
    setBanner(false)
    try { localStorage.setItem(DISMISS_KEY, String(Date.now() + 30 * 86400000)) } catch {}
  }

  async function install() {
    if (!installEvt) return
    installEvt.prompt()
    const { outcome } = await installEvt.userChoice.catch(() => ({ outcome: '' }))
    if (outcome === 'accepted') { setInstallEvt(null); setStandalone(true) }
  }

  async function enablePush() {
    if (busy) return
    setBusy(true); setMsg('')
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setMsg(isIOS ? 'No iPhone, primeiro instale o app (passo acima) e ative por dentro dele.' : 'Este navegador não suporta notificações.')
        setBusy(false); return
      }
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setMsg('Permissão de notificação negada — libere nas configurações do navegador.'); setBusy(false); return }
      const reg = await navigator.serviceWorker.ready
      const { key } = await fetch('/api/push/key').then(r => r.json())
      if (!key) { setMsg('Notificações indisponíveis no momento. Tente mais tarde.'); setBusy(false); return }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(key) as BufferSource })
      const r = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) })
      if (r.ok) { setPushOn(true); setMsg('') } else setMsg('Falha ao registrar. Tente novamente.')
    } catch { setMsg('Não foi possível ativar. Tente novamente.') }
    setBusy(false)
  }

  const card: React.CSSProperties = { background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.22)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }
  const h: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 6 }
  const p: React.CSSProperties = { fontSize: 12, color: '#94A3B8', lineHeight: 1.6, margin: 0 }
  const btn: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#F0B429,#FFD700,#C8960C)', color: '#02020A', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', marginTop: 10 }

  return (
    <>
      <style>{`.ora-appbar{display:none}@media (max-width:920px){.ora-appbar{display:flex}}`}</style>

      {/* Banner mobile */}
      {banner && !done && (
        <div className="ora-appbar" style={{ position: 'fixed', left: 10, right: 10, bottom: 10, zIndex: 1180, background: '#12121D', border: '1px solid rgba(240,180,41,0.35)', borderRadius: 14, padding: '11px 12px', alignItems: 'center', gap: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.55)' }}>
          <img src="/icon-192.png" alt="" width={38} height={38} style={{ borderRadius: 9, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F1F5F9' }}>{standalone ? 'Ative o aviso de venda 💰' : 'Instale o app do ORÁCULO'}</div>
            <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{standalone ? 'Receba uma notificação a cada venda' : 'Ícone na tela inicial + aviso de cada venda'}</div>
          </div>
          <button onClick={() => setOpen(true)} style={{ background: 'linear-gradient(135deg,#F0B429,#FFD700)', color: '#02020A', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Ver como</button>
          <button onClick={dismiss} aria-label="Dispensar" style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 16, cursor: 'pointer', padding: 4, flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* Modal-guia */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(4,4,10,0.9)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 14px' }} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '100%', background: '#0E0E18', border: '1px solid rgba(240,180,41,0.32)', borderRadius: 16, padding: '24px 22px', fontFamily: "'Inter',-apple-system,sans-serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <img src="/icon-192.png" alt="" width={44} height={44} style={{ borderRadius: 11 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#F1F5F9' }}>ORÁCULO no seu celular</div>
                <div style={{ fontSize: 11.5, color: '#94A3B8' }}>App na tela inicial + aviso de cada venda</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: '1px solid rgba(100,116,139,0.3)', color: '#94A3B8', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>✕</button>
            </div>

            {/* Passo 1 — instalar */}
            <div style={card}>
              <div style={h}>1️⃣ Instalar o app {standalone && <span style={{ color: '#34D399' }}>— instalado ✓</span>}</div>
              {standalone ? (
                <p style={p}>Você já está usando o app instalado. 👏</p>
              ) : isIOS ? (
                <>
                  <p style={p}>No <strong style={{ color: '#CBD5E1' }}>iPhone (Safari)</strong>:</p>
                  <ol style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: '#94A3B8', lineHeight: 1.9 }}>
                    <li>Toque no botão <strong style={{ color: '#CBD5E1' }}>Compartilhar</strong> <span style={{ color: GOLD }}>(quadrado com seta ↑)</span> na barra do Safari</li>
                    <li>Deslize e toque em <strong style={{ color: '#CBD5E1' }}>"Adicionar à Tela de Início"</strong></li>
                    <li>Toque em <strong style={{ color: '#CBD5E1' }}>"Adicionar"</strong> — o olho dourado aparece na sua tela 👁️</li>
                  </ol>
                </>
              ) : installEvt ? (
                <>
                  <p style={p}>No Android é 1 toque:</p>
                  <button onClick={install} style={btn}>📲 Instalar o ORÁCULO agora</button>
                </>
              ) : (
                <p style={p}>No <strong style={{ color: '#CBD5E1' }}>Android (Chrome)</strong>: toque no menu <strong style={{ color: '#CBD5E1' }}>⋮</strong> (canto superior) → <strong style={{ color: '#CBD5E1' }}>"Adicionar à tela inicial"</strong> → <strong style={{ color: '#CBD5E1' }}>"Instalar"</strong>.</p>
              )}
            </div>

            {/* Passo 2 — push */}
            <div style={card}>
              <div style={h}>2️⃣ Ativar o aviso de venda {pushOn && <span style={{ color: '#34D399' }}>— ativo ✓</span>}</div>
              {pushOn ? (
                <p style={p}>Prontinho: a cada venda na Amazon, seu celular avisa. 💰</p>
              ) : (
                <>
                  <p style={p}>Receba <strong style={{ color: '#CBD5E1' }}>"💰 Nova venda!"</strong> com o valor do pedido, na hora, mesmo com o app fechado.{isIOS ? ' No iPhone, ative DEPOIS de instalar (abra pelo ícone da tela inicial).' : ''}</p>
                  <button onClick={enablePush} disabled={busy} style={{ ...btn, opacity: busy ? 0.7 : 1 }}>{busy ? 'Ativando…' : '🔔 Ativar notificações de venda'}</button>
                  {msg && <div style={{ fontSize: 11.5, color: '#FB7185', marginTop: 8 }}>{msg}</div>}
                </>
              )}
            </div>

            <p style={{ fontSize: 10.5, color: '#475569', textAlign: 'center', margin: '4px 0 0' }}>Sem cobrança extra — é o mesmo painel, em formato de app.</p>
          </div>
        </div>
      )}
    </>
  )
}
