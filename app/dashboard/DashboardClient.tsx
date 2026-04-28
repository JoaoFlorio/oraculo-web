'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/* ─── Constants ─────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'electronics',     label: '📱 Eletrônicos' },
  { id: 'computers',       label: '💻 Computadores' },
  { id: 'home',            label: '🏠 Casa e Cozinha' },
  { id: 'sports',          label: '⚽ Esportes' },
  { id: 'beauty',          label: '💄 Beleza' },
  { id: 'toys',            label: '🧸 Brinquedos' },
  { id: 'tools',           label: '🔧 Ferramentas' },
  { id: 'pet-supplies',    label: '🐾 Pet Shop' },
  { id: 'health',          label: '💊 Saúde' },
  { id: 'office-products', label: '📦 Escritório' },
]

const NAV = [
  { id: 'bestsellers', icon: '🏆', label: 'Mais Vendidos' },
  { id: 'new',         icon: '🆕', label: 'Recém Adicionados' },
  { id: 'trending',    icon: '📈', label: 'Em Alta' },
  { id: 'generics',    icon: '🏷️',  label: 'Genéricos' },
  { id: 'search',      icon: '🔍', label: 'Buscar Produto' },
]

// Amazon referral rate por categoria (%)
const REFERRAL: Record<string, number> = {
  electronics: 0.08, computers: 0.08, health: 0.08,
  home: 0.15, sports: 0.15, beauty: 0.15, 'pet-supplies': 0.15, 'office-products': 0.15,
  tools: 0.12, toys: 0.16,
}

// Preço sugerido por categoria
const DEFAULT_PRICE: Record<string, number> = {
  electronics: 150, computers: 800, home: 80, sports: 120, beauty: 60,
  toys: 70, tools: 90, 'pet-supplies': 50, health: 80, 'office-products': 45,
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function bsrToSales(bsr: number) {
  if (bsr <= 0)       return 0
  if (bsr <= 100)     return 5000
  if (bsr <= 500)     return 2000
  if (bsr <= 1000)    return 1200
  if (bsr <= 3000)    return 600
  if (bsr <= 5000)    return 400
  if (bsr <= 10000)   return 180
  if (bsr <= 30000)   return 80
  if (bsr <= 50000)   return 40
  if (bsr <= 100000)  return 20
  return 8
}

function demandInfo(sales: number) {
  if (sales >= 2000) return { label: 'Muito Alta',  color: '#10B981', score: 95 }
  if (sales >= 800)  return { label: 'Alta',        color: '#10B981', score: 80 }
  if (sales >= 300)  return { label: 'Média',       color: '#F0B429', score: 60 }
  if (sales >= 100)  return { label: 'Baixa',       color: '#F97316', score: 35 }
  return              { label: 'Muito Baixa',        color: '#EF4444', score: 15 }
}

function oppScore(bsr: number, margin: number) {
  const bsrScore = bsr < 500 ? 40 : bsr < 2000 ? 30 : bsr < 10000 ? 20 : bsr < 50000 ? 10 : 5
  const marginScore = margin >= 35 ? 40 : margin >= 25 ? 32 : margin >= 15 ? 22 : margin >= 5 ? 12 : 4
  return Math.min(100, bsrScore + marginScore + 20)
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtInt(n: number) { return Math.round(n).toLocaleString('pt-BR') }

/* ─── Sales estimate badge ───────────────────────────────────────────────── */
function SalesBadge({ sales, bsr }: { sales: number; bsr: number }) {
  if (sales <= 0 || bsr <= 0) return null
  const label  = sales >= 1000 ? `~${(sales / 1000).toFixed(0)}k` : `~${sales}`
  const color  = sales >= 1000 ? '#10B981' : sales >= 300 ? '#F0B429' : '#94A3B8'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${color}12`, border: `1px solid ${color}35`, borderRadius: 6, padding: '4px 10px' }}>
      <span style={{ fontSize: 11 }}>📦</span>
      <span style={{ fontSize: 12, fontWeight: 800, color }}>{label} vendas/mês</span>
      <span style={{ fontSize: 10, color: '#475569', fontWeight: 500 }}>est. BSR #{bsr.toLocaleString('pt-BR')}</span>
    </div>
  )
}

/* ─── Product card ───────────────────────────────────────────────────────── */
function ProductCard({ product, onClick }: { product: any; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const img    = product.images?.[0] || ''
  const bsr    = product.bsr || 0
  const sales  = product.salesEst || bsrToSales(bsr)
  const score  = oppScore(bsr, 25)
  const scoreColor = score >= 70 ? '#10B981' : score >= 50 ? '#F0B429' : '#EF4444'
  const isGeneric = !product.brand || product.brand.toLowerCase().includes('genér') || product.brand.toLowerCase().includes('sem marca')

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#13131F', border: `1px solid ${hov ? 'rgba(240,180,41,0.4)' : 'rgba(30,30,48,0.9)'}`,
        borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? '0 8px 32px rgba(240,180,41,0.12)' : 'none',
        transition: 'all .2s',
      }}
    >
      {/* Image */}
      <div style={{ background: '#0A0A0F', height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        {img
          ? <img src={img} alt={product.title} style={{ maxHeight: 150, maxWidth: '90%', objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <span style={{ fontSize: 48, opacity: .3 }}>📦</span>
        }
        {/* Score badge */}
        <div style={{ position: 'absolute', top: 8, right: 8, background: `${scoreColor}25`, color: scoreColor, border: `1px solid ${scoreColor}50`, borderRadius: 8, padding: '3px 8px', fontSize: 11, fontWeight: 800 }}>
          {score}
        </div>
        {/* Generic badge */}
        {isGeneric && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(99,102,241,0.2)', color: '#A78BFA', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
            GENÉRICO
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px 14px' }}>
        {/* Sales estimate badge */}
        {sales > 0 && bsr > 0 && <div style={{ marginBottom: 10 }}><SalesBadge sales={sales} bsr={bsr} /></div>}

        <p style={{ fontSize: 12, color: '#E2E8F0', fontWeight: 600, lineHeight: 1.45, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
          {product.title}
        </p>

        {/* Brand */}
        {product.brand && (
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>
            Marca: <span style={{ color: '#64748B', fontWeight: 600 }}>{product.brand}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, background: '#0A0A0F', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, marginBottom: 2 }}>BSR</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#E2E8F0' }}>{bsr > 0 ? `#${fmtInt(bsr)}` : '—'}</div>
          </div>
          <div style={{ flex: 1, background: '#0A0A0F', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, marginBottom: 2 }}>VENDAS/MÊS</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#10B981' }}>~{fmtInt(sales)}</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429', fontWeight: 700, fontSize: 11, padding: '8px', borderRadius: 8, letterSpacing: '0.05em' }}>
          🔍 ANALISAR PRODUTO →
        </div>
      </div>
    </div>
  )
}

/* ─── Detail Modal ───────────────────────────────────────────────────────── */
function ProductDetailModal({ product, onClose }: { product: any; onClose: () => void }) {
  const catId   = CATEGORIES.find(c => product.category?.toLowerCase().includes(c.label.split(' ').slice(1).join(' ').toLowerCase()))?.id || 'electronics'
  const defPrice = DEFAULT_PRICE[catId] || 99
  const [price, setPrice]   = useState(defPrice)
  const [cost,  setCost]    = useState(Math.round(defPrice * 0.30))

  const bsr         = product.bsr || 0
  const sales       = product.salesEst || bsrToSales(bsr)
  const demand      = demandInfo(sales)
  const referralPct = REFERRAL[catId] || 0.15
  const referralFee = +(price * referralPct).toFixed(2)
  const fbaFee      = price < 50 ? 12 : price < 150 ? 18 : price < 400 ? 24 : 32
  const totalFees   = referralFee + fbaFee
  const profit      = +(price - totalFees - cost).toFixed(2)
  const margin      = price > 0 ? +((profit / price) * 100).toFixed(1) : 0
  const roi         = cost > 0  ? +((profit / cost) * 100).toFixed(1)  : 0
  const score       = oppScore(bsr, margin)
  const scoreColor  = score >= 70 ? '#10B981' : score >= 50 ? '#F0B429' : '#EF4444'

  const monthlyRev    = +(sales * price).toFixed(2)
  const monthlyProfit = +(sales * profit).toFixed(2)
  const monthlyPess   = +(sales * 0.3 * profit).toFixed(2)
  const monthlyOtim   = +(sales * 1.0 * profit).toFixed(2)
  const monthlyReal   = +(sales * 0.6 * profit).toFixed(2)

  const verdictText =
    score >= 75 ? { icon: '🚀', label: 'EXCELENTE OPORTUNIDADE', color: '#10B981', desc: 'Alta demanda e boa margem. Produto com forte potencial para FBA.' }
    : score >= 55 ? { icon: '✅', label: 'BOA OPORTUNIDADE',      color: '#10B981', desc: 'Demanda consistente. Vale aprofundar a análise e testar com estoque inicial.' }
    : score >= 38 ? { icon: '⚠️', label: 'POTENCIAL MÉDIO',       color: '#F0B429', desc: 'Demanda razoável, mas concorrência ou margem podem ser desafios.' }
    : { icon: '❌', label: 'BAIXO POTENCIAL', color: '#EF4444', desc: 'BSR alto ou margem negativa. Recomendamos buscar outra opção.' }

  const img = product.images?.[0] || ''

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const Input = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', background: '#0A0A0F', border: '1px solid rgba(240,180,41,0.3)', borderRadius: 10, padding: '0 12px' }}>
        <span style={{ color: '#64748B', fontSize: 13, marginRight: 4 }}>R$</span>
        <input
          type="number" min={0} value={value}
          onChange={e => onChange(+e.target.value || 0)}
          style={{ background: 'none', border: 'none', color: '#F0B429', fontSize: 18, fontWeight: 800, width: '100%', padding: '12px 0', outline: 'none', fontFamily: 'inherit' }}
        />
      </div>
    </div>
  )

  const Row = ({ label, value, highlight, isNeg }: { label: string; value: string; highlight?: boolean; isNeg?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: highlight ? 'rgba(240,180,41,0.06)' : 'transparent', borderBottom: '1px solid rgba(30,30,48,0.6)' }}>
      <span style={{ fontSize: 13, color: highlight ? '#E2E8F0' : '#94A3B8', fontWeight: highlight ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: highlight ? 15 : 13, fontWeight: highlight ? 800 : 600, color: highlight ? (isNeg ? '#EF4444' : '#F0B429') : (isNeg ? '#F97316' : '#94A3B8') }}>{value}</span>
    </div>
  )

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 1000, overflowY: 'auto', padding: '24px 16px' }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#0D0D1A', borderRadius: 20, border: '1px solid rgba(240,180,41,0.2)', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(135deg,#0D0D1A,#13131F)', padding: '20px 28px', borderBottom: '1px solid rgba(30,30,48,0.8)', display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          {/* Image */}
          <div style={{ width: 100, height: 100, background: '#0A0A0F', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {img ? <img src={img} alt="" style={{ maxWidth: 88, maxHeight: 88, objectFit: 'contain' }} /> : <span style={{ fontSize: 36, opacity: .3 }}>📦</span>}
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#E2E8F0', lineHeight: 1.4, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{product.title}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ background: 'rgba(100,116,139,0.15)', color: '#94A3B8', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>ASIN: {product.asin}</span>
              {product.category && <span style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{product.category}</span>}
              {product.brand && <span style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{product.brand}</span>}
            </div>
          </div>
          {/* Close */}
          <button onClick={onClose} style={{ background: 'rgba(100,116,139,0.15)', border: 'none', color: '#94A3B8', fontSize: 18, width: 36, height: 36, borderRadius: 8, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* ── Sales badge ── */}
        {sales > 0 && bsr > 0 && (
          <div style={{ padding: '12px 28px', borderBottom: '1px solid rgba(30,30,48,0.6)', background: 'rgba(30,30,48,0.3)' }}>
            <SalesBadge sales={sales} bsr={bsr} />
          </div>
        )}

        {/* ── KPI row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid rgba(30,30,48,0.8)' }}>
          {[
            { label: 'Vendas/mês', value: `~${fmtInt(sales)}`, sub: 'unidades estimadas', color: demand.color },
            { label: 'BSR Amazon', value: bsr > 0 ? `#${fmtInt(bsr)}` : '—', sub: 'ranking de vendas', color: '#E2E8F0' },
            { label: 'Demanda', value: demand.label, sub: 'nível de mercado', color: demand.color },
            { label: 'Score Oráculo', value: `${score}/100`, sub: 'oportunidade geral', color: scoreColor },
          ].map((k, i) => (
            <div key={i} style={{ padding: '20px 24px', borderRight: i < 3 ? '1px solid rgba(30,30,48,0.8)' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: k.color, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0', marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 10, color: '#475569' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── BSR gauge ── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em' }}>📊 POSIÇÃO NO RANKING AMAZON</span>
              <span style={{ fontSize: 12, color: '#64748B' }}>Quanto menor o BSR, mais vendido é o produto</span>
            </div>
            <div style={{ position: 'relative', height: 10, background: 'rgba(30,30,48,0.8)', borderRadius: 99 }}>
              {/* gradient bar from green to red */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,#10B981,#F0B429,#EF4444)', borderRadius: 99, opacity: .25 }} />
              {/* indicator */}
              {bsr > 0 && (() => {
                const pct = Math.min(100, Math.log10(bsr) / Math.log10(500000) * 100)
                return <div style={{ position: 'absolute', top: -3, left: `${pct}%`, transform: 'translateX(-50%)', width: 16, height: 16, background: demand.color, borderRadius: '50%', border: '2px solid #0D0D1A', boxShadow: `0 0 8px ${demand.color}80` }} />
              })()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: '#10B981' }}>BSR 1 (mais vendido)</span>
              <span style={{ fontSize: 10, color: '#EF4444' }}>BSR 500.000+</span>
            </div>
          </div>

          {/* ── Financial simulator ── */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#E2E8F0', letterSpacing: '0.06em', marginBottom: 16 }}>💰 SIMULADOR DE LUCRATIVIDADE</div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <Input label="PREÇO DE VENDA (R$)" value={price} onChange={setPrice} />
              <Input label="CUSTO DO PRODUTO (R$)" value={cost} onChange={setCost} />
            </div>

            {/* Cost breakdown */}
            <div style={{ background: '#0A0A0F', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(30,30,48,0.8)' }}>
              <Row label={`Preço de venda`}                    value={`R$ ${fmt(price)}`} />
              <Row label={`− Taxa Amazon (referral ${(referralPct * 100).toFixed(0)}%)`} value={`− R$ ${fmt(referralFee)}`} isNeg />
              <Row label={`− Taxa FBA (fulfillment)`}           value={`− R$ ${fmt(fbaFee)}`} isNeg />
              <Row label={`− Custo do produto`}                 value={`− R$ ${fmt(cost)}`} isNeg />
              <div style={{ height: 1, background: 'rgba(240,180,41,0.2)', margin: '0' }} />
              <Row label={`= Lucro por unidade`}  value={`R$ ${fmt(profit)} (${margin}%)`} highlight isNeg={profit < 0} />
              <Row label={`ROI sobre custo`}       value={`${roi}%`} highlight isNeg={roi < 0} />
            </div>
          </div>

          {/* ── Monthly scenarios ── */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#E2E8F0', letterSpacing: '0.06em', marginBottom: 16 }}>📈 PREVISÃO MENSAL DE FATURAMENTO</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { label: 'Pessimista',  pct: '30%',  units: Math.round(sales * 0.3), rev: +(sales * 0.3 * price).toFixed(2), profit: monthlyPess, color: '#EF4444' },
                { label: 'Realista',   pct: '60%',  units: Math.round(sales * 0.6), rev: +(sales * 0.6 * price).toFixed(2), profit: monthlyReal, color: '#F0B429' },
                { label: 'Otimista',   pct: '100%', units: sales,                   rev: monthlyRev,                         profit: monthlyOtim, color: '#10B981' },
              ].map(s => (
                <div key={s.label} style={{ background: '#0A0A0F', borderRadius: 14, border: `1px solid ${s.color}25`, padding: 18, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: '0.1em', marginBottom: 12 }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>Captura de mercado: {s.pct}</div>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 2 }}>~{fmtInt(s.units)} unidades</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>Receita: R$ {fmtInt(s.rev)}</div>
                  <div style={{ borderTop: `1px solid ${s.color}20`, paddingTop: 10 }}>
                    <div style={{ fontSize: 10, color: '#64748B' }}>Lucro líquido</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.profit >= 0 ? s.color : '#EF4444' }}>
                      R$ {fmtInt(Math.abs(s.profit))}
                    </div>
                    {s.profit < 0 && <div style={{ fontSize: 10, color: '#EF4444' }}>prejuízo</div>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: '#334155', textAlign: 'center' }}>
              * Baseado em estimativa de BSR {bsr > 0 ? `#${fmtInt(bsr)}` : '—'}. Valores são estimativas — use como referência, não como garantia.
            </div>
          </div>

          {/* ── Verdict ── */}
          <div style={{ background: `${verdictText.color}10`, border: `1px solid ${verdictText.color}30`, borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 36, flexShrink: 0 }}>{verdictText.icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: verdictText.color, letterSpacing: '0.06em', marginBottom: 6 }}>{verdictText.label}</div>
              <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>{verdictText.desc}</div>
            </div>
            <div style={{ marginLeft: 'auto', flexShrink: 0, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: scoreColor }}>{score}</div>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 700 }}>SCORE</div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div style={{ display: 'flex', gap: 12 }}>
            <a
              href={`https://www.amazon.com.br/dp/${product.asin}`} target="_blank" rel="noreferrer"
              style={{ flex: 1, display: 'block', textAlign: 'center', background: 'linear-gradient(135deg,#F0B429,#C8960C)', color: '#0A0A0F', fontWeight: 800, fontSize: 13, padding: '14px', borderRadius: 12, letterSpacing: '0.06em', textDecoration: 'none' }}>
              VER NA AMAZON →
            </a>
            <button onClick={onClose}
              style={{ flex: 1, background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', color: '#94A3B8', fontWeight: 700, fontSize: 13, padding: '14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              FECHAR
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
export default function DashboardClient({ user }: { user: any }) {
  const router = useRouter()
  const [activeNav,      setActiveNav]      = useState('bestsellers')
  const [activeCategory, setActiveCategory] = useState('electronics')
  const [products,       setProducts]       = useState<any[]>([])
  const [loading,        setLoading]        = useState(false)
  const [searched,       setSearched]       = useState(false)
  const [search,         setSearch]         = useState('')
  const [sidebarOpen,    setSidebarOpen]    = useState(true)
  const [detail,         setDetail]         = useState<any>(null)

  async function fetchProducts(nav = activeNav, cat = activeCategory, q = '') {
    setLoading(true); setSearched(false)
    try {
      const params = new URLSearchParams({ type: nav, category: cat, q })
      const res  = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch { setProducts([]) }
    setLoading(false); setSearched(true)
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const planColor = user.plan === 'lifetime' ? '#10B981' : user.plan === 'annual' ? '#F0B429' : user.plan === 'monthly' ? '#3B82F6' : '#64748B'
  const planLabel = user.plan === 'lifetime' ? 'Vitalício' : user.plan === 'annual' ? 'Anual' : user.plan === 'monthly' ? 'Mensal' : 'Gratuito'

  return (
    <>
      {detail && <ProductDetailModal product={detail} onClose={() => setDetail(null)} />}

      <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0A0F', fontFamily: 'Inter, -apple-system, sans-serif' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: sidebarOpen ? 240 : 64, background: '#0D0D1A', borderRight: '1px solid rgba(30,30,48,0.9)', display: 'flex', flexDirection: 'column', transition: 'width .25s', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(30,30,48,0.8)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>🔮</span>
            {sidebarOpen && <div>
              <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '0.1em', background: 'linear-gradient(135deg,#F0B429,#C8960C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ORÁCULO</div>
              <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.12em' }}>AMAZON INTELLIGENCE</div>
            </div>}
          </div>

          <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
            {NAV.map(n => (
              <button key={n.id}
                onClick={() => { setActiveNav(n.id); fetchProducts(n.id, activeCategory) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4, background: activeNav === n.id ? 'rgba(240,180,41,0.12)' : 'transparent', color: activeNav === n.id ? '#F0B429' : '#64748B', fontSize: 13, fontWeight: activeNav === n.id ? 700 : 500, fontFamily: 'inherit', textAlign: 'left', transition: 'all .15s' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
                {sidebarOpen && n.label}
              </button>
            ))}

            {sidebarOpen && <div style={{ fontSize: 10, color: '#334155', letterSpacing: '0.1em', fontWeight: 700, padding: '16px 10px 8px', textTransform: 'uppercase' }}>Categorias</div>}
            {CATEGORIES.map(c => (
              <button key={c.id}
                onClick={() => { setActiveCategory(c.id); fetchProducts(activeNav, c.id) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 2, background: activeCategory === c.id ? 'rgba(240,180,41,0.08)' : 'transparent', color: activeCategory === c.id ? '#F0B429' : '#64748B', fontSize: 12, fontWeight: activeCategory === c.id ? 700 : 400, fontFamily: 'inherit', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <span style={{ flexShrink: 0 }}>{c.label.split(' ')[0]}</span>
                {sidebarOpen && c.label.split(' ').slice(1).join(' ')}
              </button>
            ))}
          </nav>

          <div style={{ padding: 12, borderTop: '1px solid rgba(30,30,48,0.8)' }}>
            {sidebarOpen ? (
              <div style={{ background: '#13131F', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ background: `${planColor}20`, color: planColor, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>{planLabel}</span>
                  <button onClick={logout} style={{ fontSize: 11, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sair</button>
                </div>
              </div>
            ) : (
              <button onClick={logout} style={{ width: '100%', padding: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>👤</button>
            )}
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          {/* Top bar */}
          <div style={{ background: '#0D0D1A', borderBottom: '1px solid rgba(30,30,48,0.8)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 18, padding: 4 }}>☰</button>
            <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: 14 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setActiveNav('search'); fetchProducts('search', activeCategory, search) }}}
                placeholder="Buscar produto ou ASIN na Amazon..."
                style={{ width: '100%', background: '#13131F', border: '1px solid rgba(30,30,48,0.9)', borderRadius: 10, padding: '10px 14px 10px 40px', color: '#E2E8F0', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <button onClick={() => { setActiveNav('search'); fetchProducts('search', activeCategory, search) }}
              style={{ background: 'linear-gradient(135deg,#F0B429,#C8960C)', color: '#0A0A0F', fontWeight: 800, fontSize: 12, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', letterSpacing: '0.05em', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              BUSCAR
            </button>
          </div>

          <div style={{ padding: '28px 28px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E2E8F0', marginBottom: 4 }}>
                  {NAV.find(n => n.id === activeNav)?.icon} {NAV.find(n => n.id === activeNav)?.label}
                </h1>
                <p style={{ fontSize: 13, color: '#64748B' }}>
                  {CATEGORIES.find(c => c.id === activeCategory)?.label}
                  {searched ? ` · ${products.length} produtos encontrados` : ' · Clique em Atualizar para carregar'}
                </p>
              </div>
              <button onClick={() => fetchProducts()}
                style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)', color: '#F0B429', fontWeight: 700, fontSize: 12, padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                🔄 ATUALIZAR
              </button>
            </div>

            {/* Empty */}
            {!searched && !loading && (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🔮</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', marginBottom: 8 }}>Pronto para minerar produtos?</h2>
                <p style={{ fontSize: 14, color: '#64748B', maxWidth: 400, margin: '0 auto 28px' }}>Selecione uma categoria e clique em Atualizar para ver os produtos.</p>
                <button onClick={() => fetchProducts()}
                  style={{ background: 'linear-gradient(135deg,#F0B429,#C8960C)', color: '#0A0A0F', fontWeight: 800, fontSize: 13, padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 30px rgba(240,180,41,0.3)' }}>
                  COMEÇAR ANÁLISE →
                </button>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{ background: '#13131F', borderRadius: 14, height: 300, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            )}

            {/* Grid */}
            {!loading && searched && products.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {products.map(p => <ProductCard key={p.asin} product={p} onClick={() => setDetail(p)} />)}
              </div>
            )}

            {/* No results */}
            {!loading && searched && products.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
                <p style={{ color: '#64748B', fontSize: 14 }}>Nenhum produto encontrado. Tente outra categoria ou busca.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#0A0A0F} ::-webkit-scrollbar-thumb{background:#1E1E30;border-radius:3px}
        input[type=number]::-webkit-inner-spin-button{opacity:.4}
      `}</style>
    </>
  )
}
