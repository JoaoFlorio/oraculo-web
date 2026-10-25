'use client'
// NOVIDADES (27/09/2026) — aviso que abre UMA vez por CONTA quando o cliente entra no app (o servidor
// guarda quem já respondeu em app_avisos; o localStorage só evita a consulta no mesmo aparelho).
// Registra a ação: 'entendi' | 'fechou' | 'ir:<aba>'. Aviso novo no futuro: troque VERSAO e o conteúdo.
// 25/10: visual novo (obsidiana + ouro, mesmo padrão do "Estamos de cara nova" — CaraNova.tsx) e a novidade da aba
// Fornecedores. O topo é uma faixa com os LOGOS REAIS dos fornecedores passando (o próprio produto mostrando a novidade).
import { useEffect, useState } from 'react'

const VERSAO = 'novidades-2026-10-fornecedores'   // só [a-z0-9-] (validado no backend). 25/10: aba Fornecedores
const CHAVE = `oraculo:${VERSAO}`

const ic = (d: React.ReactNode) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>

const ITENS: Array<{ icone: React.ReactNode; titulo: string; texto: string; ir?: { nav: string; label: string } }> = [
  {
    icone: ic(<><path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" /><path d="M3 10l2-5h14l2 5c0 1.4-1.1 2.5-2.5 2.5S16 11.4 16 10c0 1.4-1.1 2.5-2.5 2.5S11 11.4 11 10c0 1.4-1.1 2.5-2.5 2.5S6 11.4 6 10c0 1.4-1.1 2.5-2.5 2.5" /><path d="M10 20v-4h4v4" /></>),
    titulo: 'Fornecedores nacionais dentro do Oráculo',
    texto: 'Quase 150 importadoras e distribuidoras da lista do João Florio numa aba só: região, categorias, se vende para CPF e as dicas do João. "Pedir catálogo" abre o WhatsApp do fornecedor com a mensagem pronta, e em boa parte deles você já vê os produtos do site (mais de 17 mil). Liberada para assinantes.',
    ir: { nav: 'fornecedores', label: 'Ver os fornecedores' },
  },
  {
    icone: ic(<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>),
    titulo: 'Pergunte ao NEO: "quem vende…?"',
    texto: 'Achou um produto bom na mineração? O NEO procura nos fornecedores e nos produtos dos sites deles e já te passa o WhatsApp com a mensagem pronta.',
    ir: { nav: 'agente', label: 'Falar com o NEO' },
  },
  {
    icone: ic(<><path d="M6 7h12l-1 13H7z" /><path d="M9 7a3 3 0 0 1 6 0" /></>),
    titulo: 'Modo Black Friday no NEO Ads',
    texto: 'A Amazon mediu +59% de vendas para quem anunciou na Black Friday passada. Ligado, o NEO prepara só as campanhas que já vendem: de 05/11 a 18/11 orçamento +30%; de 19/11 a 30/11 orçamento em dobro e mais topo de pesquisa. Em 01/12 tudo volta exatamente como estava.',
    ir: { nav: 'ads', label: 'Abrir o NEO Ads' },
  },
  {
    icone: ic(<><path d="M4 6h16M4 12h10M4 18h7" /><path d="M17 15l2.5 2.5L22 15" /></>),
    titulo: 'Menu mais limpo',
    texto: 'Os grupos do menu agora abrem e fecham na setinha, para caber tudo numa tela só. Fornecedores fica em Ferramentas.',
  },
]

export default function Novidades({ onIr }: { onIr: (nav: string) => void }) {
  const [aberto, setAberto] = useState(false)
  const [logos, setLogos] = useState<number[]>([])
  useEffect(() => {
    let vivo = true
    const t = setTimeout(async () => {
      try { if (localStorage.getItem(CHAVE)) return } catch { /* sem storage: pergunta ao servidor */ }
      try {
        const r = await fetch(`/api/avisos/${VERSAO}`, { cache: 'no-store' })
        const d = r.ok ? await r.json() : null
        if (!vivo) return
        if (d?.mostrar) {
          // logos reais pra faixa do topo (assinante recebe todos; teste/demo, a amostra) — falhou, a faixa some
          fetch('/api/fornecedores', { cache: 'no-store' }).then(x => x.json()).then(j => {
            if (vivo && Array.isArray(j?.fornecedores)) setLogos(j.fornecedores.filter((f: any) => f.temLogo && !f.logoClara).map((f: any) => f.id).slice(0, 14))
          }).catch(() => {})
          setAberto(true)
          void fetch(`/api/avisos/${VERSAO}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }).catch(() => {})
        } else if (d) { try { localStorage.setItem(CHAVE, 'servidor') } catch { /* ok */ } }
      } catch { /* servidor fora: não mostra agora, tenta no próximo acesso */ }
    }, 900)
    return () => { vivo = false; clearTimeout(t) }
  }, [])
  const responder = (acao: string) => {
    try { localStorage.setItem(CHAVE, new Date().toISOString()) } catch { /* ok */ }
    void fetch(`/api/avisos/${VERSAO}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ acao }), keepalive: true }).catch(() => {})
    setAberto(false)
  }
  const fechar = () => responder('fechou')
  const ir = (nav: string) => { responder(`ir:${nav}`); onIr(nav) }
  useEffect(() => {
    if (!aberto) return
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [aberto])   // eslint-disable-line react-hooks/exhaustive-deps
  if (!aberto) return null

  // faixa: a lista duplicada rola em loop contínuo (translateX -50%)
  const faixa = logos.length >= 5 ? [...logos, ...logos] : []
  return (
    <div className="nv-fundo" onClick={fechar} role="dialog" aria-modal="true" aria-labelledby="nv-titulo">
      <div className="nv-caixa" onClick={e => e.stopPropagation()}>
        <div className={`nv-topo ${faixa.length ? '' : 'nv-topo-sem'}`}>
          {faixa.length > 0 && (
            <div className="nv-faixa" aria-hidden>
              <div className="nv-trilho">
                {faixa.map((id, i) => <span key={i} className="nv-logo"><img src={`/api/fornecedores/logo/${id}`} alt="" loading="lazy" /></span>)}
              </div>
            </div>
          )}
          <button type="button" className="nv-x" onClick={fechar} aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <span className="nv-selo">Novidades · outubro de 2026</span>
        </div>
        <div className="nv-corpo">
          <h2 id="nv-titulo">Seus fornecedores agora estão <span>no Oráculo</span></h2>
          <p className="nv-sub">Do produto minerado ao fornecedor no WhatsApp em poucos cliques, e o NEO Ads pronto para a Black Friday.</p>
          <ul>
            {ITENS.map(it => (
              <li key={it.titulo}>
                <span className="nv-ic">{it.icone}</span>
                <div>
                  <b>{it.titulo}</b>
                  <small>{it.texto}</small>
                  {it.ir && <button type="button" className="nv-link" onClick={() => ir(it.ir!.nav)}>{it.ir.label} →</button>}
                </div>
              </li>
            ))}
          </ul>
          <div className="nv-acoes">
            <button type="button" className="ouro-botao nv-botao" onClick={() => ir('fornecedores')}>Ver os fornecedores</button>
            <button type="button" className="nv-depois" onClick={() => responder('entendi')}>Agora não</button>
          </div>
        </div>
      </div>
      <style>{`
        .nv-fundo{ position:fixed; inset:0; z-index:2147483000; display:grid; place-items:center; padding:16px; overflow-y:auto;
          background:rgba(3,3,6,.72); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); animation:nvFade .3s ease both; }
        .nv-caixa{ width:100%; max-width:560px; border-radius:24px; overflow:hidden; background:var(--ou-fundo2,#0E0F0E);
          border:1px solid rgba(255,200,61,.28); box-shadow:0 40px 90px -30px rgba(0,0,0,.75), 0 0 0 1px rgba(255,200,61,.06);
          animation:nvSobe .45s cubic-bezier(.2,.8,.2,1) both; font-family:var(--font-ui); margin:auto; }
        .nv-topo{ position:relative; height:150px; overflow:hidden;
          background:radial-gradient(90% 140% at 50% 0%, rgba(255,200,61,.20), transparent 65%), linear-gradient(180deg,#17150f,#0b0c0f); }
        .nv-topo-sem{ height:64px; }
        .nv-topo::after{ content:""; position:absolute; inset:0; pointer-events:none;
          background:linear-gradient(90deg,#0b0c0f 0%,transparent 14%,transparent 86%,#0b0c0f 100%), linear-gradient(180deg,transparent 55%,var(--ou-fundo2,#0E0F0E)); }
        .nv-faixa{ position:absolute; left:0; right:0; top:50px; overflow:hidden; }
        .nv-trilho{ display:flex; gap:12px; width:max-content; animation:nvRola 38s linear infinite; }
        .nv-logo{ flex:none; width:96px; height:64px; border-radius:14px; background:#fff; display:grid; place-items:center; padding:8px 10px;
          box-shadow:0 10px 24px -14px rgba(0,0,0,.8), 0 0 0 1px rgba(255,200,61,.18); }
        .nv-logo img{ max-width:100%; max-height:100%; object-fit:contain; }
        .nv-x{ position:absolute; top:12px; right:12px; z-index:2; width:34px; height:34px; border-radius:50%; display:grid; place-items:center; cursor:pointer;
          background:rgba(5,6,10,.55); border:1px solid rgba(255,255,255,.18); color:#F3EEE2; }
        .nv-x svg{ width:16px; height:16px; }
        .nv-selo{ position:absolute; left:20px; top:16px; z-index:2; font-family:var(--tg-mono),monospace; font-size:10.5px; letter-spacing:.16em; text-transform:uppercase;
          color:#FFE7A3; padding:6px 11px; border-radius:99px; background:rgba(5,6,10,.6); border:1px solid rgba(255,200,61,.35); }
        .nv-corpo{ padding:6px 26px 24px; position:relative; }
        .nv-corpo h2{ margin:0; font-family:var(--tg-display),'Archivo',sans-serif; font-stretch:108%; font-weight:800; font-size:30px; line-height:1.06; letter-spacing:-.03em; color:var(--ou-t1,#F3EEE2); }
        .nv-corpo h2 span{ background:var(--ou-grad-txt); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .nv-sub{ margin:10px 0 18px; font-size:14.5px; line-height:1.6; color:var(--ou-t2,#B9B3A6); }
        .nv-corpo ul{ list-style:none; margin:0 0 20px; padding:0; display:grid; gap:14px; }
        .nv-corpo li{ display:flex; gap:12px; align-items:flex-start; }
        .nv-ic{ flex:none; width:36px; height:36px; border-radius:11px; display:grid; place-items:center; color:var(--ou-ouro,#FFC83D);
          background:color-mix(in srgb, var(--ou-ouro,#FFC83D) 12%, transparent); border:1px solid color-mix(in srgb, var(--ou-ouro,#FFC83D) 28%, transparent); }
        .nv-ic svg{ width:19px; height:19px; }
        .nv-corpo li b{ display:block; font-size:14px; color:var(--ou-t1,#F3EEE2); margin-bottom:3px; }
        .nv-corpo li small{ display:block; font-size:13px; line-height:1.55; color:var(--ou-t3,#7E796E); }
        .nv-link{ margin-top:6px; padding:0; border:0; background:none; cursor:pointer; font-family:inherit; font-size:12.5px; font-weight:700; color:var(--ou-ouro,#FFC83D); }
        .nv-link:hover{ text-decoration:underline; }
        .nv-acoes{ display:grid; gap:8px; }
        .nv-botao{ width:100%; justify-content:center; }
        .nv-depois{ padding:8px; border:0; background:none; cursor:pointer; font-family:inherit; font-size:12.5px; color:var(--ou-t3,#7E796E); }
        .nv-depois:hover{ color:var(--ou-t2,#B9B3A6); }
        @keyframes nvFade{ from{ opacity:0 } to{ opacity:1 } }
        @keyframes nvSobe{ from{ opacity:0; transform:translateY(18px) scale(.98) } to{ opacity:1; transform:none } }
        @keyframes nvRola{ from{ transform:translateX(0) } to{ transform:translateX(-50%) } }
        @media (max-width:520px){ .nv-topo{ height:126px } .nv-faixa{ top:46px } .nv-logo{ width:80px; height:54px } .nv-corpo{ padding:4px 18px 20px } .nv-corpo h2{ font-size:25px } .nv-sub{ font-size:13.5px } }
        @media (prefers-reduced-motion:reduce){ .nv-fundo, .nv-caixa, .nv-trilho{ animation:none } }
      `}</style>
    </div>
  )
}
