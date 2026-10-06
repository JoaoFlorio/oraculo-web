'use client'
// "ESTAMOS DE CARA NOVA" (06/10/2026) — aviso único quando o visual novo do painel foi liberado pra todos.
// Aparece 1x por navegador (localStorage 'oraculo_cara_nova'); page.tsx só renderiza pra quem já era cliente
// antes da troca e não está com o aceite de termos pendente. Fecha no botão, no X, no Esc ou clicando fora.
import { useEffect, useState } from 'react'

const CHAVE = 'oraculo_cara_nova'

const ITENS: { icone: React.ReactNode; titulo: string; texto: string }[] = [
  {
    icone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>,
    titulo: 'Tudo no mesmo lugar',
    texto: 'Suas lojas, seus números, seus salvos e seus créditos continuam exatamente como estavam.',
  },
  {
    icone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 14h4M8 17h7" /></svg>,
    titulo: 'Telas redesenhadas',
    texto: 'Gestão, Ads, Mineração, Calculadora, Agente NEO e as demais ganharam layout novo, mais limpo e mais fácil de ler.',
  },
  {
    icone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
    titulo: 'Claro ou escuro',
    texto: 'Prefere fundo claro? Toque no sol lá em cima. Os dois temas ganharam o visual novo.',
  },
]

export default function CaraNova() {
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    let visto = false
    try { visto = localStorage.getItem(CHAVE) === '1' } catch { /* sem storage: mostra nesta visita */ }
    if (visto) return
    // espera a abertura animada do app instalado (AppSplash) sair da frente
    const id = setTimeout(() => setAberto(true), 1400)
    return () => clearTimeout(id)
  }, [])

  const fechar = () => {
    setAberto(false)
    try { localStorage.setItem(CHAVE, '1') } catch { /* ok */ }
  }

  useEffect(() => {
    if (!aberto) return
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [aberto])

  if (!aberto) return null
  return (
    <div className="cn-fundo" onClick={fechar} role="dialog" aria-modal="true" aria-labelledby="cn-titulo">
      <div className="cn-caixa" onClick={e => e.stopPropagation()}>
        <div className="cn-foto">
          <img src="/teste/fundo-olho.webp" alt="" />
          <button type="button" className="cn-x" onClick={fechar} aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <span className="cn-selo">Atualização do Oráculo</span>
        </div>
        <div className="cn-corpo">
          <h2 id="cn-titulo">Estamos de <span>cara nova</span></h2>
          <p className="cn-sub">Renovamos o visual do painel inteiro, com a mesma cara do nosso site: telas reorganizadas, letras mais legíveis e os números que importam em destaque.</p>
          <ul>
            {ITENS.map(i => (
              <li key={i.titulo}>
                <span className="cn-ic">{i.icone}</span>
                <div><b>{i.titulo}</b><small>{i.texto}</small></div>
              </li>
            ))}
          </ul>
          <button type="button" className="ouro-botao cn-botao" onClick={fechar}>Conhecer o novo painel</button>
          <p className="cn-nota">Achou algo estranho? Chama o suporte no WhatsApp, pelo menu.</p>
        </div>
      </div>
      <style>{`
        .cn-fundo{ position:fixed; inset:0; z-index:2147483100; display:grid; place-items:center; padding:16px; overflow-y:auto;
          background:rgba(3,3,6,.72); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); animation:cnFade .3s ease both; }
        .cn-caixa{ width:100%; max-width:520px; border-radius:24px; overflow:hidden; background:var(--ou-fundo2,#0E0F0E);
          border:1px solid rgba(255,200,61,.28); box-shadow:0 40px 90px -30px rgba(0,0,0,.75), 0 0 0 1px rgba(255,200,61,.06);
          animation:cnSobe .45s cubic-bezier(.2,.8,.2,1) both; font-family:var(--font-ui); }
        .cn-foto{ position:relative; height:180px; background:#05060A; overflow:hidden; }
        .cn-foto img{ width:100%; height:100%; object-fit:cover; object-position:68% 40%; display:block; }
        .cn-foto::after{ content:""; position:absolute; inset:0; background:linear-gradient(180deg,rgba(5,6,10,0) 45%,var(--ou-fundo2,#0E0F0E)); }
        .cn-x{ position:absolute; top:12px; right:12px; z-index:2; width:34px; height:34px; border-radius:50%; display:grid; place-items:center; cursor:pointer;
          background:rgba(5,6,10,.55); border:1px solid rgba(255,255,255,.18); color:#F3EEE2; }
        .cn-x svg{ width:16px; height:16px; }
        .cn-selo{ position:absolute; left:20px; top:16px; z-index:2; font-family:var(--tg-mono),monospace; font-size:10.5px; letter-spacing:.16em; text-transform:uppercase;
          color:#FFE7A3; padding:6px 11px; border-radius:99px; background:rgba(5,6,10,.6); border:1px solid rgba(255,200,61,.35); }
        .cn-corpo{ padding:4px 26px 24px; position:relative; }
        .cn-corpo h2{ margin:0; font-family:var(--tg-display),'Archivo',sans-serif; font-stretch:108%; font-weight:800; font-size:32px; line-height:1.05; letter-spacing:-.03em; color:var(--ou-t1,#F3EEE2); }
        .cn-corpo h2 span{ background:var(--ou-grad-txt); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .cn-sub{ margin:10px 0 18px; font-size:14.5px; line-height:1.6; color:var(--ou-t2,#B9B3A6); }
        .cn-corpo ul{ list-style:none; margin:0 0 20px; padding:0; display:grid; gap:12px; }
        .cn-corpo li{ display:flex; gap:12px; align-items:flex-start; }
        .cn-ic{ flex:none; width:36px; height:36px; border-radius:11px; display:grid; place-items:center; color:var(--ou-ouro,#FFC83D);
          background:color-mix(in srgb, var(--ou-ouro,#FFC83D) 12%, transparent); border:1px solid color-mix(in srgb, var(--ou-ouro,#FFC83D) 28%, transparent); }
        .cn-ic svg{ width:19px; height:19px; }
        .cn-corpo li b{ display:block; font-size:14px; color:var(--ou-t1,#F3EEE2); margin-bottom:2px; }
        .cn-corpo li small{ display:block; font-size:13px; line-height:1.5; color:var(--ou-t3,#7E796E); }
        .cn-botao{ width:100%; justify-content:center; }
        .cn-nota{ margin:12px 0 0; text-align:center; font-size:12px; color:var(--ou-t3,#7E796E); }
        @keyframes cnFade{ from{ opacity:0 } to{ opacity:1 } }
        @keyframes cnSobe{ from{ opacity:0; transform:translateY(18px) scale(.98) } to{ opacity:1; transform:none } }
        @media (max-width:520px){ .cn-foto{ height:140px } .cn-corpo{ padding:2px 18px 20px } .cn-corpo h2{ font-size:27px } .cn-sub{ font-size:13.5px } }
        @media (prefers-reduced-motion:reduce){ .cn-fundo, .cn-caixa{ animation:none } }
      `}</style>
    </div>
  )
}
