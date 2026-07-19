'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, Play, Zap, Table2, Lock, BadgeCheck,
  Pickaxe, Calculator, Puzzle, FileSpreadsheet, Bot, Sparkles,
} from 'lucide-react'
import DashboardMock from './DashboardMock'
import {
  RunWhenVisible, ScaledFrame, Float, MoneyUp, PctUp, Trend, Spark, Donut,
} from './ui'

const EyeCanvas = dynamic(() => import('./EyeCanvas'), { ssr: false })

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 0.12 + i * 0.09 },
  }),
}

export function EyeMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <ellipse cx="24" cy="24" rx="22" ry="12" stroke="#F0C262" strokeWidth="2" />
      <circle cx="24" cy="24" r="7.5" fill="url(#gEye)" />
      <circle cx="24" cy="24" r="2.4" fill="#fff" />
      <defs>
        <radialGradient id="gEye" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0%" stopColor="#FFE7A6" />
          <stop offset="100%" stopColor="#C48F10" />
        </radialGradient>
      </defs>
    </svg>
  )
}

/* garrafa desenhada em SVG — produto destaque da mineração */
export function Bottle({ h = 54 }: { h?: number }) {
  return (
    <svg width={h * 0.42} height={h} viewBox="0 0 42 100" fill="none" aria-hidden>
      <defs>
        <linearGradient id="botG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#43E0D0" />
          <stop offset="55%" stopColor="#2BB8A9" />
          <stop offset="100%" stopColor="#1E8F84" />
        </linearGradient>
      </defs>
      <rect x="13" y="2" width="16" height="10" rx="3" fill="#1E8F84" />
      <path d="M11 14h20c0 6 4 8 4 16v58a10 10 0 0 1-10 10H17A10 10 0 0 1 7 88V30c0-8 4-10 4-16z" fill="url(#botG)" />
      <rect x="12" y="40" width="18" height="26" rx="4" fill="rgba(255,255,255,0.28)" />
    </svg>
  )
}

/* laptop com o dashboard dentro */
function Laptop() {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* tela */}
      <div style={{
        borderRadius: '16px 16px 0 0', border: '1px solid rgba(255,255,255,0.14)',
        borderBottom: 'none', background: '#05060B', padding: '10px 10px 0',
        boxShadow: '0 60px 140px -40px rgba(0,0,0,.95), 0 0 90px -30px rgba(240,194,98,.3)',
      }}>
        <ScaledFrame designWidth={860}>
          <DashboardMock />
        </ScaledFrame>
      </div>
      {/* base */}
      <div style={{
        height: 14, borderRadius: '0 0 18px 18px',
        background: 'linear-gradient(180deg, #23252E 0%, #0D0E14 90%)',
        border: '1px solid rgba(255,255,255,0.12)', borderTop: '1px solid rgba(255,255,255,0.2)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)',
          width: 110, height: 6, borderRadius: '0 0 8px 8px', background: 'rgba(0,0,0,0.5)',
        }} />
      </div>
      {/* brilho no chão */}
      <div aria-hidden style={{
        position: 'absolute', left: '4%', right: '4%', bottom: -34, height: 34,
        background: 'radial-gradient(50% 100% at 50% 0%, rgba(240,194,98,0.14), transparent 75%)',
        filter: 'blur(6px)',
      }} />
    </div>
  )
}

/* card flutuante genérico */
function FloatCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="ora-glass" style={{
      borderRadius: 14, padding: '13px 15px', textAlign: 'left', height: '100%', ...style,
    }}>{children}</div>
  )
}

const heroIcons = [
  { icon: <span className="ora-display" style={{ fontWeight: 800, fontSize: 15 }}>a</span>, label: 'Integração Amazon' },
  { icon: <Zap size={14} />, label: 'DRE automática' },
  { icon: <Pickaxe size={14} />, label: 'Mineração' },
  { icon: <Calculator size={14} />, label: 'Calculadora' },
  { icon: <Puzzle size={14} />, label: 'Extensão Chrome' },
]

const trustBar = [
  { icon: <BadgeCheck size={17} />, t: 'Aprovado pela Amazon', d: 'Integração oficial SP-API revisada e aprovada.' },
  { icon: <Table2 size={17} />, t: 'Dados 100% reais', d: 'Direto da sua conta Amazon, sem achismo.' },
  { icon: <Zap size={17} />, t: 'Acesso imediato', d: 'Conecte sua conta e veja seus números em minutos.' },
  { icon: <FileSpreadsheet size={17} />, t: 'Sem planilha', d: 'Tudo automático, sempre atualizado e confiável.' },
  { icon: <Lock size={17} />, t: 'Segurança total', d: 'Criptografia de ponta a ponta e conformidade LGPD.' },
]

export default function Hero() {
  const reduce = useReducedMotion()
  const mouse = useRef({ x: 0, y: 0 })
  const [m, setM] = useState({ x: 0, y: 0 })
  const [allowWebgl, setAllowWebgl] = useState(false)

  useEffect(() => { setAllowWebgl(!reduce) }, [reduce])

  useEffect(() => {
    if (reduce) return
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -((e.clientY / window.innerHeight) * 2 - 1)
      mouse.current = { x, y }
      setM({ x, y })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [reduce])

  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="ora-backdrop" />
      <div className="ora-grid" />

      {/* olho — atrás do laptop, à direita */}
      <div aria-hidden className="ora-hero-eye" style={{
        position: 'absolute', right: '-11%', top: '-24%',
        width: 'min(880px, 92vw)', height: 'min(880px, 92vw)',
        transform: `translate(${m.x * 16}px, ${m.y * 11}px)`,
        zIndex: 1, pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.6,
          maskImage: 'radial-gradient(closest-side, #000 38%, transparent 74%)',
          WebkitMaskImage: 'radial-gradient(closest-side, #000 38%, transparent 74%)',
        }}>
          <Image src="/oracle-eye.png" alt="" fill priority sizes="880px"
            style={{ objectFit: 'contain', filter: 'saturate(1.15) brightness(0.95)' }} />
        </div>
        {allowWebgl && <div style={{ position: 'absolute', inset: 0 }}><EyeCanvas mouse={mouse} /></div>}
      </div>

      {/* NAV */}
      <nav style={{
        position: 'relative', zIndex: 6, maxWidth: 1240, margin: '0 auto',
        padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--tx1)' }}>
          <EyeMark />
          <span className="ora-display" style={{ fontWeight: 700, fontSize: 19, letterSpacing: '.04em' }}>ORÁCULO</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26 }} className="ora-nav-links">
          {[
            { l: 'Gestão', h: '#gestao' },
            { l: 'Como funciona', h: '#como-funciona' },
            { l: 'Mineração', h: '#mineracao' },
            { l: 'Inteligência', h: '#inteligencia' },
            { l: 'Preços', h: '#planos' },
          ].map(({ l, h }) => (
            <a key={l} href={h} style={{ color: 'var(--tx2)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/login" className="ora-cta-ghost" style={{ padding: '.58rem 1.05rem', fontSize: 14 }}>Entrar</a>
          <a href="#planos" className="ora-cta" style={{ padding: '.58rem 1.15rem', fontSize: 14 }}>Começar agora</a>
        </div>
      </nav>

      {/* GRID: texto + laptop */}
      <div className="ora-hero-grid" style={{
        position: 'relative', zIndex: 5, maxWidth: 1240, margin: '0 auto',
        padding: 'clamp(30px, 6vh, 70px) 24px 0',
        display: 'grid', gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 6.5fr)',
        gap: 'clamp(28px, 4vw, 56px)', alignItems: 'center',
      }}>
        {/* coluna texto */}
        <div>
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <span className="ora-kicker"><Sparkles size={12} /> Inteligência real para vendedores Amazon</span>
          </motion.div>

          <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show"
            style={{ fontSize: 'clamp(2.05rem, 4.3vw, 3.5rem)', fontWeight: 800, lineHeight: 1.06, margin: '24px 0 0' }}>
            A Amazon mostra<br />quanto você vende.<br />
            <span className="ora-goldtext">O Oráculo mostra<br />quanto realmente sobra.</span>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
            style={{ fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: 'var(--tx2)', maxWidth: 480, margin: '22px 0 0', lineHeight: 1.62 }}>
            Tenha uma <strong style={{ color: 'var(--tx1)' }}>DRE completa</strong> da sua operação:
            lucro real, margem, taxas, FBA, Ads, estoque e Curva ABC num painel claro.
            E use mineração, calculadora, extensão e IA para decidir melhor antes de
            comprar, anunciar ou escalar.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
            style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 30 }}>
            <a href="#planos" className="ora-cta">Quero enxergar meu lucro real <ArrowRight size={18} /></a>
            <a href="#gestao" className="ora-cta-ghost"><Play size={15} /> Ver o Oráculo por dentro</a>
          </motion.div>

          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 22px', marginTop: 28, color: 'var(--tx3)', fontSize: 13 }}>
            {heroIcons.map((x) => (
              <span key={x.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ color: 'var(--gold)', display: 'inline-flex', width: 16, justifyContent: 'center' }}>{x.icon}</span>
                {x.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* coluna laptop */}
        <RunWhenVisible amount={0.2}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 46 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.2, 0.7, 0.2, 1], delay: 0.35 }}
            style={{ transform: `translate(${m.x * -7}px, ${m.y * -5}px)` }}
          >
            <Laptop />
          </motion.div>
        </RunWhenVisible>
      </div>

      {/* CARDS FLUTUANTES */}
      <RunWhenVisible amount={0.2} style={{ position: 'relative', zIndex: 5 }}>
        <div className="ora-hero-cards" style={{
          maxWidth: 1240, margin: '0 auto', padding: 'clamp(44px, 7vh, 76px) 24px 0',
          display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, alignItems: 'stretch',
        }}>
          {/* Lucro Bruto */}
          <Float delay={0} className="ora-hc" style={{ gridColumn: 'span 2' }}>
            <FloatCard>
              <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 6 }}>Lucro Bruto</div>
              <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--emerald)' }}><MoneyUp value={2972.88} /></div>
              <div style={{ margin: '8px 0 6px' }}><Spark data={[10, 16, 13, 20, 18, 26, 23, 31, 36]} w={130} h={30} color="var(--emerald)" /></div>
              <Trend value="28,6%" size={10} />
            </FloatCard>
          </Float>

          {/* Margem donut */}
          <Float delay={0.7} className="ora-hc" style={{ gridColumn: 'span 2' }}>
            <FloatCard>
              <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 6 }}>Margem</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--tx1)' }}><PctUp value={33.7} /></div>
                <Donut size={46} thickness={8} segments={[
                  { value: 33.7, color: 'var(--violet)' }, { value: 66.3, color: 'rgba(255,255,255,0.08)' },
                ]} />
              </div>
              <div style={{ marginTop: 8 }}><Trend value="5,4%" size={10} /></div>
            </FloatCard>
          </Float>

          {/* ROI Ads */}
          <Float delay={1.4} className="ora-hc" style={{ gridColumn: 'span 2' }}>
            <FloatCard>
              <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 6 }}>ROI (Ads)</div>
              <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--tx1)' }}><PctUp value={64.4} /></div>
              <div style={{ margin: '8px 0 6px' }}><Spark data={[18, 14, 22, 19, 27, 24, 32, 30, 38]} w={130} h={30} color="var(--violet)" /></div>
              <Trend value="12,1%" size={10} />
            </FloatCard>
          </Float>

          {/* Mineração destaque */}
          <Float delay={0.4} className="ora-hc-wide" style={{ gridColumn: 'span 3' }}>
            <FloatCard>
              <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 8 }}>Mineração em destaque</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 52, height: 62, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center',
                  background: 'linear-gradient(160deg, rgba(67,224,208,0.14), rgba(30,143,132,0.08))',
                  border: '1px solid rgba(67,224,208,0.25)',
                }}>
                  <Bottle h={46} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
                    <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.06em', color: '#161006', background: 'linear-gradient(135deg,#FFE7A6,#E0AC3C)', borderRadius: 4, padding: '2px 6px' }}>DEMANDA ALTA</span>
                    <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.06em', color: 'var(--emerald)', border: '1px solid rgba(63,215,155,.4)', borderRadius: 4, padding: '2px 6px' }}>BAIXA CONCORRÊNCIA</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tx1)', lineHeight: 1.25 }}>Garrafa de Água Squeeze 1L</div>
                  <div className="ora-num" style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 3 }}>BSR #1.305 · Est. vendas ~75/mês</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: 9.5, color: 'var(--tx3)' }}>Lucro estimado</div>
                  <div className="ora-num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--emerald)' }}>R$ 8,60 <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--tx3)' }}>/un</span></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--tx3)' }}>Margem</div>
                  <div className="ora-num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx1)' }}>35,1%</div>
                </div>
              </div>
            </FloatCard>
          </Float>

          {/* Agente IA */}
          <Float delay={1} className="ora-hc-wide" style={{ gridColumn: 'span 3' }}>
            <FloatCard style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
                  background: 'linear-gradient(135deg, rgba(169,155,255,0.2), rgba(94,155,224,0.12))',
                  border: '1px solid rgba(169,155,255,0.35)', color: 'var(--violet)',
                }}>
                  <Bot size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--tx1)' }}>Agente IA</div>
                  <div style={{ fontSize: 10, color: 'var(--tx3)' }}>Seu copiloto estratégico</div>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--tx2)', lineHeight: 1.55, flex: 1 }}>
                Lê sua DRE, seu estoque e seus Ads de verdade — encontre oportunidades,
                analise anúncios e tome decisões com mais segurança.
              </div>
              <a href="#inteligencia" style={{
                marginTop: 10, alignSelf: 'flex-start', fontSize: 11.5, fontWeight: 700,
                color: 'var(--violet)', border: '1px solid rgba(169,155,255,0.4)',
                borderRadius: 999, padding: '6px 13px', textDecoration: 'none',
              }}>Conhecer o Agente IA →</a>
            </FloatCard>
          </Float>
        </div>
      </RunWhenVisible>

      {/* TRUST BAR */}
      <RunWhenVisible amount={0.3} style={{ position: 'relative', zIndex: 5 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(40px, 6vh, 64px) 24px 64px' }}>
          <div className="ora-trustbar" style={{
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
            border: '1px solid rgba(240,194,98,0.16)', borderRadius: 16,
            background: 'linear-gradient(180deg, rgba(16,16,34,0.5), rgba(8,8,20,0.6))',
            overflow: 'hidden',
          }}>
            {trustBar.map((x, i) => (
              <div key={x.t} className="ora-trustcell" style={{
                padding: '18px 18px', borderLeft: i ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold)', marginBottom: 6 }}>
                  {x.icon}
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tx1)' }}>{x.t}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--tx3)', lineHeight: 1.5 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </RunWhenVisible>

      <div className="ora-noise" />
      <div className="ora-scan" />
    </section>
  )
}
