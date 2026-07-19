'use client'

/**
 * Planos — preços reais + checkouts Greenn ativos.
 */

import { Check, Crown } from 'lucide-react'
import Reveal from './Reveal'
import { SectionHead } from './Section'

const PLANS = [
  {
    name: 'Mensal',
    price: '79,90',
    per: '/mês',
    desc: 'Para começar agora e enxergar sua operação com mais controle.',
    cta: 'Começar no mensal',
    href: 'https://payfast.greenn.com.br/pm36pq4/offer/B0febG',
    features: ['Painel completo com DRE real', 'Gestão conectada à sua conta Amazon', 'Mineração + Calculadora', 'Extensão Chrome + Agente IA', 'Ideal para testar'],
  },
  {
    name: 'Anual',
    price: '597',
    per: '/ano',
    note: 'equivale a R$ 49,75/mês',
    desc: 'Melhor custo-benefício para manter sua operação guiada por dados.',
    cta: 'Garantir anual',
    href: 'https://payfast.greenn.com.br/pm36pq4/offer/WBkId3',
    hot: true,
    features: ['Tudo do plano mensal', 'Acesso por 12 meses', 'Economia de 38% vs mensal', 'Ideal para escalar com consistência', 'Prioridade no suporte'],
  },
  {
    name: 'Semestral',
    price: '397',
    per: '/6 meses',
    note: 'equivale a R$ 66,17/mês',
    desc: 'Para usar com consistência e acompanhar sua evolução por mais tempo.',
    cta: 'Garantir semestral',
    href: 'https://payfast.greenn.com.br/pm36pq4/offer/rpgHFd',
    features: ['Tudo do plano mensal', 'Acesso por 6 meses', 'Economia vs mensal', 'Acompanhamento de evolução', 'Suporte via WhatsApp'],
  },
]

export default function Planos() {
  return (
    <section id="planos" style={{ position: 'relative', background: 'var(--ink2)' }}>
      <div className="ora-divider" />
      <div className="ora-section">
        <SectionHead
          eyebrow="Planos e preços"
          title={<>Escolha como você quer<br /><span className="ora-goldtext">enxergar seu lucro.</span></>}
          lead="Acesso imediato após a compra: login do painel, chave da extensão e passo a passo chegam automaticamente no seu e-mail."
        />

        <div className="ora-planos-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18,
          marginTop: 'clamp(44px, 7vh, 70px)', alignItems: 'stretch',
        }}>
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.1} className={p.hot ? 'ora-plan-hot' : undefined}
              style={p.hot ? { transform: 'scale(1.04)', zIndex: 2 } : undefined}>
              <div style={{
                height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 20,
                padding: '26px 24px',
                background: p.hot
                  ? 'linear-gradient(180deg, rgba(240,194,98,0.1), rgba(9,9,22,0.9))'
                  : 'linear-gradient(180deg, rgba(16,16,34,0.6), rgba(8,8,20,0.7))',
                border: p.hot ? '1px solid rgba(240,194,98,0.5)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: p.hot
                  ? '0 30px 80px -24px rgba(0,0,0,.8), 0 0 70px -24px rgba(240,194,98,.5)'
                  : '0 24px 60px -28px rgba(0,0,0,.7)',
                position: 'relative',
              }}>
                {p.hot && (
                  <span style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 11, fontWeight: 800, letterSpacing: '.08em', color: '#161006',
                    background: 'linear-gradient(135deg,#FFE7A6,#E0AC3C)',
                    borderRadius: 999, padding: '5px 14px', whiteSpace: 'nowrap',
                    boxShadow: '0 8px 24px -8px rgba(240,194,98,.7)',
                  }}><Crown size={12} /> MELHOR ESCOLHA</span>
                )}
                <div style={{ fontSize: 15, fontWeight: 800, color: p.hot ? 'var(--gold)' : 'var(--tx1)' }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 10 }}>
                  <span style={{ fontSize: 15, color: 'var(--tx2)', fontWeight: 600 }}>R$</span>
                  <span className="ora-num ora-display" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: 'var(--tx1)' }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: 'var(--tx3)' }}>{p.per}</span>
                </div>
                {p.note && <div className="ora-num" style={{ fontSize: 11.5, color: 'var(--emerald)', marginTop: 5, fontWeight: 700 }}>{p.note}</div>}
                <p style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.55, margin: '12px 0 16px' }}>{p.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {p.features.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--tx1)' }}>
                      <span style={{
                        width: 17, height: 17, borderRadius: 6, flexShrink: 0, marginTop: 1,
                        display: 'grid', placeItems: 'center', color: 'var(--emerald)',
                        background: 'rgba(63,215,155,0.1)', border: '1px solid rgba(63,215,155,0.3)',
                      }}><Check size={10} strokeWidth={3.4} /></span>
                      {f}
                    </div>
                  ))}
                </div>
                <a href={p.href} className={p.hot ? 'ora-cta' : 'ora-cta-ghost'}
                  style={{ marginTop: 20, justifyContent: 'center', width: '100%', boxSizing: 'border-box' }}>
                  {p.cta} →
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--tx3)', marginTop: 26 }}>
            Pagamento seguro via Greenn · PIX ou cartão · Suporte via WhatsApp
          </p>
        </Reveal>
      </div>
    </section>
  )
}
