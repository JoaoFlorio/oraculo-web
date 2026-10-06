// TESTE GRÁTIS DE 7 DIAS (05/10/2026) — casca do servidor: título da aba e as fontes da página (as mesmas do site
// oraculojf.com). Todo o cadastro (passos, códigos, anti-robô, chamadas à API) fica em ./Cadastro.tsx.
import type { Metadata } from 'next'
import { Archivo, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import Cadastro from './Cadastro'

const display = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--tg-display', display: 'swap' })
const corpo = Instrument_Sans({ subsets: ['latin'], variable: '--tg-corpo', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--tg-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Teste grátis de 7 dias — Oráculo',
  description: 'Use o Oráculo completo por 7 dias, sem cartão e sem pagar nada: Gestão com lucro real, NEO, mineração e extensão.',
}

export default function Page() {
  return (
    <div className={`${display.variable} ${corpo.variable} ${mono.variable}`}>
      <Cadastro />
    </div>
  )
}
