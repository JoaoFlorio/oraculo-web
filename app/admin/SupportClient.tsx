'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'

// TELA DO SUPORTE — admin RESTRITO (role 'support'). Vê SÓ a lista de clientes e
// reenvia a senha (que gera uma nova e mostra aqui pra copiar). Não vê vendas,
// faturamento, equipe nem conta demo — e o backend recusa qualquer outra ação
// (ver getClientsSession / clientsLevel). Componente separado do AdminClient de
// propósito: isola o que essa pessoa pode tocar.

const C = {
  bg: '#0A0A0F', card: '#13131F', line: 'rgba(255,255,255,0.08)', line2: 'rgba(255,255,255,0.16)',
  t1: '#E2E8F0', t2: '#94A3B8', t3: '#64748B', gold: '#F0B429',
  green: '#34D399', amber: '#FBBF24', red: '#F87171',
}
const GOLD_GRAD = 'linear-gradient(135deg,#F5C842 0%,#C48F10 100%)'
const PLAN_LABEL: Record<string, string> = { free: 'Gratuito', monthly: 'Mensal', biannual: 'Semestral', annual: 'Anual', lifetime: 'Vitalício' }
const SITE = 'https://app.oraculojf.com.br'

interface Cli { id: string; name: string; email: string; phone?: string | null; plan: string; active: boolean; expiresAt?: string | null; createdAt?: string }

function statusOf(c: Cli): { label: string; color: string } {
  if (!c.active) return { label: 'Inativo', color: C.red }
  if (c.plan === 'lifetime') return { label: 'Ativo', color: C.green }
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { label: 'Expirado', color: C.amber }
  return { label: 'Ativo', color: C.green }
}

export default function SupportClient({ name }: { name: string }) {
  const [clients, setClients] = useState<Cli[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [enviando, setEnviando] = useState<string | null>(null)
  const [gerado, setGerado] = useState<{ email: string; password: string; licenseKey: string } | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/users', { cache: 'no-store' })
      if (r.status === 401) { window.location.href = '/login'; return }
      const d = await r.json()
      setClients(Array.isArray(d.users) ? d.users : [])
    } catch { setMsg({ text: 'Falha ao carregar os clientes.', ok: false }) }
    setLoading(false)
  }, [])
  useEffect(() => { carregar() }, [carregar])

  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login' }

  async function reenviar(c: Cli) {
    if (!confirm(`Gerar uma NOVA senha para ${c.email} e reenviar o e-mail de acesso?\n\nA senha antiga deixa de funcionar.`)) return
    setEnviando(c.email); setMsg(null); setGerado(null)
    try {
      const r = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: c.email }) })
      const d = await r.json()
      if (r.ok) { setGerado({ email: c.email, password: d.password, licenseKey: d.licenseKey || '—' }); setMsg({ text: `Senha nova gerada e e-mail reenviado para ${c.email}.`, ok: true }) }
      else setMsg({ text: d.error || 'Erro ao reenviar.', ok: false })
    } catch { setMsg({ text: 'Falha de conexão.', ok: false }) }
    setEnviando(null)
  }

  function copiar(id: string, texto: string) {
    navigator.clipboard?.writeText(texto).then(() => { setCopiado(id); setTimeout(() => setCopiado(null), 1800) })
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c => (c.name || '').toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone || '').includes(q))
  }, [clients, busca])

  const inputSt: React.CSSProperties = { background: '#0A0A0F', border: `1px solid ${C.line2}`, color: C.t1, fontSize: 13, padding: '10px 14px', borderRadius: 9, outline: 'none', fontFamily: 'inherit' }
  const th: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.t3, textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${C.line}` }
  const td: React.CSSProperties = { padding: '10px 12px', borderBottom: `1px solid ${C.line}` }

  const msgSend = gerado
    ? `Olá! Seu acesso ao ORÁCULO 🔮\n\nSite: ${SITE}\nE-mail: ${gerado.email}\nSenha: ${gerado.password}\nChave da extensão: ${gerado.licenseKey}`
    : ''

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.t1, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", padding: '24px 22px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.14em' }}>ORÁCULO <span style={{ color: C.gold }}>SUPORTE</span></div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{name} · <span style={{ color: C.gold, textTransform: 'uppercase', fontWeight: 700 }}>suporte</span> · reenvio de senha</div>
          </div>
          <button onClick={logout} style={{ background: 'transparent', border: `1px solid ${C.line2}`, color: C.t2, fontSize: 12, padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>Sair</button>
        </div>

        {msg && (
          <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 10, fontSize: 13, background: msg.ok ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${msg.ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`, color: msg.ok ? C.green : C.red }}>{msg.text}</div>
        )}

        {/* Card da senha gerada */}
        {gerado && (
          <div style={{ marginBottom: 20, background: C.card, border: `1px solid rgba(240,180,41,0.3)`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 4 }}>✓ Nova senha gerada — e-mail reenviado</div>
            <div style={{ fontSize: 12, color: C.t3, marginBottom: 14 }}>O e-mail já foi enviado para <strong style={{ color: C.t2 }}>{gerado.email}</strong>. Se preferir, copie e mande você mesmo:</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {[['E-mail', gerado.email], ['Senha', gerado.password], ['Chave da extensão', gerado.licenseKey]].map(([lbl, val]) => (
                <div key={lbl} style={{ flex: '1 1 200px', background: '#0A0A0F', borderRadius: 8, padding: '10px 14px', border: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 9, color: C.t3, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: lbl === 'Chave da extensão' ? C.gold : C.green, wordBreak: 'break-all' }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => copiar('senha', gerado.password)} style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.35)', color: C.gold, fontSize: 11, fontWeight: 700, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>{copiado === 'senha' ? '✓ Copiado' : 'Copiar senha'}</button>
              <button onClick={() => copiar('msg', msgSend)} style={{ background: GOLD_GRAD, border: 'none', color: '#1a1305', fontSize: 11, fontWeight: 800, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>{copiado === 'msg' ? '✓ Mensagem copiada' : 'Copiar mensagem pronta'}</button>
              <button onClick={() => setGerado(null)} style={{ background: 'transparent', border: `1px solid ${C.line2}`, color: C.t2, fontSize: 11, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Fechar</button>
            </div>
          </div>
        )}

        {/* Lista de clientes */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone…" style={{ ...inputSt, flex: '1 1 260px' }} />
            <button onClick={carregar} style={{ background: 'transparent', border: `1px solid ${C.line2}`, color: C.t2, fontSize: 12, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>Atualizar</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr>{['Cliente', 'Contato', 'Plano', 'Status', 'Ações'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {loading && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: C.t3 }}>Carregando…</td></tr>}
                {!loading && filtrados.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: C.t3 }}>Nenhum cliente encontrado.</td></tr>}
                {!loading && filtrados.map(c => {
                  const st = statusOf(c)
                  return (
                    <tr key={c.id}>
                      <td style={td}><div style={{ fontWeight: 600, color: C.t1 }}>{c.name || '—'}</div></td>
                      <td style={td}>
                        <div style={{ color: C.t2, fontSize: 11.5 }}>{c.email}</div>
                        <div style={{ color: C.t3, fontSize: 11, marginTop: 2 }}>{c.phone || 'sem telefone'}</div>
                      </td>
                      <td style={td}><span style={{ color: C.t2 }}>{PLAN_LABEL[c.plan] || c.plan}</span></td>
                      <td style={td}><span style={{ color: st.color, fontWeight: 700 }}>● {st.label}</span></td>
                      <td style={td}>
                        <button onClick={() => reenviar(c)} disabled={enviando === c.email}
                          style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.3)', color: C.gold, fontSize: 11, padding: '5px 12px', borderRadius: 7, cursor: enviando === c.email ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: 600, opacity: enviando === c.email ? 0.5 : 1 }}>
                          {enviando === c.email ? 'Enviando…' : 'Reenviar senha'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.t3, marginTop: 14, textAlign: 'center' }}>Você tem acesso apenas à gestão de clientes e ao reenvio de senha.</div>
      </div>
    </div>
  )
}
