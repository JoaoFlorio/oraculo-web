'use client'

/**
 * Mineração — "Garimpe produtos vencedores antes da concorrência."
 * (imagem de ref. 4): painel de mineração + modal Ver Análise + Análise Rival.
 * Produtos desenhados em SVG (nada de foto).
 */

import { Flame, Users, Target, BarChart3, Brain, CircleDollarSign } from 'lucide-react'
import Reveal from './Reveal'
import { SectionHead, MiniFeature } from './Section'
import { RunWhenVisible, Float, IntUp, PctUp, Trend, Spark, Donut, Bars, ScaledFrame } from './ui'
import { Bottle } from './marks'

const T = {
  card: 'rgba(255,255,255,0.028)',
  line: 'rgba(255,255,255,0.065)',
  t1: '#EDEEF7', t2: '#9AA6C0', t3: '#5C6680',
  gold: '#F0C262', green: '#3FD79B', red: '#FF8A8A', violet: '#A99BFF',
}

/* ── produtos SVG (miniaturas geométricas) ────────────────────────────── */
function Art({ kind, h = 44 }: { kind: string; h?: number }) {
  const common = { height: h, display: 'block' as const }
  switch (kind) {
    case 'bottle': return <Bottle h={h} />
    case 'pump': return (
      <svg width={h * 0.44} height={h} viewBox="0 0 44 100" fill="none" style={common} aria-hidden>
        <rect x="14" y="14" width="6" height="10" fill="#D98CA6" />
        <path d="M12 6h18v8H20v4h-8z" fill="#C97490" />
        <path d="M8 24h28a6 6 0 0 1 6 6v60a10 10 0 0 1-10 10H12A10 10 0 0 1 2 90V30a6 6 0 0 1 6-6z" fill="url(#pmp)" />
        <rect x="8" y="46" width="28" height="22" rx="4" fill="rgba(255,255,255,0.3)" />
        <defs><linearGradient id="pmp" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F4AFC6" /><stop offset="100%" stopColor="#D77E9F" /></linearGradient></defs>
      </svg>)
    case 'utensils': return (
      <svg width={h * 0.7} height={h} viewBox="0 0 70 100" fill="none" style={common} aria-hidden>
        <rect x="4" y="34" width="62" height="60" rx="8" fill="#8A6A46" />
        <rect x="10" y="40" width="50" height="48" rx="5" fill="#6E5335" />
        <rect x="16" y="6" width="7" height="46" rx="3.5" fill="#D9B98C" />
        <rect x="30" y="2" width="7" height="50" rx="3.5" fill="#E8CBA0" />
        <rect x="44" y="8" width="7" height="44" rx="3.5" fill="#D9B98C" />
      </svg>)
    case 'toy': return (
      <svg width={h} height={h} viewBox="0 0 100 100" fill="none" style={common} aria-hidden>
        <circle cx="50" cy="54" r="34" fill="url(#toy)" />
        <circle cx="50" cy="54" r="16" fill="#FF7B5A" />
        <circle cx="50" cy="54" r="7" fill="#FFD8CC" />
        <path d="M50 20a34 34 0 0 1 24 10l-10 10a20 20 0 0 0-28 0l-10-10a34 34 0 0 1 24-10z" fill="#FFB169" />
        <defs><linearGradient id="toy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF9A62" /><stop offset="100%" stopColor="#E05A3A" /></linearGradient></defs>
      </svg>)
    case 'sun': return (
      <svg width={h * 0.5} height={h} viewBox="0 0 50 100" fill="none" style={common} aria-hidden>
        <rect x="15" y="4" width="20" height="12" rx="3" fill="#E8A23C" />
        <rect x="6" y="18" width="38" height="76" rx="9" fill="url(#sn)" />
        <rect x="12" y="36" width="26" height="30" rx="4" fill="rgba(255,255,255,0.55)" />
        <circle cx="25" cy="51" r="8" fill="#F5C518" />
        <defs><linearGradient id="sn" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFDD75" /><stop offset="100%" stopColor="#EFB43B" /></linearGradient></defs>
      </svg>)
    case 'plush': return (
      <svg width={h} height={h} viewBox="0 0 100 100" fill="none" style={common} aria-hidden>
        <circle cx="30" cy="26" r="14" fill="#9FD4C6" />
        <circle cx="70" cy="26" r="14" fill="#9FD4C6" />
        <circle cx="50" cy="58" r="32" fill="url(#pl)" />
        <circle cx="40" cy="52" r="4.5" fill="#2A4A42" />
        <circle cx="60" cy="52" r="4.5" fill="#2A4A42" />
        <ellipse cx="50" cy="66" rx="8" ry="5.5" fill="#E9FBF5" />
        <defs><linearGradient id="pl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BFEADF" /><stop offset="100%" stopColor="#84C6B4" /></linearGradient></defs>
      </svg>)
    case 'bed': return (
      <svg width={h * 1.15} height={h} viewBox="0 0 115 100" fill="none" style={common} aria-hidden>
        <ellipse cx="57" cy="62" rx="54" ry="34" fill="#8C6B4F" />
        <ellipse cx="57" cy="58" rx="44" ry="26" fill="#B5906C" />
        <ellipse cx="57" cy="60" rx="34" ry="18" fill="#E8D4B8" />
      </svg>)
    default: return (
      <svg width={h * 0.8} height={h} viewBox="0 0 80 100" fill="none" style={common} aria-hidden>
        <rect x="6" y="22" width="68" height="72" rx="8" fill="url(#pt)" />
        <rect x="6" y="10" width="68" height="14" rx="5" fill="#4E9ED9" />
        <rect x="16" y="40" width="48" height="38" rx="4" fill="rgba(255,255,255,0.4)" />
        <defs><linearGradient id="pt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BFE0F7" /><stop offset="100%" stopColor="#7FB8E0" /></linearGradient></defs>
      </svg>)
  }
}

const PRODUCTS = [
  { rank: 1, art: 'bottle', name: 'Garrafinha de Água Squeeze 1L', est: 75, bsr: '1.305', hot: true },
  { rank: 2, art: 'pump', name: 'Hidratante Corporal 500ml', est: 780, bsr: '98' },
  { rank: 3, art: 'utensils', name: 'Kit Utensílios de Silicone 10 Pçs', est: 270, bsr: '272' },
  { rank: 4, art: 'toy', name: 'Brinquedo Pet Bola Interativa', est: 110, bsr: '764' },
  { rank: 5, art: 'sun', name: 'Protetor Solar FPS 50 120ml', est: 130, bsr: '842' },
  { rank: 6, art: 'plush', name: 'Brinquedo Educativo Sensorial', est: 150, bsr: '379' },
  { rank: 7, art: 'bed', name: 'Cama Pet Conforto Premium', est: 65, bsr: '1.247' },
  { rank: 8, art: 'pots', name: 'Kit Potes Herméticos 10 Peças', est: 210, bsr: '653' },
]

function ScoreChip({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 62, background: T.card, border: `1px solid ${T.line}`, borderRadius: 8, padding: '7px 8px',
    }}>
      <div style={{ fontSize: 8, color: T.t3, marginBottom: 3 }}>{label}</div>
      <div className="ora-num" style={{ fontSize: 12, fontWeight: 800, color }}>{value}<span style={{ fontSize: 8, color: T.t3, fontWeight: 500 }}>/{max}</span></div>
      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)', marginTop: 4 }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', borderRadius: 2, background: color }} />
      </div>
    </div>
  )
}

/* ── painel de mineração (desenhado a 620px) ──────────────────────────── */
function MiningPanel() {
  return (
    <div style={{
      width: 620, borderRadius: 14, overflow: 'hidden',
      background: '#0A0C14', border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: '0 40px 110px -30px rgba(0,0,0,.9), 0 0 70px -30px rgba(240,194,98,.25)',
      fontFamily: 'var(--font-body), system-ui, sans-serif', textAlign: 'left',
    }}>
      {/* header + tabs */}
      <div style={{ padding: '12px 14px 0', borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <svg width="15" height="15" viewBox="0 0 48 48" fill="none" aria-hidden>
            <ellipse cx="24" cy="24" rx="21" ry="11.5" stroke="#F0C262" strokeWidth="3" />
            <circle cx="24" cy="24" r="7" fill="#F0C262" />
          </svg>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.14em', color: T.gold }}>ORÁCULO</span>
          <span style={{ marginLeft: 'auto', fontSize: 9, color: T.t3, border: `1px solid ${T.line}`, borderRadius: 6, padding: '3px 8px' }}>Todas as categorias ▾</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['🔥 Mais Vendidos', 'Recém-Adicionados', 'Em Alta', 'Genéricos', 'Análise Rival'].map((t, i) => (
            <span key={t} style={{
              fontSize: 9, fontWeight: i === 0 ? 800 : 600, padding: '6px 9px',
              borderRadius: '8px 8px 0 0', whiteSpace: 'nowrap',
              color: i === 0 ? '#161006' : T.t2,
              background: i === 0 ? 'linear-gradient(135deg,#FFE7A6,#E0AC3C)' : 'transparent',
            }}>{t}</span>
          ))}
        </div>
      </div>
      {/* grid de produtos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 12 }}>
        {PRODUCTS.map((p) => (
          <div key={p.rank} style={{
            background: T.card, border: `1px solid ${p.hot ? 'rgba(240,194,98,0.4)' : T.line}`,
            borderRadius: 10, padding: '9px 9px 10px', position: 'relative',
            boxShadow: p.hot ? '0 0 24px -10px rgba(240,194,98,.55)' : 'none',
          }}>
            <span className="ora-num" style={{
              position: 'absolute', top: 6, left: 7, fontSize: 8, fontWeight: 800,
              color: p.hot ? '#161006' : T.t2,
              background: p.hot ? 'linear-gradient(135deg,#FFE7A6,#E0AC3C)' : 'rgba(255,255,255,0.06)',
              borderRadius: 4, padding: '1.5px 5px',
            }}>#{p.rank}</span>
            <div style={{ height: 52, display: 'grid', placeItems: 'center', marginTop: 8 }}>
              <Art kind={p.art} h={46} />
            </div>
            <div style={{
              fontSize: 9, fontWeight: 700, color: T.t1, lineHeight: 1.3, marginTop: 6,
              height: 24, overflow: 'hidden',
            }}>{p.name}</div>
            <div className="ora-num" style={{ fontSize: 10, fontWeight: 800, color: T.green, marginTop: 5 }}>
              ~{p.est} <span style={{ fontSize: 7.5, fontWeight: 500, color: T.t3 }}>est./mês</span>
            </div>
            <div className="ora-num" style={{ fontSize: 8, color: T.t3, marginTop: 2 }}>BSR #{p.bsr}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── modal "Ver análise" (desenhado a 380px) ──────────────────────────── */
function AnalysisModal() {
  return (
    <div style={{
      width: 380, borderRadius: 14, overflow: 'hidden',
      background: '#0C0E17', border: '1px solid rgba(240,194,98,0.3)',
      boxShadow: '0 40px 110px -30px rgba(0,0,0,.95), 0 0 80px -30px rgba(240,194,98,.4)',
      fontFamily: 'var(--font-body), system-ui, sans-serif', textAlign: 'left', padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: T.t1 }}>Ver análise</span>
        <span style={{ fontSize: 11, color: T.t3 }}>✕</span>
      </div>
      {/* produto */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <div style={{
          width: 44, height: 52, borderRadius: 9, display: 'grid', placeItems: 'center', flexShrink: 0,
          background: 'linear-gradient(160deg, rgba(67,224,208,0.14), rgba(30,143,132,0.08))',
          border: '1px solid rgba(67,224,208,0.25)',
        }}>
          <Bottle h={40} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.t1, lineHeight: 1.3 }}>
            Garrafinha de Água Squeeze 1L<br />Resistente Ecológico Academia
          </div>
          <div className="ora-num" style={{ fontSize: 8.5, color: T.t3, marginTop: 2 }}>BSR #1.305</div>
        </div>
      </div>
      {/* stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        {[
          { l: 'BSR AMAZON', v: '#1.305', c: T.t1 },
          { l: 'VENDAS EST.', v: '~75/mês', c: T.t1 },
          { l: 'DEMANDA', v: 'Alta', c: T.green },
          { l: 'SCORE', v: '49/100', c: T.red },
        ].map((s) => (
          <div key={s.l} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 8, padding: '7px 6px', textAlign: 'center' }}>
            <div className="ora-num" style={{ fontSize: 11, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 6.5, letterSpacing: '.06em', color: T.t3, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>
      {/* score breakdown */}
      <div style={{ fontSize: 8, letterSpacing: '.1em', color: T.t3, margin: '0 0 6px' }}>SCORE DO ANÚNCIO — CRITÉRIOS REAIS</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <ScoreChip label="Demanda" value={24} max={30} color={T.green} />
        <ScoreChip label="Imagens" value={15} max={20} color={T.gold} />
        <ScoreChip label="Bullets" value={3} max={20} color={T.red} />
        <ScoreChip label="Título" value={6} max={15} color={T.red} />
        <ScoreChip label="Marca" value={0} max={15} color={T.red} />
      </div>
      {/* simulador */}
      <div style={{
        background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10,
      }}>
        <div style={{ fontSize: 8, letterSpacing: '.1em', color: T.t3, marginBottom: 7 }}>SIMULADOR DE LUCRATIVIDADE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          <div style={{ border: `1px solid rgba(240,194,98,0.35)`, borderRadius: 7, padding: '6px 9px' }}>
            <div style={{ fontSize: 7, color: T.t3 }}>PREÇO DE VENDA</div>
            <div className="ora-num" style={{ fontSize: 12, fontWeight: 800, color: T.gold }}>R$ 24,90</div>
          </div>
          <div style={{ border: `1px solid ${T.line}`, borderRadius: 7, padding: '6px 9px' }}>
            <div style={{ fontSize: 7, color: T.t3 }}>CUSTO DO PRODUTO</div>
            <div className="ora-num" style={{ fontSize: 12, fontWeight: 800, color: T.t1 }}>R$ 7,20</div>
          </div>
        </div>
        {[
          ['Taxa Amazon (15%)', '− R$ 3,74'], ['Taxa FBA', '− R$ 3,74'], ['Custo do produto', '− R$ 7,20'], ['Outros custos', '− R$ 1,62'],
        ].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 9, color: T.t2 }}>{l}</span>
            <span className="ora-num" style={{ fontSize: 9, fontWeight: 700, color: T.red }}>{v}</span>
          </div>
        ))}
      </div>
      {/* resultado */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 1fr', gap: 6,
        background: 'rgba(63,215,155,0.07)', border: '1px solid rgba(63,215,155,0.3)',
        borderRadius: 10, padding: '9px 12px',
      }}>
        <div>
          <div style={{ fontSize: 7, color: T.t3 }}>LUCRO EST. POR UNIDADE</div>
          <div className="ora-num" style={{ fontSize: 15, fontWeight: 800, color: T.green }}>R$ 8,60</div>
        </div>
        <div>
          <div style={{ fontSize: 7, color: T.t3 }}>MARGEM</div>
          <div className="ora-num" style={{ fontSize: 15, fontWeight: 800, color: T.t1 }}>34,5%</div>
        </div>
        <div>
          <div style={{ fontSize: 7, color: T.t3 }}>LUCRO MENSAL EST.</div>
          <div className="ora-num" style={{ fontSize: 15, fontWeight: 800, color: T.t1 }}>R$ 645</div>
        </div>
      </div>
    </div>
  )
}

/* ── análise rival ────────────────────────────────────────────────────── */
function ScoreRing({ score, size = 56, color }: { score: number; size?: number; color: string }) {
  return (
    <Donut size={size} thickness={5.5} segments={[
      { value: score, color }, { value: 100 - score, color: 'rgba(255,255,255,0.08)' },
    ]}>
      <span className="ora-num" style={{ fontSize: size * 0.26, fontWeight: 800, color: 'var(--tx1)' }}>{score}</span>
    </Donut>
  )
}

const RIVALS = [
  { name: 'Seu Produto', score: 49, color: '#F0C262', price: 'R$ 24,90', img: '8 imagens', bullets: '2 bullets', note: 'Ótimo potencial com pequenas melhorias no anúncio e SEO.', noteColor: '#A99BFF', you: true },
  { name: 'Concorrente 1', score: 72, color: '#3FD79B', price: 'R$ 27,90', img: '10 imagens', bullets: '5 bullets', note: 'Anúncio muito bem estruturado e com alta conversão.', noteColor: '#3FD79B' },
  { name: 'Concorrente 2', score: 55, color: '#F0C262', price: 'R$ 22,90', img: '6 imagens', bullets: '3 bullets', note: 'Preço competitivo, mas anúncio fraco e pouca conversão.', noteColor: '#F0C262' },
  { name: 'Concorrente 3', score: 36, color: '#FF8A8A', price: 'R$ 19,90', img: '4 imagens', bullets: '2 bullets', note: 'Baixo investimento no anúncio e SEO muito fraco.', noteColor: '#FF8A8A' },
]

export default function Mineracao() {
  return (
    <section id="mineracao" style={{ position: 'relative', background: 'var(--ink2)' }}>
      <div className="ora-divider" />
      <div className="ora-section" style={{ maxWidth: 1280 }}>
        <SectionHead
          eyebrow="Mineração de produtos"
          title={<>Garimpe produtos <span className="ora-goldtext">vencedores</span><br />antes da concorrência.</>}
          lead="Enquanto outros chutam o que vender, o Oráculo revela demanda, score do anúncio, estimativa de vendas e lucro antes da compra."
        />

        {/* stats + painel + modal */}
        <RunWhenVisible amount={0.12}>
          <div className="ora-mine-grid" style={{
            display: 'grid', gridTemplateColumns: '170px minmax(0, 1.55fr) minmax(0, 1fr)',
            gap: 18, alignItems: 'start', marginTop: 'clamp(44px, 7vh, 70px)',
          }}>
            {/* stats à esquerda */}
            <div className="ora-mine-stats" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Float delay={0.2} amp={6}>
                <div className="ora-glass" style={{ borderRadius: 14, padding: '13px 15px' }}>
                  <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 4 }}>Em Alta</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--emerald)' }}>+<PctUp value={24.8} /></div>
                  <div style={{ margin: '7px 0 4px' }}><Spark data={[8, 12, 10, 16, 14, 20, 18, 25, 30]} w={118} h={26} /></div>
                  <Trend value="vs 30 dias anteriores" label="" />
                </div>
              </Float>
              <Float delay={0.8} amp={6}>
                <div className="ora-glass" style={{ borderRadius: 14, padding: '13px 15px' }}>
                  <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 4 }}>Recém-adicionados</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tx1)' }}>+<IntUp value={1326} /></div>
                  <div style={{ fontSize: 10, color: 'var(--tx3)' }}>produtos hoje</div>
                  <div style={{ marginTop: 7 }}><Bars data={[8, 12, 9, 15, 11, 17, 13, 19, 15, 22]} w={118} h={26} /></div>
                </div>
              </Float>
              <Float delay={1.4} amp={6}>
                <div className="ora-glass" style={{ borderRadius: 14, padding: '13px 15px' }}>
                  <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 6 }}>Genéricos</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--tx1)' }}><IntUp value={38672} /></div>
                      <div style={{ fontSize: 10, color: 'var(--tx3)' }}>oportunidades</div>
                    </div>
                    <Donut size={44} thickness={8} segments={[
                      { value: 62, color: 'var(--gold)' }, { value: 38, color: 'rgba(255,255,255,0.08)' },
                    ]} />
                  </div>
                </div>
              </Float>
            </div>

            {/* painel central */}
            <Reveal delay={0.1}>
              <ScaledFrame designWidth={620} minScale={0.78}>
                <MiningPanel />
              </ScaledFrame>
            </Reveal>

            {/* modal à direita */}
            <Reveal delay={0.22}>
              <ScaledFrame designWidth={380} minScale={0.88}>
                <AnalysisModal />
              </ScaledFrame>
            </Reveal>
          </div>
        </RunWhenVisible>

        {/* Análise Rival */}
        <RunWhenVisible amount={0.15}>
          <div className="ora-rival-grid" style={{
            display: 'grid', gridTemplateColumns: '250px minmax(0, 1fr)',
            gap: 24, alignItems: 'center', marginTop: 'clamp(48px, 7vh, 76px)',
          }}>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold)', marginBottom: 12, fontSize: 13, fontWeight: 700 }}>
                <Users size={15} /> Análise Rival
              </div>
              <h3 className="ora-display" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', fontWeight: 800, lineHeight: 1.12, margin: 0 }}>
                Encontre brechas.<br /><span className="ora-goldtext">Domine o rival.</span>
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.6, marginTop: 14 }}>
                Compare seu produto com os principais concorrentes e descubra as
                oportunidades que eles deixam passar.
              </p>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="ora-glass" style={{ borderRadius: 16, padding: 16 }}>
                <div className="ora-rival-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {RIVALS.map((r) => (
                    <div key={r.name} style={{
                      background: r.you ? 'rgba(240,194,98,0.05)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${r.you ? 'rgba(240,194,98,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 12, padding: '13px 12px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: r.you ? 'var(--gold)' : 'var(--tx1)', marginBottom: 10 }}>{r.name}</div>
                      <div style={{ display: 'grid', placeItems: 'center', marginBottom: 10 }}>
                        <ScoreRing score={r.score} color={r.color} />
                      </div>
                      <div className="ora-num" style={{ fontSize: 12, fontWeight: 800, color: 'var(--tx1)' }}>{r.price}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--tx3)', margin: '4px 0 8px' }}>{r.img} · {r.bullets}</div>
                      <div style={{
                        fontSize: 9, lineHeight: 1.45, color: r.noteColor, textAlign: 'left',
                        border: `1px solid ${r.noteColor}44`, background: `${r.noteColor}0d`,
                        borderRadius: 7, padding: '6px 8px',
                      }}>{r.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </RunWhenVisible>

        {/* mini features */}
        <div className="ora-mini4" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
          marginTop: 'clamp(40px, 6vh, 60px)',
        }}>
          <MiniFeature icon={<Target size={20} />} title="Oportunidades reais" delay={0}
            desc="Encontre produtos com demanda comprovada e baixa concorrência." />
          <MiniFeature icon={<BarChart3 size={20} />} title="Dados confiáveis" delay={0.08}
            desc="Métricas reais da Amazon para decisões com menos risco e mais precisão." />
          <MiniFeature icon={<Brain size={20} />} title="Análise automática" delay={0.16}
            desc="Score do anúncio, nível de demanda, vendas e lucro em segundos." />
          <MiniFeature icon={<CircleDollarSign size={20} />} title="Lucro antes da compra" delay={0.24}
            desc="Simule seu lucro líquido e valide se vale a pena investir." />
        </div>

        <Reveal delay={0.1}>
          <div style={{ textAlign: 'center', marginTop: 'clamp(36px, 5vh, 52px)' }}>
            <a href="#planos" className="ora-cta" style={{ fontSize: '1.05rem', padding: '1.05rem 2.2rem' }}>
              <Flame size={17} /> Explorar oportunidades →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
