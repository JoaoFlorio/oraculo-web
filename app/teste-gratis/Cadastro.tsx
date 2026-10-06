'use client'
// TESTE GRÁTIS DE 7 DIAS (05/10/2026) — cadastro pelo próprio Oráculo. Passo 1: nome, e-mail, WhatsApp, CPF/CNPJ e
// senha. Passo 2: o código do WhatsApp + o código do e-mail. Só com os dois a conta nasce (7 dias, 30 créditos) e já
// entra logada. Toda a blindagem (1 teste por documento/celular/e-mail, limites, validade dos códigos) é no backend.
// Visual (05/10 noite): mesma linguagem do site oraculojf.com — estilos em ./visual.module.css; a LÓGICA abaixo é a
// mesma do commit e5ba185 (anti-robô: desafio → nonce → iniciar; isca "site"; Turnstile opcional).
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import s from './visual.module.css'

const LEGAL_BASE = 'https://central.oraculojf.com.br'   // mesmo endereço dos termos no TermsGate

const mascaraTel = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
const mascaraDoc = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 11) return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

// 05/10 — anti-robô (lib/desafioTeste.ts): acha o número que, com o sal, dá um SHA-256 com N bits zerados no começo.
function bitsZerados(h: Uint8Array): number {
  let n = 0
  for (const b of h) { if (b === 0) { n += 8; continue } return n + Math.clz32(b) - 24 }
  return n
}
async function resolverDesafio(desafio: string): Promise<string> {
  const [sal, , bits] = desafio.split('.')
  const alvo = Number(bits), enc = new TextEncoder()
  for (let i = 0; i < 50_000_000; i++) {
    const h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`${sal}:${i}`)))
    if (bitsZerados(h) >= alvo) return String(i)
  }
  throw new Error('desafio')
}
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void } } }

// ---------- só visual ----------
const Ic = {
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>,
  zap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.6z" /><path d="M9 8.6c.2-.5.5-.6.8-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.1.7l-.5.6c-.1.2-.1.4 0 .6.6 1.1 1.4 1.9 2.5 2.5.2.1.4.1.6 0l.6-.5c.2-.2.5-.2.7-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.2.6-.6.8-.6.3-1.4.4-2.2.1-2.5-.8-4.4-2.7-5.2-5.2-.3-.8-.2-1.6.1-2.2z" /></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="11" r="2.2" /><path d="M5.8 16c.6-1.5 1.8-2.3 3.2-2.3s2.6.8 3.2 2.3M15 10h3M15 13.5h3" /></svg>,
  cadeado: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>,
  olho: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>,
  olhoFechado: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.9 0 3.6-.6 5-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>,
  alerta: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></svg>,
  escudo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>,
  cartao: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="M2.5 10h19M3 3l18 18" /></svg>,
  brilho: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" /></svg>,
  relogio: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  grafico: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5M4 19h16M8 15l4-5 3 3 5-6" /></svg>,
  lupa: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></svg>,
  peca: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4.5a2 2 0 1 1 4 0V6h4a1 1 0 0 1 1 1v4h-1.5a2 2 0 1 0 0 4H18v4a1 1 0 0 1-1 1h-4v-1.5a2 2 0 1 0-4 0V20H5a1 1 0 0 1-1-1v-4h1.5a2 2 0 1 0 0-4H4V7a1 1 0 0 1 1-1h4z" /></svg>,
}
const OLHO_LOGO = (
  <svg viewBox="0 0 1000 440" aria-hidden="true"><g fill="none" stroke="#FFC83D" strokeWidth="34" strokeLinejoin="round"><path d="M70 220Q500-90 930 220Q500 530 70 220Z" /><path d="M70 220Q500-20 930 220Q500 460 70 220Z" strokeWidth="26" /><circle cx="500" cy="220" r="105" strokeWidth="26" /></g><circle cx="500" cy="220" r="40" fill="#FFE7A3" /></svg>
)

function Campo({ label, icone, dica, dicaClasse, children }: { label: string; icone: React.ReactNode; dica?: React.ReactNode; dicaClasse?: string; children: React.ReactNode }) {
  return (
    <label className={s.campo}>
      <span className={s.rotulo}>{label}</span>
      <span className={s.caixa}><span className={s.caixaIc} aria-hidden="true">{icone}</span>{children}</span>
      {dica && <span className={`${s.dica} ${dicaClasse || ''}`}>{dica}</span>}
    </label>
  )
}

// Pó dourado subindo (só enfeite; some com "reduzir movimento").
function Po() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const c = ref.current
    if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const x = c.getContext('2d'); if (!x) return
    const d = Math.min(window.devicePixelRatio || 1, 2)
    let W = 0, H = 0, raf = 0
    const tam = () => { W = c.clientWidth; H = c.clientHeight; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0) }
    tam(); window.addEventListener('resize', tam)
    const p = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + .3, v: Math.random() * .00035 + .0001, a: Math.random() * 6.28, o: Math.random() * .55 + .15 }))
    const q = () => {
      x.clearRect(0, 0, W, H)
      p.forEach((k, i) => {
        k.y -= k.v; k.a += .008; if (k.y < -.02) { k.y = 1.02; k.x = Math.random() }
        x.beginPath(); x.arc((k.x + Math.sin(k.a) * .008) * W, k.y * H, k.r, 0, 6.28)
        x.fillStyle = `rgba(255,${170 + (i % 3) * 25},80,${k.o * (.4 + .6 * Math.sin(k.a * 2) ** 2)})`; x.fill()
      })
      raf = requestAnimationFrame(q)
    }
    q()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', tam) }
  }, [])
  return <canvas ref={ref} className={s.po} aria-hidden="true" />
}

export default function Cadastro() {
  const [passo, setPasso] = useState<1 | 2>(1)
  const [nome, setNome] = useState(''), [email, setEmail] = useState(''), [tel, setTel] = useState(''), [doc, setDoc] = useState('')
  const [senha, setSenha] = useState(''), [aceite, setAceite] = useState(false)
  const [pedido, setPedido] = useState<{ id: string; tel: string; email: string } | null>(null)
  const [codZap, setCodZap] = useState(''), [codEmail, setCodEmail] = useState('')
  const [zap, setZap] = useState<string>('pendente')
  const [erro, setErro] = useState<string | null>(null), [enviando, setEnviando] = useState(false)
  const [espera, setEspera] = useState(0)
  const [verificando, setVerificando] = useState(false), [isca, setIsca] = useState('')
  const [tsToken, setTsToken] = useState(''), tsBox = useRef<HTMLDivElement | null>(null), tsId = useRef<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Situação do WhatsApp enquanto espera o código (a Central envia em segundos).
  useEffect(() => {
    if (passo !== 2 || !pedido) return
    let vivo = true
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/teste/status?pedidoId=${pedido.id}`, { cache: 'no-store' })
        const d = await r.json()
        if (vivo && d?.zap) setZap(d.zap)
      } catch { /* tenta de novo */ }
    }, 3000)
    return () => { vivo = false; clearInterval(t) }
  }, [passo, pedido])
  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])
  // Turnstile (opcional — só com a chave pública configurada no Railway).
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || passo !== 1) return
    const montar = () => { if (window.turnstile && tsBox.current && !tsId.current) tsId.current = window.turnstile.render(tsBox.current, { sitekey: TURNSTILE_SITE_KEY, theme: 'dark', callback: (t: string) => setTsToken(t), 'expired-callback': () => setTsToken('') }) }
    if (window.turnstile) { montar(); return () => { tsId.current = null; setTsToken('') } }
    const sc = document.createElement('script')
    sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; sc.async = true; sc.onload = montar
    document.head.appendChild(sc)
    return () => { tsId.current = null; setTsToken('') }   // "Corrigir dados" volta ao passo 1 com a caixinha nova
  }, [passo])
  const contarEspera = () => {
    setEspera(60)
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => setEspera(s => { if (s <= 1 && timer.current) clearInterval(timer.current); return Math.max(0, s - 1) }), 1000)
  }

  async function iniciar(e: React.FormEvent) {
    e.preventDefault(); setErro(null)
    if (senha.length < 8) { setErro('A senha precisa ter pelo menos 8 caracteres.'); return }
    if (!aceite) { setErro('Aceite os termos para continuar.'); return }
    if (TURNSTILE_SITE_KEY && !tsToken) { setErro('Confirme que você não é um robô (caixinha acima do botão).'); return }
    setEnviando(true)
    try {
      setVerificando(true)
      const { desafio } = await fetch('/api/teste/desafio', { cache: 'no-store' }).then(r => r.json())
      const nonce = await resolverDesafio(String(desafio || ''))
      setVerificando(false)
      const r = await fetch('/api/teste/iniciar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nome, email, telefone: tel, documento: doc, desafio, nonce, site: isca, turnstile: tsToken }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.pedidoId) {
        setErro(d.error || 'Não consegui iniciar o cadastro. Tente de novo.')
        if (TURNSTILE_SITE_KEY && window.turnstile) { window.turnstile.reset(tsId.current || undefined); setTsToken('') }   // token vale 1 vez
        return
      }
      setPedido({ id: d.pedidoId, tel: d.telefoneMascarado, email: d.emailMascarado }); setZap('pendente'); setPasso(2); contarEspera()
    } catch { setErro('Falha de conexão. Tente de novo.') } finally { setEnviando(false); setVerificando(false) }
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault(); if (!pedido) return; setErro(null); setEnviando(true)
    try {
      const r = await fetch('/api/teste/confirmar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pedidoId: pedido.id, codigoZap: codZap, codigoEmail: codEmail, senha }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.ok) { setErro(d.error || 'Não consegui confirmar. Confira os códigos.'); return }
      window.location.href = '/dashboard'
    } catch { setErro('Falha de conexão. Tente de novo.') } finally { setEnviando(false) }
  }

  async function reenviar() {
    if (!pedido || espera > 0) return
    setErro(null)
    const r = await fetch('/api/teste/reenviar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pedidoId: pedido.id }) })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setErro(d.error || 'Não consegui reenviar.'); return }
    setCodZap(''); setCodEmail(''); setZap('pendente'); contarEspera()
  }
  const [verSenha, setVerSenha] = useState(false)
  const codigosOk = codZap.length === 6 && codEmail.length === 6

  return (
    <main className={s.pagina}>
      <div className={s.fundo} aria-hidden="true">
        <div className={s.fundoFoto} />
        <div className={s.aurora1} /><div className={s.aurora2} />
        <div className={s.grade} />
        <Po />
      </div>

      <header className={s.topo}>
        <a className={s.marca} href="https://oraculojf.com" aria-label="Oráculo — site">{OLHO_LOGO}<span>ORÁCULO</span></a>
        <Link className={s.topoLink} href="/login">Já tem conta? <b>Entrar</b></Link>
      </header>

      <div className={s.conteudo}>
        <section className={s.cabeca}>
          <span className={`${s.selo} ${s.surge} ${s.s1}`}><i />Teste grátis · sem cartão</span>
          <h1 className={`${s.titulo} ${s.surge} ${s.s2}`}>7 dias de Oráculo.<br /><em>Por nossa conta.</em></h1>
          <p className={`${s.sub} ${s.surge} ${s.s3}`}>Acesso completo à <strong>Gestão</strong>, ao <strong>NEO</strong>, à <strong>mineração</strong> e à <strong>extensão</strong>. Conecte Amazon e Mercado Livre e veja o lucro real de cada venda. Sem cartão e sem pagar nada.</p>
          <div className={`${s.pilulas} ${s.surge} ${s.s4}`}>
            <span className={s.pilula}>{Ic.cartao}Sem cartão de crédito</span>
            <span className={s.pilula}>{Ic.brilho}30 créditos de IA</span>
            <span className={s.pilula}>{Ic.grafico}Acesso completo</span>
          </div>
        </section>

        <aside className={`${s.formLado} ${s.surge} ${s.s3}`}>
          <div className={s.cartaoBorda}>
            <div className={s.cartao}>
              <div className={s.passos} aria-label={`Passo ${passo} de 2`}>
                <span className={`${s.passo} ${passo === 1 ? s.passoAtivo : s.passoFeito}`}><i>{passo === 1 ? '1' : Ic.check}</i><span>Seus dados</span></span>
                <span className={s.passoTraco} />
                <span className={`${s.passo} ${passo === 2 ? s.passoAtivo : ''}`}><i>2</i><span>Códigos</span></span>
                <span className={s.passoTraco} />
                <span className={s.passo}><i>3</i><span>Acesso liberado</span></span>
              </div>

              {passo === 1 ? (
                <>
                  <h2 className={s.cartaoTitulo}>Crie seu acesso grátis</h2>
                  <p className={s.cartaoSub}><b>30 créditos</b> para usar em <b>7 dias</b>, sem cartão e sem pagar nada.</p>
                  <form onSubmit={iniciar} className={s.form}>
                    <Campo label="Nome completo" icone={Ic.user}><input className={s.entrada} value={nome} onChange={e => setNome(e.target.value)} autoComplete="name" required maxLength={80} placeholder="Seu nome" /></Campo>
                    <div className={s.duas}>
                      <Campo label="E-mail" icone={Ic.mail} dica="Vamos mandar um código pra ele."><input className={s.entrada} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required maxLength={120} placeholder="voce@email.com" /></Campo>
                      <Campo label="WhatsApp (com DDD)" icone={Ic.zap} dica="Vamos mandar o outro código no WhatsApp."><input className={s.entrada} inputMode="tel" value={tel} onChange={e => setTel(mascaraTel(e.target.value))} placeholder="(11) 91234-5678" autoComplete="tel" required /></Campo>
                    </div>
                    <Campo label="CPF ou CNPJ" icone={Ic.doc} dica="1 teste por CPF/CNPJ. Guardamos só uma marca embaralhada, nunca o número."><input className={s.entrada} inputMode="numeric" value={doc} onChange={e => setDoc(mascaraDoc(e.target.value))} required placeholder="000.000.000-00" /></Campo>
                    <Campo label="Crie uma senha" icone={Ic.cadeado} dica="Mínimo de 8 caracteres.">
                      <input className={s.entrada} type={verSenha ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} autoComplete="new-password" required minLength={8} maxLength={128} placeholder="••••••••" style={{ paddingRight: 50 }} />
                      <button type="button" className={s.olho} onClick={() => setVerSenha(v => !v)} aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}>{verSenha ? Ic.olhoFechado : Ic.olho}</button>
                    </Campo>
                    <label className={s.aceite}>
                      <input type="checkbox" checked={aceite} onChange={e => setAceite(e.target.checked)} />
                      <span className={s.marcador} aria-hidden="true">{Ic.check}</span>
                      <span>Li e aceito os <a href={`${LEGAL_BASE}/terms`} target="_blank" rel="noopener noreferrer">Termos de Uso</a> e a <a href={`${LEGAL_BASE}/privacy`} target="_blank" rel="noopener noreferrer">Política de Privacidade</a>, e entendo que o teste dura 7 dias com 30 créditos.</span>
                    </label>
                    {/* campo-isca: invisível pra gente, robô de formulário preenche */}
                    <input aria-hidden="true" tabIndex={-1} autoComplete="off" name="site" value={isca} onChange={e => setIsca(e.target.value)} style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
                    {TURNSTILE_SITE_KEY && <div ref={tsBox} className={s.turnstile} />}
                    {erro && <div role="alert" className={s.erro}>{Ic.alerta}<span>{erro}</span></div>}
                    <button type="submit" disabled={enviando} className={s.botao}>
                      {enviando && <span className={s.gira} aria-hidden="true" />}
                      {verificando ? 'Verificando que você não é um robô…' : enviando ? 'Enviando os códigos…' : <>Começar meu teste grátis <span className={s.seta} aria-hidden="true">→</span></>}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2 className={s.cartaoTitulo}>Confirme os dois códigos</h2>
                  <p className={s.cartaoSub}>Mandamos <b>dois códigos</b>: um no WhatsApp <b>{pedido?.tel}</b> e outro no e-mail <b>{pedido?.email}</b>. Eles valem por 15 minutos.</p>
                  <form onSubmit={confirmar} className={s.form}>
                    <Campo label="Código do WhatsApp" icone={Ic.zap}
                      dica={<span className={`${s.zap} ${zap === 'enviado' ? s.zapOk : zap === 'erro' ? s.zapErro : ''}`}><i />{zap === 'enviado' ? '✓ Enviado no seu WhatsApp' : zap === 'erro' ? 'Não consegui enviar no WhatsApp — confira o número ou peça um novo código.' : 'Enviando no WhatsApp…'}</span>}>
                      <input className={`${s.entrada} ${s.codigo}`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codZap} onChange={e => setCodZap(e.target.value.replace(/\D/g, '').slice(0, 6))} required placeholder="······" />
                    </Campo>
                    <Campo label="Código do e-mail" icone={Ic.mail} dica="Não chegou? Olhe o spam ou a aba Promoções.">
                      <input className={`${s.entrada} ${s.codigo}`} inputMode="numeric" maxLength={6} value={codEmail} onChange={e => setCodEmail(e.target.value.replace(/\D/g, '').slice(0, 6))} required placeholder="······" />
                    </Campo>
                    {erro && <div role="alert" className={s.erro}>{Ic.alerta}<span>{erro}</span></div>}
                    <button type="submit" disabled={enviando || !codigosOk} className={s.botao}>
                      {enviando && <span className={s.gira} aria-hidden="true" />}
                      {enviando ? 'Criando sua conta…' : <>Confirmar e entrar <span className={s.seta} aria-hidden="true">→</span></>}
                    </button>
                    <div className={s.linhaAcoes}>
                      <button type="button" className={s.linkBotao} onClick={() => { setPasso(1); setErro(null) }}>← Corrigir dados</button>
                      <button type="button" className={`${s.linkBotao} ${espera > 0 ? '' : s.linkOuro}`} onClick={reenviar} disabled={espera > 0}>{espera > 0 ? `Reenviar códigos em ${espera}s` : 'Reenviar códigos'}</button>
                    </div>
                  </form>
                </>
              )}

              <div className={s.confianca}>
                <span>{Ic.escudo}Dados protegidos</span>
                <span>{Ic.cartao}Sem cartão</span>
                <span>{Ic.relogio}7 dias completos</span>
              </div>
              <p className={s.depois}>Quando os 7 dias acabarem, o acesso trava até você escolher um plano. Nada é cobrado. <Link href="/planos">Ver os planos</Link></p>
            </div>
          </div>
        </aside>

        <section className={s.extras}>
          <div className={`${s.vitrine} ${s.surge} ${s.s4}`}>
            <div className={s.relogio} aria-hidden="true">
              <svg viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,200,61,.08)" strokeWidth="8" />
                <g fill="none" strokeWidth="8" strokeLinecap="round">
                  {Array.from({ length: 7 }, (_, i) => <circle key={i} className={s.seg} style={{ ['--i' as string]: i } as React.CSSProperties} cx="100" cy="100" r="88" pathLength={700} strokeDasharray="88 612" strokeDashoffset={-i * 100} transform="rotate(-86 100 100)" />)}
                </g>
              </svg>
              <img className={s.ampulheta} src="/teste/ampulheta.webp" alt="" width={540} height={716} />
            </div>
            <div className={s.vitrineTxt}>
              <small>O que você ganha</small>
              <div className={s.vitrineNum}><b>30</b><span>créditos de IA<br />em 7 dias</span></div>
              <p>Os créditos geram imagens, anúncios e vídeos com o NEO (um anúncio completo usa 8). <strong>No teste não tem recarga e o NEO responde até 80 mensagens por dia.</strong></p>
            </div>
          </div>

          <div className={s.recursos}>
            <div className={s.recurso}><span className={s.recursoIc}>{Ic.grafico}</span><div><h3>Gestão com lucro real</h3><p>DRE de cada venda: comissão, tarifa, anúncio e imposto descontados.</p></div></div>
            <div className={s.recurso}><span className={s.recursoIc}>{Ic.brilho}</span><div><h3>NEO, a IA do Oráculo</h3><p>Conversa com os seus números e cria anúncios, imagens e vídeos.</p></div></div>
            <div className={s.recurso}><span className={s.recursoIc}>{Ic.lupa}</span><div><h3>Minerador de produtos</h3><p>Acha o próximo produto no catálogo do seu fornecedor.</p></div></div>
            <div className={s.recurso}><span className={s.recursoIc}>{Ic.peca}</span><div><h3>Extensão do Chrome</h3><p>Os números do Oráculo direto na página da Amazon e do Mercado Livre.</p></div></div>
          </div>

          <div className={s.neo}>
            <div className={s.neoCab}><b>O tipo de criativo que o NEO entrega</b><span>exemplos ilustrativos</span></div>
            <div className={s.neoFotos}>
              <figure className={s.neoFoto} style={{ margin: 0 }}><img src="/teste/neo-anuncio.webp" alt="Exemplo de imagem de anúncio criada pelo NEO" width={420} height={420} loading="lazy" /><figcaption>Anúncio</figcaption></figure>
              <figure className={s.neoFoto} style={{ margin: 0 }}><img src="/teste/neo-lifestyle.webp" alt="Exemplo de foto de uso criada pelo NEO" width={420} height={420} loading="lazy" /><figcaption>Foto de uso</figcaption></figure>
              <figure className={s.neoFoto} style={{ margin: 0 }}><img src="/teste/neo-infografico.webp" alt="Exemplo de infográfico criado pelo NEO" width={420} height={420} loading="lazy" /><figcaption>Infográfico</figcaption></figure>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
