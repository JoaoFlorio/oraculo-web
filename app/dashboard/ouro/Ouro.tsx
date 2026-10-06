'use client'
// Peças do VISUAL NOVO do painel (05/10/2026, em validação — só renderizam quando useVisualNovo() é true).
// Mesma linguagem do site oraculojf.com: obsidiana + ouro, Archivo nos títulos, JetBrains Mono nos rótulos.
// Estilos em globals.css (classes .ouro-*), escopados no visual novo.
import React from 'react'

/** Cabeçalho padrão de página: categoria (mono, dourado) · título grande com destaque em ouro · subtítulo · ações. */
export function CabecalhoOuro({ grupo, titulo, destaque, sub, acoes, selo }: {
  grupo: string; titulo: string; destaque?: string; sub?: React.ReactNode; acoes?: React.ReactNode; selo?: React.ReactNode
}) {
  return (
    <header className="ouro-cab">
      <div className="ouro-cab-txt">
        <div className="ouro-cab-grupo">{selo}{grupo}</div>
        <h1 className="ouro-cab-titulo">{titulo}{destaque && <> <em>{destaque}</em></>}</h1>
        {sub && <p className="ouro-cab-sub">{sub}</p>}
      </div>
      {acoes && <div className="ouro-cab-acoes">{acoes}</div>}
    </header>
  )
}

/** Cartão com borda dourada fina. `titulo` opcional vira cabeçalho do cartão (com número de passo, se houver). */
export function CartaoOuro({ titulo, passo, extra, children, className = '', style }: {
  titulo?: React.ReactNode; passo?: number; extra?: React.ReactNode; children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  return (
    <section className={`ouro-cartao ${className}`} style={style}>
      {titulo && (
        <div className="ouro-cartao-cab">
          {passo != null && <span className="ouro-passo">{passo}</span>}
          <h3>{titulo}</h3>
          {extra && <div className="ouro-cartao-extra">{extra}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/** Tela vazia: ícone num medalhão dourado com anel girando, título e texto. */
export function VazioOuro({ icone, titulo, texto, acao }: { icone: React.ReactNode; titulo: string; texto?: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <div className="ouro-vazio">
      <div className="ouro-vazio-medalha"><i aria-hidden="true" />{icone}</div>
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {acao && <div className="ouro-vazio-acao">{acao}</div>}
    </div>
  )
}

/** Ícones de traço (24×24) usados no visual novo. */
export const IcOuro: Record<string, React.ReactElement> = {
  calc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2.5" /><rect x="8" y="6" width="8" height="3.5" rx="1" /><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01" strokeWidth="2.2" /></svg>,
  lupa: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></svg>,
  rival: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="3.2" /><circle cx="6" cy="16.5" r="2.6" /><circle cx="18" cy="16.5" r="2.6" /><path d="M10 10l-2.3 4M14 10l2.3 4" /></svg>,
  catalogo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="12" height="17" rx="2" /><path d="M7 8h6M7 11.5h6M7 15h3" /><circle cx="16.5" cy="16.5" r="3" /><path d="M18.7 18.7 21 21" /></svg>,
  salvo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5V21l-5-3-5 3z" /></svg>,
  link: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>,
  caixa: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></svg>,
  moeda: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M14.8 9.2c-.5-.9-1.5-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2.1 0 3 5.7 1.6 5.7 4.3 0 1.3-1.2 2.1-2.9 2.1-1.4 0-2.5-.6-3-1.6M12 6.5v11" /></svg>,
  grafico: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5M4 19h16M8 15l4-5 3 3 5-6" /></svg>,
  brilho: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" /></svg>,
  escudo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>,
  alvo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg>,
  pdf: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>,
  caminhao: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h11v10H3zM14 9.5h4l3 3.5v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></svg>,
}

/** Busca em destaque: campo largo com lupa + botão dourado. Enter também envia. */
export function BuscaOuro({ valor, onValor, onEnviar, carregando, placeholder, botao = 'Analisar', maxLength, mono }: {
  valor: string; onValor: (v: string) => void; onEnviar: () => void; carregando?: boolean; placeholder?: string; botao?: string; maxLength?: number; mono?: boolean
}) {
  return (
    <form className="ouro-busca" onSubmit={e => { e.preventDefault(); onEnviar() }}>
      <span className="ouro-busca-ic" aria-hidden="true">{IcOuro.lupa}</span>
      <input value={valor} onChange={e => onValor(e.target.value)} placeholder={placeholder} maxLength={maxLength}
        className={mono ? 'ouro-busca-mono' : undefined} aria-label={placeholder} />
      <button type="submit" className="ouro-botao" disabled={carregando}>
        {carregando ? <><span className="ouro-gira" aria-hidden="true" />Analisando…</> : <>{botao} <span aria-hidden="true">→</span></>}
      </button>
    </form>
  )
}

/** Faixa de recursos ("o que você recebe"): ícone + título + texto, em grade. */
export function RecursosOuro({ itens }: { itens: { icone: React.ReactNode; titulo: string; texto: string }[] }) {
  return (
    <div className="ouro-recursos">
      {itens.map(i => (
        <div key={i.titulo} className="ouro-recurso">
          <span className="ouro-recurso-ic">{i.icone}</span>
          <div><b>{i.titulo}</b><p>{i.texto}</p></div>
        </div>
      ))}
    </div>
  )
}
