'use client'
// TELA DE PAGAMENTO (01/10/2026 — pedido do João: "se não pagar, não acessa nada; só uma tela de pagamento").
// Substitui o painel INTEIRO quando a conta não tem acesso (vencido, bloqueado/reembolsado, sem plano): nada da
// Gestão, NEO, notificações ou ferramentas é sequer renderizado por baixo. As APIs já barram no servidor; o
// backend parou de mandar push e de rodar robôs pra quem não pagou. Preços: lib/planos.ts (fonte única).
import { PLANOS, fmt, checkout, type PlanoId } from '@/lib/planos'

const WA = 'https://wa.me/5541987474416?text=Ol%C3%A1!%20Sou%20cliente%20do%20Or%C3%A1culo%20e%20preciso%20de%20ajuda%20com%20o%20pagamento.'
const NOME: Record<string, string> = { monthly: 'Mensal', biannual: 'Semestral', annual: 'Anual', lifetime: 'Fundador Vitalício' }

export default function Paywall({ email, plan, expiresAt, motivo }: {
  email: string; plan: string | null; expiresAt: string | null; motivo: 'expired' | 'inactive' | 'free'
}) {
  const mensal = PLANOS.find(p => p.id === 'monthly')!
  const anual = PLANOS.find(p => p.id === 'annual')!
  const vit = PLANOS.find(p => p.id === 'lifetime')!
  const economiaAno = mensal.preco * 12 - anual.preco
  const venceu = expiresAt ? new Date(expiresAt).toLocaleDateString('pt-BR') : null
  const titulo = motivo === 'expired' ? 'Seu plano venceu' : motivo === 'inactive' ? 'Seu acesso está bloqueado' : 'Escolha seu plano'
  const sub = motivo === 'expired'
    ? <>O plano <b style={{ color: 'var(--t1)' }}>{NOME[plan || ''] || 'atual'}</b>{venceu ? <> venceu em <b style={{ color: 'var(--gold)' }}>{venceu}</b></> : null} e a renovação não foi paga.</>
    : motivo === 'inactive' ? <>Sua assinatura foi cancelada ou o pagamento foi estornado.</>
    : <>Sua conta ainda não tem um plano ativo.</>
  const pitch = plan === 'monthly' || motivo === 'expired'
    ? `Você já conhece o Oráculo no Mensal. No Anual você paga ${fmt(anual.porMes || 0)}/mês e economiza ${fmt(economiaAno)} no ano — é o plano que mais compensa pra quem já usa.`
    : `No Anual você paga ${fmt(anual.porMes || 0)}/mês e economiza ${fmt(economiaAno)} no ano em relação ao Mensal.`
  const bloqueados = ['Gestão e DRE da sua conta', 'NEO e geração de imagens', 'Notificações de venda no celular', 'Extensão do Chrome', 'Mineração e calculadoras']
  const ordem: PlanoId[] = ['monthly', 'biannual', 'annual']

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg, #07080D)', color: 'var(--t1)', fontFamily: 'inherit', padding: '40px 16px 56px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 760 }}>
        <div style={{ textAlign: 'center' as const, marginBottom: 26 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--goldSub)', border: '1px solid var(--lineG)', fontSize: 30 }} aria-hidden>🔒</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>{titulo}</h1>
          <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.65, margin: '10px auto 0', maxWidth: 560 }}>
            {sub} Tudo está <b style={{ color: 'var(--t1)' }}>travado</b> até você escolher um plano — a liberação é automática assim que o pagamento cai. Seus dados e configurações continuam guardados.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, justifyContent: 'center', marginTop: 16 }}>
            {bloqueados.map(b => (
              <span key={b} style={{ fontSize: 11.5, color: 'var(--t3)', border: '1px solid var(--line)', borderRadius: 99, padding: '5px 11px' }}>🔒 {b}</span>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--goldSub)', border: '1px solid var(--lineG)', borderRadius: 14, padding: '14px 18px', fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.6, marginBottom: 18, textAlign: 'center' as const }}>
          💡 {pitch}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
          {ordem.map(id => {
            const p = PLANOS.find(x => x.id === id)!
            const melhor = id === 'annual'
            const economia = id === 'annual' ? `Economiza ${fmt(economiaAno)} no ano` : id === 'biannual' ? `Economiza ${fmt(mensal.preco * 6 - p.preco)} no semestre` : 'Sem fidelidade'
            return (
              <a key={id} href={checkout(id as Exclude<PlanoId, 'free'>, email)} target="_blank" rel="noreferrer"
                style={{ position: 'relative' as const, display: 'flex', flexDirection: 'column' as const, gap: 6, textDecoration: 'none', borderRadius: 16, padding: '22px 18px 18px',
                  background: melhor ? 'var(--goldG)' : 'var(--card)', border: `1px solid ${melhor ? 'transparent' : 'var(--lineG)'}`,
                  boxShadow: melhor ? '0 10px 30px rgba(240,180,41,0.30)' : 'none', color: melhor ? '#02020A' : 'var(--t1)' }}>
                {melhor && <span style={{ position: 'absolute' as const, top: -10, left: 16, background: '#02020A', color: 'var(--gold)', fontSize: 9.5, fontWeight: 800, padding: '4px 10px', borderRadius: 99, letterSpacing: '0.1em' }}>MAIS VANTAJOSO</span>}
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{p.nome}</span>
                <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>{fmt(p.preco)}<span style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.75 }}>{p.ciclo}</span></span>
                {p.porMes && id !== 'monthly' && <span style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.85 }}>= {fmt(p.porMes)}/mês</span>}
                <span style={{ fontSize: 12, fontWeight: 700, color: melhor ? '#02020A' : 'var(--gold)' }}>{economia}</span>
                <span style={{ marginTop: 8, textAlign: 'center' as const, fontSize: 13, fontWeight: 800, padding: '10px 12px', borderRadius: 10,
                  background: melhor ? '#02020A' : 'var(--goldSub)', color: melhor ? 'var(--gold)' : 'var(--gold)', border: melhor ? 'none' : '1px solid var(--lineG)' }}>
                  Assinar {p.nome}
                </span>
              </a>
            )
          })}
        </div>

        <p style={{ textAlign: 'center' as const, fontSize: 12.5, color: 'var(--t3)', marginTop: 14 }}>
          Prefere nunca mais pagar mensalidade? <a href={checkout('lifetime', email)} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontWeight: 700 }}>{vit.nome} por {fmt(vit.preco)}</a>.
        </p>
        <p style={{ textAlign: 'center' as const, fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
          Use o e-mail <b style={{ color: 'var(--t2)' }}>{email}</b> no pagamento — é por ele que o acesso volta sozinho.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 10, justifyContent: 'center', marginTop: 22 }}>
          <button onClick={() => window.location.reload()}
            style={{ background: 'var(--card)', color: 'var(--t1)', border: '1px solid var(--line2, var(--line))', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Já paguei — liberar meu acesso
          </button>
          <a href={WA} target="_blank" rel="noreferrer"
            style={{ background: 'transparent', color: 'var(--t2)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Falar com o suporte
          </a>
          <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {}); window.location.href = '/login' }}
            style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
