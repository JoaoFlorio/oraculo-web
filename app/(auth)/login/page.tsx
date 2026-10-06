// LOGIN — casca do servidor: título da aba e as fontes (as mesmas do site oraculojf.com e da /teste-gratis).
// O formulário e toda a lógica de entrada (2FA, desvio admin/staff) ficam em ./Entrar.tsx.
import type { Metadata } from 'next'
import { Archivo, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import Entrar from './Entrar'

const display = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--tg-display', display: 'swap' })
const corpo = Instrument_Sans({ subsets: ['latin'], variable: '--tg-corpo', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--tg-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Entrar — Oráculo',
  description: 'Entre no Oráculo e veja o lucro real da sua operação na Amazon e no Mercado Livre.',
}

export default function Page() {
  return (
    <div className={`${display.variable} ${corpo.variable} ${mono.variable}`}>
      <Entrar />
    </div>
  )
}
