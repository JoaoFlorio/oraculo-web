import type { Metadata } from 'next'
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from 'next/font/google'
import Hero from '@/components/landing/Hero'
import ComoFunciona from '@/components/landing/ComoFunciona'
import Gestao from '@/components/landing/Gestao'
import Mineracao from '@/components/landing/Mineracao'
import Inteligencia from '@/components/landing/Inteligencia'
import Agente from '@/components/landing/Agente'
import Planos from '@/components/landing/Planos'
import Faq from '@/components/landing/Faq'
import Footer from '@/components/landing/Footer'
import FloatingSeal from '@/components/landing/FloatingSeal'

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const body = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-o', display: 'swap' })

export const metadata: Metadata = {
  title: 'ORÁCULO — A Amazon mostra quanto você vende. O Oráculo mostra quanto sobra.',
  description:
    'DRE completa e automática da sua operação Amazon: lucro real, margem, taxas, FBA, Ads, estoque e Curva ABC. Mineração, calculadora oficial, extensão Chrome e Agente IA — sem planilha.',
  openGraph: {
    title: 'ORÁCULO — O lucro real da sua operação Amazon',
    description: 'DRE automática, mineração, calculadora de precisão e IA — direto da sua conta Amazon, sem planilha.',
    images: ['/og-image.png'],
  },
}

export default function Home() {
  return (
    <main className={`ora-landing ${display.variable} ${body.variable} ${mono.variable}`}>
      <Hero />
      <ComoFunciona />
      <Gestao />
      <Mineracao />
      <Inteligencia />
      <Agente />
      <Planos />
      <Faq />
      <Footer />
      <FloatingSeal />
    </main>
  )
}
