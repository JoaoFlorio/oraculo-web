'use client'

/**
 * FAQ — accordion nativo (details/summary) estilizado.
 */

import Reveal from './Reveal'
import { SectionHead } from './Section'

const FAQS = [
  {
    q: 'O Oráculo mostra meu lucro real?',
    a: 'Sim. Conectando sua conta Amazon via integração oficial, o Oráculo monta sua DRE automaticamente: faturamento, taxas, FBA, Ads, devoluções e custo dos produtos — chegando no lucro líquido ao centavo.',
  },
  {
    q: 'Preciso conectar minha conta Amazon?',
    a: 'Para a DRE automática, sim — a conexão é feita pelo login oficial da Amazon (OAuth), sem nunca informar sua senha ao Oráculo, e pode ser desfeita quando quiser. Mineração, calculadora e extensão funcionam mesmo sem conectar.',
  },
  {
    q: 'Serve para encontrar produtos novos?',
    a: 'Sim. A mineração revela produtos por demanda real: Mais Vendidos, Recém-Adicionados, Em Alta e Genéricos (oportunidades de marca própria), com estimativa de vendas, BSR e simulação de lucro antes de comprar estoque.',
  },
  {
    q: 'É só um minerador?',
    a: 'Não. O Oráculo é uma central: gestão financeira com DRE real, Curva ABC, análise de Ads, estoque FBA, mineração, calculadora de precisão, extensão Chrome e Agente IA — tudo numa assinatura só.',
  },
  {
    q: 'A calculadora considera as taxas oficiais?',
    a: 'Sim — e esse é um dos maiores diferenciais. A calculadora usa as tabelas oficiais da Amazon (comissão real por produto, FBA, DBA e OnSite por peso, preço e região), validadas célula a célula. Não é estimativa: é o número exato.',
  },
  {
    q: 'Funciona para quem está começando?',
    a: 'Funciona. Quem está começando usa a mineração e a calculadora para escolher o primeiro produto com segurança; quem já vende conecta a conta e passa a enxergar o lucro real da operação.',
  },
  {
    q: 'Como recebo o acesso?',
    a: 'Na hora. Após a compra, você recebe um e-mail automático com o login do painel, a chave da extensão Chrome e o passo a passo para começar em minutos.',
  },
]

export default function Faq() {
  return (
    <section id="faq" style={{ position: 'relative', background: 'var(--ink)' }}>
      <div className="ora-divider" />
      <div className="ora-section" style={{ maxWidth: 860 }}>
        <SectionHead
          eyebrow="Perguntas frequentes"
          title={<>Ainda na dúvida?<br /><span className="ora-goldtext">A gente responde.</span></>}
        />
        <div style={{ marginTop: 'clamp(36px, 5vh, 52px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <details className="ora-faq">
                <summary>
                  {f.q}
                  <span className="ora-faq-chev" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </span>
                </summary>
                <p>{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
