'use client'
import { useState } from 'react'
import { CardProduto, MLDetalheModal, type Produto } from './MLMineracao'
import { useVisualNovo } from './ouro/useVisualNovo'
import { CabecalhoOuro, BuscaOuro, RecursosOuro, VazioOuro, IcOuro } from './ouro/Ouro'

// ─────────────────────────────────────────────────────────────────────────────
// ANÁLISE RIVAL — MERCADO LIVRE. Cola o link (ou MLB) de um anúncio de outro
// seller e recebe a MESMA análise do garimpo: comissão e envio reais, "você
// recebe", compre até, concorrência do catálogo, marca — e o modal completo
// (score, simulador, previsão, como melhorar, imagens).
// O backend resolve as 3 entidades do ML (anúncio, catálogo /p/, MLBU).
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  card: 'var(--card)', cardHov: 'var(--cardHov)', line: 'var(--line)', line2: 'var(--line2, var(--line))',
  lineG: 'var(--lineG)', goldG: 'var(--goldG)', gold: 'var(--gold)', r: 'var(--r)',
  t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)', t4: 'var(--t4)',
}
const tint = (v: string, pct: number) => `color-mix(in srgb, ${v} ${pct}%, transparent)`

// 06/11 (caso da Marli: "tentei MLB, MLBU e o link e continua a mensagem"): anúncio de OUTRO vendedor o ML não
// abre pro nosso servidor — /items e /user-products dão 403, para qualquer link de terceiro (medido em produção).
// Só o catálogo (/p/MLB…) abre. Em vez do aviso sem saída, a tela mostra os 2 caminhos que funcionam: abrir o
// anúncio no ML com a extensão (ela lê a página no navegador do cliente) ou colar o link /p/ do catálogo.
const EXTENSAO = 'https://chromewebstore.google.com/detail/or%C3%A1culo-amazon-intelligen/jggkabmggnkaobhjmhhcikipbhhnoapp'
function linkDoAnuncio(alvo: string): string {
  const t = alvo.trim()
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t)
    if (/(^|\.)mercadolivre\.com\.br$/i.test(u.hostname)) return u.href
  } catch { /* não é link — monta pelo código */ }
  const up = t.match(/MLBU\d+/i)
  if (up) return `https://www.mercadolivre.com.br/up/${up[0].toUpperCase()}`
  const n = t.match(/MLB-?(\d+)/i)
  return n ? `https://produto.mercadolivre.com.br/MLB-${n[1]}` : 'https://www.mercadolivre.com.br'
}

function BloqueadoPeloML({ link, novo }: { link: string; novo: boolean }) {
  const passo = { margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.6, color: novo ? 'var(--ou-t2)' : T.t2 }
  const botao = (href: string, txt: string, principal: boolean) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className={novo && principal ? 'ouro-botao' : undefined}
      style={novo && principal ? { textDecoration: 'none', height: 42, fontSize: 13.5 } : {
        display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
        textDecoration: 'none', color: principal ? '#1a1200' : (novo ? 'var(--ou-t1)' : T.t1),
        background: principal ? T.goldG : 'transparent', border: principal ? 'none' : `1px solid ${novo ? 'rgba(255,200,61,.3)' : T.lineG}` }}>{txt}</a>
  )
  return (
    <div className={novo ? 'ouro-cartao' : undefined} style={novo ? { maxWidth: 760 } : { padding: 20, background: T.card, border: `1px solid ${T.lineG}`, borderRadius: 16, maxWidth: 640 }}>
      <div style={{ fontSize: 15.5, fontWeight: 700, color: novo ? 'var(--ou-t1)' : T.t1 }}>O Mercado Livre fecha este anúncio para sistemas de fora</div>
      <p style={passo}>É anúncio de outro vendedor, e o ML não deixa nenhum sistema ler esse tipo de anúncio (vale para qualquer link de terceiro, trocar o link não resolve). Dá para analisar de dois jeitos:</p>
      <p style={passo}><strong>1.</strong> Abra o anúncio no Mercado Livre com a <strong>extensão do Oráculo</strong>: a análise completa (taxas, frete, concorrência e vendas) aparece ali mesmo, na página.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginTop: 12 }}>
        {botao(link, 'Abrir o anúncio no Mercado Livre', true)}
        {botao(EXTENSAO, 'Instalar a extensão', false)}
      </div>
      <p style={passo}><strong>2.</strong> Se o anúncio tiver página de produto (link com <strong>/p/MLB…</strong>), copie esse link e cole aqui: ele abre.</p>
    </div>
  )
}

export default function MLRival() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [bloqueio, setBloqueio] = useState<string | null>(null)   // link do anúncio que o ML fechou
  const [produto, setProduto] = useState<Produto | null>(null)
  const [modal, setModal] = useState(false)
  const novo = useVisualNovo()

  const analisar = async () => {
    const alvo = q.trim()
    if (!alvo || loading) return
    setLoading(true); setErro(null); setBloqueio(null); setProduto(null)
    try {
      const r = await fetch(`/api/ml/mineracao/analisar?q=${encodeURIComponent(alvo)}`)
      const d = await r.json()
      if (d.bloqueadoPeloML) { setBloqueio(linkDoAnuncio(alvo)); return }
      if (!r.ok || d.error) { setErro(d.error || 'Não foi possível analisar este anúncio.'); return }
      setProduto(d.produto)
      setModal(true)   // já abre a análise completa, que é o que o cliente veio buscar
    } catch { setErro('Falha de conexão.') }
    finally { setLoading(false) }
  }

  if (novo) {
    const exemplos = ['mercadolivre.com.br/p/MLB63904966', 'MLB63904966']
    return (
      <div className="ouro-pagina">
        <CabecalhoOuro grupo="Mercado Livre" titulo="Análise do" destaque="concorrente"
          sub={<>Cole o link de qualquer anúncio do Mercado Livre e veja a análise completa: <strong>taxas reais, quanto sobra, concorrência e como melhorar</strong>.</>} />
        <BuscaOuro valor={q} onValor={setQ} onEnviar={analisar} carregando={loading} placeholder="Cole o link do anúncio ou o código MLB…" />
        <div className="ouro-chips"><span>Exemplos que funcionam:</span>{exemplos.map(e => <button key={e} type="button" className="ouro-chip" onClick={() => setQ(e)}>{e}</button>)}</div>
        {erro && <div className="ouro-erro">{erro}</div>}
        {bloqueio && <BloqueadoPeloML link={bloqueio} novo />}
        {produto && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, maxWidth: 520 }}>
            <div className="ora-card-in"><CardProduto p={produto} onOpen={() => setModal(true)} /></div>
          </div>
        )}
        {!produto && !erro && !bloqueio && !loading && (
          <>
            <RecursosOuro itens={[
              { icone: IcOuro.moeda, titulo: 'Taxas e envio reais', texto: 'Comissão da categoria e frete calculados pelo próprio Mercado Livre.' },
              { icone: IcOuro.grafico, titulo: 'Quanto sobra', texto: '"Você recebe", compre até e margem de cada venda.' },
              { icone: IcOuro.rival, titulo: 'Concorrência do catálogo', texto: 'Quantos vendem o mesmo produto e a que preço.' },
              { icone: IcOuro.brilho, titulo: 'Como melhorar', texto: 'Score, simulador e o que mudar no anúncio.' },
            ]} />
            <p className="ouro-nota">A análise usa os mesmos motores do garimpo: comissão real da categoria, envio real (reputação verde) e a concorrência do catálogo. Alguns anúncios avulsos o ML fecha pra consulta — nesses, cole o link da página do produto (/p/MLB…).</p>
          </>
        )}
        {loading && <div className="ouro-cartao"><VazioOuro icone={IcOuro.lupa} titulo="Analisando o anúncio…" texto="Buscando taxas, envio e concorrência no Mercado Livre." /></div>}
        {modal && produto && <MLDetalheModal p={produto} onClose={() => setModal(false)} />}
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div className="ora-phead" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.t3, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>Mercado Livre</span>
            <span style={{ color: T.t3, fontSize: 9 }}>/</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.gold, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>Análise Rival</span>
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em', marginBottom: 6, lineHeight: 1 }}>Análise Rival ML</h1>
          <p style={{ fontSize: 11, color: T.t3 }}>Cole o link de qualquer anúncio do Mercado Livre e veja a análise completa — taxas reais, líquido, concorrência e como melhorar.</p>
        </div>
      </div>

      {/* Input no estilo da busca da Amazon (input + botão dourado) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 380px', maxWidth: 640, background: T.cardHov, border: `1px solid ${q ? T.lineG : T.line2}`, borderRadius: 8, overflow: 'hidden' }}>
          <input value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') analisar() }}
            placeholder="Cole o link do anúncio ou o código MLB…" aria-label="Link ou código do anúncio"
            style={{ background: 'none', border: 'none', outline: 'none', color: T.t1, fontSize: 12, fontWeight: 500, padding: '10px 12px', fontFamily: 'inherit', flex: 1, minWidth: 0 }} />
          <button onClick={analisar} disabled={loading} title="Analisar anúncio"
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.goldG, border: 'none', color: '#1a1200', cursor: loading ? 'wait' : 'pointer', padding: '11px 18px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.4" stroke="currentColor" strokeWidth="1.6" /><path d="M7.6 7.6L10.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            {loading ? 'Analisando…' : 'Analisar'}
          </button>
        </div>
      </div>

      {bloqueio && <div style={{ marginBottom: 14 }}><BloqueadoPeloML link={bloqueio} novo={false} /></div>}
      {erro && <div style={{ padding: '13px 16px', color: T.r, fontSize: 12.5, background: tint(T.r, 8), border: `1px solid ${tint(T.r, 25)}`, borderRadius: 12, marginBottom: 14, maxWidth: 640, lineHeight: 1.55 }}>{erro}</div>}

      {produto && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, maxWidth: 480 }}>
          <div className="ora-card-in">
            <CardProduto p={produto} onOpen={() => setModal(true)} />
          </div>
        </div>
      )}

      {!produto && !erro && !bloqueio && !loading && (
        <div style={{ padding: '44px 24px', textAlign: 'center' as const, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, color: T.t3, fontSize: 13, maxWidth: 640, lineHeight: 1.7 }}>
          Exemplos que funcionam:<br />
          <span style={{ color: T.t4, fontSize: 11.5 }}>mercadolivre.com.br/p/MLB63904966 · produto.mercadolivre.com.br/MLB-123… · MLB63904966</span>
        </div>
      )}

      <p style={{ fontSize: 10.5, color: T.t4, marginTop: 16, lineHeight: 1.5, maxWidth: 640 }}>
        A análise usa os MESMOS motores do garimpo: comissão real da categoria, envio real (reputação verde) e a concorrência do catálogo. Alguns anúncios avulsos o ML fecha pra consulta — nesses, cole o link da página do produto (/p/MLB…).
      </p>

      {modal && produto && <MLDetalheModal p={produto} onClose={() => setModal(false)} />}
    </div>
  )
}
