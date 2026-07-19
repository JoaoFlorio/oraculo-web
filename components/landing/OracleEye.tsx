'use client'

/**
 * Olho do Oráculo — line art geométrico (SVG), estilo "sacred geometry + HUD".
 *
 * Composição, de fora pra dentro:
 *   · anéis externos + coroa de ticks (giram devagar, sentidos opostos)
 *   · dois triângulos sobrepostos (giram em contra-rotação)
 *   · contorno em amêndoa com neon dourado (halo + linha + núcleo claro)
 *   · íris: anéis concêntricos + 90 raios radiais
 *   · pupila escura com dois brilhos especulares
 *
 * Vida:
 *   · íris e pupila seguem o mouse (pupila com parallax maior)
 *   · pisca a cada ~6s (achata no eixo Y)
 *   · scroll faz o olhar descer, a pupila contrair e o conjunto esmaecer
 *
 * Sem WebGL: nítido em qualquer DPI e barato de renderizar.
 */

import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion'

const CX = 450
const CY = 280

/* polar → cartesiano, relativo ao centro (0,0) do grupo interno */
function pol(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180
  return [r * Math.cos(a), r * Math.sin(a)]
}

/* ── geometria pré-calculada ──────────────────────────────────────────── */

const ALMOND = 'M 130 280 C 232 143, 668 143, 770 280 C 668 417, 232 417, 130 280 Z'

/* raios da íris */
const RAYS = Array.from({ length: 90 }, (_, i) => {
  const deg = i * 4
  const [x1, y1] = pol(59, deg)
  const [x2, y2] = pol(103, deg)
  return { x1, y1, x2, y2, o: i % 3 === 0 ? 0.85 : i % 2 === 0 ? 0.5 : 0.3 }
})

/* coroa de ticks ao redor da íris */
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const deg = i * 5
  const long = i % 6 === 0
  const [x1, y1] = pol(long ? 126 : 133, deg)
  const [x2, y2] = pol(143, deg)
  return { x1, y1, x2, y2, w: long ? 2 : 1, o: long ? 0.9 : 0.45 }
})

/* ticks do anel externo */
const OUTER_TICKS = Array.from({ length: 48 }, (_, i) => {
  const deg = i * 7.5
  const [x1, y1] = pol(238, deg)
  const [x2, y2] = pol(i % 4 === 0 ? 258 : 248, deg)
  return { x1, y1, x2, y2, o: i % 4 === 0 ? 0.7 : 0.3 }
})

/* triângulo equilátero inscrito */
function tri(r: number, rot: number) {
  return (
    [0, 120, 240]
      .map((d) => pol(r, d + rot))
      .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ') + ' Z'
  )
}

/* cantoneiras HUD */
const BRACKETS = [
  { x: -352, y: -196, sx: 1, sy: 1 },
  { x: 352, y: -196, sx: -1, sy: 1 },
  { x: -352, y: 196, sx: 1, sy: -1 },
  { x: 352, y: 196, sx: -1, sy: -1 },
]

export default function OracleEye({ mouse, scroll }: {
  mouse: React.RefObject<{ x: number; y: number }>
  scroll: React.RefObject<number>
}) {
  const reduce = useReducedMotion()

  const irisX = useMotionValue(0)
  const irisY = useMotionValue(0)
  const pupX = useMotionValue(0)
  const pupY = useMotionValue(0)
  const pupScale = useMotionValue(1)
  const fade = useMotionValue(1)

  useAnimationFrame(() => {
    if (reduce) return
    const m = mouse.current ?? { x: 0, y: 0 }
    const s = scroll.current ?? 0

    // alvo do olhar: mouse + deriva pra baixo conforme rola
    const tx = m.x * 30
    const ty = -m.y * 20 + s * 26

    const ease = (mv: typeof irisX, target: number, k: number) =>
      mv.set(mv.get() + (target - mv.get()) * k)

    ease(irisX, tx, 0.055)
    ease(irisY, ty, 0.055)
    ease(pupX, tx * 1.45, 0.075) // pupila corre mais que a íris
    ease(pupY, ty * 1.45, 0.075)
    ease(pupScale, 1 - s * 0.28, 0.06) // contrai ao rolar
    ease(fade, 1 - s * 0.5, 0.06)
  })

  const spin = (dur: number, dir = 1) =>
    reduce
      ? {}
      : {
          animate: { rotate: 360 * dir },
          transition: { duration: dur, repeat: Infinity, ease: 'linear' as const },
        }

  const origin = { transformOrigin: `${CX}px ${CY}px`, transformBox: 'view-box' as const }

  return (
    <motion.svg
      viewBox="0 0 900 560"
      width="100%"
      height="100%"
      style={{ opacity: fade, overflow: 'visible' }}
      aria-hidden
    >
      <defs>
        <radialGradient id="oeSocket" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1C1103" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#0C0803" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#050308" stopOpacity="0.75" />
        </radialGradient>
        <radialGradient id="oeIrisGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB43C" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#C87A0C" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7A4A04" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="oePupil" cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#1A1206" />
          <stop offset="70%" stopColor="#0A0703" />
          <stop offset="100%" stopColor="#040201" />
        </radialGradient>
        <filter id="oeBlurSoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="oeBlurTight" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.4" />
        </filter>
        <clipPath id="oeAlmondClip">
          <path d={ALMOND} />
        </clipPath>
      </defs>

      {/* ── geometria externa (não pisca) ──────────────────────────────── */}
      <g transform={`translate(${CX} ${CY})`} stroke="#F0C262" fill="none" strokeLinecap="round">
        {/* cantoneiras HUD */}
        {BRACKETS.map((b, i) => (
          <path
            key={i}
            d="M0,0 L74,0 M0,0 L0,52"
            transform={`translate(${b.x} ${b.y}) scale(${b.sx} ${b.sy})`}
            strokeWidth={1.6}
            opacity={0.42}
          />
        ))}
      </g>

      {/* anéis + ticks girando */}
      <motion.g {...spin(120)} style={origin}>
        <g transform={`translate(${CX} ${CY})`} stroke="#C48F10" fill="none">
          <circle r={243} strokeWidth={1.1} opacity={0.34} />
          {OUTER_TICKS.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={1.3} opacity={t.o} />
          ))}
        </g>
      </motion.g>

      <motion.g {...spin(200, -1)} style={origin}>
        <g transform={`translate(${CX} ${CY})`} stroke="#F0C262" fill="none">
          <circle r={205} strokeWidth={1.2} opacity={0.4} />
          <circle r={176} strokeWidth={1} opacity={0.26} strokeDasharray="3 9" />
        </g>
      </motion.g>

      {/* triângulos em contra-rotação */}
      <motion.g {...spin(150, -1)} style={origin}>
        <g transform={`translate(${CX} ${CY})`}>
          <path d={tri(252, 0)} fill="none" stroke="#F0C262" strokeWidth={1.7} opacity={0.62}
            strokeLinejoin="round" />
        </g>
      </motion.g>
      <motion.g {...spin(150)} style={origin}>
        <g transform={`translate(${CX} ${CY})`}>
          <path d={tri(238, 180)} fill="none" stroke="#C48F10" strokeWidth={1.5} opacity={0.5}
            strokeLinejoin="round" />
        </g>
      </motion.g>

      {/* ── o olho (pisca) ─────────────────────────────────────────────── */}
      <motion.g
        style={origin}
        animate={reduce ? undefined : { scaleY: [1, 1, 0.04, 1, 1] }}
        transition={reduce ? undefined : {
          duration: 6.2, times: [0, 0.86, 0.895, 0.93, 1],
          repeat: Infinity, ease: 'easeInOut',
        }}
      >
        {/* interior da órbita + brilho ambiente */}
        <path d={ALMOND} fill="url(#oeSocket)" />
        <g clipPath="url(#oeAlmondClip)">
          <circle cx={CX} cy={CY} r={200} fill="url(#oeIrisGlow)" filter="url(#oeBlurSoft)" />
        </g>

        {/* contorno neon da amêndoa: halo → linha → núcleo */}
        <path d={ALMOND} fill="none" stroke="#E09A18" strokeWidth={9} opacity={0.45} filter="url(#oeBlurSoft)" />
        <path d={ALMOND} fill="none" stroke="#F5B942" strokeWidth={4} opacity={0.95} filter="url(#oeBlurTight)" />
        <path d={ALMOND} fill="none" stroke="#FFE7A6" strokeWidth={1.6} opacity={0.95} />

        {/* conteúdo recortado pela amêndoa */}
        <g clipPath="url(#oeAlmondClip)">
          {/* íris — segue o mouse */}
          <motion.g style={{ x: irisX, y: irisY }}>
            <g transform={`translate(${CX} ${CY})`}>
              {/* coroa de ticks */}
              <g stroke="#F0C262" strokeLinecap="round">
                {TICKS.map((t, i) => (
                  <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.w} opacity={t.o} />
                ))}
              </g>

              {/* disco da íris */}
              <circle r={118} fill="#120A02" opacity={0.9} />
              <circle r={118} fill="url(#oeIrisGlow)" />

              {/* raios radiais */}
              <g stroke="#FFC85A" strokeLinecap="round">
                {RAYS.map((r, i) => (
                  <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} strokeWidth={1.15} opacity={r.o} />
                ))}
              </g>

              {/* anéis da íris */}
              <circle r={118} fill="none" stroke="#E09A18" strokeWidth={7} opacity={0.4} filter="url(#oeBlurSoft)" />
              <circle r={118} fill="none" stroke="#FFD87A" strokeWidth={3.2} />
              <circle r={104} fill="none" stroke="#F0C262" strokeWidth={1.1} opacity={0.55} />
              <circle r={76} fill="none" stroke="#FFD87A" strokeWidth={2.4} opacity={0.9} />
              <circle r={76} fill="none" stroke="#E09A18" strokeWidth={6} opacity={0.35} filter="url(#oeBlurTight)" />

              {/* pupila — parallax maior */}
              <motion.g style={{ x: pupX, y: pupY, scale: pupScale }}>
                <circle r={47} fill="url(#oePupil)" />
                <circle r={47} fill="none" stroke="#FFD87A" strokeWidth={1.4} opacity={0.7} />
                {/* brilhos especulares */}
                <circle cx={-16} cy={-19} r={13} fill="#FFF6E0" opacity={0.92} />
                <circle cx={14} cy={7} r={9} fill="#9A9384" opacity={0.75} />
              </motion.g>
            </g>
          </motion.g>
        </g>
      </motion.g>
    </motion.svg>
  )
}
