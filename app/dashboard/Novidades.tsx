'use client'
// NOVIDADES (27/09/2026) — aviso que abre UMA vez por CONTA quando o cliente entra no app (o servidor
// guarda quem já respondeu em app_avisos; o localStorage só evita a consulta no mesmo aparelho).
// Registra a ação: 'entendi' | 'fechou' | 'ir:<aba>'. Aviso novo no futuro: troque VERSAO e o conteúdo.
import { useEffect, useState } from 'react'

const VERSAO = 'novidades-2026-09-neo38'   // só [a-z0-9-] (validado no backend)
const CHAVE = `oraculo:${VERSAO}`

const C = {
  modal: 'var(--modal)', line: 'var(--line)', lineG: 'var(--lineG)', gold: 'var(--gold)', goldSub: 'var(--goldSub)',
  t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)', card: 'var(--card)',
}

const ITENS: Array<{ icone: string; titulo: string; texto: string; ir?: { nav: string; label: string } }> = [
  {
    icone: '🧠', titulo: 'NEO com raciocínio mais avançado',
    texto: 'O NEO passou a rodar num modelo de IA mais avançado. Ele entende melhor a sua pergunta, cruza os números reais da sua conta e já abre a conversa com o painel da sua operação pronto — respostas mais certeiras e mais rápidas.',
    ir: { nav: 'agente', label: 'Falar com o NEO' },
  },
  {
    icone: '🎯', titulo: 'NEO Ads: o NEO cuida dos seus anúncios',
    texto: 'Com um botão, o NEO assume seus anúncios na Amazon: pausa sozinho o anúncio do produto que ficou sem estoque (pra você não pagar clique que não vira venda), religa quando o estoque volta e mostra quanto você economizou.',
    ir: { nav: 'ads', label: 'Ver meus anúncios' },
  },
  {
    icone: '📄', titulo: 'Minerador de catálogo de fornecedor',
    texto: 'Envie o PDF do seu fornecedor: o NEO lê todas as páginas, entende preço por unidade e por caixa e cruza com a Amazon pra mostrar só o que dá margem. A leitura do catálogo usa créditos conforme o tamanho (até 100 páginas, 10; até 600 páginas, 60) e a 1ª varredura de cada catálogo é grátis.',
    ir: { nav: 'catalogo', label: 'Analisar um catálogo' },
  },
  {
    icone: '🟡', titulo: 'Mercado Livre na Gestão',
    texto: 'Conecte sua conta do Mercado Livre e veja a DRE real: tarifas, frete, imposto, custo do produto e o lucro depois do Mercado Ads — Amazon e Mercado Livre no mesmo painel.',
    ir: { nav: 'financeiro', label: 'Abrir a Gestão' },
  },
]

export default function Novidades({ onIr }: { onIr: (nav: string) => void }) {
  const [aberto, setAberto] = useState(false)
  useEffect(() => {
    let vivo = true
    const t = setTimeout(async () => {
      try { if (localStorage.getItem(CHAVE)) return } catch { /* sem storage: pergunta ao servidor */ }
      try {
        const r = await fetch(`/api/avisos/${VERSAO}`, { cache: 'no-store' })
        const d = r.ok ? await r.json() : null
        if (!vivo) return
        if (d?.mostrar) {
          setAberto(true)
          void fetch(`/api/avisos/${VERSAO}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }).catch(() => {})
        } else if (d) { try { localStorage.setItem(CHAVE, 'servidor') } catch { /* ok */ } }
      } catch { /* servidor fora: não mostra agora, tenta no próximo acesso */ }
    }, 900)
    return () => { vivo = false; clearTimeout(t) }
  }, [])
  const responder = (acao: string) => {
    try { localStorage.setItem(CHAVE, new Date().toISOString()) } catch { /* ok */ }
    void fetch(`/api/avisos/${VERSAO}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ acao }), keepalive: true }).catch(() => {})
    setAberto(false)
  }
  const fechar = () => responder('fechou')
  if (!aberto) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Novidades do Oráculo" onClick={fechar}
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(1,1,8,0.78)', backdropFilter: 'blur(14px)', overflowY: 'auto', padding: '32px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 600, background: C.modal, border: `1px solid ${C.lineG}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,0.8)', animation: 'fadeUp .35s ease-out both' }}>
        <div style={{ padding: '28px 28px 20px', borderBottom: `1px solid ${C.line}`, background: 'linear-gradient(180deg,rgba(240,180,41,0.10) 0%,transparent 100%)', position: 'relative' }}>
          <button onClick={fechar} aria-label="Fechar" style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 9, border: `1px solid ${C.line}`, background: 'transparent', color: C.t2, cursor: 'pointer', fontSize: 16 }}>×</button>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>Novidades · setembro de 2026</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.t1, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.25 }}>O Oráculo ficou mais inteligente</h2>
          <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, margin: '8px 0 0' }}>Trabalhamos nas últimas semanas pra você analisar, decidir e vender com menos esforço. Veja o que chegou:</p>
        </div>

        <div style={{ padding: '18px 22px 6px', display: 'grid', gap: 10 }}>
          {ITENS.map(it => (
            <div key={it.titulo} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 14, border: `1px solid ${C.line}`, background: C.card }}>
              <div style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }} aria-hidden>{it.icone}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.t1, marginBottom: 4 }}>{it.titulo}</div>
                <div style={{ fontSize: 12.8, color: C.t2, lineHeight: 1.6 }}>{it.texto}</div>
                {it.ir && (
                  <button onClick={() => { responder(`ir:${it.ir!.nav}`); onIr(it.ir!.nav) }}
                    style={{ marginTop: 8, padding: 0, border: 'none', background: 'none', color: C.gold, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {it.ir.label} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ margin: '12px 22px 0', padding: '16px 18px', borderRadius: 14, border: `1px solid ${C.lineG}`, background: C.goldSub }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, marginBottom: 6 }}>💬 Sobre os seus créditos mensais</div>
          <div style={{ fontSize: 12.8, color: C.t2, lineHeight: 1.65 }}>
            O novo NEO pensa mais em cada resposta — e isso tem um custo maior de IA pra nós. Mesmo assim, <strong style={{ color: C.t1 }}>conversar com o NEO continua sem gastar nenhum crédito</strong> (até 300 mensagens por dia).
            Pra manter tudo isso <strong style={{ color: C.t1 }}>sem mudar o valor da sua assinatura</strong>, a franquia mensal passou de <strong style={{ color: C.t1 }}>150 para 100 créditos</strong>, renovada todo mês.
            <br /><br />
            Os créditos são usados só nas entregas prontas: imagem (2), anúncio completo com 5 imagens (8), Conteúdo A+ (4), leitura de catálogo (a partir de 10, conforme as páginas) e vídeo (a partir de 25; o completo de 3 takes, 85). Com 100 créditos dá, por exemplo, pra montar 12 anúncios completos no mês.
            Precisa de mais? Recarregue na hora pela <strong style={{ color: C.t1 }}>Carteira, dentro do NEO</strong>, via PIX.
          </div>
        </div>

        <div style={{ padding: '18px 22px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: C.t3 }}>Obrigado por construir o Oráculo com a gente. 💛</div>
          <button onClick={() => responder('entendi')}
            style={{ padding: '11px 22px', borderRadius: 11, border: 'none', background: C.gold, color: '#0b0b12', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            Entendi, vamos lá
          </button>
        </div>
      </div>
    </div>
  )
}
