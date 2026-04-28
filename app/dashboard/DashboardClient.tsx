'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const C = {
  bg:      '#04040C',
  s1:      '#08081A',
  s2:      '#0D0D20',
  s3:      '#121228',
  border:  'rgba(255,255,255,0.06)',
  bAccent: 'rgba(196,155,60,0.22)',
  gold:    '#C49B3C',
  goldLt:  '#E8C060',
  text1:   '#EDEDF5',
  text2:   '#8080A0',
  text3:   '#3A3A58',
  green:   '#10B981',
  amber:   '#F59E0B',
  red:     '#EF4444',
  purple:  '#7C6FE0',
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'electronics',     label: 'Eletrônicos' },
  { id: 'computers',       label: 'Computadores' },
  { id: 'home',            label: 'Casa e Cozinha' },
  { id: 'sports',          label: 'Esportes' },
  { id: 'beauty',          label: 'Beleza' },
  { id: 'toys',            label: 'Brinquedos' },
  { id: 'tools',           label: 'Ferramentas' },
  { id: 'pet-supplies',    label: 'Pet Shop' },
  { id: 'health',          label: 'Saúde' },
  { id: 'office-products', label: 'Escritório' },
]

const NAV = [
  { id: 'bestsellers', label: 'Mais Vendidos',     dot: C.gold },
  { id: 'new',         label: 'Recém Adicionados', dot: C.purple },
  { id: 'trending',    label: 'Em Alta',           dot: C.green },
  { id: 'generics',    label: 'Genéricos',         dot: C.amber },
  { id: 'search',      label: 'Buscar Produto',    dot: C.text2 },
]

const REFERRAL: Record<string, number> = {
  electronics: 0.08, computers: 0.08, health: 0.08,
  home: 0.15, sports: 0.15, beauty: 0.15, 'pet-supplies': 0.15, 'office-products': 0.15,
  tools: 0.12, toys: 0.16,
}
const DEFAULT_PRICE: Record<string, number> = {
  electronics: 150, computers: 800, home: 80, sports: 120, beauty: 60,
  toys: 70, tools: 90, 'pet-supplies': 50, health: 80, 'office-products': 45,
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function bsrToSales(bsr: number) {
  if (!bsr)           return 0
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
function demandInfo(s: number) {
  if (s >= 2000) return { label: 'Muito Alta', color: C.green }
  if (s >= 800)  return { label: 'Alta',       color: C.green }
  if (s >= 300)  return { label: 'Média',      color: C.amber }
  if (s >= 100)  return { label: 'Baixa',      color: C.amber }
  return              { label: 'Muito Baixa',  color: C.red }
}
function oppScore(bsr: number, margin: number) {
  const b = bsr < 500 ? 40 : bsr < 2000 ? 30 : bsr < 10000 ? 20 : bsr < 50000 ? 10 : 5
  const m = margin >= 35 ? 40 : margin >= 25 ? 32 : margin >= 15 ? 22 : margin >= 5 ? 12 : 4
  return Math.min(100, b + m + 20)
}
const fmtN  = (n: number) => Math.round(n).toLocaleString('pt-BR')
const fmtR  = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtK  = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`

/* ─── Eye logo SVG ───────────────────────────────────────────────────────── */
const EyeLogo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <ellipse cx="16" cy="16" rx="13" ry="9" stroke={C.gold} strokeWidth="1.6"/>
    <circle  cx="16" cy="16" r="5"    fill={C.gold} opacity=".9"/>
    <circle  cx="16" cy="16" r="2.2"  fill={C.bg}/>
    <line x1="16" y1="7" x2="16" y2="5"   stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
    <line x1="16" y1="25" x2="16" y2="27" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
    <line x1="3"  y1="16" x2="1"  y2="16" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
    <line x1="29" y1="16" x2="31" y2="16" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
  </svg>
)

/* ─── Product detail modal ───────────────────────────────────────────────── */
function DetailModal({ product, onClose }: { product: any; onClose: () => void }) {
  const catId   = CATEGORIES.find(c => product.category?.toLowerCase().includes(c.label.toLowerCase().split(' ')[0]))?.id || 'home'
  const defP    = DEFAULT_PRICE[catId] || 99
  const [price, setPrice] = useState(defP)
  const [cost,  setCost]  = useState(Math.round(defP * 0.3))

  const bsr   = product.bsr || 0
  const sales = product.salesEst || bsrToSales(bsr)
  const dem   = demandInfo(sales)
  const refPct = REFERRAL[catId] || 0.15
  const refFee = +(price * refPct).toFixed(2)
  const fbaFee = price < 50 ? 12 : price < 150 ? 18 : price < 400 ? 24 : 32
  const profit = +(price - refFee - fbaFee - cost).toFixed(2)
  const margin = price > 0 ? +((profit / price) * 100).toFixed(1) : 0
  const roi    = cost  > 0 ? +((profit / cost)  * 100).toFixed(1) : 0
  const score  = oppScore(bsr, margin)
  const sColor = score >= 70 ? C.green : score >= 50 ? C.amber : C.red

  const verdict =
    score >= 75 ? { label: 'Excelente Oportunidade', color: C.green,  sub: 'Alta demanda e margem sólida. Produto com forte potencial para FBA.' }
    : score >= 55 ? { label: 'Boa Oportunidade',     color: C.green,  sub: 'Demanda consistente. Vale testar com estoque inicial.' }
    : score >= 38 ? { label: 'Potencial Médio',      color: C.amber,  sub: 'Demanda razoável. Avalie a concorrência antes de entrar.' }
    : { label: 'Baixo Potencial',                    color: C.red,    sub: 'BSR alto ou margem negativa. Recomendamos buscar outra opção.' }

  const scenarios = [
    { label: 'Conservador', mult: 0.3, col: C.text2 },
    { label: 'Realista',    mult: 0.6, col: C.amber },
    { label: 'Otimista',    mult: 1.0, col: C.green },
  ]

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(8px)', zIndex:1000, overflowY:'auto', padding:'32px 20px' }}>
      <div style={{ maxWidth:860, margin:'0 auto', background:C.s1, borderRadius:16, border:`1px solid ${C.bAccent}`, overflow:'hidden' }}>

        {/* ── Header ── */}
        <div style={{ padding:'24px 28px', borderBottom:`1px solid ${C.border}`, display:'flex', gap:20, alignItems:'flex-start' }}>
          <div style={{ width:84, height:84, background:C.bg, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${C.border}` }}>
            {product.images?.[0]
              ? <img src={product.images[0]} alt="" style={{ maxWidth:72, maxHeight:72, objectFit:'contain' }}/>
              : <span style={{ color:C.text3, fontSize:28 }}>□</span>}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:15, fontWeight:600, color:C.text1, lineHeight:1.45, marginBottom:10, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>
              {product.title}
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              <Tag label={`ASIN ${product.asin}`} color={C.text3} />
              {product.category && <Tag label={product.category} color={C.gold} />}
              {product.brand    && <Tag label={product.brand}    color={C.purple} />}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${C.border}`, color:C.text2, width:32, height:32, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
        </div>

        {/* ── KPIs ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:`1px solid ${C.border}` }}>
          {[
            { v: bsr > 0 ? `#${fmtN(bsr)}` : '—', l:'BSR Amazon',     s:'ranking geral',       c:C.text1 },
            { v: `~${fmtK(sales)}`,                l:'Vendas / mês',   s:'estimativa por BSR',  c:dem.color },
            { v: dem.label,                        l:'Demanda',        s:'nível de mercado',    c:dem.color },
            { v: `${score}`,                       l:'Score Oráculo',  s:'oportunidade geral',  c:sColor },
          ].map((k,i) => (
            <div key={i} style={{ padding:'20px 22px', borderRight: i<3 ? `1px solid ${C.border}` : 'none', textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:700, color:k.c, letterSpacing:'-0.02em', marginBottom:4 }}>{k.v}</div>
              <div style={{ fontSize:11, fontWeight:600, color:C.text1, marginBottom:2 }}>{k.l}</div>
              <div style={{ fontSize:10, color:C.text3 }}>{k.s}</div>
            </div>
          ))}
        </div>

        <div style={{ padding:'28px 28px', display:'flex', flexDirection:'column', gap:24 }}>

          {/* ── BSR bar ── */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:11, fontWeight:600, color:C.text2, letterSpacing:'0.06em', textTransform:'uppercase' }}>Posição no Ranking Amazon</span>
              <span style={{ fontSize:11, color:C.text3 }}>Menor BSR = mais vendido</span>
            </div>
            <div style={{ height:6, background:C.s3, borderRadius:99, position:'relative' }}>
              <div style={{ position:'absolute', inset:0, background:`linear-gradient(to right,${C.green},${C.amber},${C.red})`, borderRadius:99, opacity:.2 }}/>
              {bsr > 0 && (() => {
                const pct = Math.min(98, Math.log10(bsr) / Math.log10(500000) * 100)
                return <div style={{ position:'absolute', top:-4, left:`${pct}%`, transform:'translateX(-50%)', width:14, height:14, background:dem.color, borderRadius:'50%', border:`2px solid ${C.bg}`, boxShadow:`0 0 8px ${dem.color}60` }}/>
              })()}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
              <span style={{ fontSize:9, color:C.green, fontWeight:600 }}>BSR 1</span>
              <span style={{ fontSize:9, color:C.red, fontWeight:600 }}>500.000+</span>
            </div>
          </div>

          {/* ── Simulator ── */}
          <div>
            <SectionLabel>Simulador de Lucratividade</SectionLabel>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              {([
                { label:'Preço de Venda (R$)', val:price, set:setPrice },
                { label:'Custo do Produto (R$)', val:cost,  set:setCost  },
              ] as const).map(f => (
                <div key={f.label} style={{ background:C.bg, border:`1px solid ${C.bAccent}`, borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontSize:10, color:C.text3, fontWeight:600, marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase' as const }}>{f.label}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ color:C.text3, fontSize:13 }}>R$</span>
                    <input type="number" min={0} value={f.val} onChange={e => (f.set as any)(+e.target.value || 0)}
                      style={{ background:'none', border:'none', color:C.gold, fontSize:20, fontWeight:700, width:'100%', outline:'none', fontFamily:'inherit' }}/>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              {[
                { l:`Preço de venda`,               v:`R$ ${fmtR(price)}`,                  dim:false },
                { l:`Taxa Amazon (${(refPct*100).toFixed(0)}%)`, v:`− R$ ${fmtR(refFee)}`,   dim:true  },
                { l:`Taxa FBA (fulfillment)`,        v:`− R$ ${fmtR(fbaFee)}`,               dim:true  },
                { l:`Custo do produto`,              v:`− R$ ${fmtR(cost)}`,                 dim:true  },
              ].map((row, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 16px', borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:13, color: row.dim ? C.text2 : C.text1 }}>{row.l}</span>
                  <span style={{ fontSize:13, color: row.dim ? C.red   : C.text1, fontWeight:row.dim?400:500 }}>{row.v}</span>
                </div>
              ))}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:`1px solid ${C.bAccent}` }}>
                <div style={{ padding:'14px 16px', borderRight:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:10, color:C.text3, marginBottom:4 }}>LUCRO / UNIDADE</div>
                  <div style={{ fontSize:20, fontWeight:700, color: profit >= 0 ? C.gold : C.red }}>R$ {fmtR(profit)}</div>
                  <div style={{ fontSize:11, color:C.text2 }}>Margem {margin}%</div>
                </div>
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ fontSize:10, color:C.text3, marginBottom:4 }}>ROI SOBRE CUSTO</div>
                  <div style={{ fontSize:20, fontWeight:700, color: roi >= 0 ? C.green : C.red }}>{roi}%</div>
                  <div style={{ fontSize:11, color:C.text2 }}>Retorno do capital</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Scenarios ── */}
          <div>
            <SectionLabel>Previsão Mensal</SectionLabel>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {scenarios.map(sc => {
                const units = Math.round(sales * sc.mult)
                const rev   = +(units * price).toFixed(0)
                const luc   = +(units * profit).toFixed(0)
                return (
                  <div key={sc.label} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:sc.col, letterSpacing:'0.1em', textTransform:'uppercase' as const, marginBottom:10 }}>{sc.label}</div>
                    <div style={{ fontSize:11, color:C.text3, marginBottom:4 }}>{Math.round(sc.mult*100)}% captura · {fmtN(units)} un.</div>
                    <div style={{ fontSize:11, color:C.text2, marginBottom:12 }}>Receita R$ {fmtN(rev)}</div>
                    <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
                      <div style={{ fontSize:9, color:C.text3, marginBottom:4 }}>LUCRO LÍQUIDO</div>
                      <div style={{ fontSize:22, fontWeight:700, color: luc >= 0 ? sc.col : C.red }}>R$ {fmtN(Math.abs(luc))}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize:10, color:C.text3, marginTop:8, textAlign:'center' as const }}>Estimativas baseadas em BSR e fórmulas de mercado FBA. Não constituem garantia de resultado.</p>
          </div>

          {/* ── Verdict ── */}
          <div style={{ background:`${verdict.color}09`, border:`1px solid ${verdict.color}25`, borderRadius:10, padding:'18px 20px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:'50%', border:`1.5px solid ${verdict.color}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <div style={{ width:16, height:16, borderRadius:'50%', background:verdict.color }}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:verdict.color, marginBottom:4 }}>{verdict.label}</div>
              <div style={{ fontSize:12, color:C.text2, lineHeight:1.5 }}>{verdict.sub}</div>
            </div>
            <div style={{ textAlign:'center' as const, flexShrink:0 }}>
              <div style={{ fontSize:28, fontWeight:700, color:sColor, lineHeight:1 }}>{score}</div>
              <div style={{ fontSize:9, color:C.text3, fontWeight:600, marginTop:2 }}>SCORE</div>
            </div>
          </div>

          {/* ── CTAs ── */}
          <div style={{ display:'flex', gap:10 }}>
            <a href={`https://www.amazon.com.br/dp/${product.asin}`} target="_blank" rel="noreferrer"
              style={{ flex:1, display:'block', textAlign:'center' as const, background:`linear-gradient(135deg,${C.gold},#A87820)`, color:'#050508', fontWeight:700, fontSize:12, padding:'13px', borderRadius:8, letterSpacing:'0.08em', textDecoration:'none', textTransform:'uppercase' as const }}>
              Ver na Amazon →
            </a>
            <button onClick={onClose}
              style={{ flex:1, background:'none', border:`1px solid ${C.border}`, color:C.text2, fontWeight:600, fontSize:12, padding:'13px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' as const, letterSpacing:'0.06em' }}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Small shared components ────────────────────────────────────────────── */
function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ background:`${color}14`, color, border:`1px solid ${color}28`, borderRadius:4, padding:'2px 8px', fontSize:10, fontWeight:600, letterSpacing:'0.04em' }}>
      {label}
    </span>
  )
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:10, fontWeight:700, color:C.text3, letterSpacing:'0.12em', textTransform:'uppercase' as const, marginBottom:12 }}>{children}</div>
}

/* ─── Product card ───────────────────────────────────────────────────────── */
function ProductCard({ product, onClick }: { product: any; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const bsr    = product.bsr || 0
  const sales  = product.salesEst || bsrToSales(bsr)
  const score  = oppScore(bsr, 25)
  const sColor = score >= 70 ? C.green : score >= 50 ? C.amber : C.red
  const isGeneric = !product.brand || product.brand.toLowerCase().includes('gen')
  const img = product.images?.[0] || ''

  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? C.s2 : C.s1, border:`1px solid ${hov ? C.bAccent : C.border}`, borderRadius:12, overflow:'hidden', cursor:'pointer', transition:'all .18s', boxShadow: hov ? `0 8px 40px rgba(0,0,0,0.5)` : 'none' }}>

      {/* Image */}
      <div style={{ background:C.bg, height:164, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
        {img
          ? <img src={img} alt={product.title} style={{ maxHeight:148, maxWidth:'88%', objectFit:'contain', transition:'transform .2s', transform: hov ? 'scale(1.04)' : 'scale(1)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}/>
          : <div style={{ width:48, height:48, borderRadius:'50%', border:`1px solid ${C.border}` }}/>
        }
        {/* Score chip */}
        <div style={{ position:'absolute', top:10, right:10, background:C.bg, border:`1px solid ${sColor}40`, borderRadius:6, padding:'3px 8px', fontSize:11, fontWeight:700, color:sColor, letterSpacing:'0.02em' }}>
          {score}
        </div>
        {/* Generic badge */}
        {isGeneric && (
          <div style={{ position:'absolute', top:10, left:10, background:`${C.purple}18`, border:`1px solid ${C.purple}30`, borderRadius:4, padding:'2px 7px', fontSize:9, fontWeight:700, color:C.purple, letterSpacing:'0.08em' }}>
            GENÉRICO
          </div>
        )}
      </div>

      <div style={{ padding:'14px 16px 16px' }}>
        {/* Sales */}
        {sales > 0 && bsr > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: sales >= 400 ? C.green : C.amber, flexShrink:0 }}/>
            <span style={{ fontSize:12, fontWeight:700, color: sales >= 400 ? C.green : C.amber }}>~{fmtK(sales)}</span>
            <span style={{ fontSize:11, color:C.text3 }}>vendas/mês</span>
            <span style={{ fontSize:10, color:C.text3, marginLeft:'auto' }}>BSR #{fmtN(bsr)}</span>
          </div>
        )}

        {/* Title */}
        <p style={{ fontSize:12, fontWeight:500, color:C.text1, lineHeight:1.5, marginBottom:10, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any, overflow:'hidden' }}>
          {product.title}
        </p>

        {/* Brand */}
        {product.brand && (
          <div style={{ fontSize:10, color:C.text3, marginBottom:12 }}>
            {product.brand}
          </div>
        )}

        {/* CTA */}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:11, fontWeight:600, color: hov ? C.gold : C.text2, letterSpacing:'0.06em', transition:'color .15s' }}>
            ANALISAR PRODUTO
          </span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: hov ? C.gold : C.text3, transition:'color .15s, transform .15s', transform: hov ? 'translateX(3px)' : 'none' }}>
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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
  const [page,           setPage]           = useState(1)
  const PAGE_SIZE = 20

  async function fetchProducts(nav = activeNav, cat = activeCategory, q = '') {
    if (nav === 'search' && !q.trim()) return
    setLoading(true); setSearched(false); setPage(1)
    try {
      const res  = await fetch(`/api/products?${new URLSearchParams({ type: nav, category: cat, q })}`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch { setProducts([]) }
    setLoading(false); setSearched(true)
  }

  function handleNav(id: string) {
    setActiveNav(id); setPage(1)
    if (id === 'search') { setProducts([]); setSearched(false); return }
    fetchProducts(id, activeCategory)
  }

  const planColors: Record<string, string> = { lifetime: C.green, annual: C.gold, monthly: C.purple, free: C.text3 }
  const planLabels: Record<string, string> = { lifetime: 'Vitalício', annual: 'Anual', monthly: 'Mensal', free: 'Gratuito' }
  const pColor = planColors[user.plan] || C.text3
  const pLabel = planLabels[user.plan] || user.plan

  const activeNavItem = NAV.find(n => n.id === activeNav)
  const isCross = activeNav === 'bestsellers' || activeNav === 'trending'

  return (
    <>
      {detail && <DetailModal product={detail} onClose={() => setDetail(null)} />}

      <div style={{ display:'flex', minHeight:'100vh', background:C.bg, fontFamily:'"Inter",-apple-system,sans-serif', color:C.text1 }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: sidebarOpen ? 220 : 56, background:C.s1, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', transition:'width .22s cubic-bezier(.4,0,.2,1)', overflow:'hidden', flexShrink:0 }}>

          {/* Logo */}
          <div style={{ padding: sidebarOpen ? '22px 20px' : '22px 14px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <EyeLogo size={28} />
            {sidebarOpen && (
              <div>
                <div style={{ fontSize:13, fontWeight:800, letterSpacing:'0.18em', color:C.gold, lineHeight:1 }}>ORÁCULO</div>
                <div style={{ fontSize:8, color:C.text3, letterSpacing:'0.18em', marginTop:3 }}>AMAZON INTELLIGENCE</div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav style={{ padding:'12px 8px', flex:1, overflowY:'auto', overflowX:'hidden' }}>
            {NAV.map(n => {
              const active = activeNav === n.id
              return (
                <button key={n.id} onClick={() => handleNav(n.id)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding: sidebarOpen ? '9px 12px' : '9px 14px', borderRadius:7, border:'none', cursor:'pointer', marginBottom:2, background: active ? `${C.gold}12` : 'none', fontFamily:'inherit', textAlign:'left', transition:'all .12s', outline:'none' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background: active ? n.dot : C.text3, flexShrink:0, transition:'background .12s' }}/>
                  {sidebarOpen && <span style={{ fontSize:12, fontWeight: active ? 600 : 400, color: active ? C.text1 : C.text2, transition:'color .12s', whiteSpace:'nowrap' }}>{n.label}</span>}
                </button>
              )
            })}

            {sidebarOpen && (
              <div style={{ fontSize:9, fontWeight:700, color:C.text3, letterSpacing:'0.14em', padding:'20px 12px 8px', textTransform:'uppercase' }}>
                Categorias
              </div>
            )}
            <div style={{ height: sidebarOpen ? 'auto' : 0, overflow:'hidden', transition:'height .2s' }}>
              {CATEGORIES.map(c => (
                <button key={c.id}
                  onClick={() => { setActiveCategory(c.id); setPage(1); if (activeNav !== 'search') fetchProducts(activeNav, c.id) }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:6, border:'none', cursor:'pointer', marginBottom:1, background: activeCategory === c.id ? `${C.gold}08` : 'none', fontFamily:'inherit', textAlign:'left' }}>
                  <div style={{ width:4, height:4, borderRadius:'50%', background: activeCategory === c.id ? C.gold : C.text3, flexShrink:0 }}/>
                  <span style={{ fontSize:11, color: activeCategory === c.id ? C.gold : C.text2, fontWeight: activeCategory === c.id ? 600 : 400, whiteSpace:'nowrap' }}>{c.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* User */}
          {sidebarOpen && (
            <div style={{ padding:'12px 12px 16px', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:C.s3, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:C.text2, fontWeight:600, flexShrink:0 }}>
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:C.text1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
                  <span style={{ fontSize:9, fontWeight:700, color:pColor, letterSpacing:'0.08em', textTransform:'uppercase' as const }}>{pLabel}</span>
                </div>
                <button onClick={async () => { await fetch('/api/auth/logout', { method:'POST' }); router.push('/login') }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:C.text3, fontSize:10, fontFamily:'inherit', padding:'2px 0', flexShrink:0 }}>
                  Sair
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <main style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>

          {/* Top bar */}
          <div style={{ background:C.s1, borderBottom:`1px solid ${C.border}`, padding:'12px 24px', display:'flex', alignItems:'center', gap:14, position:'sticky', top:0, zIndex:10 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background:'none', border:'none', cursor:'pointer', color:C.text2, padding:'6px', display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
              {[0,1,2].map(i => <div key={i} style={{ width:16, height:1.5, background:C.text2, borderRadius:1, transition:'opacity .15s', opacity: i===1 && !sidebarOpen ? 0 : 1 }}/>)}
            </button>

            <div style={{ flex:1, maxWidth:480, position:'relative' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:C.text3 }}>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setActiveNav('search'); fetchProducts('search', activeCategory, search) }}}
                placeholder="Buscar produto ou ASIN na Amazon…"
                style={{ width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 14px 9px 34px', color:C.text1, fontSize:12, outline:'none', fontFamily:'inherit', transition:'border-color .15s' }}
                onFocus={e => (e.target as HTMLElement).style.borderColor = C.bAccent}
                onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
              />
            </div>

            <button onClick={() => { setActiveNav('search'); fetchProducts('search', activeCategory, search) }}
              style={{ background:`linear-gradient(135deg,${C.gold},#A87820)`, color:'#050508', fontWeight:700, fontSize:11, padding:'9px 20px', borderRadius:8, border:'none', cursor:'pointer', letterSpacing:'0.08em', fontFamily:'inherit', textTransform:'uppercase' as const, flexShrink:0 }}>
              Buscar
            </button>
          </div>

          <div style={{ padding:'28px 28px', flex:1 }}>

            {/* Page header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <div>
                <h1 style={{ fontSize:20, fontWeight:700, color:C.text1, marginBottom:4, letterSpacing:'-0.02em' }}>
                  {activeNavItem?.label}
                </h1>
                <p style={{ fontSize:12, color:C.text3 }}>
                  {isCross ? 'Todas as categorias' : CATEGORIES.find(c => c.id === activeCategory)?.label}
                  {searched && ` · ${products.length} produtos · pág. ${page}/${Math.max(1, Math.ceil(products.length / PAGE_SIZE))}`}
                </p>
              </div>
              <button onClick={() => fetchProducts()}
                style={{ background:'none', border:`1px solid ${C.border}`, color:C.text2, fontWeight:600, fontSize:11, padding:'8px 16px', borderRadius:7, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.06em', textTransform:'uppercase' as const, transition:'border-color .15s, color .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.bAccent; (e.currentTarget as HTMLElement).style.color = C.gold }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.text2 }}>
                Atualizar
              </button>
            </div>

            {/* Empty / search */}
            {!searched && !loading && (
              <div style={{ textAlign:'center', padding:'100px 24px' }}>
                <EyeLogo size={48} />
                {activeNav === 'search' ? (
                  <>
                    <h2 style={{ fontSize:18, fontWeight:600, color:C.text1, margin:'20px 0 8px' }}>Buscar produto</h2>
                    <p style={{ fontSize:13, color:C.text2 }}>Digite o nome do produto ou ASIN na barra acima.</p>
                  </>
                ) : (
                  <>
                    <h2 style={{ fontSize:18, fontWeight:600, color:C.text1, margin:'20px 0 8px' }}>Pronto para minerar?</h2>
                    <p style={{ fontSize:13, color:C.text2, marginBottom:28 }}>Selecione uma aba e clique em Atualizar.</p>
                    <button onClick={() => fetchProducts()}
                      style={{ background:`linear-gradient(135deg,${C.gold},#A87820)`, color:'#050508', fontWeight:700, fontSize:12, padding:'12px 28px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.08em', textTransform:'uppercase' as const }}>
                      Começar Análise
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:14 }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{ background:C.s1, borderRadius:12, height:280, border:`1px solid ${C.border}`, animation:`shimmer 1.6s ease-in-out infinite`, animationDelay:`${i * 0.06}s`, opacity:.7 }}/>
                ))}
              </div>
            )}

            {/* Grid + pagination */}
            {!loading && searched && products.length > 0 && (() => {
              const total = Math.ceil(products.length / PAGE_SIZE)
              const paged = products.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)
              return (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:14 }}>
                    {paged.map(p => <ProductCard key={p.asin} product={p} onClick={() => setDetail(p)}/>)}
                  </div>
                  {total > 1 && (
                    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:6, marginTop:36 }}>
                      {[
                        { label:'←', action: () => setPage(p => Math.max(1, p-1)), disabled: page===1 },
                        ...Array.from({ length: total }).map((_, i) => ({ label: String(i+1), action: () => { setPage(i+1); window.scrollTo(0,0) }, disabled: false, active: page===i+1 })),
                        { label:'→', action: () => setPage(p => Math.min(total, p+1)), disabled: page===total },
                      ].map((b: any, i) => (
                        <button key={i} onClick={() => { if (!b.disabled) { b.action(); window.scrollTo(0,0) } }}
                          style={{ background: b.active ? `${C.gold}18` : 'none', border:`1px solid ${b.active ? C.bAccent : C.border}`, color: b.active ? C.gold : b.disabled ? C.text3 : C.text2, fontWeight: b.active ? 700 : 500, fontSize:12, width:34, height:34, borderRadius:6, cursor: b.disabled ? 'default' : 'pointer', fontFamily:'inherit', transition:'all .12s' }}>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}

            {/* No results */}
            {!loading && searched && products.length === 0 && (
              <div style={{ textAlign:'center', padding:'80px 24px' }}>
                <p style={{ color:C.text2, fontSize:14 }}>Nenhum produto encontrado.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes shimmer { 0%,100%{opacity:.7} 50%{opacity:.3} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:${C.bg}} ::-webkit-scrollbar-thumb{background:${C.s3};border-radius:2px}
        input[type=number]::-webkit-inner-spin-button{opacity:.3}
      `}</style>
    </>
  )
}
