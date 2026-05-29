'use client'
import { useState, useEffect } from 'react'

const PLANS = ['monthly', 'biannual', 'annual', 'lifetime']
const PLAN_LABEL: Record<string, string> = { free: 'Gratuito', monthly: 'Mensal', biannual: 'Semestral', annual: 'Anual', lifetime: 'Vitalício' }
const PLAN_COLOR: Record<string, string> = { free: '#64748B', monthly: '#3B82F6', biannual: '#F0B429', annual: '#10B981', lifetime: '#A855F7' }

type Created = { email: string; password: string; licenseKey: string | null; plan: string; action: string }

export default function AdminPage() {
  const [key,      setKey]      = useState('')
  const [authed,   setAuthed]   = useState(false)
  const [users,    setUsers]    = useState<any[]>([])
  const [licenses, setLicenses] = useState<any[]>([])
  const [loading,  setLoading]  = useState(false)
  const [msg,      setMsg]      = useState<{ text: string; ok: boolean } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [blocked,  setBlocked]  = useState(false)
  const [search,   setSearch]   = useState('')
  const [created,  setCreated]  = useState<Created | null>(null)

  // Form
  const [email, setEmail] = useState('')
  const [plan,  setPlan]  = useState('monthly')

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
      setAuthed(true); setAttempts(0)
      // carrega licenças em paralelo
      fetchLicenses(key)
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

  async function fetchLicenses(k: string) {
    const res = await fetch('/api/admin/licenses', { headers: { 'x-admin-key': k || key } })
    if (res.ok) { const d = await res.json(); setLicenses(Array.isArray(d) ? d : []) }
  }

  async function reload() {
    const [ur, lr] = await Promise.all([
      fetch('/api/admin/users',    { headers: authHeaders() }),
      fetch('/api/admin/licenses', { headers: authHeaders() }),
    ])
    if (ur.ok) { const d = await ur.json(); setUsers(d.users || []) }
    if (lr.ok) { const d = await lr.json(); setLicenses(Array.isArray(d) ? d : []) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg(null); setCreated(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ email, plan }),
    })
    const data = await res.json()
    if (res.ok) {
      setCreated({
        email, plan, action: data.action,
        password:   data.password   || '(mantida)',
        licenseKey: data.licenseKey || null,
      })
      setEmail(''); setPlan('monthly')
      await reload()
    } else {
      setMsg({ text: data.error || 'Erro ao criar usuário', ok: false })
    }
    setLoading(false)
  }

  async function changePlan(userEmail: string, newPlan: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ email: userEmail, plan: newPlan }),
    })
    if (res.ok) { setMsg({ text: `✓ Plano de ${userEmail} atualizado para ${PLAN_LABEL[newPlan]}`, ok: true }); await reload() }
  }

  async function licenseAction(action: 'deactivate' | 'renew', licKey: string, newPlan?: string) {
    setMsg(null)
    const res = await fetch('/api/admin/licenses', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ action, key: licKey, plan: newPlan }),
    })
    if (res.ok) {
      setMsg({ text: action === 'deactivate' ? '✓ Licença desativada' : `✓ Licença renovada`, ok: true })
      await fetchLicenses(key)
    } else {
      const d = await res.json(); setMsg({ text: d.error || 'Erro', ok: false })
    }
  }

  async function resendAccess(userEmail: string) {
    setMsg(null); setCreated(null)
    const res = await fetch('/api/admin/users', {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ email: userEmail }),
    })
    const data = await res.json()
    if (res.ok) {
      setCreated({
        email:      userEmail,
        plan:       '',
        action:     'resent',
        password:   data.password   || '(erro)',
        licenseKey: data.licenseKey || null,
      })
    } else {
      setMsg({ text: data.error || 'Erro ao reenviar acesso', ok: false })
    }
  }

  async function logout() {
    await fetch('/api/admin/unlock', { method: 'DELETE' })
    window.location.href = '/'
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text)
  }

  const C = {
    bg:    '#0A0A0F',
    card:  '#0D0D1A',
    border:'rgba(30,30,48,0.9)',
    t1:    '#E2E8F0',
    t2:    '#94A3B8',
    t3:    '#64748B',
    gold:  '#F0B429',
    green: '#10B981',
    red:   '#EF4444',
  }

  const s: Record<string, any> = {
    page:  { minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif', color: C.t1, padding: '32px 24px' },
    card:  { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', maxWidth: 440, margin: '0 auto 24px' },
    wide:  { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', maxWidth: 1100, margin: '0 auto 24px' },
    label: { fontSize: 11, fontWeight: 700, color: C.t3, letterSpacing: '0.08em', marginBottom: 6, display: 'block' },
    input: { width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.t1, padding: '10px 14px', fontSize: 13, outline: 'none', marginBottom: 0, fontFamily: 'inherit', boxSizing: 'border-box' as const },
    btn:   { background: `linear-gradient(135deg,${C.gold},#C8960C)`, color: C.bg, fontWeight: 800, fontSize: 12, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
    th:    { color: C.t3, fontWeight: 600, textAlign: 'left' as const, padding: '8px 12px', borderBottom: `1px solid rgba(30,30,48,0.6)`, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em', whiteSpace: 'nowrap' as const },
    td:    { padding: '10px 12px', borderBottom: `1px solid rgba(30,30,48,0.25)` },
  }

  // Merge users + licenses by email
  const merged = users.map(u => ({
    ...u,
    license: licenses.find(l => l.email?.toLowerCase() === u.email?.toLowerCase()) || null,
  }))

  const filtered = merged.filter(u =>
    !search ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.license?.key?.toLowerCase().includes(search.toLowerCase())
  )

  /* ── Login ────────────────────────────────────────────────────────── */
  if (!authed) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.gold, textAlign: 'center', marginBottom: 4, letterSpacing: '0.1em' }}>🔮 ORÁCULO</div>
        <div style={{ textAlign: 'center', fontSize: 12, color: C.t3, marginBottom: 28 }}>Painel de Administração</div>
        {msg && <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'rgba(239,68,68,0.1)', color: C.red, fontSize: 12, border: '1px solid rgba(239,68,68,0.3)' }}>{msg.text}</div>}
        <label style={s.label}>CHAVE DE ACESSO</label>
        <input style={{ ...s.input, marginBottom: 14, opacity: blocked ? 0.5 : 1 }} type="password" value={key} autoComplete="off" disabled={blocked}
          onChange={e => setKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && !blocked && login()} placeholder="••••••••••••" />
        <button style={{ ...s.btn, width: '100%', padding: 12, opacity: blocked ? 0.5 : 1 }} onClick={login} disabled={loading || blocked}>
          {loading ? 'Verificando...' : blocked ? 'Aguarde 30s...' : 'ENTRAR'}
        </button>
      </div>
    </div>
  )

  /* ── Admin ────────────────────────────────────────────────────────── */
  return (
    <div style={s.page}>

      {/* Header */}
      <div style={{ maxWidth: 1100, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, letterSpacing: '0.1em' }}>🔮 ORÁCULO ADMIN</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 12, color: C.t3 }}>{users.length} clientes · {licenses.length} licenças</div>
          <button onClick={reload} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.t2, fontSize: 11, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>↻ Atualizar</button>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: C.red, fontSize: 11, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Sair</button>
        </div>
      </div>

      {/* Flash */}
      {msg && (
        <div style={{ maxWidth: 1100, margin: '0 auto 16px', padding: '10px 16px', borderRadius: 10, background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.ok ? C.green : C.red, fontSize: 12, border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          {msg.text}
        </div>
      )}

      {/* Resultado de criação */}
      {created && (
        <div style={{ maxWidth: 1100, margin: '0 auto 16px', padding: '16px 20px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 12 }}>
            {created.action === 'resent'
              ? `📧 Nova senha gerada e email reenviado para ${created.email}`
              : `✓ Acesso ${created.action === 'created' ? 'criado' : 'atualizado'} com sucesso`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'E-MAIL', value: created.email },
              { label: 'SENHA DE ACESSO', value: created.password },
              { label: 'CHAVE DA EXTENSÃO', value: created.licenseKey || '⚠️ Não gerada (verifique ADMIN_SECRET)' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ fontSize: 12, color: C.gold, flex: 1, wordBreak: 'break-all' as const }}>{value}</code>
                  {value && !value.startsWith('⚠️') && (
                    <button onClick={() => copyText(value)} style={{ background: 'transparent', border: 'none', color: C.t3, cursor: 'pointer', fontSize: 14, padding: 0 }} title="Copiar">⧉</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setCreated(null)} style={{ marginTop: 12, background: 'transparent', border: 'none', color: C.t3, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Fechar</button>
        </div>
      )}

      {/* Formulário novo cliente */}
      <div style={s.wide}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t2, letterSpacing: '0.1em', marginBottom: 16 }}>NOVO CLIENTE</div>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' as const }}>
            <div style={{ flex: '1 1 260px' }}>
              <label style={s.label}>E-MAIL *</label>
              <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" required />
            </div>
            <div style={{ flex: '0 0 160px' }}>
              <label style={s.label}>PLANO</label>
              <select style={{ ...s.input, cursor: 'pointer' }} value={plan} onChange={e => setPlan(e.target.value)}>
                {PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
              </select>
            </div>
            <div>
              <button type="submit" style={{ ...s.btn, padding: '10px 28px' }} disabled={loading}>
                {loading ? 'Criando...' : '+ Criar Acesso'}
              </button>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: C.t3 }}>
            O sistema gera a senha e a chave da extensão automaticamente. Se o e-mail já existir, atualiza o plano.
          </div>
        </form>
      </div>

      {/* Tabela unificada */}
      <div style={s.wide}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.t2, letterSpacing: '0.1em' }}>CLIENTES ({filtered.length})</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, email ou chave..."
            style={{ ...s.input, width: 280, fontSize: 12 }} />
        </div>

        {filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: 40, color: C.t3, fontSize: 13 }}>Nenhum cliente cadastrado ainda.</div>
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Nome / E-mail','Plano','Chave da Extensão','Status Licença','Expira em','Devices','Ações'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const lic = u.license
                    const expired  = lic && new Date(lic.expiresAt) < new Date() && lic.plan !== 'lifetime'
                    const isLife   = lic?.plan === 'lifetime'
                    const statusColor = !lic ? C.t3 : !lic.active ? C.red : expired ? '#F59E0B' : C.green
                    const statusLabel = !lic ? '—' : !lic.active ? 'Inativa' : expired ? 'Expirada' : 'Ativa'

                    return (
                      <tr key={u.id}>
                        <td style={s.td}>
                          <div style={{ fontWeight: 600, color: C.t1 }}>{u.name}</div>
                          <div style={{ color: C.t3, fontSize: 11, marginTop: 2 }}>{u.email}</div>
                        </td>
                        <td style={s.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ background: `${PLAN_COLOR[u.plan]||C.t3}20`, color: PLAN_COLOR[u.plan]||C.t3, border: `1px solid ${PLAN_COLOR[u.plan]||C.t3}40`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                              {PLAN_LABEL[u.plan]||u.plan}
                            </span>
                          </div>
                          <select defaultValue="" onChange={e => { if(e.target.value) changePlan(u.email, e.target.value); (e.target as HTMLSelectElement).value='' }}
                            style={{ background: 'transparent', border: 'none', color: C.t3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
                            <option value="" disabled>Mudar plano...</option>
                            {PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
                          </select>
                        </td>
                        <td style={s.td}>
                          {lic
                            ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <code style={{ fontSize: 11, color: C.gold, background: 'rgba(240,180,41,0.08)', padding: '2px 8px', borderRadius: 6 }}>{lic.key}</code>
                                <button onClick={() => copyText(lic.key)} style={{ background: 'transparent', border: 'none', color: C.t3, cursor: 'pointer', fontSize: 13 }} title="Copiar">⧉</button>
                              </div>
                            : <span style={{ color: C.t3 }}>—</span>
                          }
                        </td>
                        <td style={s.td}>
                          <span style={{ color: statusColor, fontWeight: 700 }}>● {statusLabel}</span>
                        </td>
                        <td style={{ ...s.td, color: isLife ? C.green : expired ? C.red : C.t3, fontSize: 11 }}>
                          {!lic ? '—' : isLife ? '∞ Vitalício' : new Date(lic.expiresAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ ...s.td, color: C.t3, fontSize: 11 }}>
                          {lic ? `${lic.deviceIds?.length||0}/${lic.maxDevices||2}` : '—'}
                        </td>
                        <td style={s.td}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                            {/* Reenviar acesso — sempre disponível */}
                            <button onClick={() => resendAccess(u.email)}
                              style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.3)', color: C.gold, fontSize: 10, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                              title="Gera nova senha e reenvia email com os dados de acesso">
                              📧 Reenviar
                            </button>
                            {lic && lic.active && (
                              <button onClick={() => licenseAction('deactivate', lic.key)}
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: C.red, fontSize: 10, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                                Desativar
                              </button>
                            )}
                            {lic && (
                              <select defaultValue="" onChange={e => { if(e.target.value) licenseAction('renew', lic.key, e.target.value); (e.target as HTMLSelectElement).value='' }}
                                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: C.green, fontSize: 10, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                                <option value="" disabled>Renovar...</option>
                                <option value="monthly">Mensal</option>
                                <option value="biannual">Semestral</option>
                                <option value="annual">Anual</option>
                                <option value="lifetime">Vitalício</option>
                              </select>
                            )}
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
    </div>
  )
}
