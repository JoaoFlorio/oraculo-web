'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── Tema (mesmos tokens CSS do DashboardClient) ─────────────────────────── */
const T = {
  card: 'var(--card)', line: 'var(--line)', modal: 'var(--modal)',
  gold: 'var(--gold)', g: 'var(--g)', a: 'var(--a)', r: 'var(--r)', pur: 'var(--pur)',
  t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)', t4: 'var(--t4)',
}
const tint = (v: string, pct: number) => `color-mix(in srgb, ${v} ${pct}%, transparent)`
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`

/* ─── Contrato da resposta do backend (/api/ml/calc → /api/ml/calc/fees) ──── */
type Modality = {
  receita: number; comissao: number; comissaoPct: number
  custoFixo: number; parcelamento: number
  imposto: number; custo: number; frete: number; ads: number
  despesas: number; lucro: number; margem: number
  fonte: 'api' | 'estimativa'
}
type Envio = { custoVendedor: number; custoCheio: number | null; subsidioPct: number | null; reputacao: string; pesoFaturavel: number | null; cenario: 'frete-gratis' | 'logistica'; fonte: 'api' }
type CalcResp = {
  input: { price: number; cost: number; taxPct: number; frete: number; adsPct: number; categoryId: string | null; itemId: string | null; dimensions: string | null; logisticType: string }
  item: null | { id: string; titulo: string; categoryId: string; precoAnuncio: number; vendidos: number | null; tipoAnuncio: string; thumbnail: string | null; logisticType: string | null; freteGratis: boolean }
  fonte: 'api' | 'estimativa'
  aviso: string | null
  freteObrigatorio: boolean
  envio: Envio | null
  modalities: { classico: Modality; premium: Modality }
  error?: string
}

// Extrai o id MLB de um link colado do Mercado Livre. O ML tem VÁRIOS formatos de
// URL e nem todos carregam o id do anúncio de forma óbvia:
//  · anúncio      produto.mercadolivre.com.br/MLB-1234567890-slug   → /items
//  · catálogo     mercadolivre.com.br/…/p/MLB12345678               → /products
//  · recomendação mercadolivre.com.br/…/up/MLBU…#…&wid=MLB123…      → o `wid` é o anúncio real
// Preferimos o `wid` quando existe (é o anúncio vencedor, o que a Pricing sabe
// precificar); senão o id do caminho; e aceitamos o id cru colado direto.
function extractItemId(raw: string): string | null {
  const s = (raw || '').trim()
  if (!s) return null
  const wid = s.match(/[?&#]wid=(MLB\d{6,})/i)          // recomendação/catálogo: o anúncio real
  if (wid) return wid[1].toUpperCase()
  const path = s.match(/MLB-?(\d{6,})/i)                // anúncio ou catálogo no caminho
  if (path) return `MLB${path[1]}`
  const up = s.match(/(MLBU\d{6,})/i)                   // novo formato /up/MLBU… (catálogo)
  if (up) return up[1].toUpperCase()
  return null
}

/* ─── Componentes de apoio ────────────────────────────────────────────────── */
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.t3, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 10.5, color: T.t4, lineHeight: 1.4 }}>{hint}</span>}
    </label>
  )
}
const inputStyle: React.CSSProperties = {
  background: T.modal, border: `1px solid ${T.line}`, borderRadius: 10,
  padding: '10px 12px', fontSize: 14, color: T.t1, outline: 'none', width: '100%',
}

function NumInput({ value, onChange, prefix, suffix, placeholder }: { value: string; onChange: (v: string) => void; prefix?: string; suffix?: string; placeholder?: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {prefix && <span style={{ position: 'absolute', left: 12, fontSize: 13, color: T.t3, pointerEvents: 'none' }}>{prefix}</span>}
      <input
        inputMode="decimal" value={value} placeholder={placeholder || '0'}
        onChange={e => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
        style={{ ...inputStyle, paddingLeft: prefix ? 30 : 12, paddingRight: suffix ? 30 : 12 }}
      />
      {suffix && <span style={{ position: 'absolute', right: 12, fontSize: 13, color: T.t3, pointerEvents: 'none' }}>{suffix}</span>}
    </div>
  )
}

/* ─── Card de uma modalidade (Clássico / Premium) ─────────────────────────── */
function ModalityCard({ nome, cor, m, hint, freteLabel }: { nome: string; cor: string; m: Modality; hint: string; freteLabel?: string }) {
  const lucroCor = m.lucro > 0 ? T.g : m.lucro < 0 ? T.r : T.t2
  const Row = ({ label, val, strong, color }: { label: string; val: string; strong?: boolean; color?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '7px 0', borderTop: `1px solid ${tint(T.line, 60)}` }}>
      <span style={{ fontSize: 12.5, color: strong ? T.t1 : T.t3, fontWeight: strong ? 700 : 500 }}>{label}</span>
      <span style={{ fontSize: strong ? 15 : 13, fontWeight: strong ? 800 : 600, color: color || T.t2, fontVariantNumeric: 'tabular-nums' as const }}>{val}</span>
    </div>
  )
  // A taxa de venda do ML já embute comissão + custo fixo + parcelamento. Mostramos
  // o total (o que de fato deduz) e a composição embaixo quando há fixo/parcelamento.
  const comp: string[] = [`comissão ${pct(m.comissaoPct)}`]
  if (m.parcelamento > 0) comp.push(`parcelamento ${brl(m.parcelamento)}`)
  if (m.custoFixo > 0) comp.push(`custo fixo ${brl(m.custoFixo)}`)
  return (
    <div style={{ flex: 1, minWidth: 250, background: T.card, border: `1px solid ${tint(cor, 40)}`, borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--elev1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: cor, letterSpacing: '-0.01em' }}>{nome}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.t3, background: tint(cor, 12), border: `1px solid ${tint(cor, 30)}`, borderRadius: 20, padding: '2px 9px' }}>comissão {pct(m.comissaoPct)}</span>
      </div>
      <div style={{ fontSize: 10.5, color: T.t4, marginBottom: 12, lineHeight: 1.4 }}>{hint}</div>
      <Row label="Receita (preço)" val={brl(m.receita)} />
      <Row label="Taxa de venda ML" val={`− ${brl(m.comissao)}`} />
      {(m.custoFixo > 0 || m.parcelamento > 0) && (
        <div style={{ fontSize: 10, color: T.t4, padding: '0 0 4px', marginTop: -3 }}>{comp.join(' + ')}</div>
      )}
      {m.imposto > 0 && <Row label="Imposto" val={`− ${brl(m.imposto)}`} />}
      <Row label="Custo do produto" val={`− ${brl(m.custo)}`} />
      {m.frete > 0 && <Row label={freteLabel || 'Frete (Mercado Envios)'} val={`− ${brl(m.frete)}`} color={freteLabel ? T.g : undefined} />}
      {m.ads > 0 && <Row label="Mercado Ads" val={`− ${brl(m.ads)}`} />}
      <Row label="Lucro por venda" val={brl(m.lucro)} strong color={lucroCor} />
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: tint(lucroCor, 10), borderRadius: 10, padding: '8px 0' }}>
        <span style={{ fontSize: 11, color: T.t3, fontWeight: 600 }}>Margem</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: lucroCor, fontVariantNumeric: 'tabular-nums' as const }}>{pct(m.margem)}</span>
      </div>
    </div>
  )
}

/* ─── Tela principal ──────────────────────────────────────────────────────── */
export default function MLCalculator() {
  const [link, setLink] = useState('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [taxPct, setTaxPct] = useState('')
  const [frete, setFrete] = useState('')
  const [adsPct, setAdsPct] = useState('')
  // Medidas do pacote (só pra frete real SEM link — com link o ML usa o pacote do anúncio)
  const [alt, setAlt] = useState('')
  const [larg, setLarg] = useState('')
  const [comp, setComp] = useState('')
  const [peso, setPeso] = useState('')
  // Reputação do SELLER no ML — muda o subsídio do frete grátis (medido 18/08:
  // verde 50% · amarela 40% · vermelha/nova 0%). Salva a escolha do usuário.
  const [reputacao, setReputacao] = useState<string>(() => {
    try { return localStorage.getItem('oraculo_ml_reputacao') || 'green' } catch { return 'green' }
  })
  useEffect(() => { try { localStorage.setItem('oraculo_ml_reputacao', reputacao) } catch {} }, [reputacao])
  const [data, setData] = useState<CalcResp | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const seq = useRef(0)

  const numify = (s: string) => { const n = parseFloat((s || '').replace(/\./g, '').replace(',', '.')); return isFinite(n) ? n : 0 }

  const calc = useCallback(async () => {
    const itemId = extractItemId(link)
    const p = numify(price)
    // Sem link e sem preço não há o que calcular — limpa e sai quieto.
    if (!itemId && p <= 0) { setData(null); setErro(null); setLoading(false); return }
    const id = ++seq.current
    setLoading(true); setErro(null)
    try {
      const body: Record<string, unknown> = { cost: numify(cost), taxPct: numify(taxPct), frete: numify(frete), adsPct: numify(adsPct) }
      if (itemId) body.itemId = itemId
      if (p > 0) body.price = p
      // Medidas (altura x largura x comprimento, em cm + peso em g) → frete real sem
      // link. Só manda quando as 4 estão preenchidas (o backend precisa do pacote todo).
      const a = numify(alt), l = numify(larg), c = numify(comp), g = numify(peso)
      if (!itemId && a > 0 && l > 0 && c > 0 && g > 0) body.dimensions = `${a}x${l}x${c},${g}`
      body.reputation = reputacao
      const r = await fetch('/api/ml/calc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j: CalcResp = await r.json()
      if (id !== seq.current) return // resposta velha, ignora
      if (!r.ok || j.error) {
        // Beco comum: link que o ML não deixou resolver E sem preço digitado. Em vez
        // do erro cru do backend, orienta — a estimativa por preço sempre funciona.
        if (itemId && p <= 0) setErro('Não consegui ler esse anúncio pelo link (o Mercado Livre tem vários formatos de URL). Digite o preço de venda para estimar agora, ou tente o link direto do anúncio.')
        else setErro(j.error || 'Não foi possível calcular. Confira o preço ou o link.')
        setData(null)
      } else { setData(j); if (j.item && p <= 0) setPrice(String(j.item.precoAnuncio).replace('.', ',')) }
    } catch {
      if (id === seq.current) { setErro('Falha de conexão ao calcular.'); setData(null) }
    } finally {
      if (id === seq.current) setLoading(false)
    }
  }, [link, price, cost, taxPct, frete, adsPct, alt, larg, comp, peso, reputacao])

  // Debounce: recalcula ~450ms depois da última tecla.
  useEffect(() => { const t = setTimeout(calc, 450); return () => clearTimeout(t) }, [calc])

  const real = data?.fonte === 'api'
  const item = data?.item

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', width: '100%', paddingTop: 20 }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#fff159', background: '#2d3277', borderRadius: 6, padding: '3px 8px', letterSpacing: '0.02em' }}>Mercado Livre</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em' }}>Calculadora de Lucro</h2>
        </div>
        <p style={{ fontSize: 13, color: T.t3, lineHeight: 1.6, maxWidth: 640 }}>
          Descubra o lucro e a margem de um produto no ML — Clássico e Premium lado a lado.
          Cole o <strong style={{ color: T.t2 }}>link do anúncio</strong> pra comissão <strong style={{ color: T.g }}>real</strong> da categoria (e ver quantos ele já vendeu), ou digite o preço pra uma estimativa.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* ── Coluna de entradas ── */}
        <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 14, background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 20, boxShadow: 'var(--elev1)' }}>
          <Field label="Link do anúncio (opcional)" hint="Cole a URL do produto no Mercado Livre para a comissão REAL da categoria.">
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="mercadolivre.com.br/... ou MLB1234567890" style={inputStyle} />
          </Field>
          <Field label="Preço de venda" hint={item ? 'Preenchido pelo anúncio — pode ajustar para simular.' : undefined}>
            <NumInput value={price} onChange={setPrice} prefix="R$" placeholder="0,00" />
          </Field>
          <Field label="Custo do produto">
            <NumInput value={cost} onChange={setCost} prefix="R$" placeholder="0,00" />
          </Field>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Imposto"><NumInput value={taxPct} onChange={setTaxPct} suffix="%" /></Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Mercado Ads"><NumInput value={adsPct} onChange={setAdsPct} suffix="%" /></Field>
            </div>
          </div>
          {/* Medidas → frete REAL sem link. Com link, o ML usa o pacote do anúncio
              e estes campos não são necessários. */}
          {!extractItemId(link) && (
            <Field label="Medidas do pacote (pra frete real)" hint="Altura × Largura × Comprimento (cm) e peso (g). Com o link do anúncio, o frete real vem sozinho.">
              <div style={{ display: 'flex', gap: 6 }}>
                <NumInput value={alt} onChange={setAlt} suffix="A" placeholder="alt" />
                <NumInput value={larg} onChange={setLarg} suffix="L" placeholder="larg" />
                <NumInput value={comp} onChange={setComp} suffix="C" placeholder="comp" />
                <NumInput value={peso} onChange={setPeso} suffix="g" placeholder="peso" />
              </div>
            </Field>
          )}
          <Field label="Sua reputação no ML" hint="Muda o subsídio do frete grátis: verde = ML cobre 50% · amarela 40% · vermelha/nova 0%.">
            <select value={reputacao} onChange={e => setReputacao(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="green">🟢 Verde / MercadoLíder</option>
              <option value="yellow">🟡 Amarela</option>
              <option value="red">🔴 Vermelha / conta nova</option>
            </select>
          </Field>
          <Field label="Frete (manual)" hint={data?.envio ? '✓ Frete real da API em uso — este campo é ignorado.' : (data?.freteObrigatorio ? '⚠️ ≥R$79 o frete grátis é obrigatório. Cole o link ou informe as medidas p/ o valor real.' : 'Só se você paga o frete e não informou link/medidas.')}>
            <NumInput value={frete} onChange={setFrete} prefix="R$" placeholder="0,00" />
          </Field>
        </div>

        {/* ── Coluna de resultados ── */}
        <div style={{ flex: '2 1 420px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Selo da fonte */}
          {data && (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 12, fontWeight: 700, color: real ? T.g : T.a, background: tint(real ? T.g : T.a, 10), border: `1px solid ${tint(real ? T.g : T.a, 30)}`, borderRadius: 10, padding: '9px 13px' }}>
              <span>{real ? '✓ Comissão REAL da API do Mercado Livre' : '≈ Comissão ESTIMADA'}</span>
              {data.envio && (
                <span style={{ fontWeight: 700, color: T.g }}>
                  · 🚚 {data.envio.cenario === 'logistica' ? 'Logística ML' : 'Frete real'} {brl(data.envio.custoVendedor)}
                  {data.envio.pesoFaturavel ? ` (${(data.envio.pesoFaturavel / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg faturável)` : ''}
                  {data.envio.subsidioPct != null && data.envio.custoCheio != null && data.envio.subsidioPct > 0 && (
                    <span style={{ fontWeight: 500, color: T.t3 }}> — reputação {data.envio.reputacao === 'green' ? 'verde' : data.envio.reputacao}: ML cobre {data.envio.subsidioPct}% de {brl(data.envio.custoCheio)}</span>
                  )}
                  {data.envio.cenario === 'logistica' && (
                    <span style={{ fontWeight: 500, color: T.t3 }}> · o comprador paga o frete; você paga a gestão do envio</span>
                  )}
                </span>
              )}
              {!real && <span style={{ fontWeight: 500, color: T.t3 }}>— cole o link do anúncio para a comissão exata.</span>}
            </div>
          )}

          {/* Card do anúncio (quando veio por link) */}
          {item && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 12, boxShadow: 'var(--elev1)' }}>
              {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', background: T.modal, flexShrink: 0 }} />}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.titulo}</div>
                <div style={{ fontSize: 11.5, color: T.t3, marginTop: 3 }}>
                  {item.vendidos != null ? <span style={{ color: T.g, fontWeight: 700 }}>{item.vendidos.toLocaleString('pt-BR')} vendidos</span> : <span>vendas não informadas</span>}
                  <span style={{ color: T.t4 }}> · {item.id}</span>
                </div>
              </div>
            </div>
          )}

          {loading && !data && <div style={{ padding: 40, textAlign: 'center', color: T.t3, fontSize: 13 }}>Calculando…</div>}
          {erro && <div style={{ padding: '14px 16px', textAlign: 'center', color: T.r, fontSize: 13, background: tint(T.r, 8), border: `1px solid ${tint(T.r, 25)}`, borderRadius: 12 }}>{erro}</div>}

          {data && (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', opacity: loading ? 0.55 : 1, transition: 'opacity .15s' }}>
              <ModalityCard nome="Clássico" cor={T.pur} m={data.modalities.classico} hint="Mais barato, sem destaque nas buscas." freteLabel={data.envio ? (data.envio.cenario === 'logistica' ? 'Logística ML (comprador paga o frete)' : 'Frete real (Mercado Envios)') : undefined} />
              <ModalityCard nome="Premium" cor={T.gold} m={data.modalities.premium} hint="Comissão maior, mais exposição + parcelamento sem juros." freteLabel={data.envio ? (data.envio.cenario === 'logistica' ? 'Logística ML (comprador paga o frete)' : 'Frete real (Mercado Envios)') : undefined} />
            </div>
          )}

          {!data && !loading && !erro && (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13, lineHeight: 1.6 }}>
              Cole o link de um anúncio do Mercado Livre<br />ou digite um preço de venda para começar.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
