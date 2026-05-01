import { redirect } from 'next/navigation'

// / → página de vendas (acessível sem login)
// Login direto: /login
export default function Home() {
  redirect('/planos')
}
