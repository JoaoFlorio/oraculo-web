'use client'

/**
 * Primitivos visuais da landing — count-up, sparkline, donut, badges e
 * moldura escalada (mockups desenhados em px fixo, escalados ao container).
 * Tudo respeita prefers-reduced-motion.
 */

import {
  createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState,
  type CSSProperties, type ReactNode,
} from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

/* ── formatadores ──────────────────────────────────────────────────────── */
export const brl = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const pct = (n: number, d = 1) => `${n.toFixed(d).replace('.', ',')}%`

/* ── contexto: dispara animações quando a seção entra na tela ─────────── */
const RunCtx = createContext(false)
export const useRun = () => useContext(RunCtx)

export function RunWhenVisible({ children, amount = 0.25, style, className }: {
  children: ReactNode; amount?: number; style?: CSSProperties; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount })
  return (
    <div ref={ref} style={style} className={className}>
      <RunCtx.Provider value={inView}>{children}</RunCtx.Provider>
    </div>
  )
}

/* ── count-up ──────────────────────────────────────────────────────────── */
export function useCountUp(target: number, run: boolean, dur = 1500, delay = 0) {
  const [val, setVal] = useState(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!run) return
    // com movimento reduzido, salta direto ao valor final — agendado num frame
    // para não disparar setState de forma síncrona dentro do efeito
    let raf = requestAnimationFrame(reduce ? () => setVal(target) : tick)
    const t0 = performance.now() + delay
    function tick(t: number) {
      const p = Math.min(1, Math.max(0, (t - t0) / dur))
      setVal(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    return () => cancelAnimationFrame(raf)
  }, [target, run, dur, delay, reduce])
  return val
}

export function MoneyUp({ value, prefix = 'R$ ', dur = 1500, delay = 0, style }: {
  value: number; prefix?: string; dur?: number; delay?: number; style?: CSSProperties
}) {
  const run = useRun()
  const v = useCountUp(value, run, dur, delay)
  return <span className="ora-num" style={style}>{prefix}{brl(v)}</span>
}

export function PctUp({ value, dur = 1400, delay = 0, d = 1, style }: {
  value: number; dur?: number; delay?: number; d?: number; style?: CSSProperties
}) {
  const run = useRun()
  const v = useCountUp(value, run, dur, delay)
  return <span className="ora-num" style={style}>{v.toFixed(d).replace('.', ',')}%</span>
}

export function IntUp({ value, dur = 1200, delay = 0, style }: {
  value: number; dur?: number; delay?: number; style?: CSSProperties
}) {
  const run = useRun()
  const v = useCountUp(value, run, dur, delay)
  return <span className="ora-num" style={style}>{Math.round(v).toLocaleString('pt-BR')}</span>
}

/* ── badge de variação (▲ 23,6% vs 30 dias anteriores) ────────────────── */
/**
 * `size` vale para os mockups (que são escalados como ilustração). Fora deles
 * o tamanho vem da classe `.ora-trend`, que sobe no mobile — 10px é pequeno
 * demais para leitura real num celular.
 */
export function Trend({ value, label = 'vs 30 dias anteriores', down = false, size }: {
  value: string; label?: string; down?: boolean; size?: number
}) {
  const color = down ? '#FF8A8A' : 'var(--emerald)'
  return (
    <span
      className={size === undefined ? 'ora-trend' : undefined}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontSize: size, color: 'var(--tx3)' }}
    >
      <span className="ora-num" style={{ color, fontWeight: 700 }}>{down ? '▼' : '▲'} {value}</span>
      {label && <span>{label}</span>}
    </span>
  )
}

/* ── sparkline SVG com draw-in ────────────────────────────────────────── */
export function Spark({
  data, w = 120, h = 36, color = 'var(--emerald)', fill = true, strokeWidth = 2, delay = 0,
}: {
  data: number[]; w?: number; h?: number; color?: string; fill?: boolean; strokeWidth?: number; delay?: number
}) {
  const run = useRun()
  const reduce = useReducedMotion()
  const id = useId() // SSR-safe: mesmo id no servidor e no cliente
  const min = Math.min(...data), max = Math.max(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - 3 - ((v - min) / span) * (h - 6),
  ])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && (
        <motion.path d={area} fill={`url(#${id})`}
          initial={reduce ? false : { opacity: 0 }}
          animate={run ? { opacity: 1 } : undefined}
          transition={{ duration: 0.9, delay: delay + 0.55 }}
        />
      )}
      <motion.path d={line} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={run ? { pathLength: 1 } : undefined}
        transition={{ duration: 1.3, ease: [0.3, 0.7, 0.2, 1], delay }}
      />
    </svg>
  )
}

/* ── donut SVG (segmentos animados) ───────────────────────────────────── */
export function Donut({
  segments, size = 74, thickness = 11, delay = 0, children,
}: {
  segments: { value: number; color: string }[]
  size?: number; thickness?: number; delay?: number; children?: ReactNode
}) {
  const run = useRun()
  const reduce = useReducedMotion()
  const r = (size - thickness) / 2
  const C = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  // offsets calculados de uma vez: acumular dentro do map mutaria durante o render
  const offsets = segments.reduce<number[]>((acc, s, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + segments[i - 1].value / total)
    return acc
  }, [])
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total
          const off = offsets[i]
          return (
            <motion.circle key={i}
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={thickness} strokeLinecap="butt"
              strokeDasharray={`${Math.max(frac * C - 1.5, 0)} ${C}`}
              style={{ transformOrigin: '50% 50%', rotate: `${off * 360}deg` }}
              initial={reduce ? false : { opacity: 0, strokeDashoffset: frac * C }}
              animate={run ? { opacity: 1, strokeDashoffset: 0 } : undefined}
              transition={{ duration: 1.1, ease: [0.3, 0.7, 0.2, 1], delay: delay + i * 0.16 }}
            />
          )
        })}
      </svg>
      {children && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{children}</div>
      )}
    </div>
  )
}

/* ── barras verticais animadas (mini histograma) ──────────────────────── */
export function Bars({ data, w = 110, h = 34, color = 'var(--violet)', delay = 0, gap = 3 }: {
  data: number[]; w?: number; h?: number; color?: string; delay?: number; gap?: number
}) {
  const run = useRun()
  const reduce = useReducedMotion()
  const max = Math.max(...data) || 1
  const bw = (w - gap * (data.length - 1)) / data.length
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }} aria-hidden>
      {data.map((v, i) => {
        const bh = Math.max(2, (v / max) * h)
        return (
          <motion.rect key={i}
            x={i * (bw + gap)} width={bw} rx={2}
            fill={color} opacity={0.85}
            initial={reduce ? { y: h - bh, height: bh } : { y: h, height: 0 }}
            animate={run ? { y: h - bh, height: bh } : undefined}
            transition={{ duration: 0.7, ease: [0.3, 0.7, 0.2, 1], delay: delay + i * 0.05 }}
          />
        )
      })}
    </svg>
  )
}

/* ── moldura escalada: mockups desenhados em px fixo ──────────────────── */
/**
 * Escala um mockup de largura fixa para caber no container.
 *
 * `minScale` é o piso de legibilidade: se couber apenas abaixo dele (telas
 * estreitas), o mockup para de encolher e o container vira uma área de
 * arrasto horizontal — o leitor desliza pra ver o resto, em vez de encarar
 * texto de 4px. Sem isso, um painel de 860px vira 38% num celular.
 */
export function ScaledFrame({ designWidth, children, maxScale = 1, minScale = 1, style }: {
  designWidth: number; children: ReactNode; maxScale?: number; minScale?: number; style?: CSSProperties
}) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(maxScale)
  const [dh, setDh] = useState<number | null>(null)
  const [scrolls, setScrolls] = useState(false)

  useLayoutEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current) return
      const fit = outer.current.clientWidth / designWidth
      const s = Math.max(minScale, Math.min(maxScale, fit))
      setScale(s)
      setScrolls(s > fit + 0.001) // não coube: vira área de arrasto
      setDh(inner.current.offsetHeight * s)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (outer.current) ro.observe(outer.current)
    if (inner.current) ro.observe(inner.current)
    return () => ro.disconnect()
  }, [designWidth, maxScale, minScale])

  return (
    // minWidth:0 impede que o filho de largura fixa (designWidth) vire o
    // min-content do container — senão um grid `1fr` estoura no mobile.
    <div
      ref={outer}
      className={scrolls ? 'ora-frame-scroll' : undefined}
      style={{
        width: '100%', minWidth: 0, height: dh ?? 'auto',
        overflowX: scrolls ? 'auto' : 'visible',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
    >
      {/* wrapper com a largura JÁ escalada: transform não conta no layout,
          então sem ele o scroll correria até designWidth (largo demais) */}
      <div style={{ width: designWidth * scale, height: dh ?? undefined }}>
        {/* data-mock: conteúdo é ilustração escalada — auditorias de layout e
            de tipografia devem medir o wrapper, não os filhos em px de design */}
        <div ref={inner} data-mock="" style={{ width: designWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ── flutuação ambiente (cards soltos) ────────────────────────────────── */
export function Float({ children, delay = 0, amp = 8, dur = 5.5, style, className }: {
  children: ReactNode; delay?: number; amp?: number; dur?: number; style?: CSSProperties; className?: string
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div style={style} className={className}>{children}</div>
  return (
    <motion.div style={style} className={className}
      animate={{ y: [0, -amp, 0] }}
      transition={{ duration: dur, ease: 'easeInOut', repeat: Infinity, delay }}
    >
      {children}
    </motion.div>
  )
}
