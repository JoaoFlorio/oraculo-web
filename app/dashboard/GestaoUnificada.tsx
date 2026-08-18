'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { SeloAmazon, SeloML } from './SelosMarketplace'

// ─────────────────────────────────────────────────────────────────────────────
// GESTÃO com SELETOR DE LOJA (Tudo · Amazon · Mercado Livre).
//
// 🚨 DECISÃO DE ARQUITETURA: este wrapper NÃO reescreve a Gestão Amazon. Ele
// escolhe QUAL componente montar. A aba "Amazon" renderiza o `GestaoHub` exatamente
// como sempre foi — mesmo componente, mesmas props, zero linha alterada — porque
// ele está em produção com ~100 clientes e é o coração do produto. Todo o risco do
// multi-loja fica em código NOVO (Consolidada e MLGestao).
//
// A escolha do cliente persiste em localStorage: quem só vende na Amazon não paga
// pedágio de clique nenhum — abre direto onde parou.
// ─────────────────────────────────────────────────────────────────────────────

const GestaoHub = dynamic(() => import('./GestaoHub'), { ssr: false, loading: () => <div style={{ padding: 40, textAlign: 'center', color: '#686890' }}>Carregando Gestão…</div> })
const MLGestao = dynamic(() => import('./MLGestao'), { ssr: false, loading: () => <div style={{ padding: 40, textAlign: 'center', color: '#686890' }}>Carregando Gestão ML…</div> })
const GestaoConsolidada = dynamic(() => import('./GestaoConsolidada'), { ssr: false, loading: () => <div style={{ padding: 40, textAlign: 'center', color: '#686890' }}>Somando as lojas…</div> })

type Loja = 'tudo' | 'amazon' | 'ml'
const CHAVE = 'oraculo_gestao_loja'

export default function GestaoUnificada(props: {
  promoActive?: boolean
  promoType?: 'fba' | 'comissao' | 'ambas' | null
  userEmail?: string
  theme?: 'dark' | 'light'
  isAdmin?: boolean
}) {
  const [loja, setLoja] = useState<Loja>('amazon')
  const [pronto, setPronto] = useState(false)

  // Preferência do cliente (só depois da montagem — localStorage não existe no SSR).
  useEffect(() => {
    try {
      const salva = localStorage.getItem(CHAVE) as Loja | null
      if (salva === 'tudo' || salva === 'amazon' || salva === 'ml') setLoja(salva)
    } catch {}
    setPronto(true)
  }, [])

  const escolher = (l: Loja) => {
    setLoja(l)
    try { localStorage.setItem(CHAVE, l) } catch {}
  }

  const OPCOES: Array<{ id: Loja; label: string; selo?: 'amz' | 'ml' | 'ambos' }> = [
    { id: 'tudo', label: 'Tudo', selo: 'ambos' },
    { id: 'amazon', label: 'Amazon', selo: 'amz' },
    { id: 'ml', label: 'Mercado Livre', selo: 'ml' },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Seletor de loja — a única coisa que este wrapper acrescenta por cima. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
        {OPCOES.map(o => {
          const ativa = loja === o.id
          return (
            <button key={o.id} onClick={() => escolher(o.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                fontSize: 12.5, fontWeight: 700, padding: '8px 14px', borderRadius: 11, cursor: 'pointer',
                background: ativa ? 'var(--cardHov)' : 'transparent',
                border: `1px solid ${ativa ? 'var(--lineG)' : 'var(--line)'}`,
                color: ativa ? 'var(--t1)' : 'var(--t3)',
                transition: 'all .15s',
              }}>
              {o.selo === 'amz' && <SeloAmazon size={13} />}
              {o.selo === 'ml' && <SeloML size={13} />}
              {o.selo === 'ambos' && <span style={{ display: 'flex', gap: 3 }}><SeloAmazon size={11} /><SeloML size={11} /></span>}
              {o.label}
            </button>
          )
        })}
      </div>

      {pronto && (
        <>
          {/* Amazon: o GestaoHub original, sem um único ajuste. */}
          {loja === 'amazon' && <GestaoHub {...props} />}
          {loja === 'ml' && <MLGestao />}
          {loja === 'tudo' && <GestaoConsolidada />}
        </>
      )}
    </div>
  )
}
