// Fontes do VISUAL NOVO do painel (em validação — só admin vê; ver VisualNovo.tsx e globals.css [data-visual="ouro"]).
// preload:false de propósito: o painel dos clientes não baixa estas fontes enquanto o visual não for liberado.
import { Archivo, Instrument_Sans, JetBrains_Mono } from 'next/font/google'

const display = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--tg-display', display: 'swap', preload: false })
const corpo = Instrument_Sans({ subsets: ['latin'], variable: '--tg-corpo', display: 'swap', preload: false })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--tg-mono', display: 'swap', preload: false })

export const classeFontesPainel = `${display.variable} ${corpo.variable} ${mono.variable}`
