import { redirect } from 'next/navigation'

// Registro público desativado — acesso apenas via webhook da Zouti após compra.
// Redireciona para a página de planos.
export default function RegisterPage() {
  redirect('/planos')
}
