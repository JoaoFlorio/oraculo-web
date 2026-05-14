'use client'
import { useState } from 'react'

const PLANS = ['free', 'monthly', 'annual', 'lifetime']
const PLAN_LABEL: Record<string, string> = { free: 'Gratuito', monthly: 'Mensal', annual: 'Anual', lifetime: 'Vitalício' }
const PLAN_COLOR: Record<string, string> = { free: '#64748B', monthly: '#3B82F6', annual: '#F0B429', lifetime: '#10B981' }

export default function AdminPage() {
  const [key,     setKey]     = useState('')
  const [authed,  setAuthed]  = useState(false)
  const [users,   setUsers]   = useState<any[]>([])
  const [licenses,setLicenses]= useState<any[]>([])
  const [tab,     setTab]     = useState<'users'|'licenses'>('users')
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null)
  const [attempts,setAttempts]= useState(0)
  const [blocked, setBlocked] = useState(false)
  const [licSearch, setLicSearch] = useState('')

  const [email,    setEmail]    = useState('')
  const [name,     setName]     = useState('')
  const [password, setPassword] = useState('')
  const [plan,     setPlan]     = useState('monthly')

  function authHeaders() {
    return { 'Content-Type': 'application/json', 'x-admin-key': key }
  }

  async function login() {
    if (blocked) return
    setLoading(true); setMsg(null)
    if (!key.trim()) { setMsg({ text: 'Informe a chave de acesso', ok: false }); setLoading(false); return }
    const res = await fetch('/api/admin/users', { headers: authHeaders() })
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users || [])
      setAuthed(true)
      setAttempts(0)
    } else {
      const n = attempts + 1; setAttempts(n)
      if (n >= 5) {
        setBlocked(true)
        setMsg({ text: 'Muitas tentativas. Aguarde 30 segundos.', ok: false })
        setTimeout(() => { setBlocked(false); setAttempts(0) }, 30_000)
      } else {
        setMsg({ text: `Chave incorreta (${n}/5)`, ok: false })
      }
    }
    setLoading(false)
  }

  async function loadUsers() {
    const res = await fetch('/api/admin/users', { headers: authHeaders() })
    if (res.ok) { const d = await res.json(); setUsers(d.users || []) }
  }

  async function loadLicenses() {
    setLoading(true)
    const res = await fetch('/api/admin/licenses', { headers: authHeaders() })
    if (res.ok) { const d = await res.json(); setLicenses(Array.isArray(d) ? d : []) }
    setLoading(false)
  }

  async function switchTab(t: 'users'|'licenses') {
    setTab(t); setMsg(null)
    if (t === 'licenses' && licenses.length === 0) await loadLicenses()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ email, name, password, plan }),
    })
    const data = await res.json()
    if (res.ok) {
      const action = data.action === 'created' ? 'criado' : 'atualizado'
      const pw = data.defaultPassword ? ` · senha padrão: ${data.defaultPassword}` : ''
      setMsg({ text: `✓ Usuário ${action}: ${data.user.email} (${data.user.plan})${pw}`, ok: true })
      setEmail(''); setName(''); setPassword(''); setPlan('monthly')
      await loadUsers()
    } else { setMsg({ text: data.error || 'Erro', ok: false }) }
    setLoading(false)
  }

  async function changePlan(userEmail: string, newPlan: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ email: userEmail, plan: newPlan }),
    })
    if (res.ok) { setMsg({ text: `✓ Plano atualizado`, ok: true }); await loadUsers() }
  }

  async function licenseAction(action: 'deactivate'|'renew', licKey: string, plan?: string) {
    setMsg(null)
    const res = await fetch('/api/admin/licenses', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ action, key: licKey, plan }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg({ text: action === 'deactivate' ? '✓ Licença desativada' : `✓ Licença renovada (${PLAN_LABEL[plan||'monthly']})`, ok: true })
      await loadLicenses()
    } else { setMsg({ text: data.error || 'Erro', ok: false }) }
  }

  async function logout() {
    await fetch('/api/admin/unlock', { method: 'DELETE' })
    window.location.href = '/'
  }

  const s: Record<string, any> = {
    page:  { minHeight: '100vh', background: '#0A0A0F', fontFamily: 'Inter, sans-serif', color: '#E2E8F0', padding: '40px 24px' },
    card:  { background: '#0D0D1A', border: '1px solid rgba(30,30,48,0.9)', borderRadius: 16, padding: '24px 28px', maxWidth: 420, margin: '0 auto 24px' },
    wide:  { background: '#0D0D1A', border: '1px solid rgba(30,30,48,0.9)', borderRadius: 16, padding: '24px 28px', maxWidth: 960, margin: '0 auto 24px' },
    label: { fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', marginBottom: 6, display: 'block' },
    input: { width: '100%', background: '#0A0A0F', border: '1px solid rgba(30,30,48,0.9)', borderRadius: 10, color: '#E2E8F0', padding: '10px 14px', fontSize: 13, outline: 'none', marginBottom: 14, fontFamily: 'inherit' },
    btn:   { background: 'linear-gradient(135deg,#F0B429,#C8960C)', color: '#0A0A0F', fontWeight: 800, fontSize: 12, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em' },
    title: { fontSize: 22, fontWeight: 900, color: '#F0B429', letterSpacing: '0.1em', textAlign: 'center' as const, marginBottom: 8 },
  }

  /* ── Login ──────────────────────────────────────────────────────────────── */
  if (!authed) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>🔮 ORÁCULO</div>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginBottom: 28 }}>Painel de Administração</div>
        {msg && <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.ok ? '#10B981' : '#EF4444', fontSize: 12, border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>{msg.text}</div>}
        <label style={s.label}>CHAVE DE ACESSO</label>
        <input style={{ ...s.input, opacity: blocked ? 0.5 : 1 }} type="password" value={key} autoComplete="off" disabled={blocked}
          onChange={e => setKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && !blocked && login()} placeholder="••••••••••••" />
        <button style={{ ...s.btn, width: '100%', padding: 12, opacity: blocked ? 0.5 : 1 }} onClick={login} disabled={loading || blocked}>
          {loading ? 'Verificando...' : blocked ? 'Aguarde 30s...' : 'ENTRAR'}
        </button>
      </div>
    </div>
  )

  const filteredLicenses = licenses.filter(l =>
    !licSearch || l.email?.toLowerCase().includes(licSearch.toLowerCase()) || l.key?.toLowerCase().includes(licSearch.toLowerCase())
  )

  /* ── Admin ──────────────────────────────────────────────────────────────── */
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ maxWidth: 960, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#F0B429', letterSpacing: '0.1em' }}>🔮 ORÁCULO ADMIN</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 12, color: '#475569' }}>{users.length} usuários · {licenses.length} licenças</div>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 11, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Sair</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 960, margin: '0 auto 20px', display: 'flex', gap: 8 }}>
        {(['users','licenses'] as const).map(t => (
          <button key={t} onClick={() => switchTab(t)} style={{
            padding: '8px 20px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            background: tab === t ? 'linear-gradient(135deg,#F0B429,#C8960C)' : 'transparent',
            color: tab === t ? '#0A0A0F' : '#64748B',
            border: tab === t ? 'none' : '1px solid rgba(30,30,48,0.9)',
          }}>
            {t === 'users' ? `👥 Usuários (${users.length})` : `🔑 Licenças (${licenses.length})`}
          </button>
        ))}
      </div>

      {/* Flash */}
      {msg && (
        <div style={{ maxWidth: 960, margin: '0 auto 16px', padding: '10px 16px', borderRadius: 10, background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.ok ? '#10B981' : '#EF4444', fontSize: 12, border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          {msg.text}
        </div>
      )}

      {/* ── ABA USUÁRIOS ─────────────────────────────────────────────────────── */}
      {tab === 'users' && <>
        <div style={s.wide}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: 20 }}>ADICIONAR / ATUALIZAR USUÁRIO</div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={s.label}>E-MAIL *</label>
                <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@email.com" required />
              </div>
              <div>
                <label style={s.label}>NOME</label>
                <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" />
              </div>
              <div>
                <label style={s.label}>SENHA <span style={{ color: '#475569', fontWeight: 400 }}>(deixe em branco para senha padrão)</span></label>
                <input style={s.input} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
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
            <span style={{ marginLeft: 12, fontSize: 11, color: '#475569' }}>Se o e-mail já existir, atualiza o plano/senha.</span>
          </form>
        </div>

        <div style={s.wide}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: 20 }}>USUÁRIOS CADASTRADOS ({users.length})</div>
          {users.length === 0
            ? <div style={{ textAlign: 'center', padding: 40, color: '#475569', fontSize: 13 }}>Nenhum usuário ainda.</div>
            : <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>{['Nome','E-mail','Plano','Cadastro','Mudar Plano'].map(h => (
                      <th key={h} style={{ color: '#475569', fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(30,30,48,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(30,30,48,0.3)' }}>
                        <td style={{ padding: '10px 12px', color: '#E2E8F0', fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: '10px 12px', color: '#94A3B8' }}>{u.email}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: `${PLAN_COLOR[u.plan]||'#64748B'}20`, color: PLAN_COLOR[u.plan]||'#64748B', border: `1px solid ${PLAN_COLOR[u.plan]||'#64748B'}40`, borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                            {PLAN_LABEL[u.plan]||u.plan}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569', fontSize: 11 }}>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <select defaultValue={u.plan} onChange={e => changePlan(u.email, e.target.value)}
                            style={{ background: '#0A0A0F', border: '1px solid rgba(30,30,48,0.9)', borderRadius: 8, color: '#E2E8F0', padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      </>}

      {/* ── ABA LICENÇAS ─────────────────────────────────────────────────────── */}
      {tab === 'licenses' && (
        <div style={s.wide}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em' }}>CHAVES DE LICENÇA ({filteredLicenses.length})</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={licSearch} onChange={e => setLicSearch(e.target.value)}
                placeholder="Buscar por email ou chave..."
                style={{ ...s.input, marginBottom: 0, width: 260, fontSize: 12 }}
              />
              <button onClick={loadLicenses} style={{ ...s.btn, padding: '8px 16px', fontSize: 11 }} disabled={loading}>
                {loading ? '...' : '↻ Atualizar'}
              </button>
            </div>
          </div>

          {filteredLicenses.length === 0
            ? <div style={{ textAlign: 'center', padding: 40, color: '#475569', fontSize: 13 }}>
                {loading ? 'Carregando...' : licSearch ? 'Nenhuma licença encontrada.' : 'Nenhuma licença gerada ainda.'}
              </div>
            : <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>{['Chave','E-mail','Plano','Status','Criada em','Expira em','Dispositivos','Ações'].map(h => (
                      <th key={h} style={{ color: '#475569', fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(30,30,48,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {filteredLicenses.map(l => {
                      const expired = new Date(l.expiresAt) < new Date()
                      const isLifetime = l.plan === 'lifetime'
                      const statusColor = !l.active ? '#EF4444' : expired ? '#F59E0B' : '#10B981'
                      const statusLabel = !l.active ? 'Inativa' : expired ? 'Expirada' : 'Ativa'
                      return (
                        <tr key={l.key} style={{ borderBottom: '1px solid rgba(30,30,48,0.3)', opacity: l.active ? 1 : 0.5 }}>
                          <td style={{ padding: '10px 12px' }}>
                            <code style={{ fontSize: 11, color: '#F0B429', background: 'rgba(240,180,41,0.08)', padding: '2px 8px', borderRadius: 6, letterSpacing: '0.05em' }}>{l.key}</code>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#94A3B8', fontSize: 11 }}>{l.email}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: `${PLAN_COLOR[l.plan]||'#64748B'}20`, color: PLAN_COLOR[l.plan]||'#64748B', border: `1px solid ${PLAN_COLOR[l.plan]||'#64748B'}40`, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                              {PLAN_LABEL[l.plan]||l.plan}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ color: statusColor, fontSize: 11, fontWeight: 700 }}>● {statusLabel}</span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#475569', fontSize: 11 }}>{new Date(l.createdAt).toLocaleDateString('pt-BR')}</td>
                          <td style={{ padding: '10px 12px', color: isLifetime ? '#10B981' : expired ? '#EF4444' : '#64748B', fontSize: 11, fontWeight: isLifetime || expired ? 700 : 400 }}>
                            {isLifetime ? '∞ Vitalício' : new Date(l.expiresAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748B', fontSize: 11 }}>
                            {l.deviceIds?.length || 0}/{l.maxDevices || 2}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {l.active && (
                                <button onClick={() => licenseAction('deactivate', l.key)}
                                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 10, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                                  Desativar
                                </button>
                              )}
                              <select defaultValue="" onChange={e => { if(e.target.value) licenseAction('renew', l.key, e.target.value); e.target.value='' }}
                                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontSize: 10, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                                <option value="" disabled>Renovar</option>
                                <option value="monthly">Renovar Mensal</option>
                                <option value="annual">Renovar Anual</option>
                                <option value="lifetime">Tornar Vitalício</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}
    </div>
  )
}
