'use client'

import Reveal from './Reveal'
import { LayoutDashboard, Pickaxe, Calculator, Puzzle, Bot, ArrowUpRight } from 'lucide-react'

function CardShell({
  area, icon, accent, title, tag, children,
}: {
  area: string; icon: React.ReactNode; accent: string; title: string; tag: string; children?: React.ReactNode
}) {
  return (
    <div className="ora-card ora-card-glow" style={{ gridArea: area, padding: 22, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 6 }}>
        <span style={{
          width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center',
          color: accent, background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}33`,
        }}>{icon}</span>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.1 }}>{title}</h3>
          <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{tag}</span>
        </div>
      </div>
      <div style={{ marginTop: 14, flex: 1 }}>{children}</div>
    </div>
  )
}

const kpis = [
  { k: 'Lucro real', v: 'R$ 26.557', c: 'var(--emerald)' },
  { k: 'Margem', v: '30,4%', c: 'var(--gold)' },
  { k: 'ROI', v: '142%', c: 'var(--violet)' },
]
const bars = [38, 52, 44, 67, 59, 78, 71, 90]

export default function Poderes() {
  return (
    <section id="poderes" className="ora-section">
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <Reveal><span className="ora-eyebrow">Os poderes do Oráculo</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="ora-h2">Sua operação Amazon<br /><span className="ora-goldtext">inteira numa tela.</span></h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="ora-lead" style={{ margin: '20px auto 0' }}>
            Gestão, mineração, concorrência, calculadora e extensão — o que hoje custa 4 ou 5 ferramentas, num só lugar.
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <div className="ora-bento">
          {/* GESTÃO (grande) */}
          <CardShell area="g" icon={<LayoutDashboard size={19} />} accent="var(--gold)"
            title="Gestão — o raio-x financeiro" tag="DRE real e automática">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
              {kpis.map((x) => (
                <div key={x.k} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{x.k}</div>
                  <div className="ora-mini" style={{ fontSize: 18, fontWeight: 700, color: x.c }}>{x.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 76, padding: '0 2px' }}>
              {bars.map((h, i) => (
                <div key={i} style={{
                  flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0',
                  background: 'linear-gradient(180deg, #F0C262, rgba(240,194,98,0.25))',
                }} />
              ))}
            </div>
            <p style={{ marginTop: 14, fontSize: 13.5, color: 'var(--tx2)' }}>
              Faturamento, comissões, FBA, armazenagem, ads e devoluções calculados sozinhos — por data do pedido.
              <strong style={{ color: 'var(--tx1)' }}> Bate ao centavo com a Amazon.</strong>
            </p>
          </CardShell>

          {/* MINERAÇÃO */}
          <CardShell area="m" icon={<Pickaxe size={19} />} accent="var(--emerald)"
            title="Mineração" tag="Produtos vencedores">
            {[
              ['Suporte Pescoço', '+312%'],
              ['Kit Skincare', '+234%'],
              ['Organizador Gaveta', '+189%'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9 }}>
                <span style={{ fontSize: 13, color: 'var(--tx1)' }}>{n}</span>
                <span className="ora-mini ora-pos" style={{ fontSize: 13, fontWeight: 700 }}>{t}</span>
              </div>
            ))}
          </CardShell>

          {/* CALCULADORA */}
          <CardShell area="c" icon={<Calculator size={19} />} accent="var(--blue)"
            title="Calculadora de precisão" tag="Lucro antes de comprar">
            {[
              ['Preço de venda', 'R$ 67,00', ''],
              ['Taxa + FBA', '− R$ 22,45', 'neg'],
              ['Custo produto', '− R$ 18,00', 'neg'],
              ['Lucro líquido', 'R$ 26,55', 'pos'],
            ].map(([k, v, t]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 13, color: 'var(--tx2)' }}>{k}</span>
                <span className={`ora-mini ${t === 'pos' ? 'ora-pos' : t === 'neg' ? 'ora-neg' : ''}`} style={{ fontSize: 13, fontWeight: t === 'pos' ? 700 : 500, color: t ? undefined : 'var(--tx1)' }}>{v}</span>
              </div>
            ))}
          </CardShell>

          {/* EXTENSÃO */}
          <CardShell area="e" icon={<Puzzle size={19} />} accent="var(--gold)"
            title="Extensão Chrome" tag="Inteligência na página do produto">
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '8px 10px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', gap: 4 }}>
                {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
              </span>
              <span className="ora-mini" style={{ fontSize: 11.5, color: 'var(--tx3)' }}>amazon.com.br/dp/B0…</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['ROI', '142%', 'var(--emerald)'], ['Payback', '3 vendas', 'var(--gold)'], ['SEO', '82/100', 'var(--violet)']].map(([k, v, c]) => (
                <div key={k} style={{ flex: '1 1 30%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${c}26`, borderRadius: 9, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--tx3)', textTransform: 'uppercase' }}>{k}</div>
                  <div className="ora-mini" style={{ fontSize: 15, fontWeight: 700, color: c as string }}>{v}</div>
                </div>
              ))}
            </div>
          </CardShell>

          {/* AGENTE IA */}
          <CardShell area="a" icon={<Bot size={19} />} accent="var(--violet)"
            title="Agente IA" tag="Decida acompanhado">
            <div style={{ background: 'rgba(169,155,255,0.08)', border: '1px solid rgba(169,155,255,0.2)', borderRadius: '12px 12px 12px 3px', padding: '10px 12px', fontSize: 13, color: 'var(--tx1)', lineHeight: 1.45 }}>
              “Seu produto X tem margem 8% e ACoS subindo. Sugiro reduzir lance e focar no kit Y.”
            </div>
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--violet)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--violet)', boxShadow: '0 0 8px var(--violet)' }} /> usa seus créditos de IA
            </div>
          </CardShell>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div style={{ textAlign: 'center', marginTop: 40, display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap', color: 'var(--tx2)', fontSize: 13.5 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowUpRight size={15} color="var(--gold)" /> Curva ABC</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowUpRight size={15} color="var(--gold)" /> Estoque FBA + alertas</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowUpRight size={15} color="var(--gold)" /> Análise de concorrência</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowUpRight size={15} color="var(--gold)" /> Relatórios CSV</span>
        </div>
      </Reveal>
    </section>
  )
}
