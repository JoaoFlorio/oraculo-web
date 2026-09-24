'use client'
/* ABA PLANOS (24/09/2026) — pedido do João: "a pessoa não precisa entrar em link meu,
   entrar em site; tudo dentro do Oráculo ela muda de plano. Quem é vitalício vê que
   está no topo; mensal recebe upsell do anual antes de vencer; anual recebe upsell do
   vitalício. O próprio Oráculo incentiva a venda."
   Checkout continua na Greenn (o webhook troca o plano sozinho pela compra com o mesmo
   e-mail). Preços/links: lib/planos.ts (fonte única). */
import { useState } from 'react'
import { PLANOS, RANK, planoDe, fmt, checkout, recomendacao, type PlanoId } from '@/lib/planos'

export default function Planos({ user }: { user: { email: string; name?: string; plan: string; expiresAt?: string | Date | null } }) {
  const [agora] = useState(() => Date.now())   // relógio fixo do render (lint react-hooks/purity)
  const atual = planoDe(user.plan)
  const rankAtual = RANK[(user.plan as PlanoId)] ?? 0
  const expiresAt = user.expiresAt ? new Date(user.expiresAt) : null
  const daysLeft = expiresAt && user.plan !== 'lifetime' ? Math.ceil((expiresAt.getTime() - agora) / 86400000) : null
  const dias = atual?.dias || null
  const inicio = expiresAt && dias ? new Date(expiresAt.getTime() - dias * 86400000) : null
  const pct = expiresAt && inicio && dias ? Math.min(100, Math.max(0, ((agora - inicio.getTime()) / (dias * 86400000)) * 100)) : null
  const rec = recomendacao(user.plan, daysLeft)
  const card: React.CSSProperties = { background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14 }

  return (
    <div style={{ padding: '4px 0 40px', maxWidth: 1080 }}>
      {/* Onde você está */}
      <div style={{ ...card, padding: '18px 20px', marginBottom: 14, borderColor: user.plan === 'lifetime' ? 'rgba(34,197,94,.35)' : 'rgba(240,180,41,.3)', boxShadow: 'var(--elev1)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--t3)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700 }}>Seu plano</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', marginTop: 2 }}>
              {user.plan === 'lifetime' ? '🏆 Fundador Vitalício' : atual ? atual.nome : 'Sem plano ativo'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--t2)', marginTop: 4 }}>
              {user.plan === 'lifetime'
                ? 'Acesso a tudo, para sempre. Sem mensalidade.'
                : atual && expiresAt
                  ? <>{fmt(atual.preco)}{atual.ciclo} · {daysLeft != null && daysLeft >= 0 ? <>{user.plan === 'monthly' ? 'renova' : 'vence'} em <b style={{ color: daysLeft <= 7 ? 'var(--gold)' : 'var(--t1)' }}>{daysLeft} dia{daysLeft === 1 ? '' : 's'}</b> ({expiresAt.toLocaleDateString('pt-BR')})</> : <>venceu em {expiresAt.toLocaleDateString('pt-BR')}</>}</>
                  : 'Escolha um plano abaixo para liberar o Oráculo completo.'}
            </div>
          </div>
          {pct != null && (
            <div style={{ minWidth: 220, flex: '0 1 280px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}><span>ciclo atual</span><span>{Math.round(pct)}%</span></div>
              <div style={{ height: 6, borderRadius: 4, background: 'var(--line)' }}><div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: 'var(--gold)' }} /></div>
            </div>
          )}
        </div>
      </div>

      {/* O degrau recomendado (upsell inteligente) */}
      <div style={{ ...card, padding: '16px 20px', marginBottom: 18, borderColor: rec.urgente ? 'rgba(240,180,41,.55)' : 'var(--line)', background: rec.urgente ? 'linear-gradient(180deg, rgba(240,180,41,.10), var(--card))' : 'var(--card)' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em' }}>{rec.urgente ? '⏳ ' : rec.alvo ? '⬆️ ' : ''}{rec.titulo}</div>
        <div style={{ fontSize: 12.5, color: 'var(--t2)', marginTop: 6, lineHeight: 1.55, maxWidth: 720 }}>{rec.texto}</div>
        {rec.alvo && (
          <a href={checkout(rec.alvo.id as Exclude<PlanoId, 'free'>, user.email)} target="_blank" rel="noreferrer"
             style={{ display: 'inline-block', marginTop: 12, padding: '10px 16px', borderRadius: 10, background: 'var(--gold)', color: '#111', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
            Trocar para o {rec.alvo.nome} — {fmt(rec.alvo.preco)}{rec.alvo.id === 'lifetime' ? ' (única vez)' : rec.alvo.ciclo}
          </a>
        )}
      </div>

      {/* A escada completa */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
        {PLANOS.map(p => {
          const r = RANK[p.id]
          const ehAtual = p.id === user.plan
          const acima = r > rankAtual
          const recomendado = rec.alvo?.id === p.id
          return (
            <div key={p.id} style={{ ...card, padding: '16px 16px 14px', position: 'relative', opacity: acima || ehAtual ? 1 : .55,
              borderColor: ehAtual ? 'rgba(34,197,94,.45)' : recomendado ? 'rgba(240,180,41,.55)' : 'var(--line)' }}>
              {(ehAtual || recomendado) && (
                <div style={{ position: 'absolute', top: -9, left: 14, fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6,
                  background: ehAtual ? 'rgba(34,197,94,.18)' : 'rgba(240,180,41,.18)', color: ehAtual ? 'var(--g)' : 'var(--gold)', border: `1px solid ${ehAtual ? 'rgba(34,197,94,.4)' : 'rgba(240,180,41,.4)'}` }}>
                  {ehAtual ? 'seu plano' : 'recomendado'}
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>{p.nome}</div>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em' }}>{fmt(p.preco)}</span>
                <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{p.ciclo}</span>
              </div>
              {p.porMes && p.id !== 'monthly' && <div style={{ fontSize: 11.5, color: 'var(--gold)', marginTop: 2, fontWeight: 700 }}>≈ {fmt(Math.round(p.porMes))}/mês</div>}
              <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 8, lineHeight: 1.5, minHeight: 36 }}>{p.frase}</div>
              <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 5 }}>
                {p.destaques.map(d => <li key={d} style={{ fontSize: 11.5, color: 'var(--t2)', display: 'flex', gap: 6 }}><span style={{ color: 'var(--g)' }}>✓</span>{d}</li>)}
              </ul>
              <div style={{ marginTop: 12 }}>
                {ehAtual ? (
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--g)' }}>✓ Você está aqui</div>
                ) : acima ? (
                  <a href={checkout(p.id as Exclude<PlanoId, 'free'>, user.email)} target="_blank" rel="noreferrer"
                     style={{ display: 'block', textAlign: 'center', padding: '9px 12px', borderRadius: 10, fontWeight: 800, fontSize: 12.5, textDecoration: 'none',
                       background: recomendado ? 'var(--gold)' : 'transparent', color: recomendado ? '#111' : 'var(--t1)', border: recomendado ? 'none' : '1px solid var(--line2)' }}>
                    {p.id === 'lifetime' ? 'Virar Fundador' : `Trocar para ${p.nome}`}
                  </a>
                ) : (
                  <div style={{ fontSize: 11.5, color: 'var(--t4)' }}>já incluso no seu plano</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.6 }}>
        Como funciona a troca: o pagamento é na Greenn, <b style={{ color: 'var(--t2)' }}>com o mesmo e-mail desta conta ({user.email})</b> — o Oráculo reconhece a compra e muda seu plano sozinho em poucos minutos, somando os dias que ainda faltavam do plano atual.
        Se você tinha assinatura recorrente, nossa equipe cancela a anterior para não cobrar duas vezes. Dúvida: <a href="mailto:atendimento@oraculojf.com.br" style={{ color: 'var(--gold)' }}>atendimento@oraculojf.com.br</a>.
      </div>
    </div>
  )
}
