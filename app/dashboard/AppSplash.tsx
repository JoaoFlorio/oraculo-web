'use client'
import { useEffect, useState } from 'react'

// Abertura do app (splash animado) — o olho dourado surge, a íris "acende" e o
// nome se revela; depois some pro painel. Aparece SÓ no app instalado
// (display-mode: standalone / navigator.standalone) e UMA vez por sessão: quem
// usa no navegador não leva splash a cada visita, e navegar dentro do app não
// repete. O gate é por CSS (@media display-mode) pra não piscar em quem não é
// standalone — o JS só cuida do fade-out.
// 1,3s de exibição + 0,42s de fade ≈ 1,7s no total. A revelação completa
// (marca → nome → subtítulo) termina em ~1,34s, então dá pra ver tudo sem
// virar espera chata em quem abre o app várias vezes por dia.
const DUR = 1300
const SESSION_KEY = 'ora_splash_seen'

export default function AppSplash() {
  const [phase, setPhase] = useState<'on' | 'out' | 'done'>('on')

  useEffect(() => {
    // Já rodou nesta sessão? (navegação interna / reabrir aba) → não repete.
    let seen = false
    try { seen = sessionStorage.getItem(SESSION_KEY) === '1' } catch {}
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true
    if (seen || !standalone) { setPhase('done'); return }
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}

    const t1 = setTimeout(() => setPhase('out'), DUR)
    const t2 = setTimeout(() => setPhase('done'), DUR + 420)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (phase === 'done') return null

  return (
    <div className="ora-splash" data-out={phase === 'out' ? '1' : undefined} aria-hidden>
      <style>{`
        .ora-splash{display:none}
        /* Só no app instalado (Android/desktop PWA e iOS standalone via JS abaixo) */
        @media (display-mode:standalone){ .ora-splash{display:flex} }
        .ora-splash{
          position:fixed;inset:0;z-index:99999;background:#0A0A0F;
          align-items:center;justify-content:center;flex-direction:column;gap:22px;
          animation:oraSplashIn .35s ease-out both;
        }
        .ora-splash[data-out]{animation:oraSplashOut .4s ease-in forwards}
        .ora-splash-mark{
          position:relative;width:104px;height:104px;border-radius:26px;
          display:flex;align-items:center;justify-content:center;
          background:radial-gradient(circle at 50% 40%, rgba(240,180,41,0.16), rgba(240,180,41,0.04));
          border:1px solid rgba(240,180,41,0.28);
          animation:oraMarkIn .8s cubic-bezier(.2,.9,.3,1.2) both;
        }
        /* halo que pulsa saindo do olho */
        .ora-splash-mark::after{
          content:'';position:absolute;inset:-14px;border-radius:34px;
          border:1px solid rgba(240,180,41,0.35);
          animation:oraHalo 1.5s ease-out infinite;
        }
        .ora-splash-mark img{width:66px;height:66px;border-radius:16px;
          animation:oraEye 1.6s ease-in-out infinite}
        .ora-splash-word{
          font-family:Inter,-apple-system,sans-serif;font-size:15px;font-weight:800;
          color:#F0B429;letter-spacing:.62em;padding-left:.62em;
          animation:oraWord .9s .18s ease-out both;
        }
        .ora-splash-sub{
          font-family:Inter,-apple-system,sans-serif;font-size:8.5px;font-weight:600;
          color:#5A6072;letter-spacing:.3em;margin-top:-14px;text-transform:uppercase;
          animation:oraWord 1s .34s ease-out both;
        }
        @keyframes oraSplashIn{from{opacity:0}to{opacity:1}}
        @keyframes oraSplashOut{to{opacity:0;transform:scale(1.04)}}
        @keyframes oraMarkIn{0%{opacity:0;transform:scale(.72)}100%{opacity:1;transform:scale(1)}}
        @keyframes oraEye{0%,100%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.05);filter:brightness(1.22)}}
        @keyframes oraHalo{0%{transform:scale(.9);opacity:.55}100%{transform:scale(1.28);opacity:0}}
        @keyframes oraWord{from{opacity:0;transform:translateY(7px);letter-spacing:.95em}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){
          .ora-splash-mark,.ora-splash-mark::after,.ora-splash-mark img,.ora-splash-word,.ora-splash-sub{animation:none!important}
        }
      `}</style>
      <div className="ora-splash-mark"><img src="/icon-192.png" alt="" /></div>
      <div className="ora-splash-word">ORÁCULO</div>
      <div className="ora-splash-sub">Amazon Intelligence</div>
    </div>
  )
}
