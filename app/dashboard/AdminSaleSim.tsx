'use client'
import { useState } from 'react'

// Simulador de cha-ching — EXCLUSIVO de admin.
// Vive em arquivo próprio e é carregado via next/dynamic SÓ quando isAdmin=true:
// assim o código (e o texto "SIMULAR CHA-CHING") NÃO entra no bundle JavaScript
// que o cliente baixa — ele não vê, não usa e não descobre nem no DevTools.
// A autorização de verdade continua no servidor (o proxy /api/push/test só
// aceita kind:'sale' de role=admin) — isto aqui é só o sigilo da existência.

export default function AdminSaleSim() {
  const [valor, setValor] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'fail'>('idle')

  async function disparar() {
    if (state === 'sending') return
    setState('sending')
    try {
      const v = parseFloat(valor.replace(',', '.'))
      const r = await fetch('/api/push/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'sale', ...(isFinite(v) && v > 0 ? { valor: v } : {}) }),
      })
      const d = await r.json().catch(() => ({}))
      setState(r.ok && d.ok ? 'sent' : 'fail')
    } catch { setState('fail') }
    setTimeout(() => setState('idle'), 6000)
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(100,116,139,0.3)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', marginBottom: 7 }}>ADMIN · SIMULAR CHA-CHING</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11.5, color: '#64748B', pointerEvents: 'none' }}>R$</span>
          <input value={valor} onChange={e => setValor(e.target.value)} inputMode="decimal" placeholder="último pedido"
            style={{ width: '100%', padding: '9px 10px 9px 30px', borderRadius: 9, border: '1px solid rgba(100,116,139,0.35)', background: '#15151F', color: '#F1F5F9', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <button onClick={disparar} disabled={state === 'sending'}
          style={{ flex: '0 0 auto', padding: '9px 14px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700,
            border: `1px solid ${state === 'fail' ? 'rgba(251,113,133,0.5)' : 'rgba(52,211,153,0.45)'}`,
            background: 'rgba(52,211,153,0.08)', color: state === 'sent' ? '#34D399' : state === 'fail' ? '#FB7185' : '#34D399' }}>
          {state === 'sending' ? '…' : state === 'sent' ? '✓ Enviado' : state === 'fail' ? 'Falhou' : '💰 Disparar'}
        </button>
      </div>
      <p style={{ fontSize: 10.5, color: '#64748B', margin: '7px 2px 0', lineHeight: 1.5 }}>
        Manda o aviso idêntico ao de uma venda real. Em branco = usa o valor do seu último pedido.
      </p>
    </div>
  )
}
