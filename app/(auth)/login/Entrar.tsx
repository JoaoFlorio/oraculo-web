'use client'
// LOGIN (visual novo 05/10/2026) — mesma linguagem do site oraculojf.com e da /teste-gratis; estilos em
// ./visual.module.css. A LÓGICA (estado + handleSubmit com 2FA/TOTP e o desvio admin/staff → /admin) é cópia literal
// da versão anterior (commit 94afe19) — não mexer aqui sem rever o /api/auth/login.
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import s from './visual.module.css'

const Ic = {
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>,
  cadeado: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>,
  escudo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>,
  olho: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>,
  olhoFechado: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.9 0 3.6-.6 5-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>,
  alerta: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></svg>,
  grafico: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5M4 19h16M8 15l4-5 3 3 5-6" /></svg>,
  brilho: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" /></svg>,
  lupa: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></svg>,
  presente: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="8.5" width="17" height="4" rx="1" /><path d="M5 12.5V20h14v-7.5M12 8.5V20M12 8.5S10.5 4 8 4.5 7 8.5 12 8.5zM12 8.5s1.5-4.5 4-4 1 4-4 4z" /></svg>,
}
const OLHO_LOGO = (
  <svg viewBox="0 0 1000 440" aria-hidden="true"><g fill="none" stroke="#FFC83D" strokeWidth="34" strokeLinejoin="round"><path d="M70 220Q500-90 930 220Q500 530 70 220Z" /><path d="M70 220Q500-20 930 220Q500 460 70 220Z" strokeWidth="26" /><circle cx="500" cy="220" r="105" strokeWidth="26" /></g><circle cx="500" cy="220" r="40" fill="#FFE7A3" /></svg>
)

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
    const p = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + .3, v: Math.random() * .00035 + .0001, a: Math.random() * 6.28, o: Math.random() * .55 + .15 }))
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

// O olho se abre uma vez ao chegar (vídeo do site). Com "reduzir movimento", já mostra o olho aberto.
function OlhoAbrindo() {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const v = ref.current; if (!v) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const fim = () => { v.currentTime = Math.max(0, v.duration - .05) }
      if (v.readyState >= 1) fim(); else v.addEventListener('loadedmetadata', fim, { once: true })
      return
    }
    v.play().catch(() => { /* navegador barrou autoplay: fica o pôster */ })
  }, [])
  return (
    <div className={s.video}>
      <video ref={ref} muted playsInline preload="auto" poster="/entrar/olho-fechado.jpg" aria-hidden="true"><source src="/entrar/olho-abre.mp4" type="video/mp4" /></video>
    </div>
  )
}

const CHIPS = (
  <>
    <li className={s.chip}>{Ic.grafico}Gestão com lucro real</li>
    <li className={s.chip}>{Ic.brilho}NEO, a IA do Oráculo</li>
    <li className={s.chip}>{Ic.lupa}Minerador de produtos</li>
  </>
)

export default function Entrar() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [code, setCode]         = useState('')          // 2FA (TOTP) — só aparece quando a conta tem
  const [needCode, setNeedCode] = useState(false)
  const year = new Date().getFullYear()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code: code || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data?.totpRequired) { setNeedCode(true); setError(code ? (data?.error || 'Código inválido') : 'Sua conta tem verificação em duas etapas: digite o código do app autenticador.') }
        else setError(data?.error || 'Não foi possível entrar. Tente novamente.')
        setLoading(false)
        return
      }
      const role = data?.user?.role
      router.push(role === 'admin' || role === 'staff' ? '/admin' : '/dashboard')
    } catch {
      setError('Falha de conexão. Verifique sua internet e tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className={s.pagina}>
      <div className={s.fundo} aria-hidden="true">
        <div className={s.aurora1} /><div className={s.aurora2} />
        <div className={s.grade} />
        <Po />
      </div>

      <header className={s.topo}>
        <a className={s.marca} href="https://oraculojf.com" aria-label="Oráculo — site">{OLHO_LOGO}<span>ORÁCULO</span></a>
        <Link className={s.topoLink} href="/teste-gratis">Novo por aqui? <b>Teste grátis</b></Link>
      </header>

      <main className={s.conteudo}>
        <section className={s.olhoLado}>
          <OlhoAbrindo />
          <span className={`${s.kicker} ${s.surge} ${s.s1}`}>Bem-vindo de volta</span>
          <h1 className={`${s.titulo} ${s.surge} ${s.s2}`}>Seus números<br /><em>te esperam.</em></h1>
          <p className={`${s.sub} ${s.surge} ${s.s3}`}>Entre e veja o <strong>lucro real</strong> da sua operação na <strong>Amazon</strong> e no <strong>Mercado Livre</strong>, atualizado a cada venda.</p>
          <ul className={`${s.chips} ${s.chipsDesk} ${s.surge} ${s.s4}`}>{CHIPS}</ul>
        </section>

        <div className={`${s.cartaoBorda} ${s.surge} ${s.s2}`}>
          <div className={s.cartao}>
            <span className={s.cartaoKicker}><i />Acesso ao painel</span>
            <h2 className={s.cartaoTitulo}>Entre na sua conta</h2>

            <form onSubmit={handleSubmit} className={s.form} noValidate>
              <div>
                <label htmlFor="og-email" className={s.rotulo}>E-mail</label>
                <div className={s.caixa}>
                  <span className={s.caixaIc} aria-hidden="true">{Ic.mail}</span>
                  <input id="og-email" className={s.entrada} type="email" required
                    autoComplete="email" inputMode="email" placeholder="seu@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div>
                <label htmlFor="og-password" className={s.rotulo}>Senha</label>
                <div className={s.caixa}>
                  <span className={s.caixaIc} aria-hidden="true">{Ic.cadeado}</span>
                  <input id="og-password" className={s.entrada} type={showPass ? 'text' : 'password'} required
                    autoComplete="current-password" placeholder="••••••••"
                    style={{ paddingRight: 50 }}
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" className={s.olho}
                    aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPass(v => !v)}>
                    {showPass ? Ic.olhoFechado : Ic.olho}
                  </button>
                </div>
              </div>

              {needCode && (
                <div className={s.dois}>
                  <label htmlFor="og-code" className={s.rotulo}>Código do autenticador</label>
                  <div className={s.caixa}>
                    <span className={s.caixaIc} aria-hidden="true">{Ic.escudo}</span>
                    <input id="og-code" className={`${s.entrada} ${s.codigo}`} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6}
                      placeholder="000000" autoFocus value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                  </div>
                </div>
              )}

              {error && (
                <div role="alert" className={s.erro}>{Ic.alerta}<span>{error}</span></div>
              )}

              <button type="submit" className={s.botao} disabled={loading}>
                {loading ? (<><span className={s.gira} aria-hidden="true" /><span>Entrando…</span></>) : (<>Entrar <span className={s.seta} aria-hidden="true">→</span></>)}
              </button>
            </form>

            <Link href="/forgot-password" className={s.esqueci}>Esqueci minha senha</Link>

            <div className={s.ou} aria-hidden="true">ainda não tem acesso?</div>

            <Link href="/teste-gratis" className={s.novo}>
              <span className={s.novoIc}>{Ic.presente}</span>
              <span><b>Teste grátis 7 dias</b><small>Sem cartão e sem pagar nada</small></span>
              <span className={s.novoSeta} aria-hidden="true">→</span>
            </Link>
            <Link href="/planos" className={s.planos}>ou <b>conheça os planos</b></Link>
          </div>
        </div>

        <ul className={`${s.chips} ${s.chipsCel}`}>{CHIPS}</ul>
      </main>

      <footer className={s.rodape}>© {year} Oráculo · Inteligência para sellers Amazon e Mercado Livre</footer>
    </div>
  )
}
