'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/* ── Tokens Oráculo (grafite + ouro) ─────────────────────────────── */
const bg    = '#07080D'
const card  = '#10121B'
const line  = 'rgba(255,255,255,0.06)'
const lineG = 'rgba(240,180,41,0.30)'
const gold  = '#F0B429'
const goldG = 'linear-gradient(135deg,#F5C842,#C48F10)'
const red   = '#F87171'
const t1    = '#F3F3FB'
const t2    = '#9DA2BC'
const t3    = '#666B85'

/* ── Marca: olho do Oráculo (almond de linha dupla + 12 raios) ───── */
function OracleEye({ size = 72 }: { size?: number }) {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a  = (i * 30 * Math.PI) / 180
    const cx = 48, cy = 48, r1 = 37.5, r2 = 44
    return {
      x1: (cx + r1 * Math.cos(a)).toFixed(2), y1: (cy + r1 * Math.sin(a)).toFixed(2),
      x2: (cx + r2 * Math.cos(a)).toFixed(2), y2: (cy + r2 * Math.sin(a)).toFixed(2),
    }
  })
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 16px rgba(240,180,41,0.22))' }}>
      {rays.map((r, i) => (
        <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
          stroke={gold} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      ))}
      {/* almond externo */}
      <path d="M11 48 C 26.5 25.5, 69.5 25.5, 85 48 C 69.5 70.5, 26.5 70.5, 11 48 Z"
        stroke={gold} strokeWidth="1.5" strokeLinejoin="round" />
      {/* almond interno (linha dupla) */}
      <path d="M17.5 48 C 30.5 30.5, 65.5 30.5, 78.5 48 C 65.5 65.5, 30.5 65.5, 17.5 48 Z"
        stroke={gold} strokeWidth="1" opacity="0.55" strokeLinejoin="round" />
      {/* íris + pupila */}
      <circle cx="48" cy="48" r="12.5" stroke={gold} strokeWidth="1.5" />
      <circle cx="48" cy="48" r="8.5" stroke={gold} strokeWidth="1" opacity="0.45" />
      <circle cx="48" cy="48" r="4.5" fill={gold} />
      <circle cx="46" cy="45.6" r="1.3" fill="rgba(255,255,255,0.55)" />
    </svg>
  )
}

/* ── Ícones de formulário (stroke 1.5) ───────────────────────────── */
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t3} strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7.5 12 13l8.5-5.5" />
    </svg>
  )
}
function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t3} strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1.4" fill={t3} stroke="none" />
    </svg>
  )
}
function IconEye({ off }: { off: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12 C 5.5 6.8, 18.5 6.8, 21.5 12 C 18.5 17.2, 5.5 17.2, 2.5 12 Z" />
      <circle cx="12" cy="12" r="2.8" />
      {off && <line x1="4.5" y1="20" x2="19.5" y2="4" />}
    </svg>
  )
}
function Tick() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="10" cy="10" r="8.5" stroke={lineG} strokeWidth="1" />
      <path d="M6.2 10.3l2.5 2.5 5-5.4" stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function Spinner() {
  return (
    <svg className="og-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="rgba(26,19,5,0.25)" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="#1a1305" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

const BULLETS = [
  'DRE automática com dados reais da Amazon',
  'Mineração de produtos e análise de concorrência',
  'Calculadora de precisão que bate com a Amazon',
]

function BrandCore({ condensed }: { condensed?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: condensed ? 'center' : 'flex-start', textAlign: condensed ? 'center' : 'left' }}>
      <OracleEye size={condensed ? 56 : 72} />
      <div style={{
        fontFamily: "'Bricolage Grotesque','Plus Jakarta Sans',sans-serif", fontWeight: 800,
        fontSize: condensed ? 19 : 26, letterSpacing: '0.35em', marginRight: '-0.35em',
        color: t1, marginTop: condensed ? 14 : 22, lineHeight: 1,
      }}>
        ORÁCULO
      </div>
      <p style={{ fontStyle: 'italic', color: t2, fontSize: condensed ? 13 : 15, marginTop: condensed ? 8 : 12, lineHeight: 1.5 }}>
        Pare de adivinhar. Comece a enxergar.
      </p>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const year = new Date().getFullYear()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Não foi possível entrar. Tente novamente.')
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Plus+Jakarta+Sans:ital,wght@0,400..800;1,400..800&family=JetBrains+Mono:wght@500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:${bg};-webkit-font-smoothing:antialiased}

        .og-shell{min-height:100dvh;display:grid;grid-template-columns:55fr 45fr;background:${bg}}

        /* ── painel de marca ── */
        .og-brand{position:relative;display:flex;flex-direction:column;justify-content:center;
          background:#05050C;padding:72px 64px;overflow:hidden;border-right:1px solid ${line}}
        .og-brand-halo{position:absolute;inset:0;pointer-events:none;
          background:radial-gradient(ellipse 90% 55% at 50% -8%,rgba(240,194,98,0.14),transparent 68%)}
        .og-brand-grid{position:absolute;inset:0;pointer-events:none;
          background-image:linear-gradient(rgba(240,180,41,0.05) 1px,transparent 1px),
            linear-gradient(90deg,rgba(240,180,41,0.05) 1px,transparent 1px);
          background-size:52px 52px;
          -webkit-mask-image:radial-gradient(ellipse 85% 75% at 50% 32%,#000 25%,transparent 78%);
          mask-image:radial-gradient(ellipse 85% 75% at 50% 32%,#000 25%,transparent 78%);
          animation:og-breathe 9s ease-in-out infinite}
        @keyframes og-breathe{0%,100%{opacity:.55}50%{opacity:1}}

        /* ── inputs ── */
        .og-input{width:100%;background:${bg};border:1px solid ${line};border-radius:10px;
          padding:12px 14px 12px 42px;color:${t1};font-size:14px;font-family:inherit;
          transition:border-color .15s ease,box-shadow .15s ease}
        .og-input::placeholder{color:${t3}}
        .og-input:focus{outline:none;border-color:${lineG};box-shadow:0 0 0 3px rgba(240,180,41,0.12)}

        .og-toggle{position:absolute;top:50%;right:6px;transform:translateY(-50%);
          width:32px;height:32px;display:flex;align-items:center;justify-content:center;
          background:none;border:none;border-radius:8px;color:${t3};cursor:pointer;
          transition:color .15s ease,background .15s ease}
        .og-toggle:hover{color:${t2};background:rgba(255,255,255,0.04)}
        .og-toggle:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(240,180,41,0.12);color:${t2}}

        /* ── CTA ── */
        .og-cta{width:100%;display:flex;align-items:center;justify-content:center;gap:9px;
          background:${goldG};color:#1a1305;font-weight:800;font-size:14px;font-family:inherit;
          padding:13px 16px;border:none;border-radius:10px;cursor:pointer;
          box-shadow:0 6px 18px rgba(240,180,41,0.16);
          transition:transform .15s ease,box-shadow .15s ease,opacity .15s ease}
        .og-cta:hover:not(:disabled){transform:translateY(-1px);
          box-shadow:0 10px 28px rgba(240,180,41,0.26),0 2px 8px rgba(240,180,41,0.18)}
        .og-cta:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(240,180,41,0.25),0 6px 18px rgba(240,180,41,0.16)}
        .og-cta:disabled{opacity:.75;cursor:not-allowed;transform:none}

        .og-spin{animation:og-rotate 0.9s linear infinite}
        @keyframes og-rotate{to{transform:rotate(360deg)}}

        .og-link{color:${t2};font-size:12.5px;text-decoration:none;transition:color .15s ease}
        .og-link:hover{color:${t1}}
        .og-link:focus-visible{outline:1px solid ${lineG};outline-offset:3px;border-radius:3px}
        .og-link-gold{color:${gold};font-weight:600;text-decoration:none;transition:opacity .15s ease}
        .og-link-gold:hover{opacity:.8}
        .og-link-gold:focus-visible{outline:1px solid ${lineG};outline-offset:3px;border-radius:3px}

        /* ── responsivo ── */
        .og-brand-mobile{display:none}
        @media (max-width:920px){
          .og-shell{grid-template-columns:1fr}
          .og-brand{display:none}
          .og-brand-mobile{display:flex;justify-content:center;margin-bottom:28px}
          .og-form-col{padding:36px 20px 44px !important;align-items:flex-start !important}
          .og-card{padding:28px 22px !important}
        }
        @media (prefers-reduced-motion:reduce){
          .og-brand-grid{animation:none}
          .og-cta,.og-cta:hover:not(:disabled){transition:none;transform:none}
        }
      `}</style>

      <div className="og-shell">
        {/* ═══ ESQUERDA · painel de marca ═══ */}
        <section className="og-brand" aria-label="Oráculo — Amazon Intelligence">
          <div className="og-brand-halo" />
          <div className="og-brand-grid" />

          <div style={{ position: 'relative', maxWidth: 460 }}>
            <BrandCore />

            <ul style={{ listStyle: 'none', marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {BULLETS.map(b => (
                <li key={b} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: t2, fontSize: 13.5, lineHeight: 1.5 }}>
                  <Tick />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{
            position: 'absolute', left: 64, bottom: 28, color: t3, fontSize: 11,
            letterSpacing: '0.08em',
          }}>
            © <span style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{year}</span> Oráculo · Amazon Intelligence
          </div>
        </section>

        {/* ═══ DIREITA · formulário ═══ */}
        <main className="og-form-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 44px' }}>
          <div className="og-brand-mobile"><BrandCore condensed /></div>

          <div className="og-card" style={{
            width: '100%', maxWidth: 440, background: card, border: `1px solid ${line}`,
            borderRadius: 18, padding: '40px 36px', boxShadow: '0 30px 70px rgba(0,0,0,0.45)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 22, height: 1, background: gold, flexShrink: 0 }} aria-hidden="true" />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', color: gold, textTransform: 'uppercase' }}>
                Acesso ao painel
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Bricolage Grotesque','Plus Jakarta Sans',sans-serif",
              fontWeight: 700, fontSize: 26, color: t1, letterSpacing: '-0.01em', marginBottom: 28,
            }}>
              Entre na sua conta
            </h1>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>
              <div>
                <label htmlFor="og-email" style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t3, marginBottom: 8 }}>
                  E-mail
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
                    <IconMail />
                  </span>
                  <input id="og-email" className="og-input" type="email" required
                    autoComplete="email" inputMode="email" placeholder="seu@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div>
                <label htmlFor="og-password" style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t3, marginBottom: 8 }}>
                  Senha
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
                    <IconLock />
                  </span>
                  <input id="og-password" className="og-input" type={showPass ? 'text' : 'password'} required
                    autoComplete="current-password" placeholder="••••••••"
                    style={{ paddingRight: 44 }}
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" className="og-toggle"
                    aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPass(v => !v)}>
                    <IconEye off={showPass} />
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" style={{
                  background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: 10, padding: '10px 14px', color: red, fontSize: 12.5, lineHeight: 1.45,
                }}>
                  {error}
                </div>
              )}

              <button type="submit" className="og-cta" disabled={loading} style={{ marginTop: 4 }}>
                {loading ? (<><Spinner /><span>Entrando…</span></>) : 'Entrar'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link href="/forgot-password" className="og-link">Esqueci minha senha</Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0' }} aria-hidden="true">
              <span style={{ flex: 1, height: 1, background: line }} />
              <span style={{ fontSize: 11, color: t3, letterSpacing: '0.08em' }}>ou</span>
              <span style={{ flex: 1, height: 1, background: line }} />
            </div>

            <p style={{ textAlign: 'center', fontSize: 12.5, color: t2 }}>
              Ainda não tem acesso?{' '}
              <Link href="/planos" className="og-link-gold">Conheça os planos</Link>
            </p>
          </div>
        </main>
      </div>
    </>
  )
}
