import type { Metadata } from 'next'
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from 'next/font/google'
import Hero from '@/components/landing/Hero'
import Problema from '@/components/landing/Problema'
import ComoFunciona from '@/components/landing/ComoFunciona'
import Poderes from '@/components/landing/Poderes'

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const body = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-o', display: 'swap' })

export const metadata: Metadata = {
  title: 'ORÁCULO — Pare de adivinhar. Comece a enxergar.',
  description:
    'A inteligência que mostra o lucro real da sua operação Amazon FBA. DRE automática, anúncios, mineração de produtos e calculadora de precisão — sem planilha.',
  openGraph: {
    title: 'ORÁCULO — Pare de adivinhar. Comece a enxergar.',
    description: 'O lucro real que a Amazon não te mostra — automático. DRE, ads, mineração e calculadora numa tela.',
    images: ['/og-image.png'],
  },
}

export default function Home() {
  return (
    <main className={`ora-landing ${display.variable} ${body.variable} ${mono.variable}`}>
      <Hero />
      <Problema />
      <ComoFunciona />
      <Poderes />
    </main>
  )
}
