'use client'
import { useState, useEffect } from 'react'

const PLANS = ['free', 'monthly', 'annual', 'lifetime']
const PLAN_LABEL: Record<string, string> = { free: 'Gratuito', monthly: 'Mensal', annual: 'Anual', lifetime: 'Vitalício' }
const PLAN_COLOR: Record<string, string> = { free: '#64748B', monthly: '#3B82F6', annual: '#F0B429', lifetime: '#10B981' }

export default function AdminPage() {
  const [key,       setKey]       = useState('')
  const [authed,    setAuthed]    = useState(false)
  const [users,     setUsers]     = useState<any[]>([])
  const [loading,   setLoading]   = useState(false)
  const [msg,       setMsg]       = useState<{ text: string; ok: boolean } | null>(null)

  // form criar/editar
  const [email,    setEmail]    = useState('')
  const [name,     setName]     = useState('')
  const [password, setPassword] = useState('')
  const [plan,     setPlan]     = useState('monthly')

  async function login() {
    setLoading(true)
    const res = await fetch(`/api/admin/users?key=${key}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users || [])
      setAuthed(true)
    } else {
      setMsg({ text: 'Senha incorreta', ok: false })
    }
    setLoading(false)
  }

  async function loadUsers() {
    const res = await fetch(`/api/admin/users?key=${key}`)
    if (res.ok) { const d = await res.json(); setUsers(d.users || []) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ email, name, password, plan }),
    })
    const data = await res.json()
    if (res.ok) {
      const action = data.action === 'created' ? 'criado' : 'atualizado'
      const pw = data.defaultPassword ? ` · senha padrão: ${data.defaultPassword}` : ''
      setMsg({ text: `✓ Usuário ${action}: ${data.user.email} (${data.user.plan})${pw}`, ok: true })
      setEmail(''); setName(''); setPassword(''); setPlan('monthly')
      await loadUsers()
    } else {
      setMsg({ text: data.error || 'Erro', ok: false })
    }
    setLoading(false)
  }

  async function changePlan(userEmail: string, newPlan: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ email: userEmail, plan: newPlan }),
    })
    if (res.ok) { setMsg({ text: `✓ Plano atualizado`, ok: true }); await loadUsers() }
  }

  const s: Record<string, any> = {
    page:  { minHeight: '100vh', background: '#0A0A0F', fontFamily: 'Inter, sans-serif', color: '#E2E8F0', padding: '40px 24px' },
    card:  { background: '#0D0D1A', border: '1px solid rgba(30,30,48,0.9)', borderRadius: 16, padding: '24px 28px', maxWidth: 480, margin: '0 auto 24px' },
    wide:  { background: '#0D0D1A', border: '1px solid rgba(30,30,48,0.9)', borderRadius: 16, padding: '24px 28px', maxWidth: 900, margin: '0 auto 24px' },
    label: { fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', marginBottom: 6, display: 'block' },
    input: { width: '100%', background: '#0A0A0F', border: '1px solid rgba(30,30,48,0.9)', borderRadius: 10, color: '#E2E8F0', padding: '10px 14px', fontSize: 13, outline: 'none', marginBottom: 14, fontFamily: 'inherit' },
    btn:   { background: 'linear-gradient(135deg,#F0B429,#C8960C)', color: '#0A0A0F', fontWeight: 800, fontSize: 12, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em' },
    title: { fontSize: 22, fontWeight: 900, color: '#F0B429', letterSpacing: '0.1em', textAlign: 'center' as const, marginBottom: 8 },
  }

  if (!authed) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>🔮 ORÁCULO</div>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginBottom: 28 }}>Painel de Administração</div>
        {msg && <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.ok ? '#10B981' : '#EF4444', fontSize: 12, border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>{msg.text}</div>}
        <label style={s.label}>CHAVE ADMIN (INTERNAL_KEY)</label>
        <input style={s.input} type="password" value={key} onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()} placeholder="oraculo-internal-2025" />
        <button style={{ ...s.btn, width: '100%', padding: 12 }} onClick={login} disabled={loading}>
          {loading ? 'Entrando...' : 'ENTRAR'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#F0B429', letterSpacing: '0.1em' }}>🔮 ORÁCULO ADMIN</div>
        <div style={{ fontSize: 12, color: '#475569' }}>{users.length} usuários cadastrados</div>
      </div>

      {/* Flash message */}
      {msg && (
        <div style={{ maxWidth: 900, margin: '0 auto 16px', padding: '10px 16px', borderRadius: 10, background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.ok ? '#10B981' : '#EF4444', fontSize: 12, border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          {msg.text}
        </div>
      )}

      {/* Create / update user form */}
      <div style={s.wide}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: 20 }}>ADICIONAR / ATUALIZAR USUÁRIO</div>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={s.label}>E-MAIL *</label>
              <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teste@email.com" required />
            </div>
            <div>
              <label style={s.label}>NOME</label>
              <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="Nome do usuário" />
            </div>
            <div>
              <label style={s.label}>SENHA (deixe em branco = oraculo123)</label>
              <input style={s.input} type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="oraculo123" />
            </div>
            <div>
              <label style={s.label}>PLANO</label>
              <select style={{ ...s.input, marginBottom: 0 }} value={plan} onChange={e => setPlan(e.target.value)}>
                {PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" style={{ ...s.btn, marginTop: 8 }} disabled={loading}>
            {loading ? 'Salvando...' : '+ CRIAR / ATUALIZAR USUÁRIO'}
          </button>
          <span style={{ marginLeft: 12, fontSize: 11, color: '#475569' }}>
            Se o e-mail já existir, atualiza o plano/senha. Se não existir, cria novo.
          </span>
        </form>
      </div>

      {/* User table */}
      <div style={s.wide}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: 20 }}>
          USUÁRIOS CADASTRADOS ({users.length})
        </div>
        {users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#475569', fontSize: 13 }}>Nenhum usuário ainda.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Nome', 'E-mail', 'Plano', 'Cadastro', 'Mudar Plano'].map(h => (
                    <th key={h} style={{ color: '#475569', fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(30,30,48,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(30,30,48,0.3)' }}>
                    <td style={{ padding: '10px 12px', color: '#E2E8F0', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '10px 12px', color: '#94A3B8' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: `${PLAN_COLOR[u.plan] || '#64748B'}20`, color: PLAN_COLOR[u.plan] || '#64748B', border: `1px solid ${PLAN_COLOR[u.plan] || '#64748B'}40`, borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                        {PLAN_LABEL[u.plan] || u.plan}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569', fontSize: 11 }}>
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <select
                        defaultValue={u.plan}
                        onChange={e => changePlan(u.email, e.target.value)}
                        style={{ background: '#0A0A0F', border: '1px solid rgba(30,30,48,0.9)', borderRadius: 8, color: '#E2E8F0', padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        {PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
