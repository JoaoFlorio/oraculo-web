'use client'

// Último anteparo: erro no próprio layout raiz (o que error.tsx de segmento não
// pega). Precisa renderizar <html>/<body> porque substitui o layout inteiro.
// Sem isto, um erro no root = tela branca total pro cliente.
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[global-error]', error) }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#0b0b10' }}>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          color: '#f5efdf', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
        }}>
          <div style={{
            maxWidth: 420, textAlign: 'center', padding: 28, borderRadius: 18,
            background: 'radial-gradient(120% 100% at 50% 0, rgba(240,180,41,.08), rgba(13,13,18,.98) 55%), #0b0b10',
            border: '1px solid rgba(240,180,41,.22)',
          }}>
            <div style={{ fontSize: 34 }}>⚠️</div>
            <h2 style={{ fontSize: 19, margin: '10px 0 6px', color: '#fff' }}>O Oráculo teve um soluço</h2>
            <p style={{ fontSize: 13.5, color: 'rgba(245,239,223,.6)', lineHeight: 1.5, margin: '0 0 18px' }}>
              Recarregue a página. Se continuar, fale com o suporte — seus dados estão a salvo.
            </p>
            <button onClick={reset} style={{
              background: '#f0b429', color: '#1a1204', border: 'none', borderRadius: 11,
              padding: '11px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>Recarregar</button>
          </div>
        </div>
      </body>
    </html>
  )
}
