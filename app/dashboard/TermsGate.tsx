'use client'
import { useState } from 'react'

// Overlay que BLOQUEIA o painel até o cliente aceitar os Termos de Uso + Política de
// Privacidade da versão vigente. Renderizado pelo server component (dashboard/page.tsx)
// apenas quando metadata.terms.version ≠ TERMS_VERSION. O aceite (versão + data + IP)
// é registrado via POST /api/user/accept-terms.
const LEGAL_BASE = 'https://central.oraculojf.com.br'
const GOLD = '#F0B429'

export default function TermsGate() {
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  if (done) return null

  async function accept() {
    if (!checked || saving) return
    setSaving(true); setErr('')
    try {
      const r = await fetch('/api/user/accept-terms', { method: 'POST' })
      if (r.ok) { setDone(true); return }
      setErr('Não foi possível registrar o aceite. Tente novamente.')
    } catch {
      setErr('Sem conexão. Verifique sua internet e tente novamente.')
    }
    setSaving(false)
  }

  const linkSt: React.CSSProperties = { color: GOLD, textDecoration: 'underline', textUnderlineOffset: 3 }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(4,4,10,0.90)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 540, width: '100%', background: '#0E0E18', border: '1px solid rgba(240,180,41,0.32)', borderRadius: 16, padding: '30px 32px', fontFamily: "'Inter', -apple-system, sans-serif", boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#64748B', fontWeight: 700, marginBottom: 6 }}>ANTES DE CONTINUAR</div>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#F1F5F9', marginBottom: 12 }}>Termos de Uso e Privacidade</h2>
        <p style={{ fontSize: 13.5, color: '#94A3B8', lineHeight: 1.7, marginBottom: 10 }}>
          Para usar o ORÁCULO você precisa ler e aceitar os nossos{' '}
          <a href={`${LEGAL_BASE}/terms`} target="_blank" rel="noopener noreferrer" style={linkSt}>Termos de Uso</a> e a{' '}
          <a href={`${LEGAL_BASE}/privacy`} target="_blank" rel="noopener noreferrer" style={linkSt}>Política de Privacidade</a>.
        </p>
        <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.65, marginBottom: 18 }}>
          Em resumo: os dados da gestão vêm das APIs oficiais da Amazon e podem apresentar divergências ou atrasos que não controlamos;
          estimativas são algorítmicas e não garantem resultados — valide números críticos no Seller Central antes de decisões importantes.
          Seus dados pessoais são tratados conforme a LGPD.
        </p>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '12px 14px', background: 'rgba(240,180,41,0.06)', border: `1px solid ${checked ? 'rgba(240,180,41,0.5)' : 'rgba(30,30,48,0.9)'}`, borderRadius: 10, marginBottom: 16 }}>
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ marginTop: 2, accentColor: GOLD, width: 16, height: 16, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.5 }}>
            Li e aceito os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong> do ORÁCULO.
          </span>
        </label>
        {err && <div style={{ fontSize: 12.5, color: '#FB7185', marginBottom: 12 }}>{err}</div>}
        <button
          onClick={accept}
          disabled={!checked || saving}
          style={{
            width: '100%', padding: '13px 18px', borderRadius: 10, border: 'none', cursor: checked && !saving ? 'pointer' : 'not-allowed',
            background: checked ? 'linear-gradient(135deg, #F0B429, #FFD700, #C8960C)' : 'rgba(100,116,139,0.25)',
            color: checked ? '#02020A' : '#64748B', fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
            opacity: saving ? 0.7 : 1, transition: 'all .15s ease',
          }}
        >
          {saving ? 'Registrando aceite…' : 'Aceitar e continuar'}
        </button>
        <p style={{ fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 12 }}>
          O aceite é registrado com data, hora e versão dos termos.
        </p>
      </div>
    </div>
  )
}
