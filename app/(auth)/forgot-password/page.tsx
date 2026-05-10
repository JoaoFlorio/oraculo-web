'use client'
import { useState } from 'react'
import Link from 'next/link'

const bg    = '#03030A'
const card  = '#09091A'
const gold  = '#F0B429'
const goldG = 'linear-gradient(135deg,#F5C842,#C48F10)'
const t1    = '#F2F2FC'
const t3    = '#686890'
const t4    = '#A0A0C8'
const line  = 'rgba(255,255,255,0.08)'
const g     = '#22C55E'

function OracleMark() {
  return (
    <div style={{width:56,height:56,borderRadius:14,background:'rgba(240,180,41,0.08)',border:'1px solid rgba(240,180,41,0.2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none"
        style={{filter:'drop-shadow(0 0 8px rgba(240,180,41,0.7)) drop-shadow(0 0 2px rgba(240,180,41,1))'}}>
        <ellipse cx="16" cy="16" rx="13" ry="9" stroke="#F0B429" strokeWidth="1.6"/>
        <circle cx="16" cy="16" r="5.5" fill="#F0B429"/>
        <circle cx="16" cy="16" r="2.4" fill="#03030A"/>
        <circle cx="14.5" cy="14.2" r="1.1" fill="rgba(255,255,255,0.45)"/>
        <line x1="16" y1="7"  x2="16" y2="5"  stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
        <line x1="16" y1="25" x2="16" y2="27" stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
        <line x1="3"  y1="16" x2="1"  y2="16" stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
        <line x1="29" y1="16" x2="31" y2="16" stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
      </svg>
    </div>
  )
}

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',system-ui,sans-serif;background:${bg}}
        input:focus{border-color:rgba(240,180,41,0.5) !important;outline:none}
      `}</style>

      <div style={{minHeight:'100vh',background:bg,display:'flex',alignItems:'center',justifyContent:'center',padding:24,position:'relative'}}>
        <div style={{position:'fixed',inset:0,backgroundImage:`linear-gradient(${line} 1px,transparent 1px),linear-gradient(90deg,${line} 1px,transparent 1px)`,backgroundSize:'52px 52px',pointerEvents:'none',opacity:.5}}/>
        <div style={{position:'fixed',top:'-20%',left:'50%',transform:'translateX(-50%)',width:'60vw',height:'60vw',borderRadius:'50%',background:'radial-gradient(circle,rgba(240,180,41,0.06) 0%,transparent 70%)',pointerEvents:'none'}}/>

        <div style={{width:'100%',maxWidth:380,position:'relative'}}>
          <div style={{textAlign:'center',marginBottom:36}}>
            <OracleMark/>
            <div style={{fontSize:16,fontWeight:800,letterSpacing:'0.22em',color:gold,lineHeight:1}}>ORÁCULO</div>
            <div style={{fontSize:8,color:t3,letterSpacing:'0.18em',marginTop:5,fontWeight:500}}>AMAZON INTELLIGENCE</div>
          </div>

          <div style={{background:card,border:`1px solid ${line}`,borderRadius:16,padding:'32px 28px',boxShadow:'0 40px 80px rgba(0,0,0,0.5)'}}>

            {sent ? (
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:40,marginBottom:16}}>📧</div>
                <h2 style={{fontSize:17,fontWeight:700,color:t1,marginBottom:8}}>Email enviado!</h2>
                <p style={{fontSize:13,color:t4,lineHeight:1.6,marginBottom:24}}>
                  Se esse email estiver cadastrado, você receberá um link para redefinir sua senha em instantes. Verifique também sua caixa de spam.
                </p>
                <div style={{background:`${g}10`,border:`1px solid ${g}30`,borderRadius:8,padding:'12px 14px',marginBottom:20}}>
                  <p style={{fontSize:12,color:g,margin:0}}>✓ O link expira em 1 hora</p>
                </div>
                <Link href="/login" style={{color:gold,fontWeight:600,fontSize:13,textDecoration:'none'}}>
                  ← Voltar para o login
                </Link>
              </div>
            ) : (
              <>
                <div style={{marginBottom:24}}>
                  <h1 style={{fontSize:17,fontWeight:700,color:t1,marginBottom:4,letterSpacing:'-0.02em'}}>Esqueceu a senha?</h1>
                  <p style={{fontSize:12,color:t4}}>Digite seu email e enviaremos um link para redefinir</p>
                </div>

                <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div>
                    <label style={{fontSize:9,fontWeight:700,color:t3,letterSpacing:'0.14em',display:'block',marginBottom:7,textTransform:'uppercase' as const}}>E-mail</label>
                    <input
                      type="email" required placeholder="seu@email.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={{width:'100%',background:bg,border:`1px solid ${line}`,borderRadius:9,padding:'11px 14px',color:t1,fontSize:13,fontFamily:'inherit',transition:'border-color .15s'}}
                    />
                  </div>

                  {error && (
                    <div style={{fontSize:12,color:'#EF4444',background:'#EF444410',border:'1px solid #EF444425',borderRadius:8,padding:'10px 14px'}}>{error}</div>
                  )}

                  <button type="submit" disabled={loading}
                    style={{background:loading?t3:goldG,color:loading?'#666':'#02020A',fontWeight:700,fontSize:11,letterSpacing:'0.1em',padding:'13px',borderRadius:9,border:'none',cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',textTransform:'uppercase' as const,marginTop:4,boxShadow:loading?'none':'0 4px 20px rgba(240,180,41,0.3)',transition:'all .15s'}}>
                    {loading ? 'Enviando…' : 'Enviar link de recuperação'}
                  </button>
                </form>

                <div style={{borderTop:`1px solid ${line}`,marginTop:24,paddingTop:20,textAlign:'center' as const,fontSize:12,color:t4}}>
                  Lembrou a senha?{' '}
                  <Link href="/login" style={{color:gold,fontWeight:600,textDecoration:'none'}}>Entrar</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
