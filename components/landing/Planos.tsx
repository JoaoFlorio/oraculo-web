'use client'

/**
 * Planos — Acesso Fundador (vitalício, destaque de lançamento) + 3 recorrentes.
 *
 * ⚠️ TODO GREENN: os links abaixo são das OFERTAS ANTIGAS (79,90/397/597).
 * Antes de commitar/deployar, criar as 4 ofertas novas na Greenn
 * (127 mensal · 597 semestral · 997 anual · 1.497 Fundador VITALÍCIO — o nome
 * do produto precisa conter "vitalício" p/ o webhook mapear como lifetime)
 * e trocar os hrefs.
 */

import { Check, Crown, Infinity as InfinityIcon, Sparkles } from 'lucide-react'
import Reveal from './Reveal'
import { SectionHead } from './Section'
import { RunWhenVisible } from './ui'

/**
 * Checkouts Greenn — conferidos ao vivo em 18/07/2026:
 *   B0febG → "Oráculo - Mensal"                     R$ 127,00 / mês
 *   rpgHFd → "Oráculo - Semestral"                  R$ 597,00 / semestre
 *   WBkId3 → "Oráculo - Anual"                      R$ 997,00 / ano
 *   b2s4g9x → "Oráculo - Acesso fundador VITALÍCIO" R$ 1.497,00 (único)
 *
 * O nome do produto na Greenn é o que define o plano no backend (o webhook
 * mapeia por palavra-chave: mensal / semestral / anual / vitalício).
 * Ao renomear uma oferta lá, confira se a palavra-chave continua no nome.
 */
const LINKS = {
  mensal: 'https://payfast.greenn.com.br/pm36pq4/offer/B0febG',
  semestral: 'https://payfast.greenn.com.br/pm36pq4/offer/rpgHFd',
  anual: 'https://payfast.greenn.com.br/pm36pq4/offer/WBkId3',
  fundador: 'https://payfast.greenn.com.br/b2s4g9x',
}

const FOUNDER_FEATURES = [
  'Tudo do Oráculo, para sempre: DRE real, Gestão, Mineração, Calculadora, Extensão e Agente IA',
  'Todas as atualizações futuras incluídas — sem pagar nada a mais',
  'Sem mensalidade. Nunca mais.',
  'Suporte prioritário direto no WhatsApp',
  'Condição exclusiva de lançamento — não volta depois',
]

const PLANS = [
  {
    name: 'Mensal',
    price: '127',
    per: '/mês',
    desc: 'Para começar agora e enxergar sua operação com mais controle.',
    cta: 'Começar no mensal',
    href: LINKS.mensal,
    features: ['Painel completo com DRE real', 'Gestão conectada à sua conta Amazon', 'Mineração + Calculadora', 'Extensão Chrome + Agente IA', 'Ideal para testar'],
  },
  {
    name: 'Semestral',
    price: '597',
    per: '/6 meses',
    note: 'equivale a R$ 99,50/mês',
    desc: 'Para usar com consistência e acompanhar sua evolução por mais tempo.',
    cta: 'Garantir semestral',
    href: LINKS.semestral,
    features: ['Tudo do plano mensal', 'Acesso por 6 meses', 'Economia de 22% vs mensal', 'Acompanhamento de evolução', 'Suporte via WhatsApp'],
  },
  {
    name: 'Anual',
    price: '997',
    per: '/ano',
    note: 'equivale a R$ 83,08/mês',
    desc: 'Para manter a operação guiada por dados o ano inteiro.',
    cta: 'Garantir anual',
    href: LINKS.anual,
    features: ['Tudo do plano mensal', 'Acesso por 12 meses', 'Economia de 35% vs mensal', 'Ideal para escalar com consistência', 'Prioridade no suporte'],
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

        {/* ── ACESSO FUNDADOR — destaque de lançamento ─────────────────── */}
        <RunWhenVisible amount={0.2}>
          <Reveal delay={0.05}>
            <div className="ora-founder" style={{
              position: 'relative', marginTop: 'clamp(44px, 7vh, 70px)', borderRadius: 24,
              padding: 2, overflow: 'hidden',
            }}>
              {/* borda viva */}
              <div aria-hidden className="ora-founder-border" />
              <div style={{
                position: 'relative', borderRadius: 22, overflow: 'hidden',
                background: 'linear-gradient(115deg, rgba(34,26,8,0.96) 0%, rgba(10,9,20,0.98) 55%, rgba(24,18,6,0.96) 100%)',
                padding: 'clamp(26px, 4vw, 44px)',
              }}>
                {/* brilho ambiente */}
                <div aria-hidden style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'radial-gradient(90% 120% at 12% 0%, rgba(240,194,98,0.16), transparent 55%), radial-gradient(70% 100% at 100% 100%, rgba(240,194,98,0.08), transparent 60%)',
                }} />
                <div className="ora-founder-grid" style={{
                  position: 'relative', display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
                  gap: 'clamp(24px, 4vw, 44px)', alignItems: 'center',
                }}>
                  {/* lado esquerdo — a oferta */}
                  <div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: '#161006',
                        background: 'linear-gradient(135deg,#FFE7A6,#E0AC3C)',
                        borderRadius: 999, padding: '6px 14px',
                        boxShadow: '0 8px 26px -8px rgba(240,194,98,.8)',
                      }}><Crown size={13} /> ACESSO FUNDADOR</span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: 'var(--gold)',
                        border: '1px solid rgba(240,194,98,0.5)', borderRadius: 999, padding: '6px 14px',
                      }}><Sparkles size={12} /> SOMENTE NO LANÇAMENTO</span>
                    </div>

                    <h3 className="ora-display" style={{
                      fontSize: 'clamp(1.7rem, 3.4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.08, margin: 0,
                    }}>
                      Pague uma vez.<br />
                      <span className="ora-goldtext">Enxergue para sempre.</span>
                    </h3>

                    <p style={{ fontSize: 14, color: 'var(--tx2)', lineHeight: 1.6, margin: '14px 0 20px', maxWidth: '46ch' }}>
                      O plano que não existe duas vezes: acesso <strong style={{ color: 'var(--gold)' }}>VITALÍCIO</strong> a
                      tudo que o Oráculo é — e a tudo que ele ainda vai se tornar. Quando o lançamento
                      acabar, essa porta fecha.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {FOUNDER_FEATURES.map((f) => (
                        <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: 'var(--tx1)', lineHeight: 1.45 }}>
                          <span style={{
                            width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1,
                            display: 'grid', placeItems: 'center', color: '#161006',
                            background: 'linear-gradient(135deg,#FFE7A6,#E0AC3C)',
                          }}><Check size={11} strokeWidth={3.6} /></span>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* lado direito — o preço */}
                  <div style={{
                    textAlign: 'center', borderRadius: 18, padding: 'clamp(22px, 3vw, 34px) 22px',
                    background: 'rgba(4,4,12,0.55)', border: '1px solid rgba(240,194,98,0.3)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 60px -20px rgba(240,194,98,0.4)',
                  }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 10,
                      fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: 'var(--gold)',
                    }}>
                      <InfinityIcon size={16} /> VITALÍCIO
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                      <span style={{ fontSize: 17, color: 'var(--tx2)', fontWeight: 600 }}>R$</span>
                      <span className="ora-num ora-display ora-goldtext" style={{ fontSize: 'clamp(52px, 6vw, 68px)', fontWeight: 800, lineHeight: 1 }}>
                        1.497
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--tx3)', marginTop: 6 }}>pagamento único · sem mensalidade</div>
                    <div className="ora-num" style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 700, marginTop: 8 }}>
                      menos de 12 meses do mensal — pra sempre
                    </div>
                    <a href={LINKS.fundador} className="ora-cta" style={{
                      marginTop: 20, justifyContent: 'center', width: '100%', boxSizing: 'border-box',
                      fontSize: '1.05rem', padding: '1.05rem 1.4rem',
                    }}>
                      <Crown size={17} /> Quero ser fundador →
                    </a>
                    <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 12 }}>
                      PIX ou cartão em até 12x · acesso imediato
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </RunWhenVisible>

        {/* ── 3 planos recorrentes ─────────────────────────────────────── */}
        <Reveal delay={0.1}>
          <div style={{
            textAlign: 'center', margin: 'clamp(36px, 5vh, 52px) 0 0',
            fontSize: 12.5, letterSpacing: '.16em', color: 'var(--tx3)', textTransform: 'uppercase', fontWeight: 700,
          }}>
            — ou assine no seu ritmo —
          </div>
        </Reveal>

        <div className="ora-planos-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18,
          marginTop: 'clamp(24px, 4vh, 36px)', alignItems: 'stretch',
        }}>
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.1}>
              <div style={{
                height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 20,
                padding: '26px 24px',
                background: 'linear-gradient(180deg, rgba(16,16,34,0.6), rgba(8,8,20,0.7))',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 24px 60px -28px rgba(0,0,0,.7)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--tx1)' }}>{p.name}</div>
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
                <a href={p.href} className="ora-cta-ghost"
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
