'use client'
import { useRef, useState } from 'react'

// CRIADOR DE ANÚNCIO — dois modos:
//  • COMPLETO: cola a URL/ASIN → 6 imagens profissionais em cima da foto oficial
//    + a copy (título SEO/bullets/descrição) que o NEO escreve. É a visão do João.
//  • MANUAL: descreve uma imagem avulsa (+ foto opcional). O modo antigo.

type Ref = { mediaType: string; data: string }
type Modo = 'completo' | 'manual'

function lerImg(file: File): Promise<Ref> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => {
      const m = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/.exec(String(r.result || ''))
      if (!m) return rej(new Error('formato'))
      res({ mediaType: m[1], data: m[2] })
    }
    r.onerror = () => rej(new Error('leitura'))
    r.readAsDataURL(file)
  })
}

export default function NeoImagem({ onClose }: { onClose: () => void }) {
  const [modo, setModo] = useState<Modo>('completo')
  return (
    <div className="niOverlay" onClick={onClose}>
      <style>{CSS}</style>
      <div className="niBox" onClick={e => e.stopPropagation()}>
        <div className="niHead">
          <span style={{ fontSize: 20 }}>🎨</span>
          <span className="niTitle">Criador de Anúncio</span>
          <button className="niX" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="niTabs">
          <button className={modo === 'completo' ? 'on' : ''} onClick={() => setModo('completo')}>Anúncio completo</button>
          <button className={modo === 'manual' ? 'on' : ''} onClick={() => setModo('manual')}>Imagem avulsa</button>
        </div>
        {modo === 'completo' ? <Completo /> : <Manual />}
      </div>
    </div>
  )
}

// ── MODO COMPLETO: URL → 6 imagens + copy ────────────────────────────────────
function Completo() {
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [res, setRes] = useState<any>(null)

  async function criar() {
    const l = link.trim()
    if (!l || loading) return
    setErro(null); setRes(null); setLoading(true)
    try {
      const r = await fetch('/api/agent/criar-anuncio', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        signal: AbortSignal.timeout(180_000),
        body: JSON.stringify({ link: l }),
      })
      const d = await r.json().catch(() => null)
      if (!d?.ok) setErro(d?.error || d?.erro || 'Não consegui criar o anúncio agora.')
      else setRes(d)
    } catch (e: any) {
      setErro(e?.name === 'TimeoutError' ? 'Demorou demais (as imagens levam alguns minutos). Tente de novo.' : 'Erro de conexão.')
    } finally { setLoading(false) }
  }

  const p = res?.produto

  return (
    <>
      <div className="niSub">Cole o link do produto na Amazon. O NEO lê o produto, gera <b>6 imagens profissionais</b> em cima da foto oficial e monta o anúncio completo pra você copiar.</div>
      <div className="niLabel">Link do produto (ou ASIN)</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="niInput" value={link} onChange={e => setLink(e.target.value)}
          placeholder="https://www.amazon.com.br/dp/B0..." onKeyDown={e => { if (e.key === 'Enter') criar() }} />
        <button className="niGo" onClick={criar} disabled={loading || !link.trim()}>{loading ? '···' : 'Criar'}</button>
      </div>

      {loading && <div className="niLoad">O NEO está montando o anúncio — 6 imagens, leva 1 a 2 minutos. Não feche.</div>}
      {erro && <div className="niErr">{erro}</div>}

      {res && (
        <div style={{ marginTop: 18 }}>
          {typeof res.usos === 'number' && (
            <div className="niQuota">Anúncio {res.usos} de {res.limite} deste mês{res.falhasImagem ? ` · ${res.falhasImagem} imagem(ns) falharam` : ''}</div>
          )}
          <div className="niLabel">As 6 imagens</div>
          <div className="niGrid">
            {(res.imagens || []).map((im: any, i: number) => (
              <a key={i} className="niCard" href={`data:${im.mediaType};base64,${im.data}`} download={`anuncio-${i + 1}.png`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`data:${im.mediaType};base64,${im.data}`} alt={im.rotulo} />
                <span>{im.rotulo} ⬇</span>
              </a>
            ))}
          </div>

          {p && (
            <>
              <div className="niLabel" style={{ marginTop: 18 }}>O produto lido</div>
              <div className="niProd">
                <div><b>Título atual:</b> {p.titulo || '—'}</div>
                <div style={{ marginTop: 6 }}><b>Marca:</b> {p.marca} · <b>Imagens no anúncio:</b> {p.imagens}</div>
              </div>
              <div className="niCopyHint">✍️ Para o <b>título SEO, bullets e descrição otimizados</b>, feche isto e peça na conversa: <i>“escreve o anúncio completo desse produto: {res.asin}”</i>. O NEO escreve na voz certa, com os dados que acabou de ler.</div>
            </>
          )}
        </div>
      )}
    </>
  )
}

// ── MODO MANUAL: imagem avulsa ───────────────────────────────────────────────
const SUGESTOES = [
  'Foto de estúdio, fundo branco puro, produto centralizado, iluminação profissional de e-commerce',
  'Foto lifestyle: produto sendo usado por uma pessoa real, ambiente aconchegante, luz natural',
  'Infográfico: destaque 3 benefícios com ícones e texto curto em português',
]
function Manual() {
  const [prompt, setPrompt] = useState('')
  const [refs, setRefs] = useState<Ref[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [imagem, setImagem] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function anexar(files: FileList | null) {
    if (!files?.length) return
    const novas: Ref[] = []
    for (const f of Array.from(files)) {
      if (refs.length + novas.length >= 3) break
      if (f.size > 6 * 1024 * 1024) { setErro('Cada foto até 6MB.'); continue }
      try { novas.push(await lerImg(f)) } catch { setErro('Não li essa foto.') }
    }
    setRefs(p => [...p, ...novas].slice(0, 3))
    if (fileRef.current) fileRef.current.value = ''
  }

  async function gerar() {
    const p = prompt.trim()
    if (!p || loading) return
    setErro(null); setImagem(null); setLoading(true)
    try {
      const res = await fetch('/api/agent/imagem', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        signal: AbortSignal.timeout(120_000),
        body: JSON.stringify({ prompt: p, refs }),
      })
      const d = await res.json().catch(() => null)
      if (!d?.ok || !d?.data) setErro(d?.erro || 'Não consegui gerar. Tente descrever de outro jeito.')
      else setImagem(`data:${d.mediaType};base64,${d.data}`)
    } catch (e: any) {
      setErro(e?.name === 'TimeoutError' ? 'Demorou demais.' : 'Erro de conexão.')
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="niSub">Descreva uma imagem. Se anexar a <b>foto real do produto</b>, ela vira base.</div>
      <div className="niLabel">O que você quer</div>
      <textarea className="niArea" value={prompt} onChange={e => setPrompt(e.target.value)}
        placeholder="Ex.: meu suporte de celular em fundo branco, estilo estúdio…" />
      <div className="niChips">{SUGESTOES.map(s => <button key={s} className="niChip" onClick={() => setPrompt(s)}>{s}</button>)}</div>
      <div className="niLabel">Foto do produto (opcional)</div>
      <div className="niRefs">
        {refs.map((r, i) => (
          <div key={i} className="niThumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:${r.mediaType};base64,${r.data}`} alt="ref" />
            <button onClick={() => setRefs(p => p.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        {refs.length < 3 && <button className="niAdd" onClick={() => fileRef.current?.click()}>+</button>}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => anexar(e.target.files)} />
      </div>
      <button className="niBtn" onClick={gerar} disabled={loading || !prompt.trim()}>{loading ? 'Gerando…' : 'Gerar imagem'}</button>
      {loading && <div className="niLoad">Desenhando… alguns segundos.</div>}
      {erro && <div className="niErr">{erro}</div>}
      {imagem && (
        <div className="niResult">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagem} alt="gerada" />
          <a className="niDl" href={imagem} download="oraculo-anuncio.png">⬇ Baixar</a>
        </div>
      )}
    </>
  )
}

const CSS = `
  .niOverlay{ position:fixed; inset:0; z-index:200; background:rgba(3,3,8,.78); backdrop-filter:blur(6px);
    display:grid; place-items:center; padding:16px; animation:niFade .2s ease; }
  @keyframes niFade{ from{opacity:0} to{opacity:1} }
  .niBox{ width:min(760px,100%); max-height:92dvh; overflow-y:auto; background:#0b0b12;
    border:1px solid rgba(240,180,41,.2); border-radius:20px; box-shadow:0 30px 80px rgba(0,0,0,.6);
    padding:22px; animation:niUp .28s cubic-bezier(.22,.61,.36,1); }
  @keyframes niUp{ from{opacity:0; transform:translateY(14px)} to{opacity:1; transform:none} }
  .niHead{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .niTitle{ font-weight:800; font-size:17px; color:#f5efdf; }
  .niX{ margin-left:auto; background:transparent; border:1px solid rgba(255,255,255,.14); color:#aaa;
    width:32px; height:32px; border-radius:9px; cursor:pointer; font-size:16px; }
  .niTabs{ display:flex; gap:4px; background:rgba(255,255,255,.04); border-radius:999px; padding:4px; margin-bottom:16px; }
  .niTabs button{ flex:1; background:transparent; border:none; color:rgba(245,239,223,.55); font-family:inherit;
    font-size:12.5px; font-weight:700; padding:9px; border-radius:999px; cursor:pointer; transition:all .2s; }
  .niTabs button.on{ color:#0d0a02; background:linear-gradient(135deg,#ffd763,#f0b429); }
  .niSub{ font-size:12.5px; color:rgba(233,228,212,.55); margin-bottom:14px; line-height:1.5; }
  .niLabel{ font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:rgba(240,180,41,.7); margin:14px 0 7px; }
  .niInput{ flex:1; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.12); border-radius:12px;
    padding:12px 14px; color:#f5efdf; font-size:14px; outline:none; }
  .niInput:focus{ border-color:rgba(240,180,41,.5); }
  .niGo,.niBtn{ border:none; border-radius:12px; cursor:pointer; font-weight:800; color:#0d0a02;
    background:linear-gradient(135deg,#ffd763,#f0b429); box-shadow:0 6px 24px rgba(240,180,41,.3); }
  .niGo{ padding:0 20px; font-size:13px; }
  .niBtn{ width:100%; margin-top:16px; height:48px; font-size:14px; }
  .niGo:disabled,.niBtn:disabled{ opacity:.6; cursor:default; }
  .niArea{ width:100%; min-height:76px; resize:vertical; background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:12px 14px; color:#f5efdf;
    font-size:14px; font-family:inherit; outline:none; box-sizing:border-box; }
  .niArea:focus{ border-color:rgba(240,180,41,.5); }
  .niChips{ display:flex; flex-direction:column; gap:6px; margin-top:9px; }
  .niChip{ font-size:11.5px; text-align:left; color:rgba(233,228,212,.7); background:rgba(240,180,41,.05);
    border:1px solid rgba(240,180,41,.18); border-radius:10px; padding:7px 11px; cursor:pointer; }
  .niChip:hover{ background:rgba(240,180,41,.13); color:#fff; }
  .niRefs{ display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
  .niThumb{ position:relative; }
  .niThumb img{ width:56px; height:56px; object-fit:cover; border-radius:9px; border:1px solid rgba(255,255,255,.15); }
  .niThumb button{ position:absolute; top:-6px; right:-6px; width:18px; height:18px; border-radius:99px;
    background:#111; border:1px solid rgba(255,255,255,.2); color:#fff; font-size:11px; cursor:pointer; }
  .niAdd{ width:56px; height:56px; border-radius:9px; border:1px dashed rgba(240,180,41,.35);
    background:transparent; color:rgba(240,180,41,.7); font-size:22px; cursor:pointer; }
  .niErr{ margin-top:12px; font-size:13px; color:#ffb3b3; background:rgba(255,77,77,.08);
    border:1px solid rgba(255,77,77,.25); border-radius:11px; padding:10px 13px; }
  .niLoad{ margin-top:14px; text-align:center; color:rgba(240,180,41,.8); font-size:13px; line-height:1.5; }
  .niQuota{ font-size:11px; letter-spacing:.06em; color:rgba(240,180,41,.6); margin-bottom:10px; }
  .niGrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  @media (max-width:560px){ .niGrid{ grid-template-columns:repeat(2,1fr); } }
  .niCard{ display:block; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,.12);
    text-decoration:none; background:#000; }
  .niCard img{ width:100%; aspect-ratio:1; object-fit:cover; display:block; }
  .niCard span{ display:block; font-size:10px; color:rgba(233,228,212,.7); padding:6px 8px; text-align:center; }
  .niCard:hover span{ color:#f0b429; }
  .niProd{ font-size:13px; color:rgba(233,228,212,.75); line-height:1.5; background:rgba(255,255,255,.03);
    border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:12px 14px; }
  .niCopyHint{ margin-top:12px; font-size:12.5px; color:rgba(233,228,212,.7); line-height:1.6;
    background:rgba(240,180,41,.05); border:1px solid rgba(240,180,41,.18); border-radius:12px; padding:12px 14px; }
  .niResult{ margin-top:16px; }
  .niResult img{ width:100%; border-radius:14px; border:1px solid rgba(255,255,255,.12); display:block; }
  .niDl{ display:inline-flex; align-items:center; gap:6px; margin-top:10px; text-decoration:none;
    font-size:12.5px; font-weight:700; color:#0d0a02; background:#f0b429; border-radius:999px; padding:8px 16px; }
`
