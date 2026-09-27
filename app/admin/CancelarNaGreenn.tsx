'use client'
// Lista "Cancelar na Greenn" (27/09/2026). Quem troca de plano fica com a assinatura ANTIGA ativa na
// Greenn (a API dela não cancela). A equipe cancela lá (Contratos) e clica "Já cancelei" aqui.
// Cancelar a antiga é SEGURO: o Oráculo não bloqueia mais o cliente por isso.
import { useEffect, useState } from 'react'

type Item = { subscription_id: string; email: string; plan: string | null; plano_novo: string | null; contract_id: string | null; desde: string; legado: boolean }
const PLANO: Record<string, string> = { monthly: 'Mensal', biannual: 'Semestral', annual: 'Anual', lifetime: 'Vitalício' }
const nomePlano = (p: string | null) => (p ? PLANO[p] || p : '?')

export default function CancelarNaGreenn({ C, compacto = false }: { C: Record<string, string>; compacto?: boolean }) {
  const [itens, setItens] = useState<Item[] | null>(null)
  const [erro, setErro] = useState('')
  const [marcando, setMarcando] = useState('')
  const carregar = () => fetch('/api/admin/assinaturas', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(r.status)).then(d => { setItens(d.itens || []); setErro('') })
    .catch(e => setErro(`não consegui carregar a lista (${e})`))
  useEffect(() => { void carregar() }, [])
  const cancelei = async (it: Item) => {
    setMarcando(it.subscription_id)
    try { await fetch(`/api/admin/assinaturas/${encodeURIComponent(it.subscription_id)}`, { method: 'POST' }); await carregar() }
    finally { setMarcando('') }
  }
  if (compacto && itens && !itens.length) return null
  const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '16px 18px' }
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.t1 }}>🔁 Cancelar na Greenn {itens && itens.length > 0 && <span style={{ color: C.gold }}>· {itens.length} pendente{itens.length > 1 ? 's' : ''}</span>}</div>
      </div>
      <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.6, marginBottom: 12 }}>
        Clientes que trocaram de plano e ainda têm a assinatura <strong style={{ color: C.t1 }}>antiga</strong> ativa na Greenn. Na Greenn: <strong style={{ color: C.t1 }}>Contratos → buscar o e-mail → cancelar a assinatura do plano antigo</strong>. Depois clique em “Já cancelei”. Cancelar é seguro: o cliente <strong style={{ color: C.t1 }}>não</strong> perde o acesso. Se a antiga cobrar antes, o Oráculo devolve o valor sozinho.
      </div>
      {erro && <div style={{ fontSize: 12.5, color: '#F87171' }}>{erro}</div>}
      {!itens && !erro && <div style={{ fontSize: 12.5, color: C.t3 }}>Carregando…</div>}
      {itens && !itens.length && <div style={{ fontSize: 13, color: C.t3 }}>Nada pendente. ✅</div>}
      {itens && itens.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          {itens.map(it => (
            <div key={it.subscription_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.line}` }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.t1, wordBreak: 'break-all' }}>{it.email}</div>
                <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>
                  Cancelar: <strong style={{ color: C.t1 }}>{nomePlano(it.plan)}</strong>{it.plano_novo ? <> · agora está no {nomePlano(it.plano_novo)}</> : null}
                  {it.contract_id ? <> · contrato {it.contract_id}</> : it.legado ? <> · procure pelo e-mail</> : null}
                  {' · desde '}{new Date(it.desde).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <button onClick={() => cancelei(it)} disabled={marcando === it.subscription_id}
                style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: C.gold, color: '#0b0b12', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: marcando === it.subscription_id ? 0.6 : 1 }}>
                {marcando === it.subscription_id ? 'Salvando…' : 'Já cancelei'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
