// ESQUECI A SENHA — casca do servidor: título da aba e fontes. A tela fica em ./Esqueci.tsx.
import type { Metadata } from 'next'
import { classeFontes } from '../fontes'
import Esqueci from './Esqueci'

export const metadata: Metadata = {
  title: 'Recuperar senha — Oráculo',
  description: 'Receba um link no seu e-mail para criar uma nova senha do Oráculo.',
}

export default function Page() {
  return <div className={classeFontes}><Esqueci /></div>
}
