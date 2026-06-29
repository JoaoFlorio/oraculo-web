'use client'

import Reveal from './Reveal'
import { FileSpreadsheet, EyeOff, Dices } from 'lucide-react'

const dores = [
  {
    icon: <FileSpreadsheet size={22} />,
    title: 'A planilha que nunca acaba',
    desc: 'Você exporta relatório, cola no Excel, conserta fórmula, e quando termina… já mudou tudo de novo.',
  },
  {
    icon: <EyeOff size={22} />,
    title: 'Comissão e FBA no escuro',
    desc: 'A Amazon desconta taxa, FBA, armazenagem, devolução — e some com o seu lucro sem te avisar quanto.',
  },
  {
    icon: <Dices size={22} />,
    title: 'Decisão no achismo',
    desc: 'Qual produto repor? Qual campanha pausar? Você decide no “feeling” e torce pra dar certo.',
  },
]

export default function Problema() {
  return (
    <section className="ora-section" style={{ maxWidth: 1100 }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <Reveal><span className="ora-eyebrow">O ponto cego</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="ora-h2">
            Vender você já sabe.<br />
            Mas você sabe seu <span className="ora-goldtext">lucro real?</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="ora-lead" style={{ margin: '20px auto 0' }}>
            Faturamento alto não é lucro. A maioria dos sellers descobre tarde demais que o
            produto “campeão de vendas” estava dando prejuízo o tempo todo.
          </p>
        </Reveal>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
        {dores.map((d, i) => (
          <Reveal key={d.title} delay={0.1 + i * 0.08}>
            <div className="ora-card ora-card-glow" style={{ padding: 24, height: '100%' }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center',
                color: '#FF8B8B', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.18)',
                marginBottom: 16,
              }}>{d.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{d.title}</h3>
              <p style={{ color: 'var(--tx2)', fontSize: 14.5, lineHeight: 1.55 }}>{d.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* contraste visual: caos vs clareza */}
      <Reveal delay={0.15}>
        <div style={{
          marginTop: 40, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0,
          alignItems: 'stretch', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)',
        }} className="ora-contrast">
          {/* caos */}
          <div style={{ padding: 22, background: 'rgba(10,10,18,0.6)' }}>
            <div style={{ fontSize: 12, letterSpacing: '.1em', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 12 }}>Antes · planilha</div>
            <div style={{ filter: 'blur(0.6px) saturate(0.4)', opacity: 0.6 }}>
              {['SKU-2231  =SOMA(B2:B40)?', 'comissão  ??? ', 'FBA       #REF!', 'lucro     —', 'margem    ???'].map((r) => (
                <div key={r} className="ora-mini" style={{
                  fontSize: 12.5, color: '#8A8AA8', padding: '7px 9px', marginBottom: 5,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6,
                }}>{r}</div>
              ))}
            </div>
          </div>
          {/* seta */}
          <div style={{ display: 'grid', placeItems: 'center', padding: '0 18px', background: 'rgba(8,8,16,0.5)' }}>
            <span className="ora-goldtext" style={{ fontSize: 26, fontWeight: 800 }}>→</span>
          </div>
          {/* clareza */}
          <div style={{ padding: 22, background: 'linear-gradient(180deg, rgba(240,194,98,0.05), rgba(8,8,18,0.5))' }}>
            <div style={{ fontSize: 12, letterSpacing: '.1em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 12 }}>Com o Oráculo</div>
            {[
              ['Faturamento', 'R$ 87.412,00', ''],
              ['Comissão + FBA', '− R$ 22.880,40', 'neg'],
              ['Lucro real', 'R$ 26.557,00', 'pos'],
              ['Margem', '30,4%', 'pos'],
            ].map(([k, v, t]) => (
              <div key={k as string} style={{
                display: 'flex', justifyContent: 'space-between', padding: '7px 9px', marginBottom: 5,
                background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(240,194,98,0.12)', borderRadius: 6,
              }}>
                <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>{k}</span>
                <span className={`ora-mini ${t === 'pos' ? 'ora-pos' : t === 'neg' ? 'ora-neg' : ''}`} style={{ fontSize: 12.5, color: t ? undefined : 'var(--tx1)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
