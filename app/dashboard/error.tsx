'use client'

// Rede de segurança do dashboard (auditoria de lançamento, 23/07). Se qualquer
// painel quebrar no render, o cliente vê ESTE card ("tentar de novo") em vez de
// uma tela branca sem saída. Isola a falha no segmento — o resto do app segue.
import { useEffect } from 'react'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[dashboard/error]', error) }, [error])

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      background: '#0b0b10', color: '#f5efdf', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
    }}>
      <div style={{
        maxWidth: 420, textAlign: 'center', padding: 28, borderRadius: 18,
        background: 'radial-gradient(120% 100% at 50% 0, rgba(240,180,41,.08), rgba(13,13,18,.98) 55%), #0b0b10',
        border: '1px solid rgba(240,180,41,.22)',
      }}>
        <div style={{ fontSize: 34 }}>⚠️</div>
        <h2 style={{ fontSize: 19, margin: '10px 0 6px', color: '#fff' }}>Algo travou nesta tela</h2>
        <p style={{ fontSize: 13.5, color: 'rgba(245,239,223,.6)', lineHeight: 1.5, margin: '0 0 18px' }}>
          Foi um soluço, não os seus dados. Tente de novo — se persistir, recarregue a página ou fale com o suporte.
        </p>
        <button onClick={reset} style={{
          background: '#f0b429', color: '#1a1204', border: 'none', borderRadius: 11,
          padding: '11px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>Tentar de novo</button>
      </div>
    </div>
  )
}
