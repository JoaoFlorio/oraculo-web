'use client'
// CARREGANDO SEUS DADOS (30/09/2026 — pedido do João): número guardado NUNCA aparece como se fosse o de agora.
// Enquanto o cálculo novo roda, a tela diz isso em destaque, com barra de progresso, e os números antigos
// ficam apagados até o novo chegar. A barra usa a previsão do backend (quanto o último recálculo desta conta
// levou) — sem previsão, assume 60 s e desacelera perto do fim em vez de "travar" em 100%.
import { useEffect, useState } from 'react'

type Cores = { gold: string; t1: string; t2: string; t3: string; card: string; line: string }

function pctDoTempo(decorridoSeg: number, previsaoSeg: number): number {
  if (decorridoSeg < previsaoSeg) return (decorridoSeg / previsaoSeg) * 90
  return 90 + 9 * (1 - Math.exp(-(decorridoSeg - previsaoSeg) / 30))
}

export default function CarregandoDados({ modo, previsaoSeg, jaSeg = 0, horaDoNumero, cores, marketplace = 'Amazon' }: {
  modo: 'inicial' | 'atualizando'
  previsaoSeg?: number | null
  jaSeg?: number
  /** Idade do número que está na tela (atualizando): mostra "números de 14:32". */
  horaDoNumero?: Date | null
  cores: Cores
  marketplace?: string
}) {
  const [inicio] = useState(() => Date.now() - Math.max(0, jaSeg) * 1000)
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => { const i = setInterval(() => setAgora(Date.now()), 500); return () => clearInterval(i) }, [])
  const previsao = Math.max(3, previsaoSeg || 60)
  const decorrido = (agora - inicio) / 1000
  const pct = Math.min(99, pctDoTempo(decorrido, previsao))
  const falta = Math.max(0, Math.ceil(previsao - decorrido))
  const hora = horaDoNumero ? horaDoNumero.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null
  const C = cores

  return (
    <div role="status" aria-live="polite"
      style={{ background: C.card, border: `1px solid ${C.gold}55`, borderRadius: 13, padding: '13px 16px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' as const }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: C.t1 }}>
          <i className="ti ti-loader-2" style={{ fontSize: 16, color: C.gold, animation: 'spin 1s linear infinite' }} aria-hidden="true" />
          {modo === 'inicial' ? `Carregando seus dados da ${marketplace}… aguarde` : 'Atualizando seus números… aguarde'}
        </span>
        <span style={{ fontSize: 11.5, color: C.t3, fontVariantNumeric: 'tabular-nums' }}>
          {decorrido < previsao ? `cerca de ${falta}s` : 'quase lá…'}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: C.line, overflow: 'hidden', marginTop: 10 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: C.gold, borderRadius: 99, transition: 'width .5s linear' }} />
      </div>
      <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.5, marginTop: 8 }}>
        {modo === 'inicial'
          ? 'Estamos somando pedidos, taxas e devoluções do período direto da sua conta. Conta com muitas vendas pode levar até 1 minuto na primeira vez.'
          : <>Os números abaixo{hora ? <> são de <b style={{ color: C.t1 }}>{hora}</b> e</> : ''} estão <b style={{ color: C.t1 }}>apagados</b> até o cálculo novo chegar — eles trocam sozinhos, não precisa recarregar.</>}
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

/** Linha de transparência das taxas: quantos pedidos já têm a taxa COBRADA e quantos têm a taxa CALCULADA. */
export function OrigemDasTaxas({ fees, cores }: { fees?: { pedidosReais?: number; pedidosEstimados?: number } | null; cores: Cores }) {
  const reais = Number(fees?.pedidosReais) || 0, est = Number(fees?.pedidosEstimados) || 0
  if (!fees || est <= 0) return null
  const C = cores
  const n = (x: number) => x.toLocaleString('pt-BR')
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11.5, color: C.t2, lineHeight: 1.5, margin: '-4px 0 14px' }}>
      <i className="ti ti-info-circle" style={{ fontSize: 14, color: C.t3, marginTop: 1 }} aria-hidden="true" />
      <span>
        <b style={{ color: C.t1 }}>Taxas da Amazon:</b> {n(reais)} pedido{reais === 1 ? '' : 's'} com a taxa já cobrada (valor real) · <b style={{ color: C.t1 }}>{n(est)}</b> ainda não cobrado{est === 1 ? '' : 's'} — pra esses, usamos o que a Amazon cobrou de você na última venda faturada do mesmo produto (ou a calculadora dela, se o produto ainda não vendeu), e troca pela cobrança real em poucos dias.
      </span>
    </div>
  )
}

type Isencao = { comissao: 'isenta' | 'parcial' | null; fba: 'isenta' | 'parcial' | null; parcelamento: 'isento' | null; itensMedidos: number } | null | undefined

/** 01/10 — PROMOÇÃO DA AMAZON NA CONTA: a tarifa R$ 0 é real (medida no que a Amazon cobrou), não falha do Oráculo. */
export function AvisoIsencao({ isencao, cores }: { isencao: Isencao; cores: Cores }) {
  if (!isencao) return null
  const isentas: string[] = [], parciais: string[] = []
  if (isencao.comissao === 'isenta') isentas.push('comissão'); else if (isencao.comissao === 'parcial') parciais.push('comissão')
  if (isencao.fba === 'isenta') isentas.push('tarifa FBA'); else if (isencao.fba === 'parcial') parciais.push('tarifa FBA')
  if (isencao.parcelamento === 'isento') isentas.push('parcelamento sem juros')
  if (!isentas.length && !parciais.length) return null
  const C = cores
  const lista = (l: string[]) => l.length > 1 ? l.slice(0, -1).join(', ') + ' e ' + l[l.length - 1] : l[0]
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.card, border: `1px solid ${C.gold}55`, borderRadius: 12, padding: '12px 15px', margin: '0 0 14px' }}>
      <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>🎁</span>
      <span style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.6 }}>
        <b style={{ color: C.t1 }}>Sua conta está numa promoção da Amazon.</b>{' '}
        {isentas.length > 0 && <>Nas suas últimas {isencao.itensMedidos >= 20 ? 20 : isencao.itensMedidos} vendas faturadas a Amazon <b style={{ color: C.t1 }}>não cobrou {lista(isentas)}</b> — por isso essas tarifas aparecem como R$ 0: é exatamente o que ela está cobrando de você. </>}
        {parciais.length > 0 && <>A {lista(parciais)} {parciais.length > 1 ? 'estão sendo cobradas' : 'está sendo cobrada'} só em parte das vendas (alguns produtos estão isentos) — cada produto mostra o que a Amazon cobrou nele. </>}
        Quando a promoção acabar, as tarifas voltam a aparecer sozinhas.
      </span>
    </div>
  )
}
