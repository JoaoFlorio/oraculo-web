'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// CARTEIRA DE CRÉDITOS DO NEO — saldo no topo da aba + recarga por PIX.
//
// ⚠️ Enquanto o backend responder `ativa: false` (flag NEO_CARTEIRA_ATIVA
// desligada), este componente não renderiza NADA. Mostrar "saldo: 0" pra quem
// nem sabe que existe carteira só gera dúvida e chamado de suporte.

const OURO = '#f0b429'

interface Evento { id: number; tipo: string; creditos: number; motivo: string; created_at: string }
interface Status {
  ativa: boolean
  saldo: number
  extrato: Evento[]
  creditosPorReal: number
  valores: number[]
  recargaMin: number
  recargaMax: number
  custos: { anuncio: number; imagem: number }
  precisaCadastro: boolean
  pagamentoConfigurado: boolean
}

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: n % 1 ? 2 : 0 })

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

  const anuncios = Math.floor(st.saldo / (st.custos.anuncio || 1))
  // Chama atenção (dourado) só quando não dá mais pra um anúncio — quando de fato importa.
  const acabando = st.saldo < st.custos.anuncio

  return (
    <>
      <div className={`neoWallet${acabando ? ' low' : ''}`}>
        <span className="wSpark" aria-hidden>◈</span>
        <span className="wNum">{st.saldo.toLocaleString('pt-BR')}</span>
        <span className="wLbl">crédito{st.saldo === 1 ? '' : 's'}</span>
        {anuncios > 0 && <span className="wSub">· {anuncios} anúncio{anuncios > 1 ? 's' : ''}</span>}
        <button className="wBtn" onClick={() => setAberto(true)}>Recarregar</button>
      </div>

      {aberto && (
        <ModalRecarga
          status={st}
          onFechar={() => { setAberto(false); carregar() }}
          onCreditou={carregar}
        />
      )}

      <style jsx>{`
        .neoWallet{
          display:flex; align-items:center; gap:8px; margin:0 0 12px auto;
          width:fit-content; padding:7px 8px 7px 13px; border-radius:999px;
          background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
          font-size:12.5px; color:rgba(245,239,223,.65); transition:border-color .3s, background .3s;
        }
        .neoWallet.low{ border-color:rgba(240,180,41,.4); background:rgba(240,180,41,.07); color:#f5efdf; }
        .wSpark{ color:${OURO}; font-size:11px; opacity:.85; }
        .low .wSpark{ opacity:1; text-shadow:0 0 10px rgba(240,180,41,.6); }
        .wNum{ font-family:'IBM Plex Mono', monospace; font-weight:700; color:#f5efdf; font-size:13px; }
        .wLbl{ opacity:.5; }
        .wSub{ opacity:.35; }
        .wBtn{
          margin-left:4px; font-family:'IBM Plex Mono', monospace; font-size:10.5px; letter-spacing:.1em;
          text-transform:uppercase; color:#1a1204; background:${OURO}; border:none; border-radius:999px;
          padding:6px 13px; cursor:pointer; font-weight:700; transition:transform .15s, box-shadow .2s;
        }
        .wBtn:hover{ transform:translateY(-1px); box-shadow:0 6px 18px rgba(240,180,41,.3); }
        @media (prefers-reduced-motion: reduce){ .wBtn:hover{ transform:none; } }
      `}</style>
    </>
  )
}

function ModalRecarga({ status, onFechar, onCreditou }: {
  status: Status; onFechar: () => void; onCreditou: () => void
}) {
  const [valorSel, setValorSel] = useState<number | null>(status.valores[1] ?? status.valores[0] ?? null)
  const [custom, setCustom] = useState('')     // string do campo "outro valor"
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [pix, setPix] = useState<{ qrImagem: string | null; qrCopiaECola: string | null; invoiceUrl: string; creditos: number } | null>(null)
  const [pago, setPago] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const saldoInicial = useRef(status.saldo)

  // O valor livre, quando digitado, vence a seleção dos botões.
  const custoNum = custom ? Math.round(parseFloat(custom.replace(',', '.')) * 100) / 100 : NaN
  const usandoCustom = custom.trim() !== '' && !Number.isNaN(custoNum)
  const valor = usandoCustom ? custoNum : valorSel
  const creditosDe = (v: number) => Math.round(v * status.creditosPorReal)
  const creditos = valor && valor > 0 ? creditosDe(valor) : 0
  const anunciosDe = (c: number) => Math.floor(c / (status.custos.anuncio || 1))

  const foraDaFaixa = usandoCustom && (custoNum < status.recargaMin || custoNum > status.recargaMax)
  const podeGerar = !!valor && valor >= status.recargaMin && valor <= status.recargaMax && !gerando

  // Depois de gerar o PIX, fica de olho no saldo: quando o webhook creditar, a
  // tela muda sozinha. Para em 10 min pra não pollar pra sempre numa aba esquecida.
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
    if (!valor) return
    setErro(null); setGerando(true)
    try {
      const r = await fetch('/api/carteira/recarga', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor, nome, cpfCnpj: cpf }),
      })
      const d = await r.json()
      if (!r.ok) { setErro(d?.error || 'Não consegui gerar a cobrança.'); return }
      setPix({ qrImagem: d.qrImagem, qrCopiaECola: d.qrCopiaECola, invoiceUrl: d.invoiceUrl, creditos: d.creditos })
    } catch {
      setErro('Erro de conexão. Tente de novo.')
    } finally { setGerando(false) }
  }

  return (
    <div className="rcOverlay" onClick={onFechar}>
      <div className="rcCard" onClick={e => e.stopPropagation()}>
        {pago ? (
          <div className="rcDone">
            <div className="rcCheck">✓</div>
            <h3>Créditos na conta</h3>
            <p>Seus <strong>{pix?.creditos}</strong> créditos já estão disponíveis. Pode voltar a criar anúncios.</p>
            <button className="rcPrimary" onClick={onFechar}>Voltar ao NEO</button>
          </div>
        ) : pix ? (
          <>
            <div className="rcHead"><span className="rcEyebrow">Pagamento PIX</span><h3>{pix.creditos} créditos a caminho</h3></div>
            <p className="rcLead">Assim que o pagamento cair, os créditos entram sozinhos — esta tela avisa.</p>
            {pix.qrImagem && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="rcQr" src={`data:image/png;base64,${pix.qrImagem}`} alt="QR Code do PIX" />
            )}
            {pix.qrCopiaECola && (
              <button className="rcCopy" onClick={() => {
                navigator.clipboard?.writeText(pix.qrCopiaECola!).then(() => {
                  setCopiado(true); setTimeout(() => setCopiado(false), 2200)
                })
              }}>{copiado ? '✓ Código copiado' : 'Copiar código PIX'}</button>
            )}
            <a className="rcInvoice" href={pix.invoiceUrl} target="_blank" rel="noopener noreferrer">Abrir a página de pagamento</a>
            <div className="rcWaiting"><span className="rcDot" />Aguardando o pagamento…</div>
          </>
        ) : (
          <>
            <div className="rcHead"><span className="rcEyebrow">Carteira do NEO</span><h3>Recarregar créditos</h3></div>
            <p className="rcLead">
              Um anúncio completo custa {status.custos.anuncio} créditos; um ajuste de imagem, {status.custos.imagem}.
            </p>

            <div className="rcGrid">
              {status.valores.map(v => {
                const sel = !usandoCustom && valorSel === v
                return (
                  <button key={v} className={`rcAmount${sel ? ' on' : ''}`}
                    onClick={() => { setCustom(''); setValorSel(v) }}>
                    <span className="rcValor">{brl(v)}</span>
                    <span className="rcCred">{creditosDe(v).toLocaleString('pt-BR')} créditos</span>
                    <span className="rcAnun">≈ {anunciosDe(creditosDe(v))} anúncio{anunciosDe(creditosDe(v)) === 1 ? '' : 's'}</span>
                  </button>
                )
              })}
            </div>

            <div className={`rcCustom${usandoCustom ? ' on' : ''}`}>
              <label className="rcCustomLbl">Outro valor</label>
              <div className="rcCustomIn">
                <span className="rcPrefix">R$</span>
                <input
                  inputMode="decimal" placeholder="75" value={custom}
                  onChange={e => setCustom(e.target.value.replace(/[^\d.,]/g, ''))}
                />
                {usandoCustom && !foraDaFaixa && (
                  <span className="rcCustomCred">→ {creditos.toLocaleString('pt-BR')} créditos</span>
                )}
              </div>
              {foraDaFaixa && (
                <span className="rcHint">Entre {brl(status.recargaMin)} e {brl(status.recargaMax)}.</span>
              )}
            </div>

            {status.precisaCadastro && (
              <div className="rcCadastro">
                <p>Só na primeira recarga — é o que a operadora de pagamento exige pra emitir a cobrança.</p>
                <input placeholder="Seu nome completo" value={nome} onChange={e => setNome(e.target.value)} />
                <input placeholder="CPF ou CNPJ" value={cpf} onChange={e => setCpf(e.target.value)} inputMode="numeric" />
              </div>
            )}

            {erro && <div className="rcErro">{erro}</div>}

            <div className="rcActions">
              <button className="rcGhost" onClick={onFechar}>Cancelar</button>
              <button className="rcPrimary rcGen" onClick={gerar} disabled={!podeGerar}>
                {gerando ? 'Gerando…' : valor ? `Pagar ${brl(valor)} · ${creditos} créditos` : 'Escolha um valor'}
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .rcOverlay{ position:fixed; inset:0; background:rgba(4,3,8,.78); backdrop-filter:blur(3px);
          z-index:1300; display:flex; align-items:center; justify-content:center; padding:16px;
          animation:rcFade .2s ease; }
        .rcCard{ position:relative; width:100%; max-width:460px; max-height:92vh; overflow-y:auto;
          color:#f5efdf; padding:26px; border-radius:20px;
          background:radial-gradient(120% 100% at 50% 0, rgba(240,180,41,.09), rgba(13,13,18,.98) 55%), #0b0b10;
          border:1px solid rgba(240,180,41,.22); box-shadow:0 30px 80px rgba(0,0,0,.6);
          animation:rcUp .28s cubic-bezier(.2,.8,.2,1); }
        @keyframes rcFade{ from{ opacity:0 } }
        @keyframes rcUp{ from{ opacity:0; transform:translateY(14px) scale(.98) } }

        .rcHead{ margin-bottom:4px; }
        .rcEyebrow{ font-family:'IBM Plex Mono', monospace; font-size:10px; letter-spacing:.28em;
          text-transform:uppercase; color:${OURO}; opacity:.85; }
        .rcCard h3{ margin:6px 0 0; font-size:22px; font-weight:700; letter-spacing:-.01em; color:#fff; }
        .rcLead{ margin:8px 0 0; font-size:13px; line-height:1.5; color:rgba(245,239,223,.55); }

        .rcGrid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:18px 0 10px; }
        .rcAmount{ display:flex; flex-direction:column; align-items:flex-start; gap:2px;
          padding:14px 15px; border-radius:14px; cursor:pointer; text-align:left;
          background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.09);
          transition:border-color .18s, background .18s, transform .1s; }
        .rcAmount:hover{ border-color:rgba(240,180,41,.4); }
        .rcAmount:active{ transform:scale(.98); }
        .rcAmount.on{ border-color:${OURO}; background:linear-gradient(160deg, rgba(240,180,41,.16), rgba(240,180,41,.04));
          box-shadow:0 0 0 1px rgba(240,180,41,.5), 0 8px 24px rgba(240,180,41,.14); }
        .rcValor{ font-family:'IBM Plex Mono', monospace; font-size:20px; font-weight:700; color:#fff; }
        .rcAmount.on .rcValor{ color:${OURO}; }
        .rcCred{ font-size:12.5px; color:${OURO}; opacity:.9; }
        .rcAnun{ font-size:11px; color:rgba(245,239,223,.4); }

        .rcCustom{ margin-bottom:16px; padding:12px 14px; border-radius:14px;
          background:rgba(255,255,255,.025); border:1px dashed rgba(255,255,255,.14); transition:border-color .18s, background .18s; }
        .rcCustom.on{ border-style:solid; border-color:${OURO}; background:linear-gradient(160deg, rgba(240,180,41,.12), rgba(240,180,41,.03)); }
        .rcCustomLbl{ font-size:11px; letter-spacing:.04em; text-transform:uppercase; color:rgba(245,239,223,.45); }
        .rcCustomIn{ display:flex; align-items:center; gap:6px; margin-top:6px; }
        .rcPrefix{ font-family:'IBM Plex Mono', monospace; font-size:17px; color:rgba(245,239,223,.6); }
        .rcCustomIn input{ width:78px; background:transparent; border:none; outline:none;
          font-family:'IBM Plex Mono', monospace; font-size:20px; font-weight:700; color:#fff; }
        .rcCustomIn input::placeholder{ color:rgba(245,239,223,.25); }
        .rcCustomCred{ margin-left:auto; font-size:13px; color:${OURO}; font-weight:600; }
        .rcHint{ display:block; margin-top:6px; font-size:11.5px; color:#ff9b9b; }

        .rcCadastro{ margin-bottom:14px; }
        .rcCadastro p{ font-size:12px; color:rgba(245,239,223,.5); margin:0 0 8px; }
        .rcCadastro input, .rcCustomIn input{ font-family:inherit; }
        .rcCadastro input{ width:100%; box-sizing:border-box; background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.13); border-radius:9px; color:#fff; padding:11px 12px;
          font-size:14px; margin-bottom:8px; outline:none; }
        .rcCadastro input:focus{ border-color:rgba(240,180,41,.5); }

        .rcErro{ background:rgba(255,90,90,.1); border:1px solid rgba(255,90,90,.3); border-radius:9px;
          padding:10px 12px; font-size:13px; margin-bottom:12px; color:#ffb3b3; }

        .rcActions{ display:flex; gap:9px; }
        .rcGhost{ flex:0 0 auto; background:transparent; color:rgba(245,239,223,.75);
          border:1px solid rgba(255,255,255,.16); border-radius:11px; padding:12px 16px; cursor:pointer;
          font-size:14px; transition:border-color .18s; }
        .rcGhost:hover{ border-color:rgba(255,255,255,.32); }
        .rcPrimary{ background:${OURO}; color:#1a1204; border:none; border-radius:11px; padding:12px 18px;
          font-weight:700; font-size:14px; cursor:pointer; transition:transform .12s, box-shadow .2s, opacity .2s; }
        .rcPrimary:hover:not(:disabled){ transform:translateY(-1px); box-shadow:0 10px 28px rgba(240,180,41,.32); }
        .rcGen{ flex:1; }
        .rcPrimary:disabled{ opacity:.4; cursor:default; }

        .rcQr{ width:100%; max-width:230px; display:block; margin:16px auto; border-radius:12px; background:#fff; padding:10px; }
        .rcCopy{ width:100%; background:rgba(255,255,255,.07); color:#fff; border:1px solid rgba(255,255,255,.18);
          border-radius:11px; padding:12px; font-size:13.5px; cursor:pointer; transition:border-color .18s; }
        .rcCopy:hover{ border-color:rgba(240,180,41,.4); }
        .rcInvoice{ display:block; text-align:center; margin-top:11px; font-size:12.5px; color:${OURO}; opacity:.8; }
        .rcWaiting{ display:flex; align-items:center; justify-content:center; gap:8px; margin-top:16px;
          font-size:12.5px; color:rgba(245,239,223,.5); }
        .rcDot{ width:7px; height:7px; border-radius:50%; background:${OURO}; animation:rcPulse 1.3s ease-in-out infinite; }
        @keyframes rcPulse{ 0%,100%{ opacity:.3 } 50%{ opacity:1; box-shadow:0 0 10px ${OURO} } }

        .rcDone{ text-align:center; padding:14px 0; }
        .rcCheck{ width:56px; height:56px; margin:0 auto 14px; border-radius:50%;
          display:flex; align-items:center; justify-content:center; font-size:28px; color:#1a1204;
          background:${OURO}; box-shadow:0 0 30px rgba(240,180,41,.5); }
        .rcDone h3{ color:${OURO}; margin:0 0 6px; font-size:20px; }
        .rcDone p{ font-size:13.5px; color:rgba(245,239,223,.7); margin:0 0 18px; }

        @media (prefers-reduced-motion: reduce){
          .rcCard,.rcOverlay{ animation:none; } .rcDot{ animation:none; }
          .rcPrimary:hover:not(:disabled){ transform:none; }
        }
      `}</style>
    </div>
  )
}
