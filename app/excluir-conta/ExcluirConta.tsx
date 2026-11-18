'use client'
// 18/11/2026 — EXCLUIR MINHA CONTA (exigência da App Store e do Google Play; direito do titular pela LGPD).
// Usado no Meu Perfil e na página /excluir-conta (o link que vai na ficha do Google Play).
import { useEffect, useState } from 'react'

const C = {
  card: 'var(--ou-card, #10121B)', linha: 'var(--ou-linha, rgba(255,255,255,0.08))', t1: 'var(--ou-t1, #F3F3FB)',
  t2: 'var(--ou-t2, #A3A8C3)', t3: 'var(--ou-t3, #6B7090)', verm: 'var(--ou-verm, #F87171)', ouro: 'var(--ou-ouro, #FFC83D)',
}

export default function ExcluirConta({ aoExcluir }: { aoExcluir?: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [info, setInfo] = useState<{ assinaturaAtiva: boolean; demo: boolean } | null>(null)
  const [senha, setSenha] = useState('')
  const [conf, setConf] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [feito, setFeito] = useState<null | 'excluida' | 'simulada'>(null)

  useEffect(() => {
    if (!aberto || info) return
    fetch('/api/conta/excluir', { cache: 'no-store' }).then(r => r.json()).then(j => setInfo({ assinaturaAtiva: !!j?.assinaturaAtiva, demo: !!j?.demo })).catch(() => setInfo({ assinaturaAtiva: false, demo: false }))
  }, [aberto, info])

  async function excluir() {
    setErro(null)
    if (conf.trim().toUpperCase() !== 'EXCLUIR') { setErro('Digite EXCLUIR para confirmar.'); return }
    if (!senha) { setErro('Digite sua senha.'); return }
    setEnviando(true)
    try {
      const r = await fetch('/api/conta/excluir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ senha, confirmacao: conf }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j?.ok) { setErro(j?.error || 'Não consegui excluir agora. Tente de novo.'); return }
      setFeito(j.simulado ? 'simulada' : 'excluida')
      if (!j.simulado) setTimeout(() => { aoExcluir ? aoExcluir() : (window.location.href = '/login') }, 4000)
    } catch { setErro('Falha de conexão. Tente de novo.') }
    finally { setEnviando(false) }
  }

  const caixa = { background: C.card, border: `1px solid ${C.linha}`, borderRadius: 16, padding: '18px 18px' } as const
  const entrada = { width: '100%', boxSizing: 'border-box' as const, padding: '11px 12px', borderRadius: 10, border: `1px solid ${C.linha}`, background: 'rgba(255,255,255,0.03)', color: C.t1, fontSize: 14, fontFamily: 'inherit' }

  if (feito) return (
    <div style={caixa}>
      <h3 style={{ margin: '0 0 8px', fontSize: 16, color: C.t1 }}>{feito === 'simulada' ? 'Exclusão simulada (conta de demonstração)' : 'Sua conta foi excluída'}</h3>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: C.t2 }}>
        {feito === 'simulada'
          ? 'Esta é a conta de demonstração: o fluxo funcionou, mas ela não é apagada pra continuar disponível.'
          : 'Apagamos seus dados e desconectamos suas contas da Amazon e do Mercado Livre. Guardamos só os registros de pagamento que a lei manda guardar. Você vai sair em instantes.'}
      </p>
    </div>
  )

  return (
    <div style={caixa}>
      <h3 style={{ margin: '0 0 6px', fontSize: 16, color: C.t1 }}>Excluir minha conta</h3>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.t2 }}>Apaga sua conta do Oráculo e os dados dela. Não dá pra desfazer.</p>
      {!aberto ? (
        <button onClick={() => setAberto(true)} style={{ marginTop: 14, padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.verm}`, background: 'transparent', color: C.verm, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>
          Quero excluir minha conta
        </button>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: C.t2 }}>
            <li><b style={{ color: C.t1 }}>Apagamos na hora:</b> seu acesso, as conexões com Amazon, Amazon Ads e Mercado Livre, os pedidos e números espelhados, campanhas, conversas e memórias do NEO, produtos salvos, fornecedores e notificações.</li>
            <li><b style={{ color: C.t1 }}>Guardamos só o que a lei exige</b> (registros de pagamento e de nota, por obrigação fiscal), sem uso pra mais nada.</li>
            <li>A licença da extensão para de funcionar.</li>
          </ul>
          {info?.assinaturaAtiva && (
            <div style={{ fontSize: 13, lineHeight: 1.55, color: C.t1, background: 'rgba(255,200,61,0.08)', border: '1px solid rgba(255,200,61,0.35)', borderRadius: 10, padding: '10px 12px' }}>
              <b style={{ color: C.ouro }}>Atenção:</b> sua assinatura é cobrada pela Greenn. Excluir a conta <b>não cancela a cobrança</b> — cancele também na sua área de cliente da Greenn (no e-mail de compra).
            </div>
          )}
          <input style={entrada} type="password" autoComplete="current-password" placeholder="Sua senha" value={senha} onChange={e => { setSenha(e.target.value); setErro(null) }} />
          <input style={entrada} placeholder='Digite EXCLUIR para confirmar' value={conf} onChange={e => { setConf(e.target.value); setErro(null) }} autoCapitalize="characters" />
          {erro && <div style={{ fontSize: 12.5, fontWeight: 600, color: C.verm }}>{erro}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
            <button onClick={excluir} disabled={enviando} style={{ padding: '11px 16px', borderRadius: 10, border: 'none', background: C.verm, color: '#1a0505', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', opacity: enviando ? 0.6 : 1 }}>
              {enviando ? 'Excluindo…' : 'Excluir minha conta para sempre'}
            </button>
            <button onClick={() => { setAberto(false); setSenha(''); setConf(''); setErro(null) }} style={{ padding: '11px 16px', borderRadius: 10, border: `1px solid ${C.linha}`, background: 'transparent', color: C.t2, fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
