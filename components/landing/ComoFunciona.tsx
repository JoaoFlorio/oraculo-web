'use client'

/**
 * Como funciona — "Conecte. Revele. Decida." (3 passos, imagem de ref. 2)
 */

import { Lock, Package, Calculator, Boxes, Megaphone, Zap, Clock, BadgeCheck } from 'lucide-react'
import Reveal from './Reveal'
import { SectionHead, CtaBanner, FootIcon } from './Section'
import { RunWhenVisible, MoneyUp, PctUp, Trend, Spark } from './ui'

function StepBadge({ n }: { n: number }) {
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%', margin: '0 auto 18px',
      display: 'grid', placeItems: 'center', position: 'relative',
      background: 'radial-gradient(circle at 50% 35%, rgba(240,194,98,0.18), rgba(240,194,98,0.04))',
      border: '1px solid rgba(240,194,98,0.45)',
      boxShadow: '0 0 30px -8px rgba(240,194,98,0.5)',
    }}>
      <span className="ora-num" style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold)' }}>{n}</span>
    </div>
  )
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10, fontSize: 12.5, color: 'var(--tx1)', fontWeight: 600,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 6, flexShrink: 0, display: 'grid', placeItems: 'center',
        background: 'rgba(63,215,155,0.12)', border: '1px solid rgba(63,215,155,0.35)', color: 'var(--emerald)',
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 13 4 4L19 7" /></svg>
      </span>
      {children}
    </div>
  )
}

function Benefit({ icon, title, desc, stat, statColor = 'var(--emerald)', delay = 0 }: {
  icon: React.ReactNode; title: string; desc: string; stat: React.ReactNode; statColor?: string; delay?: number
}) {
  return (
    <Reveal delay={delay} className="ora-card ora-card-glow" style={{ padding: '15px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
        <span style={{
          width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', flexShrink: 0,
          color: 'var(--gold)', background: 'rgba(240,194,98,0.08)', border: '1px solid rgba(240,194,98,0.22)',
        }}>{icon}</span>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--tx1)' }}>{title}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.5, marginBottom: 9 }}>{desc}</div>
      <div className="ora-num" style={{ fontSize: 14, fontWeight: 800, color: statColor }}>{stat}</div>
    </Reveal>
  )
}

export default function ComoFunciona() {
  return (
    <section id="como-funciona" style={{ position: 'relative', background: 'var(--ink2)' }}>
      <div className="ora-divider" />
      <div className="ora-section">
        <SectionHead
          eyebrow="Como funciona o Oráculo"
          title={<>Conecte. Revele. <span className="ora-goldtext">Decida.</span></>}
          lead="Em poucos passos, sua operação Amazon sai do escuro e vira uma máquina guiada por dados reais."
        />

        {/* 3 passos */}
        <div className="ora-steps" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
          marginTop: 'clamp(44px, 7vh, 70px)', position: 'relative',
        }}>
          {/* linha conectora */}
          <div className="ora-steps-line" aria-hidden style={{
            position: 'absolute', top: 26, left: '18%', right: '18%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(240,194,98,.45), rgba(240,194,98,.45), transparent)',
          }} />

          {/* PASSO 1 — conectar */}
          <Reveal delay={0.05} style={{ position: 'relative' }}>
            <StepBadge n={1} />
            <h3 style={{ fontSize: 19, fontWeight: 800, textAlign: 'center', margin: '0 0 8px' }}>
              Conecte sua <span className="ora-goldtext">conta Amazon</span>
            </h3>
            <p style={{ fontSize: 13, color: 'var(--tx2)', textAlign: 'center', lineHeight: 1.55, margin: '0 0 18px' }}>
              Integração oficial via SP-API com segurança OAuth 2.0. Seus dados estão protegidos.
            </p>
            <div className="ora-card" style={{ padding: 18 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14,
                fontSize: 22, fontWeight: 800, color: 'var(--tx1)',
              }}>
                <span className="ora-display" style={{ color: '#FF9900', fontSize: 26, lineHeight: 1 }}>a</span>
                amazon
              </div>
              <div style={{
                textAlign: 'center', fontSize: 12, color: 'var(--tx2)', marginBottom: 14,
              }}>Conecte sua conta de vendedor com poucos cliques.</div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16,
                padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 800, color: '#161006',
                background: 'linear-gradient(135deg,#FFE7A6,#E0AC3C)', boxShadow: '0 8px 24px -10px rgba(240,194,98,.6)',
              }}>
                <Lock size={13} /> Conectar com Amazon
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Check>SP-API oficial Amazon</Check>
                <Check>OAuth 2.0 seguro</Check>
                <Check>Sem acesso a dados sensíveis</Check>
                <Check>Conformidade LGPD</Check>
              </div>
            </div>
          </Reveal>

          {/* PASSO 2 — organiza */}
          <Reveal delay={0.15} style={{ position: 'relative' }}>
            <StepBadge n={2} />
            <h3 style={{ fontSize: 19, fontWeight: 800, textAlign: 'center', margin: '0 0 8px' }}>
              O Oráculo <span className="ora-goldtext">organiza tudo</span>
            </h3>
            <p style={{ fontSize: 13, color: 'var(--tx2)', textAlign: 'center', lineHeight: 1.55, margin: '0 0 18px' }}>
              Coleta, processa e transforma milhares de dados em inteligência acionável.
            </p>
            <RunWhenVisible>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { l: 'DRE Real', v: <MoneyUp value={8817.65} />, t: '23,6%', s: [10, 14, 12, 18, 16, 24, 22, 30, 36] },
                  { l: 'Lucro Bruto', v: <MoneyUp value={2972.88} delay={150} />, t: '28,6%', s: [8, 12, 10, 16, 14, 20, 18, 26, 31] },
                  { l: 'Margem', v: <PctUp value={33.7} delay={300} />, t: '5,4%', s: [20, 18, 24, 22, 27, 25, 30, 28, 33] },
                ].map((k, i) => (
                  <div key={k.l} className="ora-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 4 }}>{k.l}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tx1)' }}>{k.v}</div>
                      <div style={{ marginTop: 4 }}><Trend value={k.t} label="vs 30 dias ant." /></div>
                    </div>
                    <Spark data={k.s} w={92} h={34} color="var(--emerald)" delay={i * 0.15} />
                  </div>
                ))}
              </div>
            </RunWhenVisible>
          </Reveal>

          {/* PASSO 3 — decide */}
          <Reveal delay={0.25} style={{ position: 'relative' }}>
            <StepBadge n={3} />
            <h3 style={{ fontSize: 19, fontWeight: 800, textAlign: 'center', margin: '0 0 8px' }}>
              Você age <span className="ora-goldtext">com clareza</span>
            </h3>
            <p style={{ fontSize: 13, color: 'var(--tx2)', textAlign: 'center', lineHeight: 1.55, margin: '0 0 18px' }}>
              Insights prontos para decisão e crescimento consistente.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Benefit icon={<Package size={16} />} title="Melhores produtos" delay={0.05}
                desc="Identifique oportunidades com alto potencial." stat={<>▲ 28,6% potencial</>} />
              <Benefit icon={<Calculator size={16} />} title="Cálculo de lucro" delay={0.1}
                desc="Precificação inteligente e margem real." stat={<>R$ 41,40 lucro líquido/un</>} />
              <Benefit icon={<Boxes size={16} />} title="Estoque otimizado" delay={0.15}
                desc="Gire melhor, venda mais, empaque menos." stat={<>Ruptura: −62%</>} />
              <Benefit icon={<Megaphone size={16} />} title="Anúncios eficientes" delay={0.2}
                desc="Mais vendas com menos desperdício em Ads." stat={<>ACOS: 12,6%</>} statColor="var(--violet)" />
            </div>
          </Reveal>
        </div>

        <CtaBanner
          title={<>Pronto para transformar<br /><span className="ora-goldtext">sua operação Amazon?</span></>}
          cta="Quero ver por dentro"
          foot={<>
            <FootIcon icon={<BadgeCheck size={14} />} label="Dados reais" />
            <FootIcon icon={<Zap size={14} />} label="Integração oficial" />
            <FootIcon icon={<Clock size={14} />} label="Acesso imediato" />
          </>}
        />
      </div>
    </section>
  )
}
