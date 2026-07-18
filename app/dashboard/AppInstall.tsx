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

// Tutorial VISUAL do iPhone — desenha as telas do Safari (barra inferior, share
// sheet e confirmação) com destaque dourado em exatamente onde tocar. Nasceu do
// teste real: o usuário se perdia nos menus novos do iOS ("⋯"/"Menu da Página"),
// onde a opção NÃO fica.
function IosSteps() {
  const box: React.CSSProperties = { background: '#15151F', border: '1px solid rgba(100,116,139,0.25)', borderRadius: 10, padding: '10px 10px 8px', marginTop: 10 }
  const cap: React.CSSProperties = { fontSize: 12, color: '#CBD5E1', lineHeight: 1.55, margin: '8px 2px 0' }
  const g = GOLD, dim = '#5A5F6E'
  return (
    <>
      {/* Passo 1 — barra do Safari novo (endereço embaixo) com o ⋯ destacado */}
      <div style={box}>
        <svg viewBox="0 0 300 58" width="100%" role="img" aria-label="Barra inferior do Safari com o botão de três pontinhos destacado à direita">
          <circle cx="26" cy="29" r="17" fill="#23232F"/>
          <path d="M30 21 l-8 8 8 8" stroke="#3E7BFA" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="52" y="11" width="184" height="36" rx="18" fill="#23232F"/>
          <text x="68" y="34" fill="#B8BFCE" fontSize="12" fontFamily="Inter,-apple-system,sans-serif">app.oraculojf.com.br</text>
          <path d="M222 23 a7 7 0 1 1 -3 12 M222 23 v-5 M222 23 h5" stroke={dim} strokeWidth="1.7" fill="none" strokeLinecap="round"/>
          <circle cx="272" cy="29" r="18" fill="rgba(240,180,41,0.13)" stroke={g} strokeWidth="2.2"/>
          <circle cx="264" cy="29" r="2.2" fill={g}/><circle cx="272" cy="29" r="2.2" fill={g}/><circle cx="280" cy="29" r="2.2" fill={g}/>
        </svg>
        <p style={cap}><strong style={{ color: g }}>Passo 1:</strong> toca nos <strong>três pontinhos ⋯</strong> no canto de baixo do Safari <span style={{ color: '#94A3B8' }}>(se a tua barra mostrar direto o botão □↑, toca nele e pula pro passo 3)</span></p>
      </div>

      {/* Passo 2 — menu com Compartilhar no topo */}
      <div style={box}>
        <svg viewBox="0 0 300 104" width="100%" role="img" aria-label="Menu do Safari com a opção Compartilhar destacada">
          <rect width="300" height="104" rx="12" fill="#232330"/>
          <rect x="5" y="7" width="290" height="33" rx="9" fill="rgba(240,180,41,0.10)" stroke={g} strokeWidth="1.8"/>
          <text x="16" y="29" fill="#FFFFFF" fontSize="13" fontWeight="700" fontFamily="Inter,-apple-system,sans-serif">Compartilhar</text>
          <rect x="264" y="15" width="15" height="12" rx="2.5" stroke={g} strokeWidth="1.8" fill="none"/>
          <path d="M271.5 20 v-11 M267 13 l4.5 -4.5 4.5 4.5" stroke={g} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="48" x2="288" y2="48" stroke="#34344A" strokeWidth="1"/>
          <text x="16" y="68" fill="#8B93A5" fontSize="12.5" fontFamily="Inter,-apple-system,sans-serif">Adicionar a Favoritos</text>
          <path d="M276 57 v13 l-5 -3.6 -5 3.6 v-13 Z" stroke="#8B93A5" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
          <line x1="12" y1="78" x2="288" y2="78" stroke="#34344A" strokeWidth="1"/>
          <text x="16" y="96" fill="#6B7386" fontSize="12.5" fontFamily="Inter,-apple-system,sans-serif">Nova Aba</text>
        </svg>
        <p style={cap}><strong style={{ color: g }}>Passo 2:</strong> toca em <strong>"Compartilhar"</strong> (a primeira opção)</p>
      </div>

      {/* Passo 3 — share sheet: rolar pra baixo até a opção */}
      <div style={box}>
        <svg viewBox="0 0 300 130" width="100%" role="img" aria-label="Lista do compartilhar com a opção Adicionar à Tela de Início destacada">
          <rect width="300" height="130" rx="12" fill="#232330"/>
          <text x="16" y="24" fill="#8B93A5" fontSize="12.5" fontFamily="Inter,-apple-system,sans-serif">Buscar na Página</text>
          <path d="M270 12 a6 6 0 1 0 4 10 l5 5" stroke="#8B93A5" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <line x1="12" y1="36" x2="288" y2="36" stroke="#34344A" strokeWidth="1"/>
          <rect x="5" y="42" width="290" height="34" rx="9" fill="rgba(240,180,41,0.10)" stroke={g} strokeWidth="1.8"/>
          <text x="16" y="64" fill="#FFFFFF" fontSize="13" fontWeight="700" fontFamily="Inter,-apple-system,sans-serif">Adicionar à Tela de Início</text>
          <rect x="264" y="50" width="18" height="18" rx="4.5" stroke={g} strokeWidth="1.8" fill="none"/>
          <path d="M273 54.5 v9 M268.5 59 h9" stroke={g} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="12" y1="84" x2="288" y2="84" stroke="#34344A" strokeWidth="1"/>
          <text x="16" y="103" fill="#6B7386" fontSize="12.5" fontFamily="Inter,-apple-system,sans-serif">Marcação</text>
          <text x="150" y="122" fill="#8B93A5" fontSize="10.5" textAnchor="middle" fontFamily="Inter,-apple-system,sans-serif">↓ desliza a lista pra baixo até aparecer ↓</text>
        </svg>
        <p style={cap}><strong style={{ color: g }}>Passo 3:</strong> vai abrir a tela de compartilhar (com teus contatos e apps) — <strong>desliza a lista pra baixo</strong> (ou toca em <strong>"Ver Mais"</strong>) até achar e toca em <strong>"Adicionar à Tela de Início"</strong></p>
      </div>

      {/* Passo 4 — confirmação */}
      <div style={box}>
        <svg viewBox="0 0 300 46" width="100%" role="img" aria-label="Confirmação com o botão Adicionar destacado">
          <rect width="300" height="46" rx="12" fill="#232330"/>
          <text x="14" y="28" fill="#3E7BFA" fontSize="12.5" fontFamily="Inter,-apple-system,sans-serif">Cancelar</text>
          <text x="150" y="28" fill="#FFFFFF" fontSize="12" fontWeight="600" textAnchor="middle" fontFamily="Inter,-apple-system,sans-serif">Tela de Início</text>
          <rect x="222" y="8" width="66" height="30" rx="9" fill={g}/>
          <text x="255" y="28" fill="#111111" fontSize="12.5" fontWeight="800" textAnchor="middle" fontFamily="Inter,-apple-system,sans-serif">Adicionar</text>
        </svg>
        <p style={cap}><strong style={{ color: g }}>Passo 4:</strong> toca em <strong>"Adicionar"</strong> — o olho dourado 👁️ aparece na tua tela inicial</p>
      </div>

      <p style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.6, margin: '10px 2px 0' }}>
        Depois, <strong style={{ color: '#CBD5E1' }}>abre o ORÁCULO pelo ícone novo</strong> 👁️ e volta neste guia pra ativar as notificações de venda (passo 2 abaixo).
      </p>
    </>
  )
}

// Tutorial VISUAL do Android (Chrome) — pro caso do prompt nativo não disparar
// (ou de alguém no iPhone/desktop querer ver como é no Android).
function AndroidSteps({ installEvt, onInstall }: { installEvt: any; onInstall: () => void }) {
  const box: React.CSSProperties = { background: '#15151F', border: '1px solid rgba(100,116,139,0.25)', borderRadius: 10, padding: '10px 10px 8px', marginTop: 10 }
  const cap: React.CSSProperties = { fontSize: 12, color: '#CBD5E1', lineHeight: 1.55, margin: '8px 2px 0' }
  const g = GOLD, dim = '#5A5F6E'
  if (installEvt) {
    return (
      <>
        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>No Android é 1 toque:</p>
        <button onClick={onInstall} style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#F0B429,#FFD700,#C8960C)', color: '#02020A', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', marginTop: 10 }}>📲 Instalar o ORÁCULO agora</button>
      </>
    )
  }
  return (
    <>
      <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>No <strong style={{ color: '#CBD5E1' }}>Android (Chrome)</strong>:</p>
      <div style={box}>
        <svg viewBox="0 0 300 52" width="100%" role="img" aria-label="Barra do Chrome com o menu de três pontos destacado">
          <rect x="0" y="6" width="300" height="40" rx="12" fill="#1C1C27"/>
          <rect x="14" y="14" width="222" height="24" rx="12" fill="#2A2A38"/>
          <text x="30" y="30" fill="#8B93A5" fontSize="11" fontFamily="Inter,-apple-system,sans-serif">app.oraculojf.com.br</text>
          <circle cx="270" cy="26" r="16" fill="rgba(240,180,41,0.13)" stroke={g} strokeWidth="2"/>
          <circle cx="270" cy="19.5" r="2" fill={g}/><circle cx="270" cy="26" r="2" fill={g}/><circle cx="270" cy="32.5" r="2" fill={g}/>
        </svg>
        <p style={cap}><strong style={{ color: g }}>Passo 1:</strong> toca no menu <strong>⋮</strong> (três pontinhos, canto superior direito)</p>
      </div>
      <div style={box}>
        <svg viewBox="0 0 300 106" width="100%" role="img" aria-label="Menu do Chrome com Adicionar à tela inicial destacado">
          <rect width="300" height="106" rx="12" fill="#232330"/>
          <text x="16" y="25" fill="#8B93A5" fontSize="12.5" fontFamily="Inter,-apple-system,sans-serif">Compartilhar…</text>
          <line x1="12" y1="36" x2="288" y2="36" stroke="#34344A" strokeWidth="1"/>
          <rect x="5" y="42" width="290" height="32" rx="9" fill="rgba(240,180,41,0.10)" stroke={g} strokeWidth="1.8"/>
          <text x="16" y="63" fill="#FFFFFF" fontSize="13" fontWeight="700" fontFamily="Inter,-apple-system,sans-serif">Adicionar à tela inicial</text>
          <rect x="262" y="49" width="13" height="18" rx="3" stroke={g} strokeWidth="1.7" fill="none"/>
          <path d="M281 54 v8 M277 58 h8" stroke={g} strokeWidth="1.7" strokeLinecap="round"/>
          <line x1="12" y1="82" x2="288" y2="82" stroke="#34344A" strokeWidth="1"/>
          <text x="16" y="99" fill="#6B7386" fontSize="12.5" fontFamily="Inter,-apple-system,sans-serif">Configurações</text>
        </svg>
        <p style={cap}><strong style={{ color: g }}>Passo 2:</strong> toca em <strong>"Adicionar à tela inicial"</strong> → <strong>"Instalar"</strong> — o olho dourado 👁️ aparece na tua tela</p>
      </div>
    </>
  )
}

export default function AppInstall() {
  const [open, setOpen] = useState(false)
  const [banner, setBanner] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  // Plataforma do tutorial: pré-marcada pela detecção (userAgent), mas o usuário
  // pode trocar — detecção falha em iPad modo-desktop, navegadores alternativos,
  // ou quando alguém abre no PC querendo ver como fazer no celular.
  const [plat, setPlat] = useState<'android' | 'ios'>('android')
  const [installEvt, setInstallEvt] = useState<any>(null)
  const [pushOn, setPushOn] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [testState, setTestState] = useState<'idle' | 'sending' | 'sent' | 'fail'>('idle')

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Service worker (push + instalabilidade)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    const alone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    setStandalone(alone)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)
    setPlat(ios ? 'ios' : 'android')
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvt(e) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    // Entrada permanente: o item "App & Avisos" do menu abre este guia. Sem isso,
    // quem dispensou o banner ficava 30 dias sem conseguir chegar no push.
    const openGuide = () => setOpen(true)
    window.addEventListener('ora-open-app', openGuide)
    // Push ativo DE VERDADE = inscrição local NO aparelho + registrada NO SERVIDOR.
    // (Só a local não basta: se a sessão tinha caído na hora do "ativar", o servidor
    // nunca soube — e nenhum push sai. Era o "ativo ✓" que não notificava nada.)
    // SELF-HEAL: existe local? re-registra no servidor agora (upsert idempotente).
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready
        .then(r => r.pushManager.getSubscription())
        .then(async (sub) => {
          if (!sub) { setPushOn(false); return }
          try {
            const heal = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) })
            if (heal.ok) { setPushOn(true); return }
          } catch {}
          // re-registro falhou → confere o que o servidor tem
          try {
            const st = await fetch('/api/push/status').then(x => x.json())
            setPushOn(!!st.subscribed)
          } catch { setPushOn(false) }
        })
        .catch(() => setPushOn(false))
    } else setPushOn(false)
    // banner: só se falta instalar OU falta push, e não foi dispensado
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0)
      if (Date.now() > until) setBanner(true)
    } catch { setBanner(true) }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('ora-open-app', openGuide)
    }
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
      if (r.ok) { setPushOn(true); setMsg('') }
      else if (r.status === 401) setMsg('Sua sessão expirou — faça login de novo e tente ativar.')
      else setMsg('Falha ao registrar. Tente novamente.')
    } catch { setMsg('Não foi possível ativar. Tente novamente.') }
    setBusy(false)
  }

  // Push de teste imediato — prova que a entrega funciona sem esperar uma venda.
  async function sendTest() {
    if (testState === 'sending') return
    setTestState('sending')
    try {
      const r = await fetch('/api/push/test', { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      setTestState(r.ok && d.ok ? 'sent' : 'fail')
    } catch { setTestState('fail') }
    setTimeout(() => setTestState('idle'), 6000)
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
              ) : (
                <>
                  {/* Seletor Android/iPhone — pré-marcado pela detecção, trocável */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, color: '#94A3B8', alignSelf: 'center' }}>Seu celular é:</span>
                    {(['android', 'ios'] as const).map(k => (
                      <button key={k} onClick={() => setPlat(k)}
                        style={{ flex: 1, padding: '8px 6px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                          border: `1px solid ${plat === k ? 'rgba(240,180,41,0.55)' : 'rgba(100,116,139,0.3)'}`,
                          background: plat === k ? 'rgba(240,180,41,0.12)' : 'transparent',
                          color: plat === k ? GOLD : '#94A3B8' }}>
                        {k === 'android' ? '🤖 Android' : '🍎 iPhone'}
                      </button>
                    ))}
                  </div>
                  {plat === 'ios' ? <IosSteps /> : <AndroidSteps installEvt={installEvt} onInstall={install} />}
                </>
              )}
            </div>

            {/* Passo 2 — push */}
            <div style={card}>
              <div style={h}>2️⃣ Ativar o aviso de venda {pushOn && <span style={{ color: '#34D399' }}>— ativo ✓</span>}</div>
              {pushOn ? (
                <>
                  <p style={p}>Prontinho: a cada venda na Amazon, seu celular avisa. 💰</p>
                  <button onClick={sendTest} disabled={testState === 'sending'}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, marginTop: 10,
                      border: '1px solid rgba(240,180,41,0.4)', background: 'transparent',
                      color: testState === 'sent' ? '#34D399' : testState === 'fail' ? '#FB7185' : GOLD }}>
                    {testState === 'sending' ? 'Enviando…' : testState === 'sent' ? '✓ Teste enviado — chegou aí?' : testState === 'fail' ? 'Falhou — reative as notificações' : '🔔 Enviar notificação de teste'}
                  </button>
                </>
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
