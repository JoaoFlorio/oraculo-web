'use client'

/**
 * Inteligência — "Inteligência na página. Estratégia na ação."
 * (imagem de ref. 5): página Amazon + extensão + calculadora + Agente IA.
 * Acento violeta nesta dobra.
 */

import { Bot, Send, Gauge, CircleDollarSign, ShoppingCart, PieChart, Eye, Cpu, Shield } from 'lucide-react'
import Reveal from './Reveal'
import { SectionHead, MiniFeature } from './Section'
import { RunWhenVisible, ScaledFrame } from './ui'
import { Bottle } from './marks'

const T = {
  card: 'rgba(255,255,255,0.028)', line: 'rgba(255,255,255,0.065)',
  t1: '#EDEEF7', t2: '#9AA6C0', t3: '#5C6680',
  gold: '#F0C262', green: '#3FD79B', red: '#FF8A8A', violet: '#A99BFF',
}

/* ── página Amazon + extensão (desenhado a 660px) ─────────────────────── */
function AmazonMock() {
  return (
    <div style={{
      width: 660, borderRadius: 14, overflow: 'hidden', position: 'relative',
      background: '#101218', border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 40px 110px -30px rgba(0,0,0,.9), 0 0 70px -30px rgba(169,155,255,.3)',
      fontFamily: 'var(--font-body), system-ui, sans-serif', textAlign: 'left',
    }}>
      {/* chrome da janela */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderBottom: `1px solid ${T.line}` }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.85 }} />
        ))}
        <div style={{
          flex: 1, marginLeft: 10, display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.line}`,
          borderRadius: 7, padding: '4px 10px', fontSize: 9, color: T.t2,
        }}>
          <span style={{ color: '#FF9900', fontWeight: 800 }}>amazon</span>.com.br/garrafinha-squeeze-1l
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* página do produto */}
        <div style={{ flex: 1, padding: 14, borderRight: `1px solid ${T.line}` }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 96, height: 118, borderRadius: 10, display: 'grid', placeItems: 'center', flexShrink: 0,
              background: 'linear-gradient(160deg, rgba(67,224,208,0.15), rgba(30,143,132,0.07))',
              border: '1px solid rgba(67,224,208,0.25)',
            }}>
              <Bottle h={92} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, lineHeight: 1.35 }}>
                Garrafa de Água Squeeze 1L — Livre de BPA, Resistente, para Academia e Esportes
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                <span style={{ color: '#FFA41C', fontSize: 10, letterSpacing: 1 }}>★★★★★</span>
                <span className="ora-num" style={{ fontSize: 9, color: T.t3 }}>4,8 · 3.127 avaliações</span>
              </div>
              <div className="ora-num" style={{ fontSize: 20, fontWeight: 800, color: T.t1, marginTop: 8 }}>
                R$ 75<span style={{ fontSize: 11 }}>,90</span>
              </div>
              <div style={{ fontSize: 9, color: '#5E9BE0', fontWeight: 700, marginTop: 3 }}>✓prime <span style={{ color: T.t2, fontWeight: 500 }}>Entrega GRÁTIS amanhã</span></div>
              <div style={{ fontSize: 9.5, color: T.green, fontWeight: 700, marginTop: 3 }}>Em estoque</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 9, maxWidth: 150 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#161006', background: '#FFD814', borderRadius: 999, padding: '5px 0' }}>Adicionar ao carrinho</span>
                <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#161006', background: '#FFA41C', borderRadius: 999, padding: '5px 0' }}>Comprar agora</span>
              </div>
            </div>
          </div>
          {/* linhas fantasma */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[92, 78, 84, 60].map((w, i) => (
              <div key={i} style={{ width: `${w}%`, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        </div>

        {/* extensão por cima */}
        <div style={{ width: 218, flexShrink: 0, background: '#0B0D16', padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <svg width="13" height="13" viewBox="0 0 48 48" fill="none" aria-hidden>
              <ellipse cx="24" cy="24" rx="21" ry="11.5" stroke="#F0C262" strokeWidth="3" />
              <circle cx="24" cy="24" r="7" fill="#F0C262" />
            </svg>
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em', color: T.gold }}>ORÁCULO</span>
            <span style={{
              marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
              background: T.green, boxShadow: `0 0 8px ${T.green}`,
            }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { l: 'BSR', v: '#1.305', s: 'em Casa', c: T.t1 },
              { l: 'ROI (Ads)', v: '64,4%', s: '▲ subindo', c: T.green },
              { l: 'Concorrência', v: 'Média', s: '12 sellers', c: T.gold },
              { l: 'SEO Score', v: '88/100', s: 'muito bom', c: T.violet },
              { l: 'Lucro líquido', v: 'R$ 41,40', s: 'por unidade', c: T.green },
              { l: 'Est. vendas', v: '~75/mês', s: 'unidades', c: T.t1 },
            ].map((k) => (
              <div key={k.l} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 8, padding: '7px 8px' }}>
                <div style={{ fontSize: 7.5, color: T.t3, marginBottom: 3 }}>{k.l}</div>
                <div className="ora-num" style={{ fontSize: 11.5, fontWeight: 800, color: k.c }}>{k.v}</div>
                <div style={{ fontSize: 7, color: T.t3, marginTop: 2 }}>{k.s}</div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 10, fontSize: 10, fontWeight: 800, textAlign: 'center', color: '#161006',
            background: 'linear-gradient(135deg,#FFE7A6,#E0AC3C)', borderRadius: 8, padding: '7px 0',
            boxShadow: '0 8px 22px -10px rgba(240,194,98,.6)',
          }}>Ver análise completa →</div>
        </div>
      </div>
    </div>
  )
}

/* ── calculadora de precisão (380px) ──────────────────────────────────── */
function CalcMock() {
  return (
    <div style={{
      width: 380, borderRadius: 14, background: '#0C0E17',
      border: '1px solid rgba(169,155,255,0.3)',
      boxShadow: '0 30px 90px -30px rgba(0,0,0,.9), 0 0 60px -30px rgba(169,155,255,.4)',
      fontFamily: 'var(--font-body), system-ui, sans-serif', textAlign: 'left', padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
        <span style={{
          width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center',
          background: 'rgba(169,155,255,0.14)', border: '1px solid rgba(169,155,255,0.35)', color: T.violet,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
          </svg>
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: T.t1 }}>Calculadora de Precisão</span>
        <span style={{
          marginLeft: 'auto', fontSize: 7.5, fontWeight: 700, letterSpacing: '.06em', color: T.green,
          border: `1px solid ${T.green}55`, borderRadius: 5, padding: '2px 6px',
        }}>TABELA OFICIAL</span>
      </div>
      {[
        ['Preço de venda (R$)', '75,90', true], ['Taxa Amazon (R$)', '14,53', false],
        ['Taxa FBA (R$)', '12,90', false], ['Custo do produto (R$)', '21,60', true],
      ].map(([l, v, editable]) => (
        <div key={l as string} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: `1px solid ${editable ? 'rgba(240,194,98,0.35)' : T.line}`,
          borderRadius: 8, padding: '7px 11px', marginBottom: 6,
        }}>
          <span style={{ fontSize: 10, color: T.t2 }}>{l}</span>
          <span className="ora-num" style={{ fontSize: 12, fontWeight: 800, color: editable ? T.gold : T.t1 }}>{v}</span>
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
        {[
          { l: 'LUCRO LÍQUIDO (R$)', v: '41,40', c: T.green, big: true },
          { l: 'MARGEM LÍQUIDA', v: '54,5%', c: T.t1 },
          { l: 'ROI SOBRE CUSTO', v: '64,4%', c: T.violet },
          { l: 'PAYBACK DO LOTE', v: '2,7 meses', c: T.t1 },
        ].map((k) => (
          <div key={k.l} style={{
            background: k.big ? 'rgba(63,215,155,0.08)' : T.card,
            border: `1px solid ${k.big ? 'rgba(63,215,155,0.35)' : T.line}`,
            borderRadius: 9, padding: '8px 10px',
          }}>
            <div style={{ fontSize: 6.5, letterSpacing: '.08em', color: T.t3, marginBottom: 3 }}>{k.l}</div>
            <div className="ora-num" style={{ fontSize: 15, fontWeight: 800, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 10, fontSize: 10, fontWeight: 700, textAlign: 'center', color: T.violet,
        border: `1px solid rgba(169,155,255,0.4)`, borderRadius: 8, padding: '7px 0',
      }}>Simular outro preço ⟳</div>
    </div>
  )
}

/* ── agente IA (380px) ────────────────────────────────────────────────── */
function AgentMock() {
  return (
    <div style={{
      width: 380, borderRadius: 14, background: '#0C0E17',
      border: '1px solid rgba(169,155,255,0.3)',
      boxShadow: '0 30px 90px -30px rgba(0,0,0,.9), 0 0 60px -30px rgba(169,155,255,.4)',
      fontFamily: 'var(--font-body), system-ui, sans-serif', textAlign: 'left', padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center',
          background: 'linear-gradient(135deg, rgba(169,155,255,0.22), rgba(94,155,224,0.12))',
          border: '1px solid rgba(169,155,255,0.4)', color: T.violet,
        }}><Bot size={17} /></span>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: T.t1 }}>Agente IA</div>
          <div style={{ fontSize: 9, color: T.t3 }}>Seu copiloto inteligente para anúncios e estratégia.</div>
        </div>
      </div>
      {/* prompt */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, border: `1px solid rgba(169,155,255,0.35)`,
        borderRadius: 9, padding: '8px 11px', marginBottom: 10,
      }}>
        <span style={{ fontSize: 10, color: T.t2, flex: 1 }}>Crie um anúncio completo para garrafa de água squeeze 1L…</span>
        <Send size={12} color={T.violet} />
      </div>
      {/* resposta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 9, padding: '8px 11px' }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.08em', color: T.violet, marginBottom: 4 }}>▣ TÍTULO SEO</div>
          <div style={{ fontSize: 10, color: T.t1, lineHeight: 1.45 }}>
            Garrafa de Água Squeeze 1L — Resistente, BPA Free, Ideal para Academia e Esportes
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 9, padding: '8px 11px' }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.08em', color: T.violet, marginBottom: 4 }}>≡ BULLETS</div>
          {[
            'Capacidade 1 Litro — hidratação ideal o dia todo.',
            'Material BPA Free — seguro, durável e livre de toxinas.',
            'Vedação à prova de vazamentos.',
          ].map((b) => (
            <div key={b} style={{ fontSize: 9.5, color: T.t2, lineHeight: 1.5 }}>• {b}</div>
          ))}
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 9, padding: '8px 11px' }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.08em', color: T.violet, marginBottom: 4 }}>◎ ESTRATÉGIA DE VENDAS</div>
          <div style={{ fontSize: 9.5, color: T.t2, lineHeight: 1.5 }}>
            Foco em atletas e praticantes de atividades físicas que buscam performance.
            Usar prova social, benefícios e estilo de vida ativo.
          </div>
        </div>
      </div>
      {/* chips */}
      <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
        {['Título', 'Bullets', 'Descrição', 'Palavras-chave', 'Estratégia'].map((c) => (
          <span key={c} style={{
            fontSize: 8.5, fontWeight: 700, color: T.t2, border: `1px solid ${T.line}`,
            borderRadius: 6, padding: '3px 8px',
          }}>{c}</span>
        ))}
      </div>
    </div>
  )
}

export default function Inteligencia() {
  return (
    <section id="inteligencia" className="ora-violet-scope" style={{ position: 'relative', background: 'var(--ink)' }}>
      <div className="ora-divider" style={{ background: 'linear-gradient(90deg,transparent,rgba(169,155,255,.3),transparent)' }} />
      <div className="ora-section" style={{ maxWidth: 1280 }}>
        <SectionHead
          eyebrow="Extensão + Calculadora + Agente IA"
          title={<>Inteligência na página.<br /><span className="ora-goldtext">Estratégia na ação.</span></>}
          lead="Enquanto você navega na Amazon, o Oráculo mostra o que vale a pena. E a IA transforma análise em anúncio e decisão."
        />

        <RunWhenVisible amount={0.12}>
          <div className="ora-intel-grid" style={{
            display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
            gap: 20, alignItems: 'start', marginTop: 'clamp(44px, 7vh, 70px)',
          }}>
            <Reveal delay={0.08}>
              <ScaledFrame designWidth={660} minScale={0.8}>
                <AmazonMock />
              </ScaledFrame>
            </Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Reveal delay={0.18}>
                <ScaledFrame designWidth={380} minScale={0.88}>
                  <CalcMock />
                </ScaledFrame>
              </Reveal>
              <Reveal delay={0.28}>
                <ScaledFrame designWidth={380} minScale={0.88}>
                  <AgentMock />
                </ScaledFrame>
              </Reveal>
            </div>
          </div>
        </RunWhenVisible>

        {/* mini features */}
        <div className="ora-mini4" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
          marginTop: 'clamp(40px, 6vh, 60px)',
        }}>
          <MiniFeature icon={<Gauge size={20} />} title="SEO real" accent="var(--violet)" delay={0}
            desc="Score calculado do anúncio real: título, bullets, imagens e palavras-chave." />
          <MiniFeature icon={<CircleDollarSign size={20} />} title="Payback do lote" accent="var(--violet)" delay={0.08}
            desc="Veja em quanto tempo seu investimento retorna de verdade, venda a venda." />
          <MiniFeature icon={<ShoppingCart size={20} />} title="Anúncio pronto" accent="var(--violet)" delay={0.16}
            desc="A IA cria títulos, bullets e estratégia que vendem mais e convertem melhor." />
          <MiniFeature icon={<PieChart size={20} />} title="Análise rival" accent="var(--violet)" delay={0.24}
            desc="Descubra brechas, fraquezas e oportunidades dos seus concorrentes." />
        </div>

        <Reveal delay={0.1}>
          <div style={{ textAlign: 'center', marginTop: 'clamp(36px, 5vh, 52px)' }}>
            <a href="#planos" className="ora-cta" style={{ fontSize: '1.05rem', padding: '1.05rem 2.2rem' }}>
              Explorar recursos →
            </a>
            <div style={{
              display: 'flex', gap: '8px 26px', flexWrap: 'wrap', justifyContent: 'center',
              marginTop: 22, color: 'var(--tx3)', fontSize: 12.5,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Shield size={14} color="var(--violet)" /> Extensão Chrome segura e leve</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Eye size={14} color="var(--violet)" /> Seus dados protegidos</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Cpu size={14} color="var(--violet)" /> Atualizações constantes</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
