'use client'
// Peças visuais compartilhadas de /forgot-password e /reset-password (05/10/2026): fundo dourado com pó subindo,
// topo com a marca, ícones. Só aparência — a lógica fica em Esqueci.tsx / NovaSenha.tsx.
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import s from './recuperar.module.css'

export const Ic = {
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>,
  cadeado: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>,
  olho: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>,
  olhoFechado: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.9 0 3.6-.6 5-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>,
  alerta: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>,
  relogio: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  escudo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>,
  envelope: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /><path d="M15.5 16.5l1.6 1.6 3-3.2" strokeWidth="2" /></svg>,
}

const OLHO_LOGO = (
  <svg viewBox="0 0 1000 440" aria-hidden="true"><g fill="none" stroke="#FFC83D" strokeWidth="34" strokeLinejoin="round"><path d="M70 220Q500-90 930 220Q500 530 70 220Z" /><path d="M70 220Q500-20 930 220Q500 460 70 220Z" strokeWidth="26" /><circle cx="500" cy="220" r="105" strokeWidth="26" /></g><circle cx="500" cy="220" r="40" fill="#FFE7A3" /></svg>
)

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
    const p = Array.from({ length: 55 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + .3, v: Math.random() * .00035 + .0001, a: Math.random() * 6.28, o: Math.random() * .55 + .15 }))
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

/** Moldura da página: fundo, topo (marca + atalho pro login) e rodapé. */
export function Casca({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.pagina}>
      <div className={s.fundo} aria-hidden="true">
        <div className={s.aurora1} /><div className={s.aurora2} />
        <div className={s.grade} />
        <Po />
      </div>
      <header className={s.topo}>
        <a className={s.marca} href="https://oraculojf.com" aria-label="Oráculo — site">{OLHO_LOGO}<span>ORÁCULO</span></a>
        <Link className={s.topoLink} href="/login">Lembrou? <b>Entrar</b></Link>
      </header>
      <main className={s.conteudo}>{children}</main>
      <footer className={s.rodape}>© {new Date().getFullYear()} Oráculo · Inteligência para sellers Amazon e Mercado Livre</footer>
    </div>
  )
}
