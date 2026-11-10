'use client'
// BANNER DO CONCLAVE (09/11/2026, aprovado pelo João). Evento da Sellion: seg 23/11, 20h, online.
// Aparece no topo do painel para todo mundo a partir de 09/11 às 20h e some sozinho na noite do evento.
// No computador é a faixa larga (2400×600); no celular, a quadrada (1080×1080). Arte em public/conclave/,
// fonte em ~/Documents/banner-conclave (fundo do Codex + foto real do site + texto em HTML).
// O X esconde só nesta sessão do navegador: na próxima entrada ele volta.
// 10/11: flexShrink 0 — o <main> é coluna flex com rolagem; com overflow:hidden a caixa encolhia até ALTURA 0 (medido no
// painel do João: imagem 1130×282, caixa 1130×0) e o banner não aparecia.
import { useEffect, useState } from 'react'

const INICIO = Date.parse('2026-11-09T20:00:00-03:00')
const FIM = Date.parse('2026-11-23T22:00:00-03:00')
const LINK = 'https://conclavejf.com.br/?utm_source=oraculo&utm_medium=banner&utm_campaign=conclave'
const CHAVE = 'conclave-banner-fechado'

export default function BannerConclave() {
  const [agora, setAgora] = useState<number | null>(null)
  const [fechado, setFechado] = useState(false)

  useEffect(() => {
    try { setFechado(sessionStorage.getItem(CHAVE) === '1') } catch { /* sem storage: segue aberto */ }
    setAgora(Date.now())
    // Painel aberto na virada das 20h: o banner entra sem precisar recarregar.
    const t = setInterval(() => setAgora(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  if (agora === null || fechado || agora < INICIO || agora >= FIM) return null

  const fechar = () => {
    setFechado(true)
    try { sessionStorage.setItem(CHAVE, '1') } catch { /* ignora */ }
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0, marginBottom: 20, borderRadius: 16, overflow: 'hidden', boxShadow: '0 18px 44px -24px rgba(123,59,230,.7)' }}>
      <a href={LINK} target="_blank" rel="noopener noreferrer" aria-label="Conclave: segunda, 23/11, às 20h, online e gratuito. Garanta sua cadeira." style={{ display: 'block', lineHeight: 0 }}>
        <picture>
          <source media="(max-width: 700px)" srcSet="/conclave/banner-cel.webp" width={1080} height={1080} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/conclave/banner-pc.webp" width={2400} height={600} alt="Conclave: o plano de 2027 da sua loja, pronto. Segunda, 23/11, 20h, online e ao vivo com João Flório. Garanta sua cadeira."
            style={{ display: 'block', width: '100%', height: 'auto' }} />
        </picture>
      </a>
      <button type="button" onClick={fechar} aria-label="Fechar o banner"
        style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,.25)', background: 'rgba(7,5,13,.6)', color: '#F2EBDD', fontSize: 15, lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
        ×
      </button>
    </div>
  )
}
