'use client'
// ESQUECI A SENHA (visual novo 05/10/2026) — estilos em ../recuperar.module.css, moldura em ../RecuperarUi.tsx.
// A LÓGICA (estado + handleSubmit → /api/auth/forgot-password) é cópia literal da versão anterior.
import { useState } from 'react'
import Link from 'next/link'
import s from '../recuperar.module.css'
import { Casca, Ic } from '../RecuperarUi'

export default function Esqueci() {
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
    } catch {
      setError('Falha de conexão. Verifique sua internet e tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Casca>
      {sent ? (
        <div className={`${s.cartaoBorda} ${s.surge} ${s.s1}`} style={{ marginTop: 'clamp(16px, 6vh, 64px)' }}>
          <div className={`${s.cartao} ${s.estado}`}>
            <div className={`${s.selo} ${s.seloOuro}`}>{Ic.envelope}</div>
            <h2>Confira seu e-mail</h2>
            <p>Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes. Verifique também sua caixa de spam.</p>
            <span className={`${s.pilula} ${s.pilulaVerde}`}>{Ic.relogio}O link expira em 1 hora</span>
            <ol className={s.passos}>
              <li><b>1</b>Abra o e-mail do Oráculo</li>
              <li><b>2</b>Clique no link</li>
              <li><b>3</b>Crie a nova senha</li>
            </ol>
            <Link href="/login" className={s.botao}>Voltar para o login <span className={s.seta} aria-hidden="true">→</span></Link>
            <p className={s.estadoNota}>Digitou o e-mail errado? <button type="button" className={s.linkBotao} onClick={() => setSent(false)}>Tentar outro e-mail</button></p>
          </div>
        </div>
      ) : (
        <>
          <div className={`${s.peca} ${s.surge} ${s.s1}`}><img src="/recuperar/chave.webp" alt="" width={440} height={440} /></div>
          <span className={`${s.kicker} ${s.surge} ${s.s2}`}>Recuperar acesso</span>
          <h1 className={`${s.titulo} ${s.surge} ${s.s2}`}>Esqueceu a senha?<br /><em>A gente resolve.</em></h1>
          <p className={`${s.sub} ${s.surge} ${s.s3}`}>Digite o e-mail da sua conta e enviamos um link pra você criar uma senha nova.</p>

          <div className={`${s.cartaoBorda} ${s.surge} ${s.s4}`}>
            <div className={s.cartao}>
              <form onSubmit={handleSubmit} className={s.form}>
                <div>
                  <label htmlFor="rec-email" className={s.rotulo}>E-mail</label>
                  <div className={s.caixa}>
                    <span className={s.caixaIc} aria-hidden="true">{Ic.mail}</span>
                    <input id="rec-email" className={s.entrada} type="email" required placeholder="seu@email.com" autoComplete="email" inputMode="email"
                      value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>

                {error && <div role="alert" className={s.erro}>{Ic.alerta}<span>{error}</span></div>}

                <button type="submit" disabled={loading} className={s.botao}>
                  {loading ? (<><span className={s.gira} aria-hidden="true" /><span>Enviando…</span></>) : (<>Enviar link de recuperação <span className={s.seta} aria-hidden="true">→</span></>)}
                </button>
              </form>

              <div className={s.rodapeCartao}>Lembrou a senha? <Link href="/login">Entrar</Link></div>
            </div>
          </div>
        </>
      )}
    </Casca>
  )
}
