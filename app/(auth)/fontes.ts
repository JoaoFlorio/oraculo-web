// Fontes das telas de recuperar senha (as mesmas do site oraculojf.com, do /login e da /teste-gratis).
import { Archivo, Instrument_Sans, JetBrains_Mono } from 'next/font/google'

const display = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--tg-display', display: 'swap' })
const corpo = Instrument_Sans({ subsets: ['latin'], variable: '--tg-corpo', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--tg-mono', display: 'swap' })

export const classeFontes = `${display.variable} ${corpo.variable} ${mono.variable}`
