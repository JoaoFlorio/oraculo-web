'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔮</div>
          <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '0.1em', background: 'linear-gradient(135deg,#F0B429,#FFD700,#C8960C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ORÁCULO</div>
          <div style={{ color: '#64748B', fontSize: '12px', marginTop: '4px', letterSpacing: '0.12em' }}>AMAZON INTELLIGENCE</div>
        </div>

        {/* Card */}
        <div style={{ background: '#13131F', border: '1px solid rgba(240,180,41,0.15)', borderRadius: '20px', padding: '36px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#E2E8F0', marginBottom: '8px' }}>Entrar na plataforma</h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '28px' }}>Bem-vindo de volta 👋</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>E-mail</label>
              <input
                type="email" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="seu@email.com"
                style={{ width: '100%', background: '#0A0A0F', border: '1px solid rgba(30,30,48,0.9)', borderRadius: '10px', padding: '12px 14px', color: '#E2E8F0', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Senha</label>
              <input
                type="password" required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                style={{ width: '100%', background: '#0A0A0F', border: '1px solid rgba(30,30,48,0.9)', borderRadius: '10px', padding: '12px 14px', color: '#E2E8F0', fontSize: '14px', outline: 'none' }}
              />
            </div>

            {error && <p style={{ fontSize: '12px', color: '#EF4444', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', padding: '10px 12px' }}>{error}</p>}

            <button type="submit" disabled={loading}
              style={{ background: loading ? 'rgba(240,180,41,0.4)' : 'linear-gradient(135deg,#F0B429,#C8960C)', color: '#0A0A0F', fontWeight: 800, fontSize: '13px', letterSpacing: '0.06em', padding: '14px', borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px' }}>
              {loading ? 'Entrando...' : 'ENTRAR'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '24px' }}>
            Não tem conta?{' '}
            <Link href="/register" style={{ color: '#F0B429', fontWeight: 700 }}>Criar conta grátis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
