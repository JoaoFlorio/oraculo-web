'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { CabecalhoOuro, VazioOuro, IcOuro } from './ouro/Ouro'
import o from './Fornecedores.ouro.module.css'

/* ═══════════════════════════════════════════════════════════════════════════
   FORNECEDORES (20/10/2026) — a lista de fornecedores nacionais do João Florio
   (importadoras e distribuidoras) em cards: logo, região, categorias, dica e o
   botão que importa — pedir o catálogo no WhatsApp já com a mensagem pronta.
   Quem vê a lista completa o BACKEND decide (assinante); teste grátis e demo
   veem uma amostra e o convite pros Planos. Clique conta (qual fornecedor os
   alunos mais procuram) — /api/fornecedores.
   ═══════════════════════════════════════════════════════════════════════════ */

interface Contato { numero: string; whats: boolean; nome?: string }
interface Fornecedor {
  id: number; nome: string; tipo: string | null; categoria: string | null; tags: string[]
  estado: string | null; ufs: string[]; vendeCpf: boolean; site: string | null; instagram: string | null
  contatos: Contato[]; dica: string | null; temLogo: boolean; logoClara: boolean; produtos?: number
}
interface Produto { titulo: string; url: string | null; imagem: string | null; preco: number | null; sku?: string | null; fonte?: string }
interface Resp { liberado: boolean; total: number; fornecedores: Fornecedor[] }

const MENSAGEM = 'Olá! Vim pelo Oráculo, do João Florio, e gostaria de receber o catálogo de produtos de vocês.'
const linkWhats = (numero: string) => `https://wa.me/${numero}?text=${encodeURIComponent(MENSAGEM)}`
/** 5511992434526 → (11) 99243-4526 */
function fone(n: string): string {
  const d = n.replace(/^55/, '')
  const ddd = d.slice(0, 2), r = d.slice(2)
  return `(${ddd}) ${r.length === 9 ? `${r.slice(0, 5)}-${r.slice(5)}` : `${r.slice(0, 4)}-${r.slice(4)}`}`
}
const iniciais = (nome: string) => nome.replace(/\b(importadora|distribuidora|atacado|import|imports|grupo|ltda)\b/gi, '').trim()
  .split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || nome.slice(0, 2).toUpperCase()
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function registrar(id: number, acao: 'site' | 'whats' | 'insta' | 'tel') {
  fetch('/api/fornecedores', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, acao }) }).catch(() => {})
}

const Ic = {
  whats: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.3-.2-.5-.3Z"/></svg>,
  site: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg>,
  insta: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".9" fill="currentColor"/></svg>,
  tel: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>,
  lupa: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>,
}

function Card({ f, travado, i, verProdutos }: { f: Fornecedor; travado: boolean; i: number; verProdutos: (f: Fornecedor) => void }) {
  const [abrir, setAbrir] = useState(false)
  const [logoOk, setLogoOk] = useState(f.temLogo)
  const whats = f.contatos.filter(c => c.whats)
  const principal = whats[0] || null
  const fixo = !principal ? f.contatos[0] || null : null
  const regiao = f.ufs.length ? f.ufs.join(' · ') : (f.estado || '')
  return (
    <article className={`${o.card} ${travado ? o.travado : ''}`} style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
      <div className={`${o.vitrine} ${!logoOk ? o.vitrineVazia : f.logoClara ? o.vitrineEscura : ''}`}>
        {logoOk
          ? <img src={`/api/fornecedores/logo/${f.id}`} alt={`Logo ${f.nome}`} loading="lazy" onError={() => setLogoOk(false)} />
          : <span className={o.monograma}>{iniciais(f.nome)}</span>}
        {f.vendeCpf && <span className={o.cpf} title="Vende também para pessoa física (CPF)">VENDE P/ CPF</span>}
        {travado && <span className={o.selo}>ASSINANTES</span>}
      </div>
      <div className={o.corpo}>
        <h3 className={o.nome}>{f.nome}</h3>
        <div className={o.meta}>{[f.tipo, regiao].filter(Boolean).join(' · ') || '—'}</div>
        {f.tags.length > 0 && <div className={o.tags}>{f.tags.slice(0, 3).map(t => <span key={t}>{t}</span>)}</div>}
        {f.categoria && <p className={o.cat} title={f.categoria}>{f.categoria}</p>}
        {f.dica && <p className={o.dica}><b>Dica do João:</b> {f.dica}</p>}
        {!travado && (f.produtos || 0) > 0 && (
          <button type="button" className={o.verProdutos} onClick={() => verProdutos(f)}>Ver {f.produtos} produtos do site →</button>
        )}
      </div>
      <div className={o.acoes}>
        {principal && (
          <a className={o.btWhats} href={linkWhats(principal.numero)} target="_blank" rel="noopener noreferrer" onClick={() => registrar(f.id, 'whats')}>
            {Ic.whats} Pedir catálogo
          </a>
        )}
        {fixo && (
          <a className={`${o.btSec} ${o.btFlex}`} href={`tel:+${fixo.numero}`} onClick={() => registrar(f.id, 'tel')}>{Ic.tel} {fone(fixo.numero)}</a>
        )}
        {f.site && (
          <a className={`${o.btSec} ${!principal && !fixo ? o.btFlex : o.btIcone}`} href={f.site} target="_blank" rel="noopener noreferrer" title="Site" aria-label={`Site de ${f.nome}`} onClick={() => registrar(f.id, 'site')}>
            {Ic.site}{!principal && !fixo && ' Site'}
          </a>
        )}
        {f.instagram && (
          <a className={`${o.btSec} ${o.btIcone}`} href={f.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" aria-label={`Instagram de ${f.nome}`} onClick={() => registrar(f.id, 'insta')}>
            {Ic.insta}
          </a>
        )}
      </div>
      {f.contatos.length > 1 && !abrir && <button className={o.mais} onClick={() => setAbrir(true)}>ver os {f.contatos.length} contatos</button>}
      {abrir && (
        <div className={o.contatos}>
          {f.contatos.map(c => (
            <div key={c.numero} className={o.contato}>
              <span>{fone(c.numero)}{c.nome && <small>{c.nome}</small>}</span>
              {c.whats
                ? <a href={linkWhats(c.numero)} target="_blank" rel="noopener noreferrer" onClick={() => registrar(f.id, 'whats')}>WhatsApp</a>
                : <a href={`tel:+${c.numero}`} onClick={() => registrar(f.id, 'tel')}>Ligar</a>}
            </div>
          ))}
        </div>
      )}
    </article>
  )
}


const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Produtos lidos do site do fornecedor (robô do backend, refeito a cada 14 dias). */
function ModalProdutos({ f, fechar }: { f: Fornecedor; fechar: () => void }) {
  const [ps, setPs] = useState<Produto[] | null>(null)
  const [erro, setErro] = useState(false)
  useEffect(() => {
    let vivo = true
    fetch(`/api/fornecedores/${f.id}/produtos`, { cache: 'no-store' }).then(r => r.json()).then(j => { if (vivo) { if (Array.isArray(j?.produtos)) setPs(j.produtos); else setErro(true) } }).catch(() => { if (vivo) setErro(true) })
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
    window.addEventListener('keydown', esc)
    return () => { vivo = false; window.removeEventListener('keydown', esc) }
  }, [f.id, fechar])
  const whats = f.contatos.find(c => c.whats)
  return (
    <div className={o.modalFundo} onClick={fechar} role="dialog" aria-modal="true" aria-label={`Produtos de ${f.nome}`}>
      <div className={o.modal} onClick={e => e.stopPropagation()}>
        <div className={o.modalCab}>
          <div>
            <div className={o.meta}>Produtos do site</div>
            <h3 className={o.nome}>{f.nome}</h3>
          </div>
          <button type="button" className={`${o.btSec} ${o.btIcone}`} onClick={fechar} aria-label="Fechar">✕</button>
        </div>
        <p className={o.modalNota}>{ps?.some(p => p.fonte === 'pdf')
          ? <>Do <b>catálogo de atacado</b> que o fornecedor mandou (preço por unidade) e do site dele. Pedido mínimo e condições você confirma com ele.</>
          : 'Lidos do site público do fornecedor. Preço de site pode ser de varejo; o preço de atacado e o pedido mínimo você confirma com ele.'}</p>
        {!ps && !erro && <div className={o.modalNota}>Carregando…</div>}
        {erro && <div className="ouro-erro">Não consegui carregar os produtos agora.</div>}
        {ps && (
          <div className={o.prods}>
            {ps.map((p, i) => {
              const miolo = <>
                {p.imagem
                  ? <span className={o.prodImg}><img src={p.imagem} alt="" loading="lazy" referrerPolicy="no-referrer" onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }} /></span>
                  : p.fonte === 'pdf' && <span className={o.prodSelo}>Catálogo{p.sku ? ` · cód. ${p.sku}` : ''}</span>}
                <span className={o.prodTit}>{p.titulo}</span>
                {p.preco != null && <b className={o.prodPreco}>{brl(p.preco)}{p.fonte === 'pdf' && <small> atacado</small>}</b>}
              </>
              return p.url
                ? <a key={i} className={o.prod} href={p.url} target="_blank" rel="noopener noreferrer" onClick={() => registrar(f.id, 'site')}>{miolo}</a>
                : <div key={i} className={o.prod}>{miolo}</div>
            })}
          </div>
        )}
        {whats && (
          <div className={o.modalRodape}>
            <a className={o.btWhats} href={linkWhats(whats.numero)} target="_blank" rel="noopener noreferrer" onClick={() => registrar(f.id, 'whats')}>{Ic.whats} Pedir catálogo de atacado</a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Fornecedores({ irPlanos }: { irPlanos?: () => void }) {
  const [dados, setDados] = useState<Resp | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const [uf, setUf] = useState('')
  const [soCpf, setSoCpf] = useState(false)
  const [soSite, setSoSite] = useState(false)
  const [vendo, setVendo] = useState<Fornecedor | null>(null)

  useEffect(() => {
    let vivo = true
    fetch('/api/fornecedores', { cache: 'no-store' })
      .then(async r => { const j = await r.json().catch(() => null); if (!r.ok || !j?.fornecedores) throw new Error(j?.error || 'falha') ; return j as Resp })
      .then(j => { if (vivo) setDados(j) })
      .catch(() => { if (vivo) setErro('Não consegui carregar os fornecedores agora. Tente de novo em instantes.') })
    return () => { vivo = false }
  }, [])

  const lista = dados?.fornecedores || []
  const tags = useMemo(() => {
    const c = new Map<string, number>()
    for (const f of lista) for (const t of f.tags) c.set(t, (c.get(t) || 0) + 1)
    return [...c.entries()].sort((a, b) => b[1] - a[1])
  }, [lista])
  const ufs = useMemo(() => [...new Set(lista.flatMap(f => f.ufs))].sort(), [lista])
  const filtrados = useMemo(() => {
    const q = semAcento(busca.trim())
    return lista.filter(f =>
      (!tag || f.tags.includes(tag)) && (!uf || f.ufs.includes(uf)) && (!soCpf || f.vendeCpf) && (!soSite || !!f.site) &&
      (!q || semAcento(`${f.nome} ${f.categoria || ''} ${f.tags.join(' ')} ${f.dica || ''}`).includes(q)))
  }, [lista, busca, tag, uf, soCpf, soSite])

  const travado = !!dados && !dados.liberado
  const sub = <>Importadoras e distribuidoras selecionadas pelo <strong>João Florio</strong>. Escolha pela categoria, toque em <strong>Pedir catálogo</strong> e a conversa abre no WhatsApp com a mensagem pronta.</>

  if (erro) return (
    <div className="ouro-pagina">
      <CabecalhoOuro grupo="Ferramentas" titulo="Fornecedores" destaque="nacionais" sub={sub} />
      <div className="ouro-erro">{erro}</div>
    </div>
  )

  return (
    <div className="ouro-pagina">
      <CabecalhoOuro grupo="Ferramentas" titulo="Fornecedores" destaque="nacionais" sub={sub} />

      {!dados && <VazioOuro icone={IcOuro.caixa || IcOuro.catalogo} titulo="Carregando os fornecedores…" />}

      {travado && (
        <div className={o.cadeado}>
          <div>
            <h3>Mais <em>{Math.max(0, dados!.total - lista.length)} fornecedores</em> liberados para assinantes</h3>
            <p>No teste grátis você vê uma amostra. Assinando o Oráculo, a lista completa do João abre na hora: contato, WhatsApp com a mensagem pronta, site e as dicas de cada fornecedor.</p>
          </div>
          {irPlanos && <button className="ouro-botao" onClick={irPlanos}>Ver planos</button>}
        </div>
      )}

      {dados && !travado && (
        <div className={o.filtros}>
          <div className={o.linha}>
            <label className={o.busca}>
              {Ic.lupa}
              <input className="ouro-entrada" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar fornecedor ou produto" aria-label="Buscar fornecedor" />
            </label>
            <select className={`ouro-entrada ${o.uf}`} value={uf} onChange={e => setUf(e.target.value)} aria-label="Estado">
              <option value="">Todos os estados</option>
              {ufs.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <button type="button" className={`${o.toggle} ${soCpf ? o.toggleOn : ''}`} onClick={() => setSoCpf(v => !v)} aria-pressed={soCpf}>
              <i>{soCpf ? '✓' : ''}</i> Vende para CPF
            </button>
            <button type="button" className={`${o.toggle} ${soSite ? o.toggleOn : ''}`} onClick={() => setSoSite(v => !v)} aria-pressed={soSite}>
              <i>{soSite ? '✓' : ''}</i> Tem site
            </button>
          </div>
          <div className={`${o.linha} ${o.faixa}`}>
            <button type="button" className={`${o.chip} ${!tag ? o.chipOn : ''}`} onClick={() => setTag(null)}>Todas<small>{lista.length}</small></button>
            {tags.map(([t, n]) => (
              <button type="button" key={t} className={`${o.chip} ${tag === t ? o.chipOn : ''}`} onClick={() => setTag(tag === t ? null : t)}>{t}<small>{n}</small></button>
            ))}
          </div>
          <div className={o.contagem}><b>{filtrados.length}</b> de {lista.length} fornecedores</div>
        </div>
      )}

      {dados && filtrados.length === 0 && !travado && (
        <VazioOuro icone={IcOuro.lupa} titulo="Nenhum fornecedor com esses filtros" texto="Tire um filtro ou busque por outra palavra."
          acao={<button className="ouro-botao" onClick={() => { setBusca(''); setTag(null); setUf(''); setSoCpf(false); setSoSite(false) }}>Limpar filtros</button>} />
      )}

      {dados && filtrados.length > 0 && (
        <div className={o.grade}>
          {filtrados.map((f, i) => <Card key={f.id} f={f} travado={travado} i={i} verProdutos={setVendo} />)}
        </div>
      )}

      {vendo && <ModalProdutos f={vendo} fechar={() => setVendo(null)} />}

      {dados && !travado && (
        <p className="ouro-nota">Os contatos são dos próprios fornecedores; condições, pedido mínimo e preço são combinados direto com eles. A mensagem do WhatsApp já sai pronta, é só enviar.</p>
      )}
    </div>
  )
}
