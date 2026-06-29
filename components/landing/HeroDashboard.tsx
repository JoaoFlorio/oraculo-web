'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { TrendingUp, Wallet, Percent, Target } from 'lucide-react'

const chartData = [
  { v: 12 }, { v: 18 }, { v: 15 }, { v: 24 }, { v: 22 },
  { v: 31 }, { v: 28 }, { v: 39 }, { v: 44 }, { v: 41 }, { v: 53 }, { v: 64 },
]

function useCountUp(target: number, run: boolean, dur = 1400) {
  const [val, setVal] = useState(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!run) return
    if (reduce) { setVal(target); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, run, dur, reduce])
  return val
}

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Kpi({
  icon, label, value, run, accent,
}: {
  icon: React.ReactNode; label: string; value: string; run: boolean; accent: string
}) {
  return (
    <div
      className="ora-num"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '12px 13px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <span style={{ color: accent, display: 'inline-flex' }}>{icon}</span>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '.04em',
          color: 'var(--tx2)', textTransform: 'uppercase',
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: 'var(--tx1)',
        opacity: run ? 1 : 0, transition: 'opacity .4s', lineHeight: 1,
      }}>{value}</div>
    </div>
  )
}

export default function HeroDashboard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const reduce = useReducedMotion()

  const fat = useCountUp(257288, inView)        // R$ 2.572,88 (em centavos p/ suavidade)
  const margem = useCountUp(64.4, inView)
  const roi = useCountUp(33.7, inView)
  const lucro = useCountUp(165741, inView)

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 60, rotateX: 18 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 9 } : undefined}
      transition={{ duration: 1, ease: [0.2, 0.7, 0.2, 1], delay: 0.2 }}
      style={{ transformStyle: 'preserve-3d', perspective: 1200, width: 'min(560px, 92vw)' }}
    >
      <div
        className="ora-glass"
        style={{ borderRadius: 20, padding: 18, transform: 'rotateX(9deg)' }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: 'radial-gradient(circle at 50% 40%, #FFE7A6, #C48F10)',
              boxShadow: '0 0 14px rgba(240,194,98,.6)',
            }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--tx1)' }}>Resumo · Gestão</span>
          </div>
          <span style={{
            fontSize: 11, color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(63,215,155,.1)', border: '1px solid rgba(63,215,155,.25)',
            padding: '3px 9px', borderRadius: 999,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', boxShadow: '0 0 8px var(--emerald)' }} />
            ao vivo
          </span>
        </div>

        {/* destaque faturamento + chart */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 12, marginBottom: 14,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Lucro real (mês)
            </div>
            <div className="ora-num" style={{ fontSize: 30, fontWeight: 800, color: 'var(--tx1)', lineHeight: 1.1 }}>
              <span style={{ fontSize: 18, color: 'var(--tx2)' }}>R$ </span>{brl(lucro / 100)}
            </div>
          </div>
          <div style={{ width: 150, height: 54, opacity: 0.95 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="oraArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F0C262" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#F0C262" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#F0C262" strokeWidth={2} fill="url(#oraArea)" isAnimationActive={!reduce} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <Kpi run={inView} accent="var(--gold)" icon={<Wallet size={15} />} label="Faturamento" value={`R$ ${brl(fat / 100)}`} />
          <Kpi run={inView} accent="var(--emerald)" icon={<Percent size={15} />} label="Margem" value={`${margem.toFixed(1)}%`} />
          <Kpi run={inView} accent="var(--violet)" icon={<Target size={15} />} label="ROI" value={`${roi.toFixed(1)}%`} />
          <Kpi run={inView} accent="var(--blue)" icon={<TrendingUp size={15} />} label="TACOS" value={`${(roi / 4).toFixed(1)}%`} />
        </div>
      </div>
    </motion.div>
  )
}
