'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

// CARTEIRA DE CRÉDITOS DO NEO — saldo no topo da aba + recarga por PIX.
//
// ⚠️ Enquanto o backend responder `ativa: false` (flag NEO_CARTEIRA_ATIVA
// desligada), este componente não renderiza NADA. Mostrar "saldo: 0" pra quem
// nem sabe que existe carteira só gera dúvida e chamado de suporte.

const OURO = '#f0b429'

interface Evento { id: number; tipo: string; creditos: number; motivo: string; created_at: string }
interface Pacote { valor: number; creditos: number }
interface Status {
  ativa: boolean
  saldo: number
  extrato: Evento[]
  pacotes: Pacote[]
  custos: { anuncio: number; imagem: number }
  precisaCadastro: boolean
  pagamentoConfigurado: boolean
}

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Carteira() {
  const [st, setSt] = useState<Status | null>(null)
  const [aberto, setAberto] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch('/api/carteira/status', { cache: 'no-store' })
      const d = await r.json()
      if (d && typeof d.saldo === 'number') setSt(d)
    } catch { /* silencioso: carteira é acessório, não pode quebrar a aba do NEO */ }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  if (!st?.ativa) return null

  const quantosAnuncios = Math.floor(st.saldo / (st.custos.anuncio || 1))

  // Discreto de propósito: uma linha fina alinhada à direita, sem caixa e sem
  // botão gritando. O saldo é informação de apoio — quem manda na tela é a
  // conversa. Só chama atenção (fica dourado) quando o saldo não dá mais pra
  // um anúncio, que é quando ele de fato importa.
  const acabando = st.saldo < st.custos.anuncio

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: 8, marginBottom: 10, fontSize: 12,
      }}>
        <span style={{ opacity: .45 }}>Créditos</span>
        <strong style={{
          fontFamily: 'IBM Plex Mono, monospace',
          color: acabando ? OURO : 'inherit',
          opacity: acabando ? 1 : .8,
        }}>{st.saldo}</strong>
        {quantosAnuncios > 0 && (
          <span style={{ opacity: .35 }}>· {quantosAnuncios} anúncio{quantosAnuncios > 1 ? 's' : ''}</span>
        )}
        <button onClick={() => setAberto(true)} style={{
          background: 'transparent', border: 'none', color: OURO,
          fontSize: 12, cursor: 'pointer', padding: '2px 0', marginLeft: 2,
          fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3,
          opacity: acabando ? 1 : .7,
        }}>recarregar</button>
      </div>

      {aberto && (
        <ModalRecarga
          status={st}
          onFechar={() => { setAberto(false); carregar() }}
          onCreditou={carregar}
        />
      )}
    </>
  )
}

function ModalRecarga({ status, onFechar, onCreditou }: {
  status: Status; onFechar: () => void; onCreditou: () => void
}) {
  const [pacote, setPacote] = useState<Pacote | null>(null)
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [pix, setPix] = useState<{ qrImagem: string | null; qrCopiaECola: string | null; invoiceUrl: string; creditos: number } | null>(null)
  const [pago, setPago] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const saldoInicial = useRef(status.saldo)

  // Depois de gerar o PIX, fica de olho no saldo: quando o webhook creditar, a
  // tela muda sozinha. Sem isso o seller paga e fica olhando pro QR sem saber
  // se deu certo. Para em 10 min pra não pollar pra sempre numa aba esquecida.
  useEffect(() => {
    if (!pix || pago) return
    let vivo = true
    const fim = Date.now() + 10 * 60_000
    const tick = async () => {
      if (!vivo || Date.now() > fim) return
      try {
        const r = await fetch('/api/carteira/status', { cache: 'no-store' })
        const d = await r.json()
        if (vivo && typeof d?.saldo === 'number' && d.saldo > saldoInicial.current) {
          setPago(true); onCreditou(); return
        }
      } catch { /* rede instável não é motivo pra parar de esperar */ }
      if (vivo) setTimeout(tick, 5000)
    }
    const t = setTimeout(tick, 4000)
    return () => { vivo = false; clearTimeout(t) }
  }, [pix, pago, onCreditou])

  async function gerar() {
    if (!pacote) return
    setErro(null); setGerando(true)
    try {
      const r = await fetch('/api/carteira/recarga', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: pacote.valor, nome, cpfCnpj: cpf }),
      })
      const d = await r.json()
      if (!r.ok) { setErro(d?.error || 'Não consegui gerar a cobrança.'); return }
      setPix({ qrImagem: d.qrImagem, qrCopiaECola: d.qrCopiaECola, invoiceUrl: d.invoiceUrl, creditos: d.creditos })
    } catch {
      setErro('Erro de conexão. Tente de novo.')
    } finally { setGerando(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: 14, marginTop: 6,
  }

  return (
    <div onClick={onFechar} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0d0d12', border: '1px solid rgba(240,180,41,0.28)', borderRadius: 16,
        padding: 22, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', color: '#fff',
      }}>
        {pago ? (
          <div style={{ textAlign: 'center', padding: '18px 0' }}>
            <div style={{ fontSize: 40 }}>✓</div>
            <h3 style={{ color: OURO, margin: '10px 0 6px' }}>Créditos na conta!</h3>
            <p style={{ fontSize: 13.5, opacity: .75, margin: 0 }}>
              Seus {pix?.creditos} créditos já estão disponíveis. Pode voltar a criar anúncios.
            </p>
            <button onClick={onFechar} style={{
              marginTop: 18, background: OURO, color: '#1a1204', border: 'none', borderRadius: 9,
              padding: '10px 20px', fontWeight: 700, cursor: 'pointer', minHeight: 42,
            }}>Fechar</button>
          </div>
        ) : pix ? (
          <>
            <h3 style={{ marginTop: 0, color: OURO }}>Pague com PIX</h3>
            <p style={{ fontSize: 13, opacity: .72, marginTop: 0 }}>
              {pix.creditos} créditos entram automaticamente assim que o pagamento cair — sem precisar avisar ninguém.
            </p>
            {pix.qrImagem && (
              <img src={`data:image/png;base64,${pix.qrImagem}`} alt="QR Code do PIX"
                style={{ width: '100%', maxWidth: 240, display: 'block', margin: '12px auto', borderRadius: 10, background: '#fff', padding: 8 }} />
            )}
            {pix.qrCopiaECola && (
              <button onClick={() => {
                navigator.clipboard?.writeText(pix.qrCopiaECola!).then(() => {
                  setCopiado(true); setTimeout(() => setCopiado(false), 2200)
                })
              }} style={{
                width: '100%', background: 'rgba(255,255,255,0.08)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9, padding: '11px',
                fontSize: 13, cursor: 'pointer', minHeight: 44,
              }}>{copiado ? '✓ Código copiado' : 'Copiar código PIX'}</button>
            )}
            <a href={pix.invoiceUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'block', textAlign: 'center', marginTop: 10, fontSize: 12, color: OURO, opacity: .8,
            }}>Abrir a página de pagamento</a>
            <div style={{ marginTop: 14, fontSize: 12, opacity: .6, textAlign: 'center' }}>
              Aguardando o pagamento…
            </div>
          </>
        ) : (
          <>
            <h3 style={{ marginTop: 0, color: OURO }}>Recarregar créditos</h3>
            <p style={{ fontSize: 13, opacity: .72, marginTop: 0 }}>
              Um anúncio completo custa {status.custos.anuncio} créditos; um ajuste de imagem, {status.custos.imagem}.
            </p>

            <div style={{ display: 'grid', gap: 8, margin: '14px 0' }}>
              {status.pacotes.map(p => {
                const sel = pacote?.valor === p.valor
                return (
                  <button key={p.valor} onClick={() => setPacote(p)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: sel ? 'rgba(240,180,41,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${sel ? OURO : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 10, padding: '12px 14px', cursor: 'pointer', color: '#fff',
                    minHeight: 48,
                  }}>
                    <span style={{ fontWeight: 700 }}>{brl(p.valor)}</span>
                    <span style={{ fontSize: 13, color: OURO }}>
                      {p.creditos} créditos
                      <span style={{ opacity: .6, color: '#fff', marginLeft: 6 }}>
                        · {Math.floor(p.creditos / (status.custos.anuncio || 1))} anúncios
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {status.precisaCadastro && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, opacity: .65, margin: '0 0 4px' }}>
                  Só na primeira recarga — é o que a operadora de pagamento exige pra emitir a cobrança.
                </p>
                <input placeholder="Seu nome completo" value={nome} onChange={e => setNome(e.target.value)} style={inp} />
                <input placeholder="CPF ou CNPJ" value={cpf} onChange={e => setCpf(e.target.value)} inputMode="numeric" style={inp} />
              </div>
            )}

            {erro && (
              <div style={{
                background: 'rgba(255,90,90,0.12)', border: '1px solid rgba(255,90,90,0.3)',
                borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12,
              }}>{erro}</div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onFechar} style={{
                flex: 1, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 9, padding: '11px', cursor: 'pointer', minHeight: 44,
              }}>Cancelar</button>
              <button onClick={gerar} disabled={!pacote || gerando} style={{
                flex: 2, background: pacote && !gerando ? OURO : 'rgba(240,180,41,0.35)',
                color: '#1a1204', border: 'none', borderRadius: 9, padding: '11px',
                fontWeight: 700, cursor: pacote && !gerando ? 'pointer' : 'default', minHeight: 44,
              }}>{gerando ? 'Gerando…' : 'Gerar PIX'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
