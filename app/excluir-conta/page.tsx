// 18/11/2026 — página pública de exclusão de conta (o link que vai na ficha do Google Play e serve a App Store).
// Sem login → manda entrar e volta pra cá. Com login (até vencido) → o mesmo cartão do Meu Perfil.
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSessionOrExpired } from '@/lib/auth'
import ExcluirConta from './ExcluirConta'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Excluir minha conta — ORÁCULO' }

export default async function Page() {
  const { user } = await getSessionOrExpired()
  if (!user) redirect('/login?next=/excluir-conta')
  return (
    <main style={{ minHeight: '100dvh', background: '#07080D', color: '#F3F3FB', display: 'flex', justifyContent: 'center', padding: '48px 18px', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <a href="/dashboard" style={{ fontSize: 13, color: '#A3A8C3', textDecoration: 'none' }}>← Voltar ao Oráculo</a>
          <h1 style={{ margin: '14px 0 6px', fontSize: 24, fontWeight: 800 }}>Excluir minha conta</h1>
          <p style={{ margin: 0, fontSize: 14, color: '#A3A8C3' }}>Conta: <b style={{ color: '#F3F3FB' }}>{user.email}</b></p>
        </div>
        <ExcluirConta />
        <p style={{ fontSize: 12, color: '#6B7090', lineHeight: 1.6, margin: 0 }}>
          Não consegue entrar? Peça a exclusão pelo e-mail de suporte informado na nossa <a href="https://central.oraculojf.com.br/privacy" style={{ color: '#A3A8C3' }}>Política de Privacidade</a>.
        </p>
      </div>
    </main>
  )
}
