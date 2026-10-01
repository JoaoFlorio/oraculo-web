'use client'
// PEDIR AVALIAÇÃO AUTOMÁTICO (30/09/2026). O cliente LIGA (decisão do João): a Amazon manda o e-mail em nome
// da loja dele, então nada sai sem o "sim" explícito. Regras e envio em backend lib/avaliacoes.ts.
import { useEffect, useState } from 'react'

type Tema = { card: string; line: string; t1: string; t2: string; t3: string; gold: string; grn: string; red: string; dark: boolean }
type Pedido = { pedido: string; status: string; compra: string | null; liberadoEm: string | null; solicitadaEm: string | null; verificadoEm: string | null }
type Estado = {
  demo?: boolean; conectado: boolean; ligado: boolean; dias: number; ligadoEm?: string | null
  contagem: { hoje: number; seteDias: number; trintaDias: number; total: number; aguardando: number; jaSolicitadas: number; perdidos: number } | null
  pedidos: Pedido[]; error?: string
}

const dia = (iso: string | null) => { if (!iso) return '—'; const d = new Date(iso); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) }

function rotulo(p: Pedido, dias: number): { txt: string; cor: 'grn' | 'gold' | 't3' | 'red' } {
  switch (p.status) {
    case 'solicitada': return { txt: `Avaliação solicitada em ${dia(p.solicitadaEm)}`, cor: 'grn' }
    case 'aguardando': return { txt: p.liberadoEm ? `Aguardando o ${dias}º dia após a entrega` : 'Aguardando a Amazon liberar (5 dias após a entrega)', cor: 'gold' }
    case 'ja_solicitada': return { txt: 'Já tinha sido solicitada (pelo Seller Central ou outra ferramenta)', cor: 't3' }
    case 'expirou': return { txt: 'Fora do prazo da Amazon', cor: 't3' }
    case 'erro': return { txt: 'A Amazon recusou agora — tenta de novo amanhã', cor: 'gold' }
    default: return { txt: 'Não foi possível solicitar', cor: 'red' }
  }
}

export default function Avaliacoes({ t }: { t: Tema }) {
  const [e, setE] = useState<Estado | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    fetch('/api/avaliacoes', { cache: 'no-store' })
      .then(async r => ({ ok: r.ok, d: await r.json().catch(() => null) }))
      .then(({ ok, d }) => { if (!vivo) return; if (ok && d) { setE(d); setErro(null) } else setErro('Não consegui carregar agora. Tente de novo em instantes.') })
      .catch(() => { if (vivo) setErro('Não consegui carregar agora. Tente de novo em instantes.') })
    return () => { vivo = false }
  }, [])

  const definir = async (ligado: boolean) => {
    setSalvando(true)
    try {
      const r = await fetch('/api/avaliacoes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ligado }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'falha')
      setE(d); setConfirmar(false); setErro(null)
    } catch (x) { setErro(x instanceof Error && x.message !== 'falha' ? x.message : 'Não consegui salvar. Tente de novo.') }
    finally { setSalvando(false) }
  }

  const caixa = { background: t.card, border: `1px solid ${t.line}`, borderRadius: 14, padding: '16px 18px', marginBottom: 14 } as const
  const btn = (fundo: string, cor: string) => ({ background: fundo, color: cor, border: 'none', borderRadius: 9, padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: salvando ? 'wait' : 'pointer', fontFamily: 'inherit' }) as const
  const corDe = (c: 'grn' | 'gold' | 't3' | 'red') => t[c]
  const escuro = t.dark ? '#1c1606' : '#3a2a05'

  if (erro && !e) return <div style={{ ...caixa, color: t.t2, fontSize: 13 }}>{erro}</div>
  if (!e) return <div style={{ ...caixa, color: t.t3, fontSize: 13 }}>Carregando…</div>
  if (!e.conectado) return <div style={{ ...caixa, color: t.t2, fontSize: 13 }}>Conecte sua conta da Amazon pra pedir avaliação dos seus pedidos automaticamente.</div>

  const c = e.contagem
  return (
    <div>
      <div style={{ ...caixa, borderLeft: `3px solid ${e.ligado ? t.grn : t.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' as const }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: t.t1 }}>
              <i className="ti ti-star" style={{ color: t.gold, fontSize: 18 }} aria-hidden="true" />
              Pedir avaliação automático
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, color: e.ligado ? t.grn : t.t3, border: `1px solid ${e.ligado ? t.grn : t.line}` }}>{e.ligado ? 'LIGADO' : 'DESLIGADO'}</span>
            </div>
            <div style={{ fontSize: 12.5, color: t.t2, lineHeight: 1.6, marginTop: 6 }}>
              Toda venda recebe o pedido oficial de avaliação da Amazon — o mesmo botão <b style={{ color: t.t1 }}>&quot;Solicitar uma avaliação&quot;</b> do Seller Central — no <b style={{ color: t.t1 }}>{e.dias}º dia após a entrega</b>, sem você clicar em nada. Mais avaliações, mais conversão.
            </div>
          </div>
          {e.demo ? <span style={{ fontSize: 12, color: t.t3 }}>Conta de demonstração — não envia.</span>
            : e.ligado ? <button disabled={salvando} onClick={() => definir(false)} style={btn('transparent', t.t2)}>Desligar</button>
            : !confirmar && <button disabled={salvando} onClick={() => setConfirmar(true)} style={btn(t.gold, escuro)}>Ligar</button>}
        </div>
        {confirmar && !e.ligado && (
          <div style={{ marginTop: 14, padding: '13px 15px', borderRadius: 11, border: `1px solid ${t.gold}66`, fontSize: 12.5, color: t.t2, lineHeight: 1.6 }}>
            Ao ligar, você autoriza o Oráculo a solicitar, <b style={{ color: t.t1 }}>em nome da sua loja</b>, a avaliação de cada pedido pela Amazon. Quem envia o e-mail ao comprador é a própria Amazon, no modelo padrão dela (avaliação do produto e da loja). Pode desligar quando quiser.
            <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
              <button disabled={salvando} onClick={() => definir(true)} style={btn(t.gold, escuro)}>{salvando ? 'Ligando…' : 'Sim, ligar'}</button>
              <button disabled={salvando} onClick={() => setConfirmar(false)} style={btn('transparent', t.t2)}>Cancelar</button>
            </div>
          </div>
        )}
        {erro && <div style={{ fontSize: 12, color: t.red, marginTop: 10 }}>{erro}</div>}
      </div>

      {c && (
        <div className="ora-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 14 }}>
          {[['Solicitadas hoje', c.hoje], ['Últimos 7 dias', c.seteDias], ['Últimos 30 dias', c.trintaDias], ['Aguardando o dia certo', c.aguardando]].map(([l, v]) => (
            <div key={String(l)} style={{ ...caixa, marginBottom: 0, padding: '14px 16px' }}>
              <div style={{ fontSize: 11.5, color: t.t3 }}>{l}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.t1, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{Number(v).toLocaleString('pt-BR')}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...caixa, fontSize: 12, color: t.t2, lineHeight: 1.65 }}>
        <b style={{ color: t.t1 }}>Como funciona (regras da Amazon):</b> 1 pedido de avaliação por venda — a Amazon não aceita repetir · só entre 5 e 30 dias depois da entrega · o e-mail é o padrão da Amazon, sem texto personalizado · pedido que você já solicitou pelo Seller Central é pulado · os envios acontecem entre 9h e 20h.
      </div>

      {e.pedidos.length > 0 && (
        <div style={caixa}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: t.t1, marginBottom: 8 }}>Últimos pedidos</div>
          {e.pedidos.map(p => {
            const r = rotulo(p, e.dias)
            return (
              <div key={p.pedido} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: `1px solid ${t.line}`, fontSize: 12.5, flexWrap: 'wrap' as const }}>
                <span style={{ color: t.t1, fontVariantNumeric: 'tabular-nums' }}>{p.pedido} <span style={{ color: t.t3 }}>· compra {dia(p.compra)}</span></span>
                <span style={{ color: corDe(r.cor) }}>{r.txt}</span>
              </div>
            )
          })}
        </div>
      )}
      {e.ligado && e.pedidos.length === 0 && (
        <div style={{ ...caixa, fontSize: 12.5, color: t.t3 }}>Ligado. Na próxima rodada (a cada 30 min, das 9h às 20h) o Oráculo começa a verificar seus pedidos entregues.</div>
      )}
    </div>
  )
}
