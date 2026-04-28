'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const C = { bg:'#04040C', s1:'#08081A', gold:'#C49B3C', text1:'#EDEDF5', text2:'#8080A0', text3:'#3A3A58', red:'#EF4444', border:'rgba(255,255,255,0.06)', bAccent:'rgba(196,155,60,0.2)' }

const EyeLogo = () => (
  <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
    <ellipse cx="16" cy="16" rx="13" ry="9" stroke={C.gold} strokeWidth="1.6"/>
    <circle  cx="16" cy="16" r="5"    fill={C.gold} opacity=".9"/>
    <circle  cx="16" cy="16" r="2.2"  fill={C.bg}/>
    <line x1="16" y1="7" x2="16" y2="5"   stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
    <line x1="16" y1="25" x2="16" y2="27" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
    <line x1="3"  y1="16" x2="1"  y2="16" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
    <line x1="29" y1="16" x2="31" y2="16" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
  </svg>
)

export default function RegisterPage() {
  const router = useRouter()
  const [form,    setForm]    = useState({ name: '', email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res  = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    router.push('/dashboard')
  }

  const inputStyle = { width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'11px 14px', color:C.text1, fontSize:13, outline:'none', fontFamily:'inherit', transition:'border-color .15s' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Inter',-apple-system,sans-serif; }
        input:focus { border-color: ${C.bAccent} !important; }
      `}</style>

      <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ position:'fixed', inset:0, backgroundImage:`linear-gradient(${C.border} 1px,transparent 1px),linear-gradient(90deg,${C.border} 1px,transparent 1px)`, backgroundSize:'48px 48px', pointerEvents:'none', opacity:.4 }}/>

        <div style={{ width:'100%', maxWidth:380, position:'relative' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <EyeLogo />
            <div style={{ fontSize:16, fontWeight:800, letterSpacing:'0.2em', color:C.gold, marginTop:12 }}>ORÁCULO</div>
            <div style={{ fontSize:9, color:C.text3, letterSpacing:'0.2em', marginTop:4 }}>AMAZON INTELLIGENCE</div>
          </div>

          <div style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:14, padding:'32px 28px' }}>
            <div style={{ marginBottom:28 }}>
              <h1 style={{ fontSize:17, fontWeight:700, color:C.text1, marginBottom:4 }}>Criar conta</h1>
              <p style={{ fontSize:12, color:C.text3 }}>Acesso ao painel de inteligência Amazon</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { k:'name',     label:'Nome',  type:'text',     ph:'Seu nome' },
                { k:'email',    label:'E-mail', type:'email',   ph:'seu@email.com' },
                { k:'password', label:'Senha', type:'password', ph:'Mínimo 6 caracteres' },
              ].map(f => (
                <div key={f.k}>
                  <label style={{ fontSize:10, fontWeight:600, color:C.text3, letterSpacing:'0.1em', display:'block', marginBottom:6, textTransform:'uppercase' as const }}>{f.label}</label>
                  <input type={f.type} required placeholder={f.ph}
                    value={(form as any)[f.k]} onChange={e => setForm(prev => ({ ...prev, [f.k]: e.target.value }))}
                    style={inputStyle} />
                </div>
              ))}

              {error && (
                <div style={{ fontSize:12, color:C.red, background:`${C.red}10`, border:`1px solid ${C.red}25`, borderRadius:6, padding:'9px 12px' }}>{error}</div>
              )}

              <button type="submit" disabled={loading}
                style={{ background: loading ? C.text3 : `linear-gradient(135deg,${C.gold},#9A7520)`, color:'#04040C', fontWeight:700, fontSize:11, letterSpacing:'0.1em', padding:'13px', borderRadius:8, border:'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit', textTransform:'uppercase' as const, marginTop:4 }}>
                {loading ? 'Criando conta…' : 'Criar Conta'}
              </button>
            </form>

            <div style={{ borderTop:`1px solid ${C.border}`, marginTop:24, paddingTop:20, textAlign:'center', fontSize:12, color:C.text3 }}>
              Já tem conta?{' '}
              <Link href="/login" style={{ color:C.gold, fontWeight:600, textDecoration:'none' }}>Entrar</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
