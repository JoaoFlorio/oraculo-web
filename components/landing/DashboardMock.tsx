'use client'

/**
 * Mockup do painel do Oráculo — desenhado 100% em CSS/SVG (nada de print).
 * Desenhado a 860px e escalado via ScaledFrame por quem o usa.
 * Números: conta demo (fake) — os mesmos das peças de referência.
 */

import type { CSSProperties, ReactNode } from 'react'
import {
  MoneyUp, PctUp, IntUp, Trend, Spark, Donut, useRun,
} from './ui'

/* tokens internos do mock */
const M = {
  shell: '#0A0C14',
  side: '#0B0D16',
  card: 'rgba(255,255,255,0.028)',
  line: 'rgba(255,255,255,0.065)',
  gold: '#F0C262',
  green: '#3FD79B',
  red: '#FF8A8A',
  violet: '#A99BFF',
  blue: '#5E9BE0',
  t1: '#EDEEF7', t2: '#9AA6C0', t3: '#5C6680',
}

const up = [12, 16, 14, 21, 19, 26, 24, 31, 29, 38, 41, 47]
const up2 = [8, 12, 11, 15, 19, 17, 24, 22, 28, 33, 31, 39]
const wavy = [22, 18, 25, 21, 30, 26, 34, 30, 38, 35, 44, 41]

function SideItem({ label, icon, active }: { label: string; icon: ReactNode; active?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
      borderRadius: 8, fontSize: 11.5, fontWeight: active ? 700 : 500,
      color: active ? '#161006' : M.t2,
      background: active ? 'linear-gradient(135deg,#FFE7A6,#E0AC3C)' : 'transparent',
      boxShadow: active ? '0 4px 14px -6px rgba(240,194,98,.55)' : 'none',
    }}>
      <span style={{ display: 'inline-flex', opacity: active ? 1 : 0.75 }}>{icon}</span>
      {label}
    </div>
  )
}

function SideGroup({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 8.5, letterSpacing: '.16em', color: M.t3, textTransform: 'uppercase',
      padding: '10px 10px 4px', fontWeight: 700,
    }}>{title}</div>
  )
}

/* mini ícones geométricos (SVG inline, 12px) */
const ic = (d: string, extra?: ReactNode) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />{extra}
  </svg>
)
const I = {
  home: ic('M3 12 12 4l9 8M5 10v9h5v-5h4v5h5v-9'),
  sales: ic('M3 17l5-5 4 3 8-8M16 7h5v5'),
  abc: ic('M21 12A9 9 0 1 1 12 3v9z'),
  ads: ic('M3 11v2l9 4 9-4v-2M12 3 3 7l9 4 9-4z'),
  dre: ic('M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01'),
  prod: ic('M21 8 12 3 3 8v8l9 5 9-5zM12 13 3 8M12 13l9-5M12 13v8'),
  stock: ic('M3 9h18v11H3zM8 9V5h8v4'),
  rep: ic('M14 3v6h6M14 3H6v18h12V9z'),
  mine: ic('M6 3h12l4 6-10 12L2 9zM2 9h20'),
  calc: ic('M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01'),
  ext: ic('M4 7h9v9H4zM13 10h3a3 3 0 0 1 0 6h-1M9 4v3M17 13V9a2 2 0 0 0-2-2'),
  ia: ic('M12 2a7 7 0 0 1 7 7c0 2.5-1.5 4-3 5.5V17H8v-2.5C6.5 13 5 11.5 5 9a7 7 0 0 1 7-7zM9 21h6'),
}

function Kpi({ label, children, trend, down, spark, sparkColor, delay = 0, style }: {
  label: string; children: ReactNode; trend?: string; down?: boolean
  spark?: number[]; sparkColor?: string; delay?: number; style?: CSSProperties
}) {
  return (
    <div style={{
      background: M.card, border: `1px solid ${M.line}`, borderRadius: 10,
      padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, ...style,
    }}>
      <span style={{ fontSize: 9.5, color: M.t2, letterSpacing: '.02em' }}>{label}</span>
      <span style={{ fontSize: 17, fontWeight: 800, color: M.t1, lineHeight: 1 }}>{children}</span>
      {trend && <Trend value={trend} down={down} size={8.5} />}
      {spark && <div style={{ marginTop: 2 }}><Spark data={spark} w={118} h={22} color={sparkColor ?? M.green} delay={delay} strokeWidth={1.6} /></div>}
    </div>
  )
}

function DreRow({ label, value, neg, strong, delay }: {
  label: string; value: string; neg?: boolean; strong?: boolean; delay?: number
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: strong ? '7px 2px 1px' : '4.5px 2px',
      borderBottom: strong ? 'none' : `1px solid rgba(255,255,255,0.045)`,
      borderTop: strong ? `1px solid ${M.line}` : 'none',
      marginTop: strong ? 3 : 0,
    }}>
      <span style={{
        fontSize: strong ? 11.5 : 10, color: strong ? M.green : neg ? M.t2 : M.t1,
        fontWeight: strong ? 800 : 500,
      }}>{label}</span>
      <span className="ora-num" style={{
        fontSize: strong ? 13 : 10, fontWeight: strong ? 800 : 600,
        color: strong ? M.green : neg ? M.red : M.t1,
      }}>{value}</span>
    </div>
  )
}

export default function DashboardMock({ compact = false }: { compact?: boolean }) {
  const run = useRun()
  return (
    <div style={{
      width: 860, display: 'flex', borderRadius: 14, overflow: 'hidden',
      background: M.shell, border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: '0 40px 120px -30px rgba(0,0,0,.9), 0 0 80px -30px rgba(240,194,98,.28), inset 0 1px 0 rgba(255,255,255,.05)',
      fontFamily: 'var(--font-body), system-ui, sans-serif',
      textAlign: 'left',
    }}>
      {/* ── sidebar ── */}
      <div style={{
        width: 152, flexShrink: 0, background: M.side, borderRight: `1px solid ${M.line}`,
        padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '2px 10px 10px' }}>
          <svg width="16" height="16" viewBox="0 0 48 48" fill="none" aria-hidden>
            <ellipse cx="24" cy="24" rx="21" ry="11.5" stroke="#F0C262" strokeWidth="3" />
            <circle cx="24" cy="24" r="7" fill="#F0C262" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', color: M.gold }}>ORÁCULO</span>
        </div>
        <SideGroup title="Gestão" />
        <SideItem label="Resumo" icon={I.home} active />
        <SideItem label="Vendas" icon={I.sales} />
        <SideItem label="Curva ABC" icon={I.abc} />
        <SideItem label="Anúncios" icon={I.ads} />
        <SideGroup title="Análises" />
        <SideItem label="DRE" icon={I.dre} />
        <SideItem label="Produtos" icon={I.prod} />
        <SideItem label="Estoque" icon={I.stock} />
        <SideItem label="Relatórios" icon={I.rep} />
        <SideGroup title="Ferramentas" />
        <SideItem label="Mineração" icon={I.mine} />
        <SideItem label="Calculadora" icon={I.calc} />
        <SideItem label="Extensão" icon={I.ext} />
        <SideItem label="Agente IA" icon={I.ia} />
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px',
          borderTop: `1px solid ${M.line}`,
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#FFE7A6,#C48F10)',
            display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 800, color: '#161006',
          }}>J</div>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: M.t1 }}>João P.</div>
            <div style={{ fontSize: 8, color: M.gold }}>Seller Pro</div>
          </div>
        </div>
      </div>

      {/* ── main ── */}
      <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: M.t1 }}>Resumo Geral</div>
            <div style={{ fontSize: 9.5, color: M.t3, marginTop: 1 }}>Visão completa da sua operação Amazon</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 9.5, color: M.t2,
            border: `1px solid ${M.line}`, borderRadius: 7, padding: '5px 9px',
          }}>
            Últimos 30 dias
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>

        {/* KPIs linha 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
          <Kpi label="Faturamento" trend="23,6%" spark={up} sparkColor={M.green}>
            <MoneyUp value={8817.65} />
          </Kpi>
          <Kpi label="Lucro Bruto" trend="28,6%" spark={up2} sparkColor={M.green} delay={0.1}>
            <MoneyUp value={2972.88} delay={100} />
          </Kpi>
          <Kpi label="Margem" trend="5,4%">
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <PctUp value={33.7} delay={150} />
              <Donut size={34} thickness={6} delay={0.3}
                segments={[{ value: 33.7, color: M.violet }, { value: 66.3, color: 'rgba(255,255,255,0.09)' }]} />
            </span>
          </Kpi>
          <Kpi label="ROI (Ads)" trend="12,1%" spark={wavy} sparkColor={M.violet} delay={0.2}>
            <PctUp value={64.4} delay={200} />
          </Kpi>
        </div>

        {/* KPIs linha 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
          <Kpi label="TACOS" trend="1,3%" down><PctUp value={12.6} delay={250} /></Kpi>
          <Kpi label="Ticket Médio" trend="8,1%"><MoneyUp value={122.47} delay={300} /></Kpi>
          <Kpi label="Produtos em Alta" trend="18 novos esta semana">
            <IntUp value={60} delay={350} />
          </Kpi>
          {/* Curva ABC */}
          <div style={{
            background: M.card, border: `1px solid ${M.line}`,
            borderRadius: 10, padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <span style={{ fontSize: 9.5, color: M.t2 }}>Curva ABC</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <Donut size={62} thickness={11} delay={0.4} segments={[
                { value: 70, color: M.green }, { value: 20, color: M.violet }, { value: 10, color: M.blue },
              ]} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { c: M.green, l: 'Classe A (70%)', n: '12 produtos' },
                  { c: M.violet, l: 'Classe B (20%)', n: '18 produtos' },
                  { c: M.blue, l: 'Classe C (10%)', n: '30 produtos' },
                ].map((x) => (
                  <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 8.5, whiteSpace: 'nowrap' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: x.c, flexShrink: 0 }} />
                    <span style={{ color: M.t1, fontWeight: 600 }}>{x.l}</span>
                    <span style={{ color: M.t3 }}>{x.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DRE + evolução */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.16fr 1fr', gap: 8 }}>
          <div style={{ background: M.card, border: `1px solid ${M.line}`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: M.t1 }}>DRE — Demonstração do Resultado</span>
              <span style={{ fontSize: 8.5, color: M.t3, border: `1px solid ${M.line}`, borderRadius: 5, padding: '2px 6px' }}>Diário ▾</span>
            </div>
            <DreRow label="Receita Líquida" value="R$ 8.817,65" />
            <DreRow label="(−) Custo dos Produtos" value="− R$ 4.450,00" neg />
            <DreRow label="(−) Tarifas Amazon" value="− R$ 1.742,31" neg />
            <DreRow label="(−) Frete até Amazon" value="− R$ 350,00" neg />
            <DreRow label="(−) Ads" value="− R$ 1.179,01" neg />
            <DreRow label="Outros custos" value="− R$ 123,45" neg />
            <DreRow label="Lucro Líquido" value="R$ 2.972,88" strong />
          </div>

          <div style={{ background: M.card, border: `1px solid ${M.line}`, borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: M.t1 }}>Evolução do Lucro Líquido</span>
              <span style={{ fontSize: 8.5, color: M.t3, border: `1px solid ${M.line}`, borderRadius: 5, padding: '2px 6px' }}>Diário ▾</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 12 }}>
                {['R$ 3k', 'R$ 2k', 'R$ 1k', 'R$ 0'].map((t) => (
                  <span key={t} className="ora-num" style={{ fontSize: 7.5, color: M.t3 }}>{t}</span>
                ))}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, opacity: run ? 1 : 0, transition: 'opacity .5s' }}>
                  <Spark data={[9, 14, 11, 18, 15, 23, 19, 28, 24, 33, 30, 39, 36, 44]}
                    w={244} h={78} color={M.violet} delay={0.35} strokeWidth={2} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  {['30/Abr', '05/Mai', '10/Mai', '15/Mai', '20/Mai', '25/Mai', '30/Mai'].map((t) => (
                    <span key={t} className="ora-num" style={{ fontSize: 7, color: M.t3 }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
