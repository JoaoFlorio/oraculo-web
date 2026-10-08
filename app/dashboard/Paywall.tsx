'use client'
// TELA DE BLOQUEIO (01/10/2026 — "se não pagar, não acessa nada"; refeita 06/10/2026 a pedido do João).
// Substitui o painel INTEIRO quando a conta não tem acesso (teste grátis acabou, plano venceu, cancelado/reembolsado):
// nada da Gestão, NEO, notificações ou ferramentas é renderizado — as APIs já barram no servidor (401) e o backend
// parou de mandar push e de rodar robôs pra quem não pagou. O que aparece:
//   · à esquerda, o MESMO menu do painel (app/dashboard/navItens.ts) com TUDO no cadeado — clicar só avisa;
//   · embaixo do menu, o card da pessoa com o estado ("Teste encerrado" / "Plano vencido" / "Bloqueado");
//   · no meio, a mensagem grande e os planos: Fundador vitalício em destaque (até FUNDADOR_ATE) + Mensal/Semestral/Anual.
// Preços e prazo do Fundador: lib/planos.ts (fonte única).
import { useState } from 'react'
import { PLANOS, fmt, checkout, fundadorAberto, FUNDADOR_ATE, type PlanoId } from '@/lib/planos'
import { NAV, NAV_GROUPS } from './navItens'

const WA_REEMBOLSO = 'https://wa.me/5541987474416?text=Ol%C3%A1!%20Pedi%20o%20reembolso%20do%20Or%C3%A1culo%20e%20queria%20conversar.'
const WA = 'https://wa.me/5541987474416?text=Ol%C3%A1!%20Sou%20cliente%20do%20Or%C3%A1culo%20e%20preciso%20de%20ajuda%20com%20o%20pagamento.'
const NOME: Record<string, string> = { monthly: 'Mensal', biannual: 'Semestral', annual: 'Anual', lifetime: 'Fundador Vitalício' }

// Cores do visual novo (variáveis --ou-* do painel), com fallback se a página abrir sem elas.
const C = {
  fundo: 'var(--ou-fundo, #07080D)', card: 'var(--ou-card, #10121B)', sup: 'var(--ou-sup1, rgba(255,255,255,0.03))',
  linha: 'var(--ou-linha, rgba(255,255,255,0.08))', ouro: 'var(--ou-ouro, #FFC83D)', ouroClaro: 'var(--ou-ouro-claro, #FFE7A3)',
  t1: 'var(--ou-t1, #F3F3FB)', t2: 'var(--ou-t2, #A3A8C3)', t3: 'var(--ou-t3, #6B7090)', verm: 'var(--ou-verm, #F87171)',
  grad: 'linear-gradient(180deg,#FFE7A3 0%,#FFC83D 50%,#EBA31A 100%)',
}
const DISPLAY = "var(--tg-display),'Archivo',system-ui,sans-serif"

function Cadeado({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </svg>
  )
}

export default function Paywall({ email, nome, plan, expiresAt, motivo, foiTeste = false, reembolsoPedidoEm = null }: {
  email: string; nome?: string | null; plan: string | null; expiresAt: string | null; motivo: 'expired' | 'inactive' | 'free'; foiTeste?: boolean
  /** 08/10: abriu pedido de reembolso (reclamação na Greenn) — acesso suspenso na hora. ISO da abertura. */
  reembolsoPedidoEm?: string | null
}) {
  const [aviso, setAviso] = useState<string | null>(null)
  const [agora] = useState(() => Date.now())
  const mensal = PLANOS.find(p => p.id === 'monthly')!
  const anual = PLANOS.find(p => p.id === 'annual')!
  const vit = PLANOS.find(p => p.id === 'lifetime')!
  const economiaAno = mensal.preco * 12 - anual.preco
  const venceu = expiresAt ? new Date(expiresAt).toLocaleDateString('pt-BR') : null
  const fundador = fundadorAberto(agora)
  const fundadorAte = new Date(FUNDADOR_ATE).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const primeiroNome = (nome || '').trim().split(' ')[0] || ''
  const reembolso = motivo === 'inactive' && !!reembolsoPedidoEm
  const pedidoEm = reembolsoPedidoEm ? new Date(reembolsoPedidoEm).toLocaleDateString('pt-BR') : null
  const estado = reembolso ? 'Reembolso solicitado' : foiTeste ? 'Teste encerrado' : motivo === 'expired' ? 'Plano vencido' : motivo === 'inactive' ? 'Acesso bloqueado' : 'Sem plano'

  const titulo = reembolso ? <>Você pediu o reembolso. Seu acesso foi <span style={{ color: C.verm }}>suspenso.</span></>
    : foiTeste ? <>Seu teste de 7 dias <span style={{ background: C.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>acabou.</span></>
    : motivo === 'expired' ? <>Seu plano {NOME[plan || ''] || ''} <span style={{ color: C.verm }}>venceu.</span></>
    : motivo === 'inactive' ? <>Seu acesso está <span style={{ color: C.verm }}>bloqueado.</span></>
    : <>Escolha seu <span style={{ background: C.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>plano.</span></>
  const sub = reembolso
    ? <>{primeiroNome ? `${primeiroNome}, recebemos` : 'Recebemos'} seu pedido de reembolso{pedidoEm ? <> em <b style={{ color: C.t1 }}>{pedidoEm}</b></> : null} e o Oráculo e a extensão foram travados. Se aconteceu algum problema ou você mudou de ideia, <a href={WA_REEMBOLSO} target="_blank" rel="noopener noreferrer" style={{ color: C.ouroClaro, fontWeight: 700 }}>fale com a gente no WhatsApp</a> — a gente resolve e libera de novo. Ou escolha um plano abaixo pra voltar a usar.</>
    : foiTeste
    ? <>{primeiroNome ? `${primeiroNome}, os` : 'Os'} 7 dias grátis terminaram{venceu ? <> em <b style={{ color: C.t1 }}>{venceu}</b></> : null} e o Oráculo está travado. {fundador
        ? <>A partir de agora você tem a oportunidade de assinar o <b style={{ color: C.ouroClaro }}>Plano Fundador</b> e ter <b style={{ color: C.t1 }}>acesso vitalício</b> — são <b style={{ color: C.t1 }}>pouquíssimas vagas</b> e só até <b style={{ color: C.t1 }}>{fundadorAte}</b>. Ou, se preferir, assine o Mensal, o Semestral ou o Anual.</>
        : <>Pra continuar, assine o Mensal, o Semestral ou o Anual.</>}</>
    : motivo === 'expired'
      ? <>O plano <b style={{ color: C.t1 }}>{NOME[plan || ''] || 'atual'}</b>{venceu ? <> venceu em <b style={{ color: C.t1 }}>{venceu}</b></> : null} e a renovação não foi paga — por isso tudo está travado. Renove ou escolha outro plano pra liberar na hora.</>
      : motivo === 'inactive'
        ? <>Sua assinatura foi cancelada ou o pagamento foi estornado. Escolha um plano pra voltar a usar o Oráculo.</>
        : <>Sua conta ainda não tem um plano ativo.</>

  const travado = (label: string) => {
    setAviso(`"${label}" está travado. Assine um plano pra liberar — a liberação é automática assim que o pagamento cai.`)
    setTimeout(() => setAviso(a => (a && a.startsWith(`"${label}"`) ? null : a)), 4200)
    document.getElementById('planos-bloqueio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const ordem: PlanoId[] = ['monthly', 'biannual', 'annual']

  return (
    <div className="pw-raiz" style={{ minHeight: '100dvh', background: C.fundo, color: C.t1, display: 'flex' }}>
      <style>{`
        .pw-menu{width:248px;flex:none;border-right:1px solid ${C.linha};display:flex;flex-direction:column;position:sticky;top:0;height:100dvh;overflow-y:auto}
        .pw-item{display:flex;align-items:center;gap:10px;width:100%;padding:8px 12px;border-radius:10px;border:none;background:none;color:${C.t3};font:inherit;font-size:12.5px;text-align:left;cursor:not-allowed;opacity:.72}
        .pw-item:hover{background:${C.sup};opacity:1}
        .pw-item span{flex:1}
        .pw-chips{display:none}
        .pw-quem{display:none}
        .pw-plano{transition:transform .2s, box-shadow .2s}
        .pw-plano:hover{transform:translateY(-2px)}
        @media (max-width: 860px){
          .pw-menu{display:none}
          .pw-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:18px}
          .pw-quem{display:inline-flex}
        }
      `}</style>

      {/* MENU LATERAL — tudo no cadeado */}
      <aside className="pw-menu" aria-label="Menu (travado)">
        <div style={{ padding: '22px 20px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 800, letterSpacing: '0.14em', fontSize: 15, color: C.ouroClaro }}>ORÁCULO</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', color: C.verm, border: '1px solid rgba(248,113,113,0.35)', borderRadius: 99, padding: '3px 8px' }}><Cadeado size={10} />TRAVADO</span>
        </div>
        <nav style={{ padding: '4px 10px', flex: 1 }}>
          {NAV_GROUPS.map(g => (
            <div key={g.group} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.t3, padding: '8px 12px 4px' }}>{g.group}</div>
              {g.ids.map(id => {
                const n = NAV.find(x => x.id === id)
                if (!n) return null
                return (
                  <button key={id} type="button" className="pw-item" aria-disabled="true" onClick={() => travado(n.label)} title="Travado — assine um plano pra liberar">
                    <span>{n.label}</span><Cadeado />
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        {/* card da pessoa — deixa claro que ela NÃO tem plano */}
        <div style={{ margin: 12, padding: 12, borderRadius: 14, border: `1px solid ${C.linha}`, background: C.sup, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#1a1204', background: C.grad, flex: 'none' }}>{(primeiroNome || email || '?').charAt(0).toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(nome || '').trim() || email}</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.verm, border: '1px solid rgba(248,113,113,0.3)', borderRadius: 99, padding: '2px 7px' }}><Cadeado size={9} />{estado}</span>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main style={{ flex: 1, minWidth: 0, padding: '40px 16px 56px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 780 }}>
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            {/* celular: sem o menu lateral, o estado da conta aparece aqui em cima */}
            <div className="pw-quem" style={{ alignItems: 'center', gap: 6, marginBottom: 14, fontSize: 12, color: C.t2 }}>
              <b style={{ color: C.t1 }}>{(nome || '').trim() || email}</b>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.verm, border: '1px solid rgba(248,113,113,0.3)', borderRadius: 99, padding: '2px 7px' }}><Cadeado size={9} />{estado}</span>
            </div>
            <div style={{ width: 66, height: 66, borderRadius: 20, margin: '0 auto 18px', display: 'grid', placeItems: 'center', color: C.ouro, background: 'rgba(255,200,61,0.08)', border: '1px solid rgba(255,200,61,0.3)' }}><Cadeado size={30} /></div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(30px,5vw,46px)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.04, margin: 0 }}>{titulo}</h1>
            <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.65, margin: '14px auto 0', maxWidth: 600 }}>{sub}</p>
            <p style={{ fontSize: 12.5, color: C.t3, margin: '10px auto 0', maxWidth: 560 }}>Seus dados e configurações continuam guardados. A liberação é automática assim que o pagamento cai.</p>
            {/* celular: o menu travado vira uma linha de itens com cadeado */}
            <div className="pw-chips" aria-hidden="true">
              {NAV.filter(n => n.id !== 'planos' && n.id !== 'perfil').map(n => (
                <span key={n.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.t3, border: `1px solid ${C.linha}`, borderRadius: 99, padding: '4px 10px' }}><Cadeado size={10} />{n.label}</span>
              ))}
            </div>
          </div>

          {aviso && <div role="status" style={{ margin: '0 0 14px', padding: '11px 14px', borderRadius: 12, fontSize: 13, color: C.t1, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', textAlign: 'center' }}>🔒 {aviso}</div>}

          <div id="planos-bloqueio" />
          {/* FUNDADOR — em destaque, primeiro (até FUNDADOR_ATE) */}
          {fundador && (
            <a href={checkout('lifetime', email)} target="_blank" rel="noreferrer" className="pw-plano"
              style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, textDecoration: 'none', borderRadius: 20, padding: '22px 22px', marginBottom: 14,
                background: 'linear-gradient(135deg, rgba(255,200,61,0.16), rgba(255,200,61,0.04))', border: '1px solid rgba(255,200,61,0.55)', boxShadow: '0 18px 44px -18px rgba(255,200,61,0.45)', color: C.t1 }}>
              <span style={{ position: 'absolute', top: -11, left: 18, background: C.grad, color: '#1a1204', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', padding: '4px 11px', borderRadius: 99 }}>POUQUÍSSIMAS VAGAS · SÓ ATÉ {fundadorAte}</span>
              <div style={{ minWidth: 230, flex: '1 1 320px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: C.ouro }}>PLANO FUNDADOR · ACESSO VITALÍCIO</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 800, marginTop: 6, letterSpacing: '-0.02em' }}>{fmt(vit.preco)} <span style={{ fontSize: 13, fontWeight: 600, color: C.t2 }}>{vit.ciclo}</span></div>
                <div style={{ fontSize: 13, color: C.t2, marginTop: 6, lineHeight: 1.55 }}>Pague uma vez e nunca mais pague mensalidade. Todas as atualizações futuras incluídas e suporte prioritário no WhatsApp.</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, padding: '13px 20px', borderRadius: 12, background: C.grad, color: '#1a1204', whiteSpace: 'nowrap' }}>Quero ser Fundador</span>
            </a>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
            {ordem.map(id => {
              const p = PLANOS.find(x => x.id === id)!
              const melhor = id === 'annual'
              const economia = id === 'annual' ? `Economiza ${fmt(economiaAno)} no ano` : id === 'biannual' ? `Economiza ${fmt(mensal.preco * 6 - p.preco)} no semestre` : 'Sem fidelidade'
              return (
                <a key={id} href={checkout(id as Exclude<PlanoId, 'free'>, email)} target="_blank" rel="noreferrer" className="pw-plano"
                  style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6, textDecoration: 'none', borderRadius: 16, padding: '22px 18px 18px',
                    background: C.card, border: `1px solid ${melhor ? 'rgba(255,200,61,0.45)' : C.linha}`, color: C.t1 }}>
                  {melhor && <span style={{ position: 'absolute', top: -10, left: 16, background: C.ouro, color: '#1a1204', fontSize: 9.5, fontWeight: 800, padding: '4px 10px', borderRadius: 99, letterSpacing: '0.1em' }}>MAIS VANTAJOSO</span>}
                  <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{p.nome}</span>
                  <span style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>{fmt(p.preco)}<span style={{ fontSize: 12.5, fontWeight: 600, color: C.t2 }}>{p.ciclo}</span></span>
                  {p.porMes && id !== 'monthly' && <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t2 }}>= {fmt(p.porMes)}/mês</span>}
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.ouro }}>{economia}</span>
                  <span style={{ marginTop: 8, textAlign: 'center', fontSize: 13, fontWeight: 800, padding: '10px 12px', borderRadius: 10,
                    background: melhor ? C.grad : 'rgba(255,200,61,0.08)', color: melhor ? '#1a1204' : C.ouro, border: melhor ? 'none' : '1px solid rgba(255,200,61,0.3)' }}>Assinar {p.nome}</span>
                </a>
              )
            })}
          </div>

          <p style={{ textAlign: 'center', fontSize: 12.5, color: C.t3, marginTop: 14 }}>
            Use o e-mail <b style={{ color: C.t2 }}>{email}</b> no pagamento — é por ele que o acesso volta sozinho.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button onClick={() => window.location.reload()}
              style={{ background: C.card, color: C.t1, border: `1px solid ${C.linha}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Já paguei — liberar meu acesso
            </button>
            <a href={WA} target="_blank" rel="noreferrer"
              style={{ color: C.t2, border: `1px solid ${C.linha}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Falar com o suporte
            </a>
            <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {}); window.location.href = '/login' }}
              style={{ background: 'none', border: 'none', color: C.t3, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Sair da conta
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
