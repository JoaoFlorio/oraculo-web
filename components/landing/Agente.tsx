'use client'

/**
 * Agente NEO — "o cérebro do João Flório dentro do painel".
 * Dobra própria, fora da curva: identidade exclusiva ouro→violeta (marca +
 * IA), núcleo neural em SVG com sinapses pulsando e constelação de domínios,
 * e um chat mockado onde o agente responde com os NÚMEROS da operação
 * (DRE/Ads/estoque), não com teoria de manual.
 */

import {
  Brain, Sparkles, CircleDollarSign, Megaphone, Pickaxe, Truck,
  Search, Boxes, TrendingUp, Clock3, Send, BadgeCheck, Zap,
} from 'lucide-react'
import Reveal from './Reveal'
import { SectionHead } from './Section'
import { RunWhenVisible, ScaledFrame } from './ui'
import { NeoMark, NeoLockup } from './marks'

const T = {
  card: 'rgba(255,255,255,0.028)', line: 'rgba(255,255,255,0.065)',
  t1: '#EDEEF7', t2: '#9AA6C0', t3: '#5C6680',
  gold: '#F0C262', green: '#3FD79B', red: '#FF8A8A', violet: '#A99BFF',
}

/* ── chat mockado (desenhado a 430px) ─────────────────────────────────── */
function ChatMock() {
  return (
    <div style={{
      width: 430, borderRadius: 16, overflow: 'hidden',
      background: '#0B0D16', border: '1px solid rgba(169,155,255,0.32)',
      boxShadow: '0 40px 110px -30px rgba(0,0,0,.92), 0 0 90px -30px rgba(169,155,255,.4), 0 0 60px -30px rgba(240,194,98,.25)',
      fontFamily: 'var(--font-body), system-ui, sans-serif', textAlign: 'left',
    }}>
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
        borderBottom: `1px solid ${T.line}`,
        background: 'linear-gradient(90deg, rgba(240,194,98,0.07), rgba(169,155,255,0.08))',
      }}>
        <NeoMark size={38} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.t1, letterSpacing: '.04em' }}>
            AGENTE <span className="ora-goldtext">NEO</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: T.t3 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: `0 0 8px ${T.green}` }} />
            online · conectado à sua operação
          </div>
        </div>
        <span style={{
          marginLeft: 'auto', fontSize: 8, fontWeight: 800, letterSpacing: '.1em',
          color: '#161006', background: 'linear-gradient(135deg,#FFE7A6,#E0AC3C)',
          borderRadius: 5, padding: '3px 8px', whiteSpace: 'nowrap',
        }}>MÉTODO JOÃO FLÓRIO</span>
      </div>

      {/* mensagens */}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* usuário */}
        <div style={{
          alignSelf: 'flex-end', maxWidth: '82%', borderRadius: '14px 14px 4px 14px',
          background: 'rgba(240,194,98,0.1)', border: '1px solid rgba(240,194,98,0.3)',
          padding: '9px 12px', fontSize: 11.5, color: T.t1, lineHeight: 1.5,
        }}>
          Minha margem caiu pra 18% esse mês. Onde tá o vazamento?
        </div>

        {/* agente */}
        <div style={{
          alignSelf: 'flex-start', maxWidth: '92%', borderRadius: '14px 14px 14px 4px',
          background: T.card, border: `1px solid rgba(169,155,255,0.28)`,
          padding: '10px 12px', fontSize: 11, color: T.t2, lineHeight: 1.55,
        }}>
          <div style={{ color: T.t1, fontWeight: 700, marginBottom: 5, fontSize: 11.5 }}>
            Olhei sua DRE de julho. Achei dois vazamentos:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 7 }}>
            <div><span className="ora-num" style={{ color: T.red, fontWeight: 700 }}>−3 p.p.</span> — tarifa FBA da Garrafa 1L subiu <span className="ora-num" style={{ color: T.t1 }}>R$ 1,20/un</span> (mudança de faixa de peso)</div>
            <div><span className="ora-num" style={{ color: T.red, fontWeight: 700 }}>−4 p.p.</span> — ACOS da campanha “Squeeze Auto” foi de <span className="ora-num" style={{ color: T.t1 }}>12% → 19%</span></div>
          </div>
          <div style={{ color: T.t1, fontWeight: 700, marginBottom: 4, fontSize: 11 }}>O que eu faria:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>1. Reprecificar pra <span className="ora-num" style={{ color: T.green, fontWeight: 700 }}>R$ 84,90</span> — margem volta a <span className="ora-num" style={{ color: T.green, fontWeight: 700 }}>23,8%</span> sem perder o Buy Box</div>
            <div>2. Negativar os 4 termos que gastam sem converter (te listei no painel de Ads)</div>
          </div>
          {/* fontes */}
          <div style={{ display: 'flex', gap: 5, marginTop: 9, flexWrap: 'wrap' }}>
            {['DRE · julho', 'Ads · 30 dias', 'Tarifas FBA'].map((s) => (
              <span key={s} className="ora-num" style={{
                fontSize: 7.5, fontWeight: 700, color: T.violet,
                border: '1px solid rgba(169,155,255,0.35)', borderRadius: 5, padding: '2px 7px',
              }}>{s}</span>
            ))}
          </div>
        </div>

        {/* usuário 2 */}
        <div style={{
          alignSelf: 'flex-end', maxWidth: '82%', borderRadius: '14px 14px 4px 14px',
          background: 'rgba(240,194,98,0.1)', border: '1px solid rgba(240,194,98,0.3)',
          padding: '9px 12px', fontSize: 11.5, color: T.t1, lineHeight: 1.5,
        }}>
          E vale escalar ela agora?
        </div>

        {/* agente 2 */}
        <div style={{
          alignSelf: 'flex-start', maxWidth: '92%', borderRadius: '14px 14px 14px 4px',
          background: T.card, border: `1px solid rgba(169,155,255,0.28)`,
          padding: '10px 12px', fontSize: 11, color: T.t2, lineHeight: 1.55,
        }}>
          Com o preço corrigido, sim: giro de <span className="ora-num" style={{ color: T.t1 }}>~75 un/mês</span>,
          ROI de <span className="ora-num" style={{ color: T.t1 }}>64%</span> e só
          <span className="ora-num" style={{ color: T.t1 }}> 23 dias</span> de cobertura de estoque.
          Pede reposição de <span className="ora-num" style={{ color: T.green, fontWeight: 700 }}>150 un</span> essa
          semana pra não romper no pico.
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
            fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em', color: T.green,
            border: `1px solid ${T.green}55`, background: 'rgba(63,215,155,0.08)',
            borderRadius: 6, padding: '4px 10px',
          }}>
            <TrendingUp size={11} /> VEREDITO: ESCALAR
          </div>
        </div>
      </div>

      {/* input */}
      <div style={{ padding: '0 14px 14px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          border: '1px solid rgba(169,155,255,0.35)', borderRadius: 12, padding: '10px 13px',
        }}>
          <span style={{ fontSize: 11, color: T.t3, flex: 1 }}>Pergunte como quem pergunta a um mentor…</span>
          <span style={{
            width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center',
            background: 'linear-gradient(135deg, #F0C262, #6D5BD0)',
          }}><Send size={13} color="#0B0D16" /></span>
        </div>
      </div>
    </div>
  )
}

/* ── domínios de conhecimento ─────────────────────────────────────────── */
const DOMAINS = [
  { icon: <CircleDollarSign size={15} />, l: 'Precificação & margem' },
  { icon: <Megaphone size={15} />, l: 'Ads: ACOS & TACOS' },
  { icon: <Pickaxe size={15} />, l: 'Mineração de produtos' },
  { icon: <Truck size={15} />, l: 'FBA, DBA & logística' },
  { icon: <Search size={15} />, l: 'SEO & ranqueamento' },
  { icon: <Boxes size={15} />, l: 'Estoque & reposição' },
  { icon: <TrendingUp size={15} />, l: 'Escala & capital de giro' },
]

const DIFFS = [
  {
    icon: <Brain size={17} />,
    t: 'Conhecimento de operador, não de manual',
    d: 'Treinado com o método e a experiência real do João Flório vendendo na Amazon Brasil — o mesmo que ele ensina em mentoria.',
  },
  {
    icon: <Zap size={17} />,
    t: 'Responde com o SEU número',
    d: 'Conectado à sua operação: DRE, margem, Ads e estoque. A resposta parte dos seus dados, não de um exemplo genérico.',
  },
  {
    icon: <BadgeCheck size={17} />,
    t: 'Veredito e próximo passo',
    d: 'Nada de parede de texto. Diagnóstico, número e o que fazer agora — como um mentor que respeita seu tempo.',
  },
  {
    icon: <Clock3 size={17} />,
    t: 'Disponível 24/7',
    d: 'Dúvida às 2h da manhã antes de fechar pedido com fornecedor? Ele está online. Sempre.',
  },
]

export default function Agente() {
  return (
    <section id="agente" className="ora-agente" style={{ position: 'relative', background: 'var(--ink)', overflow: 'hidden' }}>
      {/* divisor + aura exclusiva da dobra: ouro fundindo com violeta */}
      <div className="ora-divider" style={{ background: 'linear-gradient(90deg,transparent,rgba(240,194,98,.3),rgba(169,155,255,.35),transparent)' }} />
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background:
          'radial-gradient(60% 50% at 22% 30%, rgba(240,194,98,0.08), transparent 60%),' +
          'radial-gradient(55% 45% at 80% 62%, rgba(169,155,255,0.1), transparent 60%)',
      }} />

      <div className="ora-section" style={{ maxWidth: 1280 }}>
        {/* lockup da marca do agente abre a dobra */}
        <Reveal>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
            <NeoLockup size={62} />
          </div>
        </Reveal>
        <SectionHead
          eyebrow="Exclusivo do Oráculo"
          title={<>Conheça o <span className="ora-goldtext">NEO</span>.<br />O cérebro de um especialista na sua operação.</>}
          lead="Não é um chatbot genérico. O NEO carrega o conhecimento do João Flório sobre Amazon — método, critérios e experiência de operação — rodando em IA de última geração e conectado aos números reais da sua conta."
        />

        {/* composição: diferenciais | chat */}
        <RunWhenVisible amount={0.12}>
          <div className="ora-agente-grid" style={{
            display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
            gap: 'clamp(28px, 4vw, 56px)', alignItems: 'center',
            marginTop: 'clamp(44px, 7vh, 70px)',
          }}>
            {/* esquerda: diferenciais */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }} className="ora-agente-diffs">
                {DIFFS.map((x, i) => (
                  <Reveal key={x.t} delay={0.08 + i * 0.07} className="ora-card ora-card-glow" style={{ padding: '15px 16px' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', marginBottom: 9,
                      color: '#0B0D16', background: 'linear-gradient(135deg, #F0C262, #A99BFF)',
                    }}>{x.icon}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--tx1)', marginBottom: 5, lineHeight: 1.3 }}>{x.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.55 }}>{x.d}</div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* direita: chat */}
            <Reveal delay={0.15}>
              <ScaledFrame designWidth={430} minScale={0.86}>
                <ChatMock />
              </ScaledFrame>
            </Reveal>
          </div>
        </RunWhenVisible>

        {/* domínios de conhecimento */}
        <Reveal delay={0.1}>
          <div style={{ textAlign: 'center', marginTop: 'clamp(44px, 6vh, 64px)' }}>
            <div style={{
              fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 700,
              color: 'var(--tx3)', marginBottom: 18,
            }}>
              Tudo que ele domina sobre <span style={{ color: 'var(--gold)' }}>vender na Amazon</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 860, margin: '0 auto' }}>
              {DOMAINS.map((d) => (
                <span key={d.l} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontSize: 13, fontWeight: 600, color: 'var(--tx1)',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(169,155,255,0.28)',
                  borderRadius: 999, padding: '10px 16px',
                }}>
                  <span style={{ color: 'var(--gold)', display: 'inline-flex' }}>{d.icon}</span>
                  {d.l}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* contraste genérico vs agente */}
        <Reveal delay={0.15}>
          <div className="ora-agente-vs" style={{
            display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)',
            gap: 16, alignItems: 'stretch', maxWidth: 860,
            margin: 'clamp(36px, 5vh, 52px) auto 0',
          }}>
            <div style={{
              borderRadius: 16, padding: '18px 20px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: 'var(--tx3)', marginBottom: 8 }}>IA GENÉRICA</div>
              <div style={{ fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.6, fontStyle: 'italic' }}>
                “Considere analisar seus custos e otimizar suas campanhas de anúncios…”
              </div>
            </div>
            <div style={{ display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, color: 'var(--tx3)' }}>VS</div>
            <div style={{
              borderRadius: 16, padding: '18px 20px',
              background: 'linear-gradient(135deg, rgba(240,194,98,0.07), rgba(169,155,255,0.08))',
              border: '1px solid rgba(240,194,98,0.35)',
              boxShadow: '0 0 50px -20px rgba(169,155,255,.4)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: 'var(--gold)', marginBottom: 8 }}>AGENTE NEO</div>
              <div style={{ fontSize: 13.5, color: 'var(--tx1)', lineHeight: 1.6 }}>
                “Sua margem caiu por causa da tarifa FBA da Garrafa 1L. Sobe o preço pra
                <span className="ora-num" style={{ color: 'var(--emerald)', fontWeight: 700 }}> R$ 84,90</span> e repõe
                <span className="ora-num" style={{ color: 'var(--emerald)', fontWeight: 700 }}> 150 un</span> essa semana.”
              </div>
            </div>
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal delay={0.2}>
          <div style={{ textAlign: 'center', marginTop: 'clamp(36px, 5vh, 52px)' }}>
            <a href="#planos" className="ora-cta" style={{ fontSize: '1.05rem', padding: '1.05rem 2.2rem' }}>
              <Sparkles size={17} /> Quero esse cérebro na minha operação →
            </a>
            <div style={{ fontSize: 12.5, color: 'var(--tx3)', marginTop: 16 }}>
              Incluído em todos os planos — sem custo extra.
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
