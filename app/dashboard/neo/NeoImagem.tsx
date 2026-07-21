'use client'
import { useRef, useState } from 'react'

// CRIADOR DE IMAGEM dentro do Oráculo (Nano Banana / Gemini). Modal que o NEO
// abre: o seller descreve OU manda a foto real do produto, e recebe a imagem
// gerada — sem sair pro ChatGPT. Anexar a foto real é o que vira "amador → estúdio".

type Ref = { mediaType: string; data: string }

const SUGESTOES = [
  'Foto de estúdio, fundo branco puro, produto centralizado, iluminação profissional de e-commerce',
  'Foto lifestyle: o produto sendo usado por uma pessoa real, ambiente aconchegante, luz natural',
  'Infográfico do anúncio: destaque 3 benefícios com ícones e texto curto em português',
]

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

export default function NeoImagem({ promptInicial = '', onClose }: { promptInicial?: string; onClose: () => void }) {
  const [prompt, setPrompt] = useState(promptInicial)
  const [refs, setRefs] = useState<Ref[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [imagem, setImagem] = useState<string | null>(null)   // data URL da imagem gerada
  const fileRef = useRef<HTMLInputElement>(null)

  async function anexar(files: FileList | null) {
    if (!files?.length) return
    const novas: Ref[] = []
    for (const f of Array.from(files)) {
      if (refs.length + novas.length >= 6) break
      if (f.size > 6 * 1024 * 1024) { setErro('Cada foto deve ter até 6MB.'); continue }
      try { novas.push(await lerImg(f)) } catch { setErro('Não consegui ler essa foto.') }
    }
    setRefs(p => [...p, ...novas].slice(0, 6))
    if (fileRef.current) fileRef.current.value = ''
  }

  async function gerar() {
    const p = prompt.trim()
    if (!p || loading) return
    setErro(null); setImagem(null); setLoading(true)
    try {
      const res = await fetch('/api/agent/imagem', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: AbortSignal.timeout(120_000),
        body: JSON.stringify({ prompt: p, refs }),
      })
      const d = await res.json().catch(() => null)
      if (!d?.ok || !d?.data) setErro(d?.erro || 'Não consegui gerar a imagem. Tente descrever de outro jeito.')
      else setImagem(`data:${d.mediaType};base64,${d.data}`)
    } catch (e: any) {
      setErro(e?.name === 'TimeoutError' ? 'Demorou demais. Tente de novo.' : 'Erro de conexão.')
    } finally { setLoading(false) }
  }

  return (
    <div className="niOverlay" onClick={onClose}>
      <style>{`
        .niOverlay{ position:fixed; inset:0; z-index:200; background:rgba(3,3,8,.78); backdrop-filter:blur(6px);
          display:grid; place-items:center; padding:16px; animation:niFade .2s ease; }
        @keyframes niFade{ from{opacity:0} to{opacity:1} }
        .niBox{ width:min(680px,100%); max-height:92dvh; overflow-y:auto; background:#0b0b12;
          border:1px solid rgba(240,180,41,.2); border-radius:20px; box-shadow:0 30px 80px rgba(0,0,0,.6);
          padding:22px; animation:niUp .28s cubic-bezier(.22,.61,.36,1); }
        @keyframes niUp{ from{opacity:0; transform:translateY(14px)} to{opacity:1; transform:none} }
        .niHead{ display:flex; align-items:center; gap:10px; margin-bottom:4px; }
        .niTitle{ font-weight:800; font-size:17px; color:#f5efdf; }
        .niX{ margin-left:auto; background:transparent; border:1px solid rgba(255,255,255,.14); color:#aaa;
          width:32px; height:32px; border-radius:9px; cursor:pointer; font-size:16px; }
        .niSub{ font-size:12.5px; color:rgba(233,228,212,.55); margin-bottom:16px; line-height:1.5; }
        .niLabel{ font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:rgba(240,180,41,.7); margin:14px 0 7px; }
        .niArea{ width:100%; min-height:80px; resize:vertical; background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:12px 14px; color:#f5efdf;
          font-size:14px; font-family:inherit; outline:none; box-sizing:border-box; }
        .niArea:focus{ border-color:rgba(240,180,41,.5); }
        .niChips{ display:flex; flex-wrap:wrap; gap:7px; margin-top:9px; }
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
        .niBtn{ width:100%; margin-top:18px; height:48px; border:none; border-radius:13px; cursor:pointer;
          font-weight:800; font-size:14px; color:#0d0a02; background:linear-gradient(135deg,#ffd763,#f0b429);
          box-shadow:0 6px 24px rgba(240,180,41,.3); }
        .niBtn:disabled{ opacity:.6; cursor:default; }
        .niErr{ margin-top:12px; font-size:13px; color:#ffb3b3; background:rgba(255,77,77,.08);
          border:1px solid rgba(255,77,77,.25); border-radius:11px; padding:10px 13px; }
        .niLoad{ margin-top:16px; text-align:center; color:rgba(240,180,41,.8); font-size:13px; }
        .niResult{ margin-top:16px; }
        .niResult img{ width:100%; border-radius:14px; border:1px solid rgba(255,255,255,.12); display:block; }
        .niDl{ display:inline-flex; align-items:center; gap:6px; margin-top:10px; text-decoration:none;
          font-size:12.5px; font-weight:700; color:#0d0a02; background:#f0b429; border-radius:999px; padding:8px 16px; }
      `}</style>
      <div className="niBox" onClick={e => e.stopPropagation()}>
        <div className="niHead">
          <span style={{ fontSize: 20 }}>🎨</span>
          <span className="niTitle">Criar imagem do anúncio</span>
          <button className="niX" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="niSub">Descreva a imagem que você quer. Se anexar a <b>foto real do seu produto</b>, ela vira base — o resultado fica igual ao seu produto, só num visual profissional.</div>

        <div className="niLabel">O que você quer</div>
        <textarea className="niArea" value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Ex.: foto do meu suporte de celular em fundo branco, estilo estúdio, iluminação profissional…" />
        <div className="niChips">
          {SUGESTOES.map(s => <button key={s} className="niChip" onClick={() => setPrompt(s)}>{s}</button>)}
        </div>

        <div className="niLabel">Foto do seu produto (opcional, recomendado)</div>
        <div className="niRefs">
          {refs.map((r, i) => (
            <div key={i} className="niThumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`data:${r.mediaType};base64,${r.data}`} alt="ref" />
              <button onClick={() => setRefs(p => p.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {refs.length < 6 && <button className="niAdd" onClick={() => fileRef.current?.click()}>+</button>}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => anexar(e.target.files)} />
        </div>

        <button className="niBtn" onClick={gerar} disabled={loading || !prompt.trim()}>
          {loading ? 'Gerando…' : 'Gerar imagem'}
        </button>

        {loading && <div className="niLoad">O Nano Banana está desenhando… leva alguns segundos.</div>}
        {erro && <div className="niErr">{erro}</div>}
        {imagem && (
          <div className="niResult">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagem} alt="imagem gerada" />
            <a className="niDl" href={imagem} download="oraculo-anuncio.png">⬇ Baixar</a>
          </div>
        )}
      </div>
    </div>
  )
}
