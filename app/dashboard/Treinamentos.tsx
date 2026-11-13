'use client'
/* ABA TREINAMENTOS (13/11/2026) — pedido do João: "quem está no Oráculo nem sempre tem a Rota 10K. Faz uma aba de
   treinamentos com os módulos, um banner, o meu vídeo vendendo a Rota e um agentezinho tirando as dúvidas."

   DECISÕES (combinadas com o João no chat):
   • As aulas continuam na área de membros da Greenn (progresso, login e proteção já existem lá). Aqui é VITRINE +
     PORTA: quem não comprou vê vídeo, módulos com cadeado e o botão de compra; quem comprou vê o botão da área.
   • "Comprou?" vem da Greenn (backend lib/rota10k.ts): pelo e-mail da conta ou por um e-mail vinculado
     ("Comprei com outro e-mail").
   • Aparece pra TODOS os planos. Vídeo = o mesmo da página de oferta. Preço = R$ 47 (checkout da Greenn 323043).
   • O assistente da Rota (agent:'rota') tira dúvida e vende com critério: pergunta se a pessoa já é da Fraternidade
     antes de oferecer (backend agents/rotaPersona.ts). */
import React, { useEffect, useRef, useState } from 'react'
import { CabecalhoOuro } from './ouro/Ouro'

const VIDEO = 'https://player-vz-aa29160c-7ea.tv.pandavideo.com.br/embed/?v=f63f46c4-beda-444f-98b3-0ef60a2ef80a'
const CHECKOUT = 'https://payfast.greenn.com.br/redirect/323043?utm_source=oraculo&utm_medium=aba-treinamentos&utm_campaign=rota10k'
const AREA_MEMBROS = 'https://app.greenn.club'

const MODULOS = [
  { img: 'm01', nome: 'Comece por aqui', txt: 'O mapa inteiro e a ordem certa.' },
  { img: 'm02', nome: 'Mentalidade', txt: 'Como pensar como dono da operação.' },
  { img: 'm03', nome: 'Start na Amazon', txt: 'Conta certa e o primeiro produto no ar.' },
  { img: 'm04', nome: 'DBA · Dropshipping', txt: 'Vender na Amazon sem comprar estoque.' },
  { img: 'm05', nome: 'FBA', txt: 'A Amazon guarda, embala e entrega.' },
  { img: 'm06', nome: 'Central de Marketing', txt: 'Foto, título e anúncio que vendem.' },
  { img: 'm07', nome: 'Start no Mercado Livre', txt: 'Conta, reputação e o 1º anúncio.' },
  { img: 'm08', nome: 'Primeiras vendas', txt: 'O que fazer pra a venda acontecer.' },
  { img: 'm09', nome: 'Central de Promoções', txt: 'Cupom e promoção que fazem girar.' },
  { img: 'm10', nome: 'Full', txt: 'O ML estoca e entrega rápido.' },
]

type Status = { comprou: boolean; via: 'conta' | 'vinculo' | null; emailCompra: string | null }
type Msg = { role: 'user' | 'assistant'; text: string }

const CSS = `
.tr{--au:#F0B429;--au2:#FFD466;max-width:1120px;padding:6px 0 48px}
.tr *{box-sizing:border-box}
@keyframes tr-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes tr-pulse{0%,100%{box-shadow:0 0 0 0 rgba(240,180,41,.45)}60%{box-shadow:0 0 0 12px rgba(240,180,41,0)}}
.tr-in{animation:tr-rise .5s cubic-bezier(.2,.7,.2,1) both}
.tr-hero{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:26px;align-items:center;border:1px solid var(--lineG,var(--line));border-radius:20px;padding:22px;background:radial-gradient(800px 260px at 0% -10%,rgba(240,180,41,.16),transparent 60%),var(--card)}
.tr-hero.so{grid-template-columns:minmax(0,1fr)}
.tr-video{position:relative;width:100%;aspect-ratio:9/16;max-height:540px;border-radius:16px;overflow:hidden;background:#000;border:1px solid var(--line)}
.tr-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.tr-eyebrow{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--au)}
.tr-title{font-size:clamp(24px,3vw,36px);font-weight:900;letter-spacing:-.035em;line-height:1.05;color:var(--t1);margin:6px 0 10px}
.tr-title em{font-style:normal;color:var(--au)}
.tr-lista{list-style:none;padding:0;margin:0 0 16px;display:grid;gap:8px}
.tr-lista li{display:flex;gap:9px;font-size:14px;line-height:1.5;color:var(--t2)}
.tr-lista li b{color:var(--t1)}
.tr-lista svg{flex-shrink:0;margin-top:3px;color:var(--au)}
.tr-preco{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:14px}
.tr-preco b{font-size:34px;font-weight:900;letter-spacing:-.03em;color:var(--t1)}
.tr-preco span{font-size:12.5px;color:var(--t3)}
.tr-cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:0 26px;border-radius:14px;background:var(--au);color:#1a1200;font-weight:900;font-size:15.5px;text-decoration:none;border:0;cursor:pointer;animation:tr-pulse 2.6s ease-out infinite}
.tr-cta:hover{background:var(--au2)}
.tr-dica{font-size:12.5px;color:var(--t3);margin-top:10px;line-height:1.5}
.tr-dica b{color:var(--t2)}
.tr-links{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px}
.tr-link{background:none;border:0;padding:0;color:var(--au);font-size:13px;font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.tr-link:disabled{opacity:.6;cursor:wait}
.tr-vinc{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.tr-vinc input{flex:1;min-width:200px;height:42px;border-radius:12px;border:1px solid var(--line);background:var(--bg,transparent);color:var(--t1);padding:0 12px;font-size:14px}
.tr-vinc button{height:42px;padding:0 16px;border-radius:12px;border:1px solid var(--line2,var(--line));background:var(--card);color:var(--t1);font-weight:800;cursor:pointer}
.tr-msg{font-size:13px;margin-top:8px;line-height:1.5}
.tr-msg.err{color:#F87171}.tr-msg.ok{color:#4ADE80}
.tr-ok{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:800;color:#4ADE80;border:1px solid rgba(74,222,128,.35);background:rgba(74,222,128,.08);margin-bottom:10px}
.tr-h2{font-size:16px;font-weight:800;color:var(--t1);margin:30px 0 4px;letter-spacing:-.01em}
.tr-sub{font-size:13px;color:var(--t3);margin:0 0 14px}
.tr-mods{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.tr-mod{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--line);background:var(--card)}
.tr-mod img{display:block;width:100%;aspect-ratio:410/550;object-fit:cover}
.tr-mod.trancado img{filter:saturate(.55) brightness(.55)}
.tr-cad{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.6);color:#fff}
.tr-mod div{padding:9px 10px 11px}
.tr-mod b{display:block;font-size:12.5px;color:var(--t1);line-height:1.25}
.tr-mod p{margin:3px 0 0;font-size:11.5px;color:var(--t3);line-height:1.35}
.tr-chat{border:1px solid var(--line);border-radius:18px;background:var(--card);padding:16px;display:flex;flex-direction:column;gap:12px}
.tr-msgs{max-height:420px;overflow-y:auto;display:flex;flex-direction:column;gap:10px}
.tr-bolha{max-width:88%;border-radius:14px;padding:10px 14px;font-size:14px;line-height:1.55;white-space:pre-wrap;word-break:break-word}
.tr-bolha.u{align-self:flex-end;background:var(--au);color:#1a1200}
.tr-bolha.a{align-self:flex-start;border:1px solid var(--line);color:var(--t1);background:var(--bg,transparent)}
.tr-bolha a{color:var(--au);font-weight:700}
.tr-sug{display:flex;flex-wrap:wrap;gap:8px}
.tr-sug button{border:1px solid var(--line);background:transparent;color:var(--t2);border-radius:999px;padding:8px 12px;font-size:12.5px;cursor:pointer}
.tr-sug button:hover{border-color:var(--au);color:var(--t1)}
.tr-form{display:flex;gap:8px}
.tr-form input{flex:1;min-width:0;height:44px;border-radius:12px;border:1px solid var(--line);background:var(--bg,transparent);color:var(--t1);padding:0 12px;font-size:14px}
.tr-form button{height:44px;padding:0 18px;border-radius:12px;border:0;background:var(--au);color:#1a1200;font-weight:900;cursor:pointer}
.tr-form button:disabled{opacity:.55;cursor:default}
@media (max-width:860px){.tr-hero{grid-template-columns:minmax(0,1fr)}.tr-video{max-width:300px;margin:0 auto}.tr-mods{grid-template-columns:repeat(2,minmax(0,1fr))}}
`

const Check = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
const Cadeado = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>

// Texto do assistente: **negrito** e links clicáveis; o resto vai como texto puro (sem HTML vindo do modelo).
function Rico({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g)
  return <>{partes.map((p, i) => p.startsWith('**') && p.endsWith('**') ? <b key={i}>{p.slice(2, -2)}</b>
    : /^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer">{p.replace(/^https?:\/\//, '').split('?')[0]}</a>
    : <React.Fragment key={i}>{p}</React.Fragment>)}</>
}

function ChatRota({ comprou }: { comprou: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const caixa = useRef<HTMLDivElement>(null)
  useEffect(() => { caixa.current?.scrollTo({ top: caixa.current.scrollHeight, behavior: 'smooth' }) }, [msgs, carregando])
  const sugestoes = comprou
    ? ['Por onde eu começo?', 'Como entro na área de membros?', 'Como uso o galpão do João?']
    : ['O que eu aprendo na Rota?', 'Serve pra quem nunca vendeu?', 'Os 10K são lucro?', 'Já tenho o Oráculo, preciso da Rota?']

  async function enviar(t: string) {
    const q = t.trim()
    if (!q || carregando) return
    setErro(null)
    const hist: Msg[] = [...msgs, { role: 'user', text: q }]
    setMsgs(hist); setInput(''); setCarregando(true)
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agent: 'rota', messages: hist.map(m => ({ role: m.role, content: m.text })) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.error) setErro(data?.error || 'Não consegui responder agora. Tente de novo.')
      else setMsgs([...hist, { role: 'assistant', text: data.reply || '' }])
    } catch { setErro('Erro de rede. Tente de novo.') }
    finally { setCarregando(false) }
  }

  return (
    <div className="tr-chat">
      <div ref={caixa} className="tr-msgs" aria-live="polite">
        {msgs.length === 0 && <div className="tr-bolha a">{comprou
          ? 'Oi! Sou o assistente da Rota 10K. Me pergunta o que quiser sobre as aulas, a área de membros ou o próximo passo.'
          : 'Oi! Sou o assistente da Rota 10K. Me conta: você já vende na Amazon ou no Mercado Livre, ou está começando agora?'}</div>}
        {msgs.map((m, i) => <div key={i} className={`tr-bolha ${m.role === 'user' ? 'u' : 'a'}`}>{m.role === 'assistant' ? <Rico texto={m.text}/> : m.text}</div>)}
        {carregando && <div className="tr-bolha a" style={{ opacity: .7 }}>pensando…</div>}
        {erro && <div className="tr-msg err">{erro}</div>}
      </div>
      {msgs.length === 0 && <div className="tr-sug">{sugestoes.map(s => <button key={s} onClick={() => enviar(s)}>{s}</button>)}</div>}
      <form className="tr-form" onSubmit={e => { e.preventDefault(); enviar(input) }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Pergunte sobre a Rota 10K" maxLength={800} aria-label="Sua pergunta sobre a Rota 10K"/>
        <button type="submit" disabled={carregando || !input.trim()}>Enviar</button>
      </form>
    </div>
  )
}

export default function Treinamentos({ email }: { email: string }) {
  const [status, setStatus] = useState<Status | null>(null)
  const [falhou, setFalhou] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [abrirVinculo, setAbrirVinculo] = useState(false)
  const [outro, setOutro] = useState('')
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  useEffect(() => {
    let vivo = true
    fetch('/api/rota/status').then(r => r.json()).then(d => { if (!vivo) return; if (d && typeof d.comprou === 'boolean') setStatus(d); else setFalhou(true) })
      .catch(() => { if (vivo) setFalhou(true) })
    return () => { vivo = false }
  }, [])

  async function verificar() {
    setVerificando(true); setAviso(null)
    try {
      const d = await fetch('/api/rota/verificar', { method: 'POST' }).then(r => r.json())
      if (d?.error) setAviso({ tipo: 'err', texto: d.error })
      else { setStatus(d); setAviso(d.comprou ? { tipo: 'ok', texto: 'Achei sua compra. Bons estudos!' } : { tipo: 'err', texto: `Ainda não achei compra aprovada com ${email}. Pagou por PIX agora? Espere uns minutos e tente de novo. Comprou com outro e-mail? Use a opção ao lado.` }) }
    } catch { setAviso({ tipo: 'err', texto: 'Não consegui conferir agora. Tente de novo em instantes.' }) }
    finally { setVerificando(false) }
  }

  async function vincular(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(outro.trim())) { setAviso({ tipo: 'err', texto: 'Digite o e-mail usado na compra.' }); return }
    setVerificando(true); setAviso(null)
    try {
      const d = await fetch('/api/rota/vincular', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ outro: outro.trim() }) }).then(r => r.json())
      if (d?.error) setAviso({ tipo: 'err', texto: d.error })
      else { setStatus(d); setAbrirVinculo(false); setAviso({ tipo: 'ok', texto: 'Compra vinculada à sua conta.' }) }
    } catch { setAviso({ tipo: 'err', texto: 'Não consegui conferir agora. Tente de novo em instantes.' }) }
    finally { setVerificando(false) }
  }

  const comprou = !!status?.comprou

  return (
    <div className="tr">
      <style>{CSS}</style>
      <CabecalhoOuro grupo="Treinamentos" titulo="Rota" destaque="10K" sub="O treinamento do João pra sair do zero até as primeiras vendas na Amazon e no Mercado Livre."/>

      {status === null && !falhou && <div className="tr-hero so tr-in"><div style={{ color: 'var(--t3)', fontSize: 13 }}>Conferindo seus treinamentos…</div></div>}

      {(status !== null || falhou) && (comprou ? (
        <div className="tr-hero so tr-in">
          <div>
            <span className="tr-ok"><Check/> Você tem a Rota 10K</span>
            <h2 className="tr-title">Suas aulas estão na <em>área de membros</em></h2>
            <ul className="tr-lista">
              <li><Check/><span>Comece pelo módulo <b>Comece por aqui</b>: ele mostra o mapa e a ordem certa.</span></li>
              <li><Check/><span>Cada passo da Rota tem uma ferramenta aqui no Oráculo: mineração pra achar produto, calculadora pra fechar a margem, Gestão pra ver o lucro.</span></li>
            </ul>
            <a className="tr-cta" href={AREA_MEMBROS} target="_blank" rel="noreferrer">Abrir área de membros ↗</a>
            <p className="tr-dica">Entre com o e-mail e a senha da compra{status?.emailCompra ? <>: <b>{status.emailCompra}</b></> : null}. Esqueceu a senha? Use “Esqueci minha senha” na própria área de membros.</p>
          </div>
        </div>
      ) : (
        <div className="tr-hero tr-in">
          <div className="tr-video"><iframe src={VIDEO} title="Rota 10K" loading="lazy" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;fullscreen" allowFullScreen/></div>
          <div>
            <div className="tr-eyebrow">Você já tem a ferramenta. Falta o caminho.</div>
            <h2 className="tr-title">A rota pros seus primeiros <em>R$ 10 mil em vendas</em></h2>
            <ul className="tr-lista">
              <li><Check/><span><b>A ordem certa</b>: produto, fornecedor, margem, anúncio e logística, sem se perder em mil caminhos.</span></li>
              <li><Check/><span><b>Amazon e Mercado Livre</b>, do dropshipping (sem estoque) ao Full/FBA.</span></li>
              <li><Check/><span><b>O galpão do João sem mensalidade</b>: você paga só a preparação de cada mercadoria.</span></li>
            </ul>
            <div className="tr-preco"><b>R$ 47</b><span>pagamento único · cartão ou PIX · garantia de 7 dias</span></div>
            <a className="tr-cta" href={CHECKOUT} target="_blank" rel="noreferrer">Quero a Rota 10K</a>
            <p className="tr-dica">Compre com o mesmo e-mail do Oráculo (<b>{email}</b>) e esta aba libera o acesso sozinha. R$ 10 mil é faturamento, não lucro garantido.</p>
            <div className="tr-links">
              <button className="tr-link" onClick={verificar} disabled={verificando}>{verificando ? 'Conferindo…' : 'Já comprei — verificar'}</button>
              <button className="tr-link" onClick={() => { setAbrirVinculo(v => !v); setAviso(null) }}>Comprei com outro e-mail</button>
            </div>
            {abrirVinculo && (
              <form className="tr-vinc" onSubmit={vincular}>
                <input type="email" value={outro} onChange={e => setOutro(e.target.value)} placeholder="email-da-compra@exemplo.com" aria-label="E-mail usado na compra da Rota 10K"/>
                <button type="submit" disabled={verificando}>{verificando ? 'Conferindo…' : 'Vincular'}</button>
              </form>
            )}
            {aviso && <p className={`tr-msg ${aviso.tipo}`}>{aviso.texto}</p>}
            {falhou && !aviso && <p className="tr-msg err">Não consegui conferir se você já tem a Rota. Se já comprou, toque em “Já comprei — verificar”.</p>}
          </div>
        </div>
      ))}

      <h3 className="tr-h2">Os módulos</h3>
      <p className="tr-sub">{comprou ? 'Tudo liberado na área de membros.' : 'Do primeiro passo ao Full, na ordem certa.'}</p>
      <div className="tr-mods">
        {MODULOS.map((m, i) => (
          <div key={m.img} className={`tr-mod tr-in${comprou ? '' : ' trancado'}`} style={{ animationDelay: `${i * 40}ms` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/treinamentos/rota/${m.img}.webp`} alt={`Módulo ${m.nome}`} loading="lazy" width={410} height={550}/>
            {!comprou && <span className="tr-cad"><Cadeado/></span>}
            <div><b>{m.nome}</b><p>{m.txt}</p></div>
          </div>
        ))}
      </div>

      <h3 className="tr-h2">Tire suas dúvidas</h3>
      <p className="tr-sub">O assistente da Rota responde na hora: conteúdo, preço, acesso, pra quem serve.</p>
      <ChatRota comprou={comprou}/>
    </div>
  )
}
