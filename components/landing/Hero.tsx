'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, Play, Zap, Table2, Lock, BadgeCheck,
  Pickaxe, Calculator, Puzzle, FileSpreadsheet, Sparkles,
} from 'lucide-react'
import DashboardMock from './DashboardMock'
import Nav from './Nav'
import { Bottle, NeoMark } from './marks'
import {
  RunWhenVisible, ScaledFrame, Float, MoneyUp, PctUp, Trend, Spark, Donut,
} from './ui'

// olho geométrico em SVG — só no cliente (lê mouse/scroll por frame)
const OracleEye = dynamic(() => import('./OracleEye'), { ssr: false })

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 0.12 + i * 0.09 },
  }),
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
        <ScaledFrame designWidth={860} minScale={0.62}>
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
  const scrollN = useRef(0) // 0 no topo → 1 depois de ~0.9 viewport (o olho reage)
  const [m, setM] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (reduce) return
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -((e.clientY / window.innerHeight) * 2 - 1)
      mouse.current = { x, y }
      setM({ x, y })
    }
    const onScroll = () => {
      scrollN.current = Math.min(1, window.scrollY / (window.innerHeight * 0.9))
    }
    onScroll()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [reduce])

  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="ora-backdrop" />
      <div className="ora-grid" />

      {/* olho — atrás do laptop, à direita */}
      <div aria-hidden className="ora-hero-eye" style={{
        position: 'absolute', right: '-10%', top: '-4%',
        width: 'min(1020px, 96vw)', aspectRatio: '900 / 560',
        transform: `translate(${m.x * 14}px, ${m.y * 10}px)`,
        zIndex: 1, pointerEvents: 'none',
        // dissolve nas bordas em vez de cortar duro na viewport
        maskImage: 'radial-gradient(72% 78% at 50% 50%, #000 55%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(72% 78% at 50% 50%, #000 55%, transparent 100%)',
      }}>
        {/* `dynamic(..., { ssr: false })` já garante que só monta no cliente */}
        <OracleEye mouse={mouse} scroll={scrollN} />
      </div>

      <Nav />

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
              <Trend value="28,6%" />
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
              <div style={{ marginTop: 8 }}><Trend value="5,4%" /></div>
            </FloatCard>
          </Float>

          {/* ROI Ads */}
          <Float delay={1.4} className="ora-hc" style={{ gridColumn: 'span 2' }}>
            <FloatCard>
              <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 6 }}>ROI (Ads)</div>
              <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--tx1)' }}><PctUp value={64.4} /></div>
              <div style={{ margin: '8px 0 6px' }}><Spark data={[18, 14, 22, 19, 27, 24, 32, 30, 38]} w={130} h={30} color="var(--violet)" /></div>
              <Trend value="12,1%" />
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
                    <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em', color: '#161006', background: 'linear-gradient(135deg,#FFE7A6,#E0AC3C)', borderRadius: 4, padding: '2px 6px' }}>DEMANDA ALTA</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: 'var(--emerald)', border: '1px solid rgba(63,215,155,.4)', borderRadius: 4, padding: '2px 6px' }}>BAIXA CONCORRÊNCIA</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tx1)', lineHeight: 1.25 }}>Garrafa de Água Squeeze 1L</div>
                  <div className="ora-num" style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 3 }}>BSR #1.305 · Est. vendas ~75/mês</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--tx3)' }}>Lucro estimado</div>
                  <div className="ora-num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--emerald)' }}>R$ 8,60 <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--tx3)' }}>/un</span></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--tx3)' }}>Margem</div>
                  <div className="ora-num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx1)' }}>35,1%</div>
                </div>
              </div>
            </FloatCard>
          </Float>

          {/* Agente NEO */}
          <Float delay={1} className="ora-hc-wide" style={{ gridColumn: 'span 3' }}>
            <FloatCard style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <NeoMark size={36} />
                <div>
                  <div className="ora-display" style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--tx1)', letterSpacing: '.06em' }}>
                    AGENTE <span className="ora-goldtext">NEO</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--tx3)' }}>Seu copiloto estratégico</div>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.55, flex: 1 }}>
                Lê sua DRE, seu estoque e seus Ads de verdade — encontre oportunidades,
                analise anúncios e tome decisões com mais segurança.
              </div>
              <a href="#agente" style={{
                marginTop: 10, alignSelf: 'flex-start', fontSize: 12.5, fontWeight: 700,
                color: 'var(--gold)', border: '1px solid rgba(240,194,98,0.4)',
                borderRadius: 999, padding: '11px 16px', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', minHeight: 42,
              }}>Conhecer o NEO →</a>
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
