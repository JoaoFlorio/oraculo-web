'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { id: 'electronics',        label: '📱 Eletrônicos' },
  { id: 'computers',          label: '💻 Computadores' },
  { id: 'home',               label: '🏠 Casa e Cozinha' },
  { id: 'sports',             label: '⚽ Esportes' },
  { id: 'beauty',             label: '💄 Beleza' },
  { id: 'toys',               label: '🧸 Brinquedos' },
  { id: 'tools',              label: '🔧 Ferramentas' },
  { id: 'pet-supplies',       label: '🐾 Pet Shop' },
  { id: 'health',             label: '💊 Saúde' },
  { id: 'office-products',    label: '📦 Escritório' },
]

const NAV = [
  { id: 'bestsellers', icon: '🏆', label: 'Mais Vendidos' },
  { id: 'new',         icon: '🆕', label: 'Recém Adicionados' },
  { id: 'trending',   icon: '📈', label: 'Em Alta' },
  { id: 'search',     icon: '🔍', label: 'Buscar Produto' },
]

function SalesTag({ bsr }: { bsr: number }) {
  const sales = bsr < 100 ? 5000 : bsr < 500 ? 2000 : bsr < 1000 ? 1200 : bsr < 5000 ? 400 : bsr < 10000 ? 180 : bsr < 50000 ? 60 : 20
  const color = sales >= 1000 ? '#10B981' : sales >= 200 ? '#F0B429' : '#94A3B8'
  const label = sales >= 10000 ? `+${(sales/1000).toFixed(0)}k` : `+${sales}`
  return <span style={{ background: `${color}20`, color, border: `1px solid ${color}40`, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{label} vendas/mês</span>
}

function ReviewTag({ count }: { count: number }) {
  if (count < 50) return null
  const color = count >= 500 ? '#10B981' : '#F0B429'
  return <span style={{ background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>⭐ {count >= 1000 ? `${(count/1000).toFixed(1)}k` : count}+ avaliações</span>
}

function ProductCard({ product }: { product: any }) {
  const img = product.images?.[0] || '/placeholder.png'
  const price = product.price || 0
  const bsr = product.bsr || 99999
  const reviews = product.reviewCount || 0
  const score = Math.max(10, Math.min(100, Math.round(100 - Math.log10(bsr + 1) * 20)))
  const scoreColor = score >= 70 ? '#10B981' : score >= 50 ? '#F0B429' : '#EF4444'

  return (
    <div style={{ background: '#13131F', border: '1px solid rgba(30,30,48,0.9)', borderRadius: '14px', overflow: 'hidden', transition: 'border-color .2s, transform .2s', cursor: 'pointer' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,180,41,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,30,48,0.9)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>

      {/* Image */}
      <div style={{ background: '#0A0A0F', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <img src={img} alt={product.title} style={{ maxHeight: '160px', maxWidth: '90%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="%23334155"><rect width="24" height="24" rx="4"/></svg>' }} />
      </div>

      <div style={{ padding: '16px' }}>
        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <SalesTag bsr={bsr} />
            <ReviewTag count={reviews} />
          </div>
          <div style={{ background: `${scoreColor}20`, color: scoreColor, border: `1px solid ${scoreColor}40`, borderRadius: '8px', padding: '3px 10px', fontSize: '12px', fontWeight: 800 }}>{score}</div>
        </div>

        {/* Title */}
        <p style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 600, lineHeight: 1.4, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.title}</p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>Preço</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#F0B429' }}>{price > 0 ? `R$ ${price.toFixed(2).replace('.',',')}` : '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>BSR</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0' }}>#{bsr.toLocaleString('pt-BR')}</div>
          </div>
          {reviews > 0 && <div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>Avaliações</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0' }}>{reviews.toLocaleString('pt-BR')}</div>
          </div>}
        </div>

        {/* CTA */}
        <a href={`https://www.amazon.com.br/dp/${product.asin}`} target="_blank" rel="noreferrer"
          style={{ display: 'block', textAlign: 'center', background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)', color: '#F0B429', fontWeight: 700, fontSize: '12px', padding: '9px', borderRadius: '8px', letterSpacing: '0.05em' }}>
          VER NA AMAZON →
        </a>
      </div>
    </div>
  )
}

export default function DashboardClient({ user }: { user: any }) {
  const router = useRouter()
  const [activeNav, setActiveNav] = useState('bestsellers')
  const [activeCategory, setActiveCategory] = useState('electronics')
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  async function fetchProducts(nav = activeNav, cat = activeCategory, q = '') {
    setLoading(true); setSearched(false)
    try {
      const params = new URLSearchParams({ type: nav, category: cat, q })
      const res = await fetch(`/api/products?${params}`)
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0A0F', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* SIDEBAR */}
      <aside style={{ width: sidebarOpen ? '240px' : '64px', background: '#0D0D1A', borderRight: '1px solid rgba(30,30,48,0.9)', display: 'flex', flexDirection: 'column', transition: 'width .25s', overflow: 'hidden', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(30,30,48,0.8)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>🔮</span>
          {sidebarOpen && <div>
            <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.1em', background: 'linear-gradient(135deg,#F0B429,#C8960C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ORÁCULO</div>
            <div style={{ fontSize: '9px', color: '#475569', letterSpacing: '0.12em' }}>AMAZON INTELLIGENCE</div>
          </div>}
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setActiveNav(n.id); fetchProducts(n.id, activeCategory) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '4px', background: activeNav === n.id ? 'rgba(240,180,41,0.12)' : 'transparent', color: activeNav === n.id ? '#F0B429' : '#64748B', fontSize: '13px', fontWeight: activeNav === n.id ? 700 : 500, fontFamily: 'inherit', textAlign: 'left', transition: 'all .15s' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{n.icon}</span>
              {sidebarOpen && n.label}
            </button>
          ))}

          {sidebarOpen && <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em', fontWeight: 700, padding: '16px 10px 8px', textTransform: 'uppercase' }}>Categorias</div>}
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => { setActiveCategory(c.id); fetchProducts(activeNav, c.id) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginBottom: '2px', background: activeCategory === c.id ? 'rgba(240,180,41,0.08)' : 'transparent', color: activeCategory === c.id ? '#F0B429' : '#64748B', fontSize: '12px', fontWeight: activeCategory === c.id ? 700 : 400, fontFamily: 'inherit', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <span style={{ flexShrink: 0 }}>{c.label.split(' ')[0]}</span>
              {sidebarOpen && c.label.split(' ').slice(1).join(' ')}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(30,30,48,0.8)' }}>
          {sidebarOpen ? (
            <div style={{ background: '#13131F', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#E2E8F0', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ background: `${planColor}20`, color: planColor, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>{planLabel}</span>
                <button onClick={logout} style={{ fontSize: '11px', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sair</button>
              </div>
            </div>
          ) : (
            <button onClick={logout} style={{ width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>👤</button>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{ background: '#0D0D1A', borderBottom: '1px solid rgba(30,30,48,0.8)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '18px', padding: '4px' }}>☰</button>

          {/* Search bar */}
          <div style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: '14px' }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchProducts('search', activeCategory, search) }}
              placeholder="Buscar produto ou ASIN na Amazon..."
              style={{ width: '100%', background: '#13131F', border: '1px solid rgba(30,30,48,0.9)', borderRadius: '10px', padding: '10px 14px 10px 40px', color: '#E2E8F0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <button onClick={() => fetchProducts('search', activeCategory, search)}
            style={{ background: 'linear-gradient(135deg,#F0B429,#C8960C)', color: '#0A0A0F', fontWeight: 800, fontSize: '12px', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', letterSpacing: '0.05em', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            BUSCAR
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '28px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#E2E8F0', marginBottom: '4px' }}>
                {NAV.find(n => n.id === activeNav)?.icon} {NAV.find(n => n.id === activeNav)?.label}
              </h1>
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                {CATEGORIES.find(c => c.id === activeCategory)?.label} · {searched ? `${products.length} produtos encontrados` : 'Selecione uma categoria e clique em buscar'}
              </p>
            </div>
            <button onClick={() => fetchProducts()}
              style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)', color: '#F0B429', fontWeight: 700, fontSize: '12px', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>
              🔄 ATUALIZAR
            </button>
          </div>

          {/* Empty state */}
          {!searched && !loading && (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔮</div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#E2E8F0', marginBottom: '8px' }}>Pronto para minerar produtos?</h2>
              <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 28px' }}>Selecione uma categoria no menu lateral e clique em Atualizar para ver os produtos.</p>
              <button onClick={() => fetchProducts()}
                style={{ background: 'linear-gradient(135deg,#F0B429,#C8960C)', color: '#0A0A0F', fontWeight: 800, fontSize: '13px', padding: '14px 32px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 30px rgba(240,180,41,0.3)' }}>
                COMEÇAR ANÁLISE →
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ background: '#13131F', borderRadius: '14px', height: '340px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          )}

          {/* Products grid */}
          {!loading && searched && products.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {products.map(p => <ProductCard key={p.asin} product={p} />)}
            </div>
          )}

          {/* No results */}
          {!loading && searched && products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>😕</div>
              <p style={{ color: '#64748B', fontSize: '14px' }}>Nenhum produto encontrado. Tente outra categoria ou busca.</p>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#0A0A0F} ::-webkit-scrollbar-thumb{background:#1E1E30;border-radius:3px}
      `}</style>
    </div>
  )
}
