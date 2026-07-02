'use client'
import { useState, useEffect } from 'react'

/* ─── Tokens premium (grafite + ouro, igual ao painel) ────────────────────── */
const C = {
  bg: '#07080D', card: '#10121B', cardHov: '#161925', line: 'rgba(255,255,255,0.06)',
  lineG: 'rgba(240,180,41,0.30)', gold: '#F0B429', green: '#34D399', red: '#F87171',
  amber: '#FBBF24', violet: '#8B78FF', blue: '#5E9BE0',
  t1: '#F3F3FB', t2: '#9DA2BC', t3: '#666B85',
}
const PLAN_LABEL: Record<string, string> = { free: 'Gratuito', monthly: 'Mensal', biannual: 'Semestral', annual: 'Anual', lifetime: 'Vitalício' }
const PLAN_COLOR: Record<string, string> = { free: C.t3, monthly: C.blue, biannual: C.gold, annual: C.green, lifetime: C.violet }
const PLANS = ['monthly', 'biannual', 'annual', 'lifetime']
const brl = (n: number) => 'R$ ' + (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const waLink = (phone?: string) => { const d = String(phone || '').replace(/\D/g, ''); if (!d) return null; return `https://wa.me/${d.startsWith('55') ? d : '55' + d}` }

type Data = {
  kpis: { activeSubs: number; overdue: number; canceled: number; lifetime: number; revenueTotal: number; revenueMonth: number; totalClients: number }
  byPlan: { plan: string; count: number }[]
  revenueSeries: { date: string; amount: number }[]
  clients: any[]
}

export default function AdminClient({ role, name, previewData }: { role: string; name: string; previewData?: Data }) {
  // Funcionário (staff) só cadastra cliente; admin vê tudo.
  const isAdmin = role === 'admin'
  const [tab, setTab] = useState<'overview' | 'clients' | 'new'>(isAdmin ? 'overview' : 'new')
  const [data, setData] = useState<Data | null>(previewData || null)
  const [days, setDays] = useState(90)
  const [licenses, setLicenses] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState<'all' | 'active' | 'overdue' | 'canceled'>('all')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<any>(null)
  const [form, setForm] = useState({ email: '', name: '', phone: '', plan: 'monthly' })

  const isPreview = !!previewData

  async function load() {
    if (isPreview || !isAdmin) return   // staff não puxa dashboard/lista
    const [d, l] = await Promise.all([
      fetch(`/api/admin/dashboard?days=${days}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/admin/licenses').then(r => r.ok ? r.json() : []).catch(() => []),
    ])
    if (d) setData(d)
    setLicenses(Array.isArray(l) ? l : [])
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [days])

  async function createClient(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg(null); setCreated(null)
    const r = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await r.json()
    if (r.ok) {
      setCreated({ ...form, password: d.password || '(mantida)', licenseKey: d.licenseKey || null, action: d.action })
      setForm({ email: '', name: '', phone: '', plan: 'monthly' }); await load()
    } else setMsg({ text: d.error || 'Erro ao criar', ok: false })
    setLoading(false)
  }
  async function changePlan(email: string, plan: string) {
    const r = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, plan }) })
    if (r.ok) { setMsg({ text: `Plano de ${email} → ${PLAN_LABEL[plan]}`, ok: true }); await load() }
  }
  async function resend(email: string) {
    setMsg(null); setCreated(null)
    const r = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    const d = await r.json()
    if (r.ok) setCreated({ email, action: 'resent', password: d.password, licenseKey: d.licenseKey })
    else setMsg({ text: d.error || 'Erro', ok: false })
  }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login' }
  const copy = (t: string) => navigator.clipboard.writeText(t)

  const k = data?.kpis
  const clients = data?.clients || []
  const filtered = clients.filter(c =>
    (fStatus === 'all' || c.status === fStatus) &&
    (!search || [c.name, c.email, c.phone].some(v => String(v || '').toLowerCase().includes(search.toLowerCase())))
  )
  const licByEmail = (email: string) => licenses.find(l => l.email?.toLowerCase() === email?.toLowerCase())

  /* ── styles ── */
  const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, boxShadow: '0 1px 2px rgba(0,0,0,0.4)' }
  const chip = (on: boolean, col = C.gold): any => ({ padding: '7px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? C.lineG : C.line}`, background: on ? 'rgba(240,180,41,0.10)' : 'transparent', color: on ? col : C.t2, fontFamily: 'inherit' })
  const num = { fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: 'tabular-nums' as const }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.t1, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", padding: '24px 22px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');`}</style>

      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(240,180,41,0.08)', border: `1px solid ${C.lineG}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><path d="M3 16 Q16 4 29 16" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" /><path d="M3 16 Q16 28 29 16" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" /><circle cx="16" cy="16" r="5.2" stroke={C.gold} strokeWidth="1.2" /><circle cx="16" cy="16" r="1.7" fill="#F6D89B" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.14em', color: C.t1 }}>ORÁCULO <span style={{ color: C.gold }}>ADMIN</span></div>
              <div style={{ fontSize: 11, color: C.t3 }}>{name} · <span style={{ color: role === 'admin' ? C.gold : C.t2, textTransform: 'uppercase', fontWeight: 700 }}>{role}</span>{isPreview && ' · PREVIEW'}</div>
            </div>
          </div>
          <button onClick={logout} style={{ background: 'transparent', border: `1px solid ${C.line}`, color: C.t2, fontSize: 12, padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>Sair</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(isAdmin ? [['overview', 'Visão geral'], ['clients', 'Clientes'], ['new', 'Novo cliente']] as const : [['new', 'Cadastrar cliente']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={chip(tab === id)}>{label}</button>
          ))}
        </div>

        {msg && <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, fontSize: 13, background: msg.ok ? 'rgba(52,211,153,0.10)' : 'rgba(248,113,113,0.10)', color: msg.ok ? C.green : C.red, border: `1px solid ${msg.ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>{msg.text}</div>}

        {created && (
          <div style={{ marginBottom: 16, padding: '16px 20px', borderRadius: 12, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.3)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 12 }}>{created.action === 'resent' ? `Nova senha gerada e e-mail reenviado para ${created.email}` : 'Acesso criado com sucesso'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              {[['E-MAIL', created.email], ['SENHA', created.password], ['CHAVE DA EXTENSÃO', created.licenseKey || '—']].map(([l, v]) => (
                <div key={l} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, letterSpacing: '0.08em', marginBottom: 6 }}>{l}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><code style={{ fontSize: 12, color: C.gold, flex: 1, wordBreak: 'break-all' }}>{v}</code>{v && v !== '—' && <button onClick={() => copy(v as string)} style={{ background: 'none', border: 'none', color: C.t3, cursor: 'pointer' }}>⧉</button>}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setCreated(null)} style={{ marginTop: 12, background: 'none', border: 'none', color: C.t3, fontSize: 11, cursor: 'pointer' }}>Fechar</button>
          </div>
        )}

        {/* ═══ VISÃO GERAL ═══ */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 12 }}>
              {[30, 90, 365].map(d => <button key={d} onClick={() => setDays(d)} style={chip(days === d)}>{d === 365 ? '1 ano' : `${d} dias`}</button>)}
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 14 }}>
              {[
                { label: 'Assinantes ativos', value: k?.activeSubs ?? '—', col: C.green, ic: 'M4 20V4M4 20h16M8 17v-5M13 17V9M18 17V6' },
                { label: 'Faturamento total', value: brl(k?.revenueTotal ?? 0), col: C.gold, money: true },
                { label: 'Faturamento no mês', value: brl(k?.revenueMonth ?? 0), col: C.gold, money: true },
                { label: 'Atrasados', value: k?.overdue ?? '—', col: C.amber },
                { label: 'Cancelamentos', value: k?.canceled ?? '—', col: C.red },
                { label: 'Vitalícios', value: k?.lifetime ?? '—', col: C.violet },
              ].map(kpi => (
                <div key={kpi.label} style={{ ...card, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: 2, width: '100%', background: `linear-gradient(90deg,${kpi.col},transparent)` }} />
                  <div style={{ fontSize: 11.5, color: C.t2, marginBottom: 8 }}>{kpi.label}</div>
                  <div style={{ ...num, fontSize: kpi.money ? 19 : 24, fontWeight: 700, color: C.t1 }}>{kpi.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
              {/* Gráfico de faturamento */}
              <div style={{ ...card, padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Faturamento por dia</span>
                  <span style={{ ...num, fontSize: 11, color: C.t3 }}>{days} dias</span>
                </div>
                <RevChart series={data?.revenueSeries || []} />
              </div>
              {/* Distribuição por plano */}
              <div style={{ ...card, padding: '16px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Assinantes por plano</div>
                {(data?.byPlan || []).length === 0 && <div style={{ color: C.t3, fontSize: 12 }}>Sem dados ainda.</div>}
                {(data?.byPlan || []).sort((a, b) => b.count - a.count).map(p => {
                  const max = Math.max(1, ...(data?.byPlan || []).map(x => x.count))
                  return (
                    <div key={p.plan} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                        <span style={{ color: PLAN_COLOR[p.plan] || C.t2, fontWeight: 600 }}>{PLAN_LABEL[p.plan] || p.plan}</span>
                        <span style={{ ...num, color: C.t2 }}>{p.count}</span>
                      </div>
                      <div style={{ height: 7, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${(p.count / max) * 100}%`, background: PLAN_COLOR[p.plan] || C.t2, borderRadius: 99 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ═══ CLIENTES ═══ */}
        {tab === 'clients' && (
          <div style={{ ...card, padding: '16px 18px' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone…" style={{ flex: '1 1 240px', background: C.bg, border: `1px solid ${C.line}`, borderRadius: 9, color: C.t1, padding: '9px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              {([['all', 'Todos'], ['active', 'Ativos'], ['overdue', 'Atrasados'], ['canceled', 'Cancelados']] as const).map(([id, l]) => (
                <button key={id} onClick={() => setFStatus(id)} style={chip(fStatus === id)}>{l}</button>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead><tr>{['Cliente', 'Contato', 'Plano', 'Status', 'Expira', 'Ações'].map(h => <th key={h} style={{ color: C.t3, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${C.line}`, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: C.t3 }}>Nenhum cliente.</td></tr>}
                  {filtered.map(c => {
                    const wa = waLink(c.phone)
                    const stCol = c.status === 'active' ? C.green : c.status === 'overdue' ? C.amber : c.status === 'canceled' ? C.red : C.t3
                    const stLbl = c.status === 'active' ? 'Ativo' : c.status === 'overdue' ? 'Atrasado' : c.status === 'canceled' ? 'Cancelado' : '—'
                    const lic = licByEmail(c.email)
                    return (
                      <tr key={c.id}>
                        <td style={{ padding: '10px 12px', borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                          <div style={{ fontWeight: 600, color: C.t1 }}>{c.name}</div>
                        </td>
                        <td style={{ padding: '10px 12px', borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                          <div style={{ color: C.t2, fontSize: 11.5 }}>{c.email}</div>
                          {c.phone
                            ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                <span style={{ ...num, color: C.t3, fontSize: 11 }}>{c.phone}</span>
                                {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ fontSize: 10, fontWeight: 700, color: C.green, textDecoration: 'none', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, padding: '2px 8px' }}>WhatsApp</a>}
                              </div>
                            : <div style={{ color: C.t3, fontSize: 11, marginTop: 3 }}>sem telefone</div>}
                        </td>
                        <td style={{ padding: '10px 12px', borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                          <span style={{ background: `${PLAN_COLOR[c.plan] || C.t3}20`, color: PLAN_COLOR[c.plan] || C.t3, border: `1px solid ${PLAN_COLOR[c.plan] || C.t3}40`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{PLAN_LABEL[c.plan] || c.plan}</span>
                        </td>
                        <td style={{ padding: '10px 12px', borderBottom: `1px solid rgba(255,255,255,0.03)` }}><span style={{ color: stCol, fontWeight: 700 }}>● {stLbl}</span></td>
                        <td style={{ ...num, padding: '10px 12px', borderBottom: `1px solid rgba(255,255,255,0.03)`, color: C.t3, fontSize: 11 }}>{c.plan === 'lifetime' ? '∞' : c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : '—'}</td>
                        <td style={{ padding: '10px 12px', borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <button onClick={() => resend(c.email)} style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.3)', color: C.gold, fontSize: 10, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Reenviar</button>
                            <select defaultValue="" onChange={e => { if (e.target.value) changePlan(c.email, e.target.value); (e.target as HTMLSelectElement).value = '' }} style={{ background: 'rgba(94,155,224,0.08)', border: '1px solid rgba(94,155,224,0.3)', color: C.blue, fontSize: 10, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                              <option value="" disabled>Plano…</option>
                              {PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
                            </select>
                            {lic && lic.active && <span style={{ ...num, fontSize: 10, color: C.t3, alignSelf: 'center' }}>{lic.deviceIds?.length || 0}/{lic.maxDevices || 1} disp.</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ NOVO CLIENTE ═══ */}
        {tab === 'new' && (
          <div style={{ ...card, padding: '24px 26px', maxWidth: 560 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Cadastrar cliente</div>
            <div style={{ fontSize: 12, color: C.t3, marginBottom: 20 }}>Gera senha + chave da extensão automaticamente e envia o e-mail de acesso.</div>
            <form onSubmit={createClient} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {([['email', 'E-mail *', 'cliente@email.com', 'email'], ['name', 'Nome', 'Nome do cliente', 'text'], ['phone', 'Telefone (WhatsApp)', '(11) 99999-9999', 'tel']] as const).map(([f, l, ph, ty]) => (
                <div key={f}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.t3, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{l}</label>
                  <input required={f === 'email'} type={ty} value={(form as any)[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} placeholder={ph} style={{ width: '100%', background: C.bg, border: `1px solid ${C.line}`, borderRadius: 9, color: C.t1, padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.t3, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Plano</label>
                <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} style={{ width: '100%', background: C.bg, border: `1px solid ${C.line}`, borderRadius: 9, color: C.t1, padding: '10px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg,#F5C842,#C48F10)', color: '#1a1305', fontWeight: 800, fontSize: 13, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>{loading ? 'Criando…' : 'Criar acesso'}</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Gráfico de faturamento (SVG area) ───────────────────────────────────── */
function RevChart({ series }: { series: { date: string; amount: number }[] }) {
  const W = 640, H = 150, pad = 6
  if (!series.length) return <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontSize: 12 }}>Sem faturamento no período.</div>
  const max = Math.max(1, ...series.map(s => s.amount))
  const n = series.length
  const x = (i: number) => pad + (i / Math.max(1, n - 1)) * (W - pad * 2)
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2)
  const line = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(s.amount).toFixed(1)}`).join(' ')
  const area = `${line} L ${x(n - 1).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`
  const total = series.reduce((a, s) => a + s.amount, 0)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }} preserveAspectRatio="none">
        <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(240,180,41,0.28)" /><stop offset="100%" stopColor="rgba(240,180,41,0)" /></linearGradient></defs>
        <path d={area} fill="url(#rg)" />
        <path d={line} fill="none" stroke={C.gold} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div style={{ marginTop: 8, fontSize: 11, color: C.t3, fontFamily: "'JetBrains Mono',monospace" }}>Total no período: <span style={{ color: C.gold }}>{brl(total)}</span></div>
    </div>
  )
}
