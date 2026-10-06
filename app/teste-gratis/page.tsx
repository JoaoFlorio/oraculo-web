'use client'
// TESTE GRÁTIS DE 7 DIAS (05/10/2026) — cadastro pelo próprio Oráculo. Passo 1: nome, e-mail, WhatsApp, CPF/CNPJ e
// senha. Passo 2: o código do WhatsApp + o código do e-mail. Só com os dois a conta nasce (7 dias, 30 créditos) e já
// entra logada. Toda a blindagem (1 teste por documento/celular/e-mail, limites, validade dos códigos) é no backend.
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const LEGAL_BASE = 'https://central.oraculojf.com.br'   // mesmo endereço dos termos no TermsGate
const bg = '#07080D', card = '#10121B', line = 'rgba(255,255,255,0.08)', lineG = 'rgba(240,180,41,0.32)'
const gold = '#F0B429', goldG = 'linear-gradient(135deg,#F5C842,#C48F10)', t1 = '#F3F3FB', t2 = '#A3A8C3', t3 = '#6B7090', red = '#F87171', green = '#34D399'

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

function Campo({ label, children, dica }: { label: string; children: React.ReactNode; dica?: string }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t2, marginBottom: 6 }}>{label}</span>
      {children}
      {dica && <span style={{ display: 'block', fontSize: 11, color: t3, marginTop: 5 }}>{dica}</span>}
    </label>
  )
}
const inputSt: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#0B0D15', border: `1px solid ${line}`, borderRadius: 11, padding: '12px 14px', color: t1, fontSize: 14.5, outline: 'none', fontFamily: 'inherit' }

export default function TesteGratis() {
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

  const btn: React.CSSProperties = { width: '100%', border: 'none', borderRadius: 12, padding: '14px 16px', background: goldG, color: '#14100A', fontWeight: 800, fontSize: 15, cursor: enviando ? 'default' : 'pointer', opacity: enviando ? 0.7 : 1, fontFamily: 'inherit' }

  return (
    <div style={{ minHeight: '100dvh', background: bg, color: t1, fontFamily: 'Inter, -apple-system, Segoe UI, Roboto, sans-serif', display: 'flex', justifyContent: 'center', padding: '40px 16px 56px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: gold }}>ORÁCULO · TESTE GRÁTIS</div>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em', margin: '10px 0 8px', lineHeight: 1.1 }}>7 dias grátis no Oráculo</h1>
          <p style={{ fontSize: 14, color: t2, margin: 0, lineHeight: 1.6 }}>Acesso completo à Gestão, ao NEO, à mineração e à extensão. Sem cartão.</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14, background: 'rgba(240,180,41,0.10)', border: `1px solid ${lineG}`, borderRadius: 99, padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>
            🎁 <span><b style={{ color: gold }}>30 créditos</b> para usar em <b style={{ color: gold }}>7 dias</b></span>
          </div>
          <p style={{ fontSize: 11.5, color: t3, margin: '10px 0 0', lineHeight: 1.55 }}>Os créditos geram imagens, anúncios e vídeos com o NEO (um anúncio completo usa 8). No teste não tem recarga e o NEO responde até 80 mensagens por dia.<br />Quando os 7 dias acabarem, o acesso trava até você escolher um plano.</p>
        </div>

        <div style={{ background: card, border: `1px solid ${line}`, borderRadius: 18, padding: '22px 20px' }}>
          {passo === 1 ? (
            <form onSubmit={iniciar} style={{ display: 'grid', gap: 14 }}>
              <Campo label="Nome completo"><input style={inputSt} value={nome} onChange={e => setNome(e.target.value)} autoComplete="name" required maxLength={80} /></Campo>
              <Campo label="E-mail" dica="Vamos mandar um código pra ele."><input style={inputSt} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required maxLength={120} /></Campo>
              <Campo label="WhatsApp (com DDD)" dica="Vamos mandar o outro código no WhatsApp."><input style={inputSt} inputMode="tel" value={tel} onChange={e => setTel(mascaraTel(e.target.value))} placeholder="(11) 91234-5678" autoComplete="tel" required /></Campo>
              <Campo label="CPF ou CNPJ" dica="1 teste por CPF/CNPJ. Guardamos só uma marca embaralhada, nunca o número."><input style={inputSt} inputMode="numeric" value={doc} onChange={e => setDoc(mascaraDoc(e.target.value))} required /></Campo>
              <Campo label="Crie uma senha" dica="Mínimo de 8 caracteres."><input style={inputSt} type="password" value={senha} onChange={e => setSenha(e.target.value)} autoComplete="new-password" required minLength={8} maxLength={128} /></Campo>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, color: t2, lineHeight: 1.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={aceite} onChange={e => setAceite(e.target.checked)} style={{ marginTop: 2, accentColor: gold }} />
                <span>Li e aceito os <a href={`${LEGAL_BASE}/terms`} target="_blank" rel="noopener noreferrer" style={{ color: gold }}>Termos de Uso</a> e a <a href={`${LEGAL_BASE}/privacy`} target="_blank" rel="noopener noreferrer" style={{ color: gold }}>Política de Privacidade</a>, e entendo que o teste dura 7 dias com 30 créditos.</span>
              </label>
              {/* campo-isca: invisível pra gente, robô de formulário preenche */}
              <input aria-hidden="true" tabIndex={-1} autoComplete="off" name="site" value={isca} onChange={e => setIsca(e.target.value)} style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
              {TURNSTILE_SITE_KEY && <div ref={tsBox} style={{ minHeight: 65 }} />}
              {erro && <div role="alert" style={{ fontSize: 13, color: red, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 12px' }}>{erro}</div>}
              <button type="submit" disabled={enviando} style={btn}>{verificando ? 'Verificando que você não é um robô…' : enviando ? 'Enviando os códigos…' : 'Começar meu teste grátis'}</button>
            </form>
          ) : (
            <form onSubmit={confirmar} style={{ display: 'grid', gap: 14 }}>
              <div style={{ fontSize: 13.5, color: t2, lineHeight: 1.6 }}>Mandamos <b style={{ color: t1 }}>dois códigos</b>: um no WhatsApp <b style={{ color: t1 }}>{pedido?.tel}</b> e outro no e-mail <b style={{ color: t1 }}>{pedido?.email}</b>. Eles valem por 15 minutos.</div>
              <Campo label="Código do WhatsApp" dica={zap === 'enviado' ? '✓ Enviado no seu WhatsApp' : zap === 'erro' ? 'Não consegui enviar no WhatsApp — confira o número ou peça um novo código.' : 'Enviando no WhatsApp…'}>
                <input style={{ ...inputSt, letterSpacing: '0.4em', fontSize: 20, fontWeight: 800, textAlign: 'center' }} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codZap} onChange={e => setCodZap(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
              </Campo>
              <Campo label="Código do e-mail" dica="Não chegou? Olhe o spam ou a aba Promoções.">
                <input style={{ ...inputSt, letterSpacing: '0.4em', fontSize: 20, fontWeight: 800, textAlign: 'center' }} inputMode="numeric" maxLength={6} value={codEmail} onChange={e => setCodEmail(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
              </Campo>
              {erro && <div role="alert" style={{ fontSize: 13, color: red, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 12px' }}>{erro}</div>}
              <button type="submit" disabled={enviando || codZap.length !== 6 || codEmail.length !== 6} style={{ ...btn, opacity: (enviando || codZap.length !== 6 || codEmail.length !== 6) ? 0.55 : 1 }}>{enviando ? 'Criando sua conta…' : 'Confirmar e entrar'}</button>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <button type="button" onClick={() => { setPasso(1); setErro(null) }} style={{ background: 'none', border: 'none', color: t3, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>← Corrigir dados</button>
                <button type="button" onClick={reenviar} disabled={espera > 0} style={{ background: 'none', border: 'none', color: espera > 0 ? t3 : gold, cursor: espera > 0 ? 'default' : 'pointer', padding: 0, fontWeight: 700, fontFamily: 'inherit' }}>{espera > 0 ? `Reenviar códigos em ${espera}s` : 'Reenviar códigos'}</button>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12.5, color: t3, marginTop: 16 }}>
          Já tem conta? <Link href="/login" style={{ color: gold, fontWeight: 700 }}>Entrar</Link> · <Link href="/planos" style={{ color: t2 }}>Ver os planos</Link>
        </p>
        <p style={{ textAlign: 'center', fontSize: 11, color: t3, marginTop: 6 }}><span style={{ color: green }}>●</span> Seus dados ficam protegidos — o CPF/CNPJ serve só pra garantir 1 teste por pessoa.</p>
      </div>
    </div>
  )
}
