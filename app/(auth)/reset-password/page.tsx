// NOVA SENHA — casca do servidor: título da aba e fontes. A tela fica em ./NovaSenha.tsx.
import type { Metadata } from 'next'
import { classeFontes } from '../fontes'
import NovaSenha from './NovaSenha'

export const metadata: Metadata = {
  title: 'Nova senha — Oráculo',
  description: 'Crie uma nova senha para entrar no Oráculo.',
}

export default function Page() {
  return <div className={classeFontes}><NovaSenha /></div>
}
