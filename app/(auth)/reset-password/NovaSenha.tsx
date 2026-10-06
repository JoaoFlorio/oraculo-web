'use client'
// NOVA SENHA (visual novo 05/10/2026) — estilos em ../recuperar.module.css, moldura em ../RecuperarUi.tsx.
// A LÓGICA do formulário (token da URL, validações, POST /api/auth/reset-password, ir pro login em 3 s) é cópia literal
// da versão anterior. A barrinha de força da senha é só indicação visual — não bloqueia nada.
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import s from '../recuperar.module.css'
import { Casca, Ic } from '../RecuperarUi'

function forcaDaSenha(p: string): number {
  if (!p) return 0
  let n = 0
  if (p.length >= 8) n++
  if (p.length >= 12) n++
  if (/[a-zA-Z]/.test(p) && /\d/.test(p)) n++
  if (/[^a-zA-Z0-9]/.test(p) || (/[a-z]/.test(p) && /[A-Z]/.test(p))) n++
  return Math.max(1, n)
}
const NOMES_FORCA = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']

function ResetForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') || ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem'); return }
    if (password.length < 8)  { setError('A senha deve ter pelo menos 8 caracteres'); return }

    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Falha de conexão. Verifique sua internet e tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  const [verSenha, setVerSenha] = useState(false)

  if (!token) {
    return (
      <div className={`${s.cartaoBorda} ${s.surge} ${s.s1}`} style={{ marginTop: 'clamp(16px, 6vh, 64px)' }}>
        <div className={`${s.cartao} ${s.estado}`}>
          <div className={`${s.selo} ${s.seloVermelho}`}>{Ic.alerta}</div>
          <h2>Link inválido</h2>
          <p>Este link de recuperação é inválido ou expirou.</p>
          <Link href="/forgot-password" className={s.botao}>Solicitar novo link <span className={s.seta} aria-hidden="true">→</span></Link>
          <p className={s.estadoNota}><Link href="/login" className={s.linkBotao}>Voltar para o login</Link></p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className={`${s.cartaoBorda} ${s.surge} ${s.s1}`} style={{ marginTop: 'clamp(16px, 6vh, 64px)' }}>
        <div className={`${s.cartao} ${s.estado}`}>
          <div className={`${s.selo} ${s.seloVerde}`}>{Ic.check}</div>
          <h2>Senha redefinida!</h2>
          <p>Sua senha foi alterada com sucesso. Redirecionando para o login…</p>
          <span className={`${s.pilula} ${s.pilulaVerde}`}>{Ic.escudo}Todas as sessões foram encerradas por segurança</span>
          <Link href="/login" className={s.botao}>Entrar agora <span className={s.seta} aria-hidden="true">→</span></Link>
        </div>
      </div>
    )
  }

  const forca = forcaDaSenha(password)
  const tipo = verSenha ? 'text' : 'password'
  return (
    <>
      <div className={`${s.peca} ${s.surge} ${s.s1}`}><img src="/recuperar/cadeado.webp" alt="" width={440} height={440} /></div>
      <span className={`${s.kicker} ${s.surge} ${s.s2}`}>Nova senha</span>
      <h1 className={`${s.titulo} ${s.surge} ${s.s2}`}>Crie sua<br /><em>nova senha.</em></h1>
      <p className={`${s.sub} ${s.surge} ${s.s3}`}>Escolha uma senha forte para sua conta. Pelo menos 8 caracteres.</p>

      <div className={`${s.cartaoBorda} ${s.surge} ${s.s4}`}>
        <div className={s.cartao}>
          <form onSubmit={handleSubmit} className={s.form}>
            <div>
              <label htmlFor="ns-senha" className={s.rotulo}>Nova senha</label>
              <div className={s.caixa}>
                <span className={s.caixaIc} aria-hidden="true">{Ic.cadeado}</span>
                <input id="ns-senha" className={s.entrada} type={tipo} required placeholder="••••••••" autoComplete="new-password" style={{ paddingRight: 50 }}
                  value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className={s.olho} onClick={() => setVerSenha(v => !v)} aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}>{verSenha ? Ic.olhoFechado : Ic.olho}</button>
              </div>
              <div className={s.forca} aria-hidden="true">{[1, 2, 3, 4].map(i => <i key={i} className={i <= forca ? s.acesa : ''} />)}</div>
              <span className={s.forcaTxt}>{password ? `Força: ${NOMES_FORCA[forca]}` : 'Use letras e números. Quanto maior, melhor.'}</span>
            </div>

            <div>
              <label htmlFor="ns-confirma" className={s.rotulo}>Confirmar senha</label>
              <div className={s.caixa}>
                <span className={s.caixaIc} aria-hidden="true">{Ic.cadeado}</span>
                <input id="ns-confirma" className={s.entrada} type={tipo} required placeholder="••••••••" autoComplete="new-password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              {confirm && (password === confirm
                ? <span className={`${s.confere} ${s.confereOk}`}>{Ic.check}As senhas são iguais</span>
                : <span className={`${s.confere} ${s.confereNao}`}>{Ic.x}As senhas ainda não são iguais</span>)}
            </div>

            {error && <div role="alert" className={s.erro}>{Ic.alerta}<span>{error}</span></div>}

            <button type="submit" disabled={loading} className={s.botao}>
              {loading ? (<><span className={s.gira} aria-hidden="true" /><span>Salvando…</span></>) : (<>Salvar nova senha <span className={s.seta} aria-hidden="true">→</span></>)}
            </button>
          </form>

          <div className={s.rodapeCartao}><Link href="/login">← Voltar para o login</Link></div>
        </div>
      </div>
    </>
  )
}

export default function NovaSenha() {
  return (
    <Casca>
      <Suspense fallback={<p className={s.carregando}>Carregando…</p>}>
        <ResetForm />
      </Suspense>
    </Casca>
  )
}
