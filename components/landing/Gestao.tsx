'use client'

/**
 * Gestão e DRE real — "Veja o lucro que a Amazon não mastiga para você."
 * (imagem de ref. 3): dashboard central + KPIs flutuantes nas laterais.
 */

import { Crosshair, Table2, Star, Download, BadgeCheck, Zap, ShieldCheck } from 'lucide-react'
import Reveal from './Reveal'
import DashboardMock from './DashboardMock'
import { SectionHead, MiniFeature, FootIcon } from './Section'
import { RunWhenVisible, ScaledFrame, Float, MoneyUp, PctUp, Trend, Spark, Donut, Bars } from './ui'

function SideKpi({ label, value, trend, down, spark, sparkColor, bars, donut, sub, delay = 0 }: {
  label: string; value: React.ReactNode; trend?: string; down?: boolean
  spark?: number[]; sparkColor?: string; bars?: boolean; donut?: boolean; sub?: string; delay?: number
}) {
  return (
    <Float delay={delay} amp={6} dur={6}>
      <div className="ora-glass" style={{ borderRadius: 14, padding: '13px 15px' }}>
        <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 5 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--tx1)' }}>{value}</div>
          {donut && (
            <Donut size={40} thickness={7} segments={[
              { value: 33.7, color: 'var(--violet)' }, { value: 66.3, color: 'rgba(255,255,255,0.08)' },
            ]} />
          )}
        </div>
        {sub && <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 2 }}>{sub}</div>}
        {spark && <div style={{ margin: '7px 0 5px' }}><Spark data={spark} w={122} h={26} color={sparkColor ?? 'var(--emerald)'} /></div>}
        {bars && <div style={{ margin: '7px 0 5px' }}><Bars data={[10, 14, 9, 16, 12, 19, 15, 22, 17, 24]} w={122} h={26} color="var(--violet)" /></div>}
        {trend && <Trend value={trend} size={9.5} down={down} />}
      </div>
    </Float>
  )
}

export default function Gestao() {
  return (
    <section id="gestao" style={{ position: 'relative', background: 'var(--ink)' }}>
      <div className="ora-divider" />
      <div className="ora-section" style={{ maxWidth: 1280 }}>
        <SectionHead
          eyebrow="Gestão e DRE real"
          title={<>Veja o lucro que a Amazon<br /><span className="ora-goldtext">não mastiga</span> para você.</>}
          lead="Faturamento, taxas, FBA, armazenagem, devoluções, Ads e margem real — tudo consolidado numa visão financeira de verdade, ao centavo."
        />

        {/* composição: KPIs à esquerda + dashboard + KPIs à direita */}
        <RunWhenVisible amount={0.15}>
          <div className="ora-gestao-grid" style={{
            display: 'grid', gridTemplateColumns: '180px minmax(0, 1fr) 180px',
            gap: 20, alignItems: 'center', marginTop: 'clamp(44px, 7vh, 70px)',
          }}>
            {/* lateral esquerda */}
            <div className="ora-gestao-side" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SideKpi label="Faturamento" value={<MoneyUp value={8817.65} />} trend="23,6%"
                spark={[10, 15, 12, 19, 16, 24, 21, 30, 36]} delay={0.2} />
              <SideKpi label="Margem" value={<PctUp value={33.7} />} trend="5,4%" donut delay={0.9} />
              <SideKpi label="Estoque FBA" value={<MoneyUp value={24850.9} />} sub="em valor de custo" bars delay={0.5} />
              <SideKpi label="Reembolsos" value={<MoneyUp value={1742.31} />} trend="12,2%" down
                spark={[24, 20, 22, 17, 19, 14, 16, 12, 10]} sparkColor="#FF8A8A" delay={1.3} />
            </div>

            {/* dashboard central */}
            <Reveal delay={0.1}>
              <div style={{
                borderRadius: 18, padding: 8,
                background: 'linear-gradient(180deg, rgba(240,194,98,0.14), rgba(240,194,98,0.03))',
                border: '1px solid rgba(240,194,98,0.25)',
                boxShadow: '0 50px 130px -40px rgba(0,0,0,.95), 0 0 100px -40px rgba(240,194,98,.4)',
              }}>
                <ScaledFrame designWidth={860}>
                  <DashboardMock />
                </ScaledFrame>
              </div>
            </Reveal>

            {/* lateral direita */}
            <div className="ora-gestao-side" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SideKpi label="Lucro Bruto" value={<span style={{ color: 'var(--emerald)' }}><MoneyUp value={2972.88} /></span>} trend="28,6%"
                spark={[8, 13, 11, 17, 15, 22, 19, 27, 33]} delay={0.6} />
              <SideKpi label="ROI (Ads)" value={<PctUp value={64.4} />} trend="12,1%"
                spark={[16, 13, 19, 16, 23, 20, 27, 25, 31]} sparkColor="var(--violet)" delay={0.1} />
              <SideKpi label="TACOS" value={<PctUp value={12.6} />} trend="1,3%" down
                spark={[26, 23, 24, 21, 22, 19, 20, 17, 15]} sparkColor="var(--violet)" delay={1} />
              <SideKpi label="Lucro pós Ads" value={<span style={{ color: 'var(--emerald)' }}><MoneyUp value={1130.67} /></span>} trend="31,5%"
                spark={[6, 10, 8, 13, 11, 16, 14, 19, 24]} delay={0.4} />
            </div>
          </div>
        </RunWhenVisible>

        {/* 4 mini-features */}
        <div className="ora-mini4" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
          marginTop: 'clamp(40px, 6vh, 60px)',
        }}>
          <MiniFeature icon={<Crosshair size={20} />} title="Bate ao centavo" delay={0}
            desc="Números precisos e atualizados direto da Amazon. Sem achismo, sem arredondamento." />
          <MiniFeature icon={<Table2 size={20} />} title="Sem planilha" delay={0.08}
            desc="Tudo automatizado. Chega de planilhas confusas e horas de conferência manual." />
          <MiniFeature icon={<Star size={20} />} title="Top produtos" delay={0.16}
            desc="Descubra seus campeões de lucro e foque no que realmente faz seu negócio crescer." />
          <MiniFeature icon={<Download size={20} />} title="Relatórios CSV" delay={0.24}
            desc="Exportes completos para análises avançadas e integração com suas ferramentas." />
        </div>

        {/* CTA */}
        <Reveal delay={0.1}>
          <div style={{ textAlign: 'center', marginTop: 'clamp(36px, 5vh, 52px)' }}>
            <a href="#planos" className="ora-cta" style={{ fontSize: '1.05rem', padding: '1.05rem 2.2rem' }}>
              Começar agora →
            </a>
            <div style={{
              display: 'flex', gap: '8px 26px', flexWrap: 'wrap', justifyContent: 'center',
              marginTop: 22, color: 'var(--tx3)', fontSize: 12.5,
            }}>
              <FootIcon icon={<BadgeCheck size={14} />} label="Integração oficial Amazon" />
              <FootIcon icon={<ShieldCheck size={14} />} label="Dados reais" />
              <FootIcon icon={<Zap size={14} />} label="Acesso imediato" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
