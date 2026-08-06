'use client'
import { useEffect, useMemo, useState } from 'react'

/* ─── Tokens premium (grafite + ouro, identidade Oráculo) ─────────────────── */
const C = {
  bg: '#07080D', card: '#10121B', cardHov: '#161925', line: 'rgba(255,255,255,0.06)',
  lineG: 'rgba(240,180,41,0.30)', gold: '#F0B429', green: '#34D399', red: '#F87171',
  amber: '#FBBF24', violet: '#8B78FF', blue: '#5E9BE0',
  t1: '#F3F3FB', t2: '#9DA2BC', t3: '#666B85',
}
const GOLD_GRAD = 'linear-gradient(135deg,#F5C842,#C48F10)'
const PLAN_LABEL: Record<string, string> = { free: 'Gratuito', monthly: 'Mensal', biannual: 'Semestral', annual: 'Anual', lifetime: 'Vitalício' }
const PLAN_COLOR: Record<string, string> = { free: C.t3, monthly: C.blue, biannual: C.gold, annual: C.green, lifetime: C.violet }
const PLANS = ['monthly', 'biannual', 'annual', 'lifetime']

const brl = (n: number) => 'R$ ' + (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const brlAbbr = (n: number) => n >= 1000
  ? 'R$ ' + (n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k'
  : 'R$ ' + Math.round(n).toLocaleString('pt-BR')
const waLink = (phone?: string | null) => { const d = String(phone || '').replace(/\D/g, ''); if (!d) return null; return `https://wa.me/${d.startsWith('55') ? d : '55' + d}` }
const fmtDM = (d: string | Date) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
const fmtDMY = (d: string | Date) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
const isoDM = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}` // 'YYYY-MM-DD' sem fuso

const num = { fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: 'tabular-nums' as const }
const upLabel = { fontSize: 10, fontWeight: 700 as const, color: C.t3, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, boxShadow: '0 1px 2px rgba(0,0,0,0.4)' }
const inputSt = { width: '100%', background: C.bg, border: `1px solid ${C.line}`, borderRadius: 9, color: C.t1, padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, transition: 'border-color .15s' }

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
.orc-row:hover td { background: rgba(255,255,255,0.02); }
.orc-in:focus { border-color: ${C.lineG} !important; }
.orc-gold:hover:not(:disabled) { filter: brightness(1.07); }
.orc-gold:disabled { opacity: .55; cursor: default; }
.orc-ghost:hover { border-color: rgba(255,255,255,0.16); color: ${C.t1}; }
.orc-wa:hover { background: rgba(52,211,153,0.18) !important; }
.orc-mini:hover { filter: brightness(1.15); }
`

/* ─── Peças de UI ─────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(240,180,41,0.08)', border: `1px solid ${C.lineG}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><path d="M3 16 Q16 4 29 16" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" /><path d="M3 16 Q16 28 29 16" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" /><circle cx="16" cy="16" r="5.2" stroke={C.gold} strokeWidth="1.2" /><circle cx="16" cy="16" r="1.7" fill="#F6D89B" /></svg>
    </div>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  const col = PLAN_COLOR[plan] || C.t3
  return <span style={{ background: `${col}1A`, color: col, border: `1px solid ${col}40`, borderRadius: 6, padding: '2px 8px', fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{PLAN_LABEL[plan] || plan}</span>
}

function CopyBtn({ value }: { value: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button" title="Copiar" className="orc-mini"
      onClick={() => { navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1400) }}
      style={{ background: 'transparent', border: `1px solid ${ok ? 'rgba(52,211,153,0.4)' : C.line}`, borderRadius: 7, width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: ok ? C.green : C.t3, flexShrink: 0, padding: 0 }}
    >
      {ok
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>}
    </button>
  )
}

function WaBtn({ phone, text }: { phone?: string | null; text?: string }) {
  const base = waLink(phone)
  if (!base) return null
  const href = text ? `${base}?text=${encodeURIComponent(text)}` : base
  return (
    <a href={href} target="_blank" rel="noreferrer" className="orc-wa" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: C.green, textDecoration: 'none', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap', transition: 'background .15s' }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
      WhatsApp
    </a>
  )
}

function GrowthBadge({ pct }: { pct: number | null | undefined }) {
  if (pct === null || pct === undefined) {
    return <span style={{ ...num, fontSize: 10, fontWeight: 700, color: C.t3, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.line}`, borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap' }}>1º mês</span>
  }
  const up = pct >= 0
  const col = up ? C.green : C.red
  return (
    <span style={{ ...num, fontSize: 10, fontWeight: 700, color: col, background: `${col}14`, border: `1px solid ${col}33`, borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {up ? '▲ +' : '▼ '}{pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
    </span>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '18px 8px', textAlign: 'center', color: C.t3, fontSize: 12, lineHeight: 1.5 }}>{children}</div>
}

/* ─── Gráfico de faturamento (SVG área + gridlines + tooltip) ─────────────── */
function RevChart({ series, days }: { series: { date: string; amount: number }[]; days: number }) {
  const [hover, setHover] = useState<number | null>(null)

  // Acima de 120 dias, agrega por semana pra não virar serrote ilegível.
  const { pts, weekly } = useMemo(() => {
    if (days <= 120 || series.length === 0) return { pts: series, weekly: false }
    const agg: { date: string; amount: number }[] = []
    for (let i = 0; i < series.length; i += 7) {
      const chunk = series.slice(i, i + 7)
      agg.push({ date: chunk[0].date, amount: chunk.reduce((a, s) => a + s.amount, 0) })
    }
    return { pts: agg, weekly: true }
  }, [series, days])

  const W = 640, H = 170, padX = 8, padT = 14, padB = 8, CHART_PX = 190

  if (!pts.length) {
    return <div style={{ height: CHART_PX + 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontSize: 12 }}>Sem faturamento no período.</div>
  }

  const max = Math.max(1, ...pts.map(p => p.amount))
  const n = pts.length
  const x = (i: number) => padX + (i / Math.max(1, n - 1)) * (W - padX * 2)
  const y = (v: number) => H - padB - (v / max) * (H - padT - padB)
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.amount).toFixed(1)}`).join(' ')
  const area = `${line} L ${x(n - 1).toFixed(1)} ${H - padB} L ${x(0).toFixed(1)} ${H - padB} Z`
  const total = series.reduce((a, s) => a + s.amount, 0)
  const grid = [1 / 3, 2 / 3, 1] // 3 gridlines com label de valor

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const rx = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.round(((rx - padX) / (W - padX * 2)) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  const hovPt = hover !== null ? pts[hover] : null
  const hovLeft = hover !== null ? (x(hover) / W) * 100 : 0
  const hovTop = hovPt ? (y(hovPt.amount) / H) * 100 : 0
  const axisIdx = n >= 3 ? [0, Math.floor((n - 1) / 2), n - 1] : n === 2 ? [0, 1] : [0]

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
          style={{ width: '100%', height: CHART_PX, display: 'block', cursor: 'crosshair' }}
          onMouseMove={onMove} onMouseLeave={() => setHover(null)}
        >
          <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(240,180,41,0.28)" /><stop offset="100%" stopColor="rgba(240,180,41,0)" /></linearGradient></defs>
          {grid.map(f => (
            <line key={f} x1={0} x2={W} y1={y(max * f)} y2={y(max * f)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} fill="url(#rg)" />
          <path d={line} fill="none" stroke={C.gold} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* labels das gridlines (HTML pra não distorcer com o preserveAspectRatio) */}
        {grid.map(f => (
          <div key={f} style={{ ...num, position: 'absolute', left: 2, top: `${(y(max * f) / H) * 100}%`, transform: 'translateY(-115%)', fontSize: 9.5, color: C.t3, pointerEvents: 'none' }}>
            {brlAbbr(max * f)}
          </div>
        ))}

        {/* guia + marcador + tooltip */}
        {hovPt && (
          <>
            <div style={{ position: 'absolute', left: `${hovLeft}%`, top: 0, bottom: 0, width: 1, background: 'rgba(240,180,41,0.22)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: `${hovLeft}%`, top: `${hovTop}%`, width: 8, height: 8, borderRadius: 99, background: C.gold, border: `2px solid ${C.card}`, transform: 'translate(-50%,-50%)', pointerEvents: 'none', boxShadow: '0 0 0 1px rgba(240,180,41,0.4)' }} />
            <div style={{ position: 'absolute', left: `${Math.min(88, Math.max(12, hovLeft))}%`, top: `${hovTop}%`, transform: 'translate(-50%,-130%)', background: C.cardHov, border: `1px solid ${C.lineG}`, borderRadius: 8, padding: '6px 10px', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 2, boxShadow: '0 6px 18px rgba(0,0,0,0.5)' }}>
              <div style={{ ...num, fontSize: 9.5, color: C.t3, marginBottom: 2 }}>{weekly ? 'semana de ' : ''}{isoDM(hovPt.date)}</div>
              <div style={{ ...num, fontSize: 12.5, fontWeight: 700, color: C.gold }}>{brl(hovPt.amount)}</div>
            </div>
          </>
        )}
      </div>

      {/* eixo de datas: primeira / meio / última */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {axisIdx.map(i => <span key={i} style={{ ...num, fontSize: 9.5, color: C.t3 }}>{isoDM(pts[i].date)}</span>)}
      </div>

      <div style={{ ...num, marginTop: 10, fontSize: 11, color: C.t3 }}>
        Total no período: <span style={{ color: C.gold }}>{brl(total)}</span>{weekly && <span> · agregado por semana</span>}
      </div>
    </div>
  )
}

/* ─── Componente principal ────────────────────────────────────────────────── */
export default function AdminClient({ role, name, previewData }: { role: string; name: string; previewData?: any }) {
  // Funcionário (staff) só cadastra cliente; admin vê o centro de decisão completo.
  const isAdmin = role === 'admin'
  const [tab, setTab] = useState<'overview' | 'clients' | 'new' | 'team' | 'demo'>(isAdmin ? 'overview' : 'new')
  const [data, setData] = useState<any>(previewData || null)
  const [days, setDays] = useState(90)
  const [licenses, setLicenses] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState<'all' | 'active' | 'overdue' | 'canceled'>('all')
  // Diagnóstico do push por cliente ("não recebo notificação") — ver painel abaixo.
  const [diag, setDiag] = useState<{ email: string; loading: boolean; data: any } | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<any>(null)
  const [form, setForm] = useState({ email: '', name: '', phone: '', plan: 'monthly' })
  // Equipe
  const [team, setTeam] = useState<any[]>(previewData?.team || [])
  const [teamForm, setTeamForm] = useState({ name: '', email: '', role: 'staff' })
  const [teamCreated, setTeamCreated] = useState<{ name: string; email: string; password?: string; promoted?: boolean; role?: string } | null>(null)
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamMsg, setTeamMsg] = useState<string | null>(null)
  // Conta demo (apresentação)
  const [demoCfg, setDemoCfg] = useState<any>(null)
  const [demoEmail, setDemoEmail] = useState('demo@oraculojf.com.br')
  const [demoPass, setDemoPass] = useState('')
  const [demoResult, setDemoResult] = useState<{ email: string; password: string | null } | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoMsg, setDemoMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const isPreview = !!previewData

  async function load() {
    if (isPreview || !isAdmin) return   // staff não puxa dashboard/lista
    const [d, l, t] = await Promise.all([
      fetch(`/api/admin/dashboard?days=${days}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/admin/licenses').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/admin/team').then(r => r.ok ? r.json() : null).catch(() => null),
    ])
    if (d) setData(d)
    setLicenses(Array.isArray(l) ? l : Array.isArray(l?.licenses) ? l.licenses : [])
    if (t && Array.isArray(t.team)) setTeam(t.team)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [days])

  // Carrega a config da conta demo (uma vez, só admin)
  useEffect(() => {
    if (isPreview || !isAdmin) return
    fetch('/api/admin/demo').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setDemoCfg(d.config); if (d.email) setDemoEmail(d.email) }
    }).catch(() => {})
  /* eslint-disable-next-line */ }, [])

  function setCfg(key: string, value: any) { setDemoCfg((c: any) => ({ ...(c || {}), [key]: value })) }
  function setProd(i: number, key: string, value: any) {
    setDemoCfg((c: any) => { const products = [...(c?.products || [])]; products[i] = { ...products[i], [key]: value }; return { ...c, products } })
  }

  async function saveDemo(e: React.FormEvent) {
    e.preventDefault(); setDemoLoading(true); setDemoMsg(null)
    try {
      const r = await fetch('/api/admin/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: demoEmail, password: demoPass || undefined, config: demoCfg }) })
      const d = await r.json()
      setDemoLoading(false)
      if (r.ok) { setDemoResult({ email: d.email, password: d.password }); setDemoPass(''); setDemoCfg(d.config); setDemoMsg({ text: 'Conta demo salva. Faça login com ela para apresentar.', ok: true }) }
      else setDemoMsg({ text: d.error || 'Erro ao salvar', ok: false })
    } catch { setDemoLoading(false); setDemoMsg({ text: 'Falha de conexão.', ok: false }) }
  }

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
  async function addStaff(e: React.FormEvent) {
    e.preventDefault(); setTeamLoading(true); setTeamMsg(null); setTeamCreated(null)
    const r = await fetch('/api/admin/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(teamForm) })
    const d = await r.json()
    if (r.ok) { setTeamCreated({ name: teamForm.name, email: teamForm.email, password: d.password, promoted: d.action === 'promoted', role: d.role }); setTeamForm({ name: '', email: '', role: 'staff' }); await load() }
    else setTeamMsg(d.error || 'Erro ao criar funcionário')
    setTeamLoading(false)
  }
  async function toggleStaff(email: string, active: boolean) {
    const r = await fetch('/api/admin/team', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, active }) })
    if (r.ok) await load()
  }
  async function toggleClient(email: string, active: boolean) {
    if (!active && !confirm(`Desativar ${email}?\n\nBloqueia o painel E a extensão. Dá pra reativar depois.`)) return
    setMsg(null); setCreated(null)
    const r = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, active }) })
    const d = await r.json()
    if (!r.ok) { setMsg({ text: d.error || 'Erro', ok: false }); return }
    // licencaDesativada === false → a conta caiu, mas a chave da extensão não foi
    // achada/derrubada. Avisa em vez de dar "tudo certo" e deixar a extensão viva.
    setMsg({
      text: active
        ? `${email} reativado`
        : d.licencaDesativada === false
          ? `${email} desativado — mas a licença da extensão NÃO caiu, confira na aba Licenças`
          : `${email} desativado (painel + extensão)`,
      ok: active || d.licencaDesativada !== false,
    })
    await load()
  }
  async function diagPush(email: string) {
    setDiag({ email, loading: true, data: null })
    try {
      const r = await fetch(`/api/admin/push-diagnose?email=${encodeURIComponent(email)}`)
      const d = await r.json()
      setDiag({ email, loading: false, data: r.ok ? d : { erro: d?.error || 'falhou' } })
    } catch {
      setDiag({ email, loading: false, data: { erro: 'sem resposta do servidor' } })
    }
  }
  async function markSaleTest(id: string, email: string, amount: number) {
    if (!confirm(`Marcar a venda de ${email} (${brl(amount)}) como TESTE?\n\nSai do faturamento, MRR e ticket médio. A linha continua no histórico.`)) return
    setMsg(null); setCreated(null)
    const r = await fetch('/api/admin/sales', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'test' }) })
    const d = await r.json()
    if (r.ok) { setMsg({ text: `Venda de ${email} marcada como teste — fora do faturamento`, ok: true }); await load() }
    else setMsg({ text: d.error || 'Erro', ok: false })
  }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login' }

  const k = data?.kpis
  const clients: any[] = data?.clients || []
  const filtered = clients.filter(c =>
    (fStatus === 'all' || c.status === fStatus) &&
    (!search || [c.name, c.email, c.phone].some(v => String(v || '').toLowerCase().includes(search.toLowerCase())))
  )
  const licByEmail = (email: string) => licenses.find(l => l.email?.toLowerCase() === email?.toLowerCase())

  const chip = (on: boolean, col = C.gold): any => ({ padding: '7px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? C.lineG : C.line}`, background: on ? 'rgba(240,180,41,0.10)' : 'transparent', color: on ? col : C.t2, fontFamily: 'inherit', transition: 'border-color .15s,color .15s' })
  const fieldLabel = { ...upLabel, display: 'block', marginBottom: 6 }
  const cellB = { borderBottom: '1px solid rgba(255,255,255,0.03)' }

  // Texto pré-preenchido do WhatsApp com os dados de acesso (staff)
  const accessWaText = (cr: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return [
      'Seu acesso ao ORÁCULO está pronto!',
      '',
      `Painel: ${origin}/login`,
      `E-mail: ${cr.email}`,
      cr.password && cr.password !== '(mantida)' ? `Senha: ${cr.password}` : null,
      cr.licenseKey ? `Chave da extensão: ${cr.licenseKey}` : null,
    ].filter(Boolean).join('\n')
  }

  /* ── Card de credenciais geradas (compartilhado admin/staff) ── */
  const credentialsCard = created && (
    <div style={{ marginBottom: 16, padding: '16px 20px', borderRadius: 12, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.3)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 12 }}>
        {created.action === 'resent' ? `Nova senha gerada e e-mail reenviado para ${created.email}` : created.action === 'updated' ? 'Acesso atualizado com sucesso' : 'Acesso criado com sucesso'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
        {[['E-mail', created.email], ['Senha', created.password], ['Chave da extensão', created.licenseKey || '—']].map(([l, v]) => (
          <div key={l} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ ...upLabel, marginBottom: 6 }}>{l}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{ ...num, fontSize: 12, color: C.gold, flex: 1, wordBreak: 'break-all' }}>{v}</code>
              {v && v !== '—' && v !== '(mantida)' && <CopyBtn value={v as string} />}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        {!isAdmin && (
          <a
            href={`${waLink(created.phone) || 'https://wa.me/'}?text=${encodeURIComponent(accessWaText(created))}`}
            target="_blank" rel="noreferrer" className="orc-wa"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: C.green, textDecoration: 'none', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, padding: '7px 14px', transition: 'background .15s' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            Enviar por WhatsApp
          </a>
        )}
        <button onClick={() => setCreated(null)} className="orc-ghost" style={{ background: 'none', border: `1px solid ${C.line}`, borderRadius: 7, color: C.t3, fontSize: 11, padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .15s,border-color .15s' }}>Fechar</button>
      </div>
    </div>
  )

  // Painel do diagnóstico de push. O valor está em TRADUZIR o JSON num veredito
  // — quem atende o cliente precisa da causa, não do dump. O cru fica no rodapé.
  const diagBox = diag && (
    <div onClick={() => setDiag(null)}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(3,4,10,0.72)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ ...card, padding: '20px 22px', maxWidth: 520, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: C.t1, flex: 1, wordBreak: 'break-all' as const }}>Push de {diag.email}</span>
          <button onClick={() => setDiag(null)} style={{ background: 'transparent', border: 'none', color: C.t3, fontSize: 18, cursor: 'pointer', lineHeight: 1, fontFamily: 'inherit' }} aria-label="Fechar">×</button>
        </div>
        {diag.loading && <div style={{ fontSize: 12.5, color: C.t3, padding: '12px 0' }}>Consultando…</div>}
        {!diag.loading && diag.data?.erro && <div style={{ fontSize: 12.5, color: C.red, padding: '10px 0' }}>{diag.data.erro}</div>}
        {!diag.loading && diag.data && !diag.data.erro && (() => {
          const d = diag.data
          const v = d.vigia || {}
          const linha = (ok: boolean, txt: string) => (
            <div key={txt} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 0', fontSize: 12.5, color: C.t2 }}>
              <span style={{ color: ok ? C.green : C.red, fontWeight: 700, flexShrink: 0 }}>{ok ? '✓' : '✗'}</span>
              <span>{txt}</span>
            </div>
          )
          // Veredito: a primeira coisa que está errada na ordem em que quebra.
          const veredito = !d.subscribed
            ? { cor: C.amber, txt: 'Não está inscrito. O cliente precisa ativar as notificações no painel — e no iPhone o app tem que estar instalado na tela de início (pelo Safari não recebe).' }
            : !d.amazonConectada
              ? { cor: C.amber, txt: 'Conta Amazon não conectada. Sem isso o vigia nem olha os pedidos dele.' }
              : v.lastError
                ? { cor: C.red, txt: `O vigia está com erro: ${v.lastError}` }
                : (d.pedidosNaJanela ?? 0) === 0
                  ? { cor: C.t2, txt: 'Configuração OK. Não houve pedido nas últimas 24h — não havia o que notificar.' }
                  : { cor: C.green, txt: `Configuração OK e houve ${d.pedidosNaJanela} pedido(s) em 24h. Se mesmo assim não chegou, o gargalo é no aparelho: no iPhone o app precisa estar na tela de início, e o modo Foco/silencioso esconde o alerta.` }
          return (
            <>
              <div style={{ fontSize: 12.5, color: veredito.cor, padding: '10px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.line}`, margin: '10px 0 14px', lineHeight: 1.5 }}>
                {veredito.txt}
              </div>
              {linha(!!d.subscribed, `Inscrito no servidor${d.subscriptions ? ` · ${d.subscriptions} dispositivo(s)` : ''}`)}
              {linha(!!d.amazonConectada, 'Conta Amazon conectada')}
              {linha(!!d.active, 'Web Push configurado no servidor (VAPID)')}
              {linha(!v.lastError, v.lastError ? `Vigia com erro: ${v.lastError}` : `Vigia rodando · ${v.runs || 0} ciclos · ${v.sellers || 0} sellers · ciclo ${v.cicloMin || '?'}min`)}
              {linha((d.pedidosNaJanela ?? 0) > 0, `${d.pedidosNaJanela ?? 0} pedido(s) nas últimas ${d.janelaHoras || 24}h`)}
              {!!(d.ultimosPedidos || []).length && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
                  <div style={{ ...upLabel, marginBottom: 6 }}>Últimos pedidos</div>
                  {d.ultimosPedidos.map((o: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11.5, color: C.t3, padding: '3px 0' }}>
                      <span style={{ ...num }}>{fmtDM(o.data)}</span>
                      <span style={{ flex: 1 }}>{o.status}</span>
                      {/* total 0 = a Amazon suprime o valor no pedido Pending */}
                      <span style={{ ...num, color: o.total > 0 ? C.t2 : C.amber }}>{o.total > 0 ? brl(o.total) : 'sem valor'}</span>
                    </div>
                  ))}
                </div>
              )}
              <details style={{ marginTop: 12 }}>
                <summary style={{ ...upLabel, cursor: 'pointer' }}>Resposta crua</summary>
                <pre style={{ ...num, fontSize: 10, color: C.t3, whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const, marginTop: 8 }}>{JSON.stringify(d, null, 2)}</pre>
              </details>
            </>
          )
        })()}
      </div>
    </div>
  )

  const msgBox = msg && (
    <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, fontSize: 13, background: msg.ok ? 'rgba(52,211,153,0.10)' : 'rgba(248,113,113,0.10)', color: msg.ok ? C.green : C.red, border: `1px solid ${msg.ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>{msg.text}</div>
  )

  const clientForm = (
    <form onSubmit={createClient} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {([['email', 'E-mail *', 'cliente@email.com', 'email'], ['name', 'Nome', 'Nome do cliente', 'text'], ['phone', 'Telefone (WhatsApp)', '(11) 99999-9999', 'tel']] as const).map(([f, l, ph, ty]) => (
        <div key={f}>
          <label style={fieldLabel}>{l}</label>
          <input required={f === 'email'} type={ty} value={(form as any)[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} placeholder={ph} className="orc-in" style={inputSt} />
        </div>
      ))}
      <div>
        <label style={fieldLabel}>Plano</label>
        <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} className="orc-in" style={{ ...inputSt, cursor: 'pointer' }}>
          {PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
        </select>
      </div>
      <button type="submit" disabled={loading} className="orc-gold" style={{ background: GOLD_GRAD, color: '#1a1305', fontWeight: 800, fontSize: 13, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4, transition: 'filter .15s' }}>{loading ? 'Criando…' : 'Criar acesso'}</button>
    </form>
  )

  /* ═══ TELA DO FUNCIONÁRIO (staff): só cadastro, sem dados do negócio ═══ */
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.t1, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", padding: '24px 22px' }}>
        <style>{CSS}</style>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Logo />
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.14em' }}>ORÁCULO <span style={{ color: C.gold }}>EQUIPE</span></div>
            </div>
            <button onClick={logout} className="orc-ghost" style={{ background: 'transparent', border: `1px solid ${C.line}`, color: C.t2, fontSize: 12, padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', transition: 'color .15s,border-color .15s' }}>Sair</button>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 4 }}>Olá, {name}</div>
            <div style={{ fontSize: 13.5, color: C.t2 }}>Cadastre novos clientes do Oráculo</div>
          </div>

          {msgBox}
          {credentialsCard}

          <div style={{ ...card, padding: '24px 26px', maxWidth: 560 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Novo cliente</div>
            <div style={{ fontSize: 12, color: C.t3, marginBottom: 20 }}>Gera senha + chave da extensão automaticamente e envia o e-mail de acesso.</div>
            {clientForm}
          </div>
        </div>
      </div>
    )
  }

  /* ═══ PAINEL DO ADMIN ═══ */
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.t1, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", padding: '24px 22px' }}>
      <style>{CSS}</style>

      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.14em', color: C.t1 }}>ORÁCULO <span style={{ color: C.gold }}>ADMIN</span></div>
              <div style={{ fontSize: 11, color: C.t3 }}>{name} · <span style={{ color: C.gold, textTransform: 'uppercase', fontWeight: 700 }}>{role}</span>{isPreview && ' · PREVIEW'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="/dashboard" className="orc-ghost" style={{ background: 'transparent', border: `1px solid ${C.gold}55`, color: C.gold, fontSize: 12, padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', transition: 'color .15s,border-color .15s' }}>Painel do cliente ↗</a>
            <button onClick={logout} className="orc-ghost" style={{ background: 'transparent', border: `1px solid ${C.line}`, color: C.t2, fontSize: 12, padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', transition: 'color .15s,border-color .15s' }}>Sair</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {([['overview', 'Visão geral'], ['clients', 'Clientes'], ['new', 'Novo cliente'], ['team', 'Equipe'], ['demo', 'Conta Demo']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={chip(tab === id)}>{label}</button>
          ))}
        </div>

        {diagBox}
        {msgBox}
        {credentialsCard}

        {/* ═══ VISÃO GERAL ═══ */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {[7, 30, 90, 365].map(d => <button key={d} onClick={() => setDays(d)} style={chip(days === d)}>{d === 365 ? '1 ano' : `${d} dias`}</button>)}
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 14 }}>
              {[
                { label: 'Assinantes ativos', value: k ? String(k.activeSubs) : '—', col: C.green },
                { label: 'MRR · receita recorrente/mês', value: k ? brl(k.mrr) : '—', col: C.gold, money: true },
                { label: 'Faturamento no mês', value: k ? brl(k.revenueMonth) : '—', col: C.gold, money: true, badge: k ? <GrowthBadge pct={k.growthPct} /> : null },
                { label: 'Faturamento total', value: k ? brl(k.revenueTotal) : '—', col: C.gold, money: true },
                { label: 'Ticket médio', value: k ? (k.avgTicket == null ? '—' : brl(k.avgTicket)) : '—', col: C.blue, money: true },
                { label: 'Atrasados', value: k ? String(k.overdue) : '—', col: C.amber },
                { label: 'Cancelamentos', value: k ? String(k.canceled) : '—', col: C.red },
                { label: 'Vitalícios', value: k ? String(k.lifetime) : '—', col: C.violet },
              ].map((kpi: any) => (
                <div key={kpi.label} style={{ ...card, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: 2, width: '100%', background: `linear-gradient(90deg,${kpi.col},transparent)` }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 8, minHeight: 18 }}>
                    <div style={{ ...upLabel, letterSpacing: '0.08em' }}>{kpi.label}</div>
                    {kpi.badge}
                  </div>
                  <div style={{ ...num, fontSize: kpi.money ? 17 : 22, fontWeight: 700, color: C.t1 }}>{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Gráfico + planos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 14, marginBottom: 14 }}>
              <div style={{ ...card, padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Faturamento por dia</span>
                  <span style={{ ...num, fontSize: 11, color: C.t3 }}>{days === 365 ? '1 ano' : `${days} dias`}</span>
                </div>
                <RevChart series={data?.revenueSeries || []} days={days} />
              </div>

              <div style={{ ...card, padding: '16px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Assinantes por plano</div>
                {(data?.byPlan || []).length === 0 && <Empty>Sem assinantes ativos ainda.</Empty>}
                {[...(data?.byPlan || [])].sort((a: any, b: any) => b.count - a.count).map((p: any) => {
                  const max = Math.max(1, ...(data?.byPlan || []).map((x: any) => x.count))
                  const col = PLAN_COLOR[p.plan] || C.t2
                  return (
                    <div key={p.plan} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, fontSize: 12, marginBottom: 5 }}>
                        <span style={{ color: col, fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {PLAN_LABEL[p.plan] || p.plan} <span style={{ color: C.t2, fontWeight: 500 }}>· {p.count} {p.count === 1 ? 'assinante' : 'assinantes'}</span>
                        </span>
                        <span style={{ ...num, color: C.t1, flexShrink: 0 }}>{brl(p.revenue)}</span>
                      </div>
                      <div style={{ height: 7, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${(p.count / max) * 100}%`, background: col, borderRadius: 99 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Radar de ação + vendas recentes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14 }}>
              <div style={{ ...card, padding: '16px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Radar de ação</div>

                <div style={{ ...upLabel, marginBottom: 8 }}>Renovações em 7 dias</div>
                {(data?.expiringSoon || []).length === 0
                  ? <Empty>Nenhuma renovação nos próximos 7 dias.</Empty>
                  : (data?.expiringSoon || []).map((c: any) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '7px 0', ...cellB }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || c.email}</span>
                        <PlanBadge plan={c.plan} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ ...num, fontSize: 11, color: C.t2 }}>vence {fmtDM(c.expiresAt)}</span>
                        <WaBtn phone={c.phone} />
                      </div>
                    </div>
                  ))}

                <div style={{ height: 1, background: C.line, margin: '14px 0' }} />

                <div style={{ ...upLabel, color: C.amber, marginBottom: 8 }}>Atrasados</div>
                {(data?.overdueList || []).length === 0
                  ? <Empty>Nenhum cliente em atraso. Tudo em dia.</Empty>
                  : (data?.overdueList || []).map((c: any) => {
                    const dOver = Math.max(1, Math.floor((Date.now() - new Date(c.expiresAt).getTime()) / 86400_000))
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '7px 0', ...cellB }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || c.email}</span>
                          <PlanBadge plan={c.plan} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ ...num, fontSize: 11, color: C.amber }}>vencido há {dOver}d</span>
                          <WaBtn phone={c.phone} />
                        </div>
                      </div>
                    )
                  })}
              </div>

              <div style={{ ...card, padding: '16px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Vendas recentes</div>
                {(data?.recentSales || []).length === 0
                  ? <Empty>As vendas da Greenn aparecem aqui em tempo real.</Empty>
                  : (data?.recentSales || []).map((s: any) => {
                    const dead = s.status === 'refunded' || s.status === 'canceled' || s.status === 'test'
                    return (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', ...cellB }}>
                        <span style={{ ...num, fontSize: 11, color: C.t3, flexShrink: 0 }}>{fmtDM(s.paidAt)}</span>
                        <span style={{ fontWeight: 600, fontSize: 12.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: dead ? C.t3 : C.t1 }}>{s.name || s.email}</span>
                        {s.status === 'test' && <span style={{ ...upLabel, fontSize: 9, color: C.t3, flexShrink: 0 }}>teste</span>}
                        <PlanBadge plan={s.plan} />
                        <span style={{ ...num, fontSize: 12.5, fontWeight: 700, flexShrink: 0, color: dead ? C.red : C.t1, textDecoration: dead ? 'line-through' : 'none' }}>{brl(s.amount)}</span>
                        {/* Só na venda ainda contada: marcar como teste é o que tira do faturamento.
                            ⚠️ O rótulo era só "teste" e o João leu como STATUS ("essas vendas
                            estão marcadas como teste?"), justo num painel de dinheiro. Verbo na
                            frente deixa claro que é ação, não etiqueta. */}
                        {!dead && (
                          <button onClick={() => markSaleTest(s.id, s.email, s.amount)} className="orc-mini" title="Esta venda não é real (teste de webhook) — tirar do faturamento"
                            style={{ background: 'transparent', border: `1px solid ${C.line}`, color: C.t3, fontSize: 9.5, padding: '2px 7px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>não é real</button>
                        )}
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
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone…" className="orc-in" style={{ ...inputSt, flex: '1 1 240px', width: 'auto', padding: '9px 14px' }} />
              {([['all', 'Todos'], ['active', 'Ativos'], ['overdue', 'Atrasados'], ['canceled', 'Cancelados']] as const).map(([id, l]) => (
                <button key={id} onClick={() => setFStatus(id)} style={chip(fStatus === id)}>{l}</button>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead><tr>{['Cliente', 'Contato', 'Plano', 'Status', 'Expira', 'Cliente desde', 'Ações'].map(h => <th key={h} style={{ ...upLabel, letterSpacing: '0.08em', textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${C.line}` }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: C.t3 }}>Nenhum cliente encontrado.</td></tr>}
                  {filtered.map(c => {
                    const stCol = c.status === 'active' ? C.green : c.status === 'overdue' ? C.amber : c.status === 'canceled' ? C.red : C.t3
                    const stLbl = c.status === 'active' ? 'Ativo' : c.status === 'overdue' ? 'Atrasado' : c.status === 'canceled' ? 'Cancelado' : '—'
                    const lic = licByEmail(c.email)
                    return (
                      <tr key={c.id} className="orc-row">
                        <td style={{ padding: '10px 12px', ...cellB }}>
                          <div style={{ fontWeight: 600, color: C.t1 }}>{c.name}</div>
                        </td>
                        <td style={{ padding: '10px 12px', ...cellB }}>
                          <div style={{ color: C.t2, fontSize: 11.5 }}>{c.email}</div>
                          {c.phone
                            ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                <span style={{ ...num, color: C.t3, fontSize: 11 }}>{c.phone}</span>
                                <WaBtn phone={c.phone} />
                              </div>
                            : <div style={{ color: C.t3, fontSize: 11, marginTop: 3 }}>sem telefone</div>}
                        </td>
                        <td style={{ padding: '10px 12px', ...cellB }}><PlanBadge plan={c.plan} /></td>
                        <td style={{ padding: '10px 12px', ...cellB }}><span style={{ color: stCol, fontWeight: 700 }}>● {stLbl}</span></td>
                        <td style={{ ...num, padding: '10px 12px', ...cellB, color: C.t3, fontSize: 11 }}>{c.plan === 'lifetime' ? '∞' : c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : '—'}</td>
                        <td style={{ ...num, padding: '10px 12px', ...cellB, color: C.t3, fontSize: 11 }}>{c.createdAt ? fmtDMY(c.createdAt) : '—'}</td>
                        <td style={{ padding: '10px 12px', ...cellB }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <button onClick={() => resend(c.email)} className="orc-mini" style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.3)', color: C.gold, fontSize: 10, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Reenviar</button>
                            <select defaultValue="" onChange={e => { if (e.target.value) changePlan(c.email, e.target.value); (e.target as HTMLSelectElement).value = '' }} style={{ background: 'rgba(94,155,224,0.08)', border: '1px solid rgba(94,155,224,0.3)', color: C.blue, fontSize: 10, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                              <option value="" disabled>Plano…</option>
                              {PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
                            </select>
                            <button onClick={() => diagPush(c.email)} className="orc-mini" title="Por que este cliente não recebe notificação de venda?"
                              style={{ background: 'rgba(139,120,255,0.08)', border: '1px solid rgba(139,120,255,0.3)', color: C.violet, fontSize: 10, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Push</button>
                            {c.active === false
                              ? <button onClick={() => toggleClient(c.email, true)} className="orc-mini" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', color: C.green, fontSize: 10, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Reativar</button>
                              : <button onClick={() => toggleClient(c.email, false)} className="orc-mini" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', color: C.red, fontSize: 10, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Desativar</button>}
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
            {clientForm}
          </div>
        )}

        {/* ═══ EQUIPE ═══ */}
        {tab === 'team' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 14, alignItems: 'start' }}>
            {/* Lista de membros */}
            <div style={{ ...card, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Membros da equipe</div>
              {team.length === 0
                ? <Empty>Nenhum membro ainda. Adicione o primeiro funcionário ao lado.</Empty>
                : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                      <thead><tr>{['Membro', 'Papel', 'Status', 'Desde', 'Ações'].map(h => <th key={h} style={{ ...upLabel, letterSpacing: '0.08em', textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${C.line}` }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {team.map((m: any) => {
                          const admin = m.role === 'admin'
                          const roleCol = admin ? C.gold : m.role === 'support' ? C.violet : C.blue
                          const roleLbl = admin ? 'ADMIN' : m.role === 'support' ? 'SUPORTE' : 'STAFF'
                          return (
                            <tr key={m.id} className="orc-row">
                              <td style={{ padding: '10px 12px', ...cellB }}>
                                <div style={{ fontWeight: 600, color: C.t1 }}>{m.name}</div>
                                <div style={{ color: C.t3, fontSize: 11 }}>{m.email}</div>
                              </td>
                              <td style={{ padding: '10px 12px', ...cellB }}>
                                <span style={{ background: `${roleCol}1A`, color: roleCol, border: `1px solid ${roleCol}40`, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>{roleLbl}</span>
                              </td>
                              <td style={{ padding: '10px 12px', ...cellB }}>
                                <span style={{ color: m.active ? C.green : C.t3, fontWeight: 700, fontSize: 12 }}>● {m.active ? 'Ativo' : 'Inativo'}</span>
                              </td>
                              <td style={{ ...num, padding: '10px 12px', ...cellB, color: C.t3, fontSize: 11 }}>{m.createdAt ? fmtDMY(m.createdAt) : '—'}</td>
                              <td style={{ padding: '10px 12px', ...cellB }}>
                                {admin
                                  ? <span style={{ color: C.t3, fontSize: 11 }}>—</span>
                                  : m.active
                                    ? <button onClick={() => toggleStaff(m.email, false)} className="orc-mini" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', color: C.red, fontSize: 10, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Desativar</button>
                                    : <button onClick={() => toggleStaff(m.email, true)} className="orc-mini" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', color: C.green, fontSize: 10, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Reativar</button>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>

            {/* Adicionar funcionário */}
            <div style={{ ...card, padding: '24px 26px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Adicionar à equipe</div>
              <div style={{ fontSize: 12, color: C.t3, marginBottom: 20 }}>Cria o acesso, gera a senha e envia por e-mail. <strong style={{ color: C.t2 }}>Funcionário</strong> só cadastra clientes; <strong style={{ color: C.violet }}>Suporte</strong> vê a lista de clientes e reenvia senha (sem ver vendas).</div>

              {teamMsg && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, fontSize: 12.5, background: 'rgba(248,113,113,0.10)', color: C.red, border: '1px solid rgba(248,113,113,0.3)' }}>{teamMsg}</div>}

              <form onSubmit={addStaff} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={fieldLabel}>Nome</label>
                  <input type="text" value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} placeholder="Nome do membro" className="orc-in" style={inputSt} />
                </div>
                <div>
                  <label style={fieldLabel}>E-mail *</label>
                  <input required type="email" value={teamForm.email} onChange={e => setTeamForm({ ...teamForm, email: e.target.value })} placeholder="pessoa@email.com" className="orc-in" style={inputSt} />
                </div>
                <div>
                  <label style={fieldLabel}>Papel</label>
                  <select value={teamForm.role} onChange={e => setTeamForm({ ...teamForm, role: e.target.value })} className="orc-in" style={inputSt}>
                    <option value="staff">Funcionário — só cadastra clientes</option>
                    <option value="support">Suporte — clientes + reenviar senha</option>
                  </select>
                </div>
                <button type="submit" disabled={teamLoading} className="orc-gold" style={{ background: GOLD_GRAD, color: '#1a1305', fontWeight: 800, fontSize: 13, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4, transition: 'filter .15s' }}>{teamLoading ? 'Criando…' : 'Criar acesso da equipe'}</button>
              </form>

              {teamCreated && (
                <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 12, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.green, marginBottom: 10 }}>{teamCreated.promoted ? `Conta promovida a ${teamCreated.role === 'support' ? 'Suporte' : 'Funcionário'}` : 'Acesso da equipe criado'}</div>
                  {teamCreated.promoted ? (
                    <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.6 }}>
                      <strong style={{ color: C.t1 }}>{teamCreated.email}</strong> já tinha conta e foi promovida — <strong style={{ color: C.green }}>mantém o mesmo login e senha</strong> e o acesso ao produto. É só pedir pra ela entrar em <span style={{ color: C.gold }}>/admin</span> (ou usar o botão “Painel Admin” no painel dela).
                    </div>
                  ) : (
                    <>
                      {[['E-mail', teamCreated.email], ['Senha', teamCreated.password || '—']].map(([l, v]) => (
                        <div key={l} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                          <div style={{ ...upLabel, marginBottom: 6 }}>{l}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <code style={{ ...num, fontSize: 12, color: C.gold, flex: 1, wordBreak: 'break-all' }}>{v}</code>
                            <CopyBtn value={v} />
                          </div>
                        </div>
                      ))}
                      <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.55, marginTop: 4 }}>
                        Envie estes dados; a pessoa acessa <span style={{ color: C.gold }}>/login</span>. A senha é exibida apenas uma vez.
                      </div>
                    </>
                  )}
                  <button onClick={() => setTeamCreated(null)} className="orc-ghost" style={{ marginTop: 10, background: 'none', border: `1px solid ${C.line}`, borderRadius: 7, color: C.t3, fontSize: 11, padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .15s,border-color .15s' }}>Fechar</button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'demo' && (
          <div style={{ maxWidth: 780 }}>
            <div style={{ ...card, padding: '24px 26px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, marginBottom: 4 }}>Conta de demonstração</div>
              <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.6, marginBottom: 18 }}>Uma conta com dados <b style={{ color: C.gold }}>100% fictícios</b> da Gestão para você apresentar a alunos sem expor sua loja real. Faça login com ela e todas as abas (Resumo, Vendas, Curva ABC, Ads, Estoque) mostram os números abaixo — de forma coerente. Sua conta e seus produtos reais nunca aparecem.</div>

              {demoMsg && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, fontSize: 12.5, background: demoMsg.ok ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${demoMsg.ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`, color: demoMsg.ok ? C.green : C.red }}>{demoMsg.text}</div>
              )}

              {!demoCfg ? (
                <div style={{ fontSize: 12.5, color: C.t3 }}>Carregando…</div>
              ) : (
                <form onSubmit={saveDemo} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <div style={{ ...upLabel, marginBottom: 6 }}>Nome exibido na conta</div>
                    <input value={demoCfg.name ?? ''} onChange={e => setCfg('name', e.target.value)} placeholder="João Florio" className="orc-in" style={inputSt} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><div style={{ ...upLabel, marginBottom: 6 }}>E-mail de acesso</div><input value={demoEmail} onChange={e => setDemoEmail(e.target.value)} className="orc-in" style={inputSt} /></div>
                    <div><div style={{ ...upLabel, marginBottom: 6 }}>Senha (branco = manter/gerar)</div><input value={demoPass} onChange={e => setDemoPass(e.target.value)} placeholder="••••••" className="orc-in" style={inputSt} /></div>
                  </div>

                  <div>
                    <div style={{ ...upLabel, marginBottom: 8 }}>Números da operação demo</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                      {([
                        ['revToday', 'Faturamento hoje (R$)'], ['revYesterday', 'Faturamento ontem (R$)'], ['rev7d', 'Faturamento 7 dias (R$)'], ['rev30d', 'Faturamento 30 dias (R$)'],
                        ['marginPct', 'Margem final % (MPA)'], ['tacosPct', 'TACOS % (ads)'], ['commissionPct', 'Comissão Amazon %'], ['fbaPct', 'Tarifa FBA %'], ['roas', 'ROAS (vendas/ads)'],
                      ] as const).map(([k, l]) => (
                        <div key={k}><div style={{ fontSize: 9.5, color: C.t3, marginBottom: 5 }}>{l}</div><input type="number" step="0.01" value={demoCfg[k] ?? ''} onChange={e => setCfg(k, Number(e.target.value))} className="orc-in" style={{ ...inputSt, padding: '9px 11px' }} /></div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ ...upLabel, marginBottom: 8 }}>Produtos demo &nbsp;<span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: C.t3 }}>(nome · participação 0–1 · preço)</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(demoCfg.products || []).map((p: any, i: number) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 92px 92px', gap: 8 }}>
                          <input value={p.name} onChange={e => setProd(i, 'name', e.target.value)} className="orc-in" style={inputSt} />
                          <input type="number" step="0.01" value={p.share} onChange={e => setProd(i, 'share', Number(e.target.value))} className="orc-in" style={inputSt} />
                          <input type="number" step="0.01" value={p.price} onChange={e => setProd(i, 'price', Number(e.target.value))} className="orc-in" style={inputSt} />
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10.5, color: C.t3, marginTop: 8, lineHeight: 1.5 }}>A margem final ({demoCfg.marginPct}%) é a MÉDIA — o custo dos produtos é fixado por ela (comissão + FBA + ads + margem = 100%), e cada período OSCILA em torno dela (ads, ACoS e TACoS variam, como numa loja real). As participações somam ~1.</div>
                  </div>

                  <button type="submit" disabled={demoLoading} className="orc-gold" style={{ alignSelf: 'flex-start', background: GOLD_GRAD, color: '#02020A', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: demoLoading ? 0.6 : 1 }}>{demoLoading ? 'Salvando…' : 'Salvar conta demo'}</button>
                </form>
              )}

              {demoResult && (
                <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 12, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.green, marginBottom: 10 }}>Conta demo pronta</div>
                  {[['E-mail', demoResult.email], ['Senha', demoResult.password || '(mantida)']].map(([l, v]) => (
                    <div key={l} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                      <div style={{ ...upLabel, marginBottom: 6 }}>{l}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{ ...num, fontSize: 12, color: C.gold, flex: 1, wordBreak: 'break-all' }}>{v}</code>
                        <CopyBtn value={String(v)} />
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.55, marginTop: 4 }}>Faça login em <span style={{ color: C.gold }}>/login</span> com essa conta para apresentar. A senha só aparece agora.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
