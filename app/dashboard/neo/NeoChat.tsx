'use client'
import { useEffect, useRef, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
 * AGENTE NEO — ambiente premium
 *
 * Não é "um chat": é a sala de comando do vendedor. Preto obsidiana, aura
 * dourada, um núcleo vivo (o orbe) que respira em repouso e acelera quando o
 * NEO está lendo os números. Tipografia própria (Unbounded p/ display, IBM
 * Plex Mono p/ dados) só neste ambiente — o resto do painel não muda.
 *
 * Voz, sem custo de API (tudo no navegador):
 *  - ENTRADA: Web Speech Recognition (pt-BR) — botão de microfone transcreve
 *    a fala pro campo. Funciona bem; fica ligado.
 *  - SAÍDA: speechSynthesis — DESLIGADA (ver VOZ_SAIDA abaixo).
 * ═══════════════════════════════════════════════════════════════════════════ */

type Img = { mediaType: string; data: string }
type Msg = { role: 'user' | 'assistant'; text: string; images?: Img[] }
type Insight = { texto: string; severidade: 'critico' | 'atencao' | 'ok'; geradoEm: string } | null

const GPT_AGENT_URL = 'https://chatgpt.com/g/g-6a02736d422081918e58416c49426a3a-oraculo-ia-especialista-em-marketplace'
const SUGESTOES = [
  'Como está minha operação?',
  'Qual produto está caindo?',
  'Meu ACOS está saudável?',
  'Onde estou perdendo margem?',
]
const MAX_IMGS = 3

/**
 * Voz de saída (o NEO falando a resposta em voz alta) — DESLIGADA por decisão
 * de produto, não por bug: o código todo abaixo funciona.
 *
 * O motivo: a Web Speech API usa as vozes instaladas NO APARELHO do cliente, e
 * em pt-BR o que existe é ruim. No Mac de teste as opções eram Luciana
 * (feminina), as Eloquence (robôs de leitor de tela) e o Felipe (aquela voz de
 * meme). Num produto premium, recurso que só soa mal é pior que recurso nenhum.
 *
 * Pra ter uma voz masculina brasileira decente e IGUAL pra todo cliente, o
 * caminho é TTS pago no backend (Google Chirp 3 HD ≈ US$30/milhão de caracteres,
 * com 1 milhão grátis/mês — cobre a base atual). Decisão em aberto com o João.
 *
 * Pra religar a voz do aparelho: basta trocar para `true`.
 */
const VOZ_SAIDA = false

const SEV = {
  critico: { cor: '#ff4d4d', rotulo: 'Precisa de decisão hoje' },
  atencao: { cor: '#f0b429', rotulo: 'Vale olhar' },
  ok:      { cor: '#31d183', rotulo: 'Operação na régua' },
} as const

function lerImagem(file: File): Promise<Img> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const m = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/.exec(String(r.result || ''))
      if (!m) return reject(new Error('formato inválido'))
      resolve({ mediaType: m[1], data: m[2] })
    }
    r.onerror = () => reject(new Error('falha ao ler'))
    r.readAsDataURL(file)
  })
}

function toApiContent(m: Msg): any {
  if (!m.images?.length) return m.text
  return [
    ...m.images.map((im) => ({ type: 'image', source: { type: 'base64', media_type: im.mediaType, data: im.data } })),
    ...(m.text ? [{ type: 'text', text: m.text }] : []),
  ]
}

// Vozes masculinas de pt-BR que existem por aí, por plataforma. A lista é
// necessária porque a Web Speech API NÃO expõe gênero — só nome e idioma.
// Apple usa Felipe, Windows usa Daniel, Android marca no voiceURI (#male).
// Ordem = preferência. Felipe (Apple) e Daniel (Windows) são vozes de leitura
// de verdade; Eddy/Rocko/Reed/Grandpa são as "novelty" da Apple — servem, mas
// só depois. Percorrer NESTA ordem, não a ordem do aparelho: no Mac de teste a
// primeira voz da lista é a Luciana, e sair pegando a primeira que casa
// entregava uma novelty quando havia opção melhor instalada.
const MASCULINAS = ['felipe', 'daniel', 'ricardo', 'eddy', 'rocko', 'reed', 'grandpa']

function escolherMasculina(vozes: SpeechSynthesisVoice[]): string {
  for (const m of MASCULINAS) {
    const v = vozes.find((x) => x.name.toLowerCase().includes(m))
    if (v) return v.name
  }
  const marcada = vozes.find((v) => /male|masculin/i.test(v.voiceURI || '') && !/female/i.test(v.voiceURI || ''))
  if (marcada) return marcada.name
  return vozes[0]?.name || ''   // sem voz masculina no aparelho: usa a que tem
}

// Markdown mínimo e seguro: só **negrito** — o resto é texto puro do React.
function rico(texto: string) {
  const partes = texto.split(/\*\*(.+?)\*\*/g)
  return partes.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : p))
}

export default function NeoChat() {
  const [ins, setIns] = useState<Insight>(null)
  const [carregandoIns, setCarregandoIns] = useState(true)
  const [semConexao, setSemConexao] = useState(false)
  const [demo, setDemo] = useState(false)

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [pend, setPend] = useState<Img[]>([])
  const [loading, setLoading] = useState(false)
  const [seg, setSeg] = useState(0)          // segundos decorridos na consulta
  const [erro, setErro] = useState<string | null>(null)

  // Voz
  const [suportaMic, setSuportaMic] = useState(false)
  const [gravando, setGravando] = useState(false)
  const [vozAtiva, setVozAtiva] = useState(false)
  const [falando, setFalando] = useState(false)
  const [vozes, setVozes] = useState<SpeechSynthesisVoice[]>([])
  const [vozNome, setVozNome] = useState('')
  const recRef = useRef<any>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [msgs, loading, pend])

  // Consulta que puxa muita coisa demora — mostrar o tempo correndo é o que
  // diferencia "está trabalhando" de "travou".
  useEffect(() => {
    if (!loading) { setSeg(0); return }
    const t = setInterval(() => setSeg((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [loading])

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSuportaMic(!!SR)
    return () => { try { recRef.current?.stop() } catch {} ; try { window.speechSynthesis?.cancel() } catch {} }
  }, [])

  // Catálogo de vozes pt-BR do dispositivo. No Chrome, getVoices() volta VAZIO
  // na primeira chamada — sem escutar 'voiceschanged' a gente acabava falando
  // com a voz padrão do sistema (que nem sempre é português).
  useEffect(() => {
    if (!VOZ_SAIDA || !('speechSynthesis' in window)) return
    const carregar = () => {
      const pt = window.speechSynthesis.getVoices().filter((v) => /^pt[-_]?br/i.test(v.lang || ''))
      if (!pt.length) return
      setVozes(pt)
      setVozNome((atual) => atual || localStorage.getItem('neo_voz') || escolherMasculina(pt))
    }
    carregar()
    window.speechSynthesis.addEventListener('voiceschanged', carregar)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', carregar)
  }, [])

  useEffect(() => {
    let vivo = true
    fetch('/api/agent/insight', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return
        if (d?.connected === false) setSemConexao(true)
        else if (d?.demo) setDemo(true)
        else if (d?.texto) setIns(d)
      })
      .catch(() => {})
      .finally(() => { if (vivo) setCarregandoIns(false) })
    return () => { vivo = false }
  }, [])

  // ── Saída de voz: o NEO fala a resposta (voz pt-BR do próprio sistema) ─────
  function falar(texto: string) {
    if (!('speechSynthesis' in window)) return
    const limpo = texto.replace(/\*\*/g, '').replace(/[#`_]/g, '').replace(/\n+/g, '. ')
    const u = new SpeechSynthesisUtterance(limpo)
    u.lang = 'pt-BR'
    u.rate = 1.06
    u.pitch = 0.92   // um pouco mais grave — o NEO é operador, não locutor
    const voz = vozes.find((v) => v.name === vozNome) || vozes[0]
    if (voz) u.voice = voz
    u.onstart = () => setFalando(true)
    u.onend = () => setFalando(false)
    u.onerror = () => setFalando(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  // ── Entrada de voz: microfone transcreve pro campo ─────────────────────────
  function toggleMic() {
    if (gravando) { try { recRef.current?.stop() } catch {} ; setGravando(false); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    try { window.speechSynthesis?.cancel(); setFalando(false) } catch {}
    const rec = new SR()
    rec.lang = 'pt-BR'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e: any) => {
      let t = ''
      for (const r of e.results) t += r[0].transcript
      setInput(t)
    }
    rec.onend = () => setGravando(false)
    rec.onerror = () => setGravando(false)
    recRef.current = rec
    setGravando(true)
    try { rec.start() } catch { setGravando(false) }
  }

  async function anexar(files: FileList | null) {
    if (!files?.length) return
    setErro(null)
    const novas: Img[] = []
    for (const f of Array.from(files)) {
      if (pend.length + novas.length >= MAX_IMGS) break
      if (f.size > 5 * 1024 * 1024) { setErro('Cada imagem deve ter até 5MB.'); continue }
      try { novas.push(await lerImagem(f)) } catch { setErro('Não consegui ler essa imagem.') }
    }
    if (novas.length) setPend((p) => [...p, ...novas].slice(0, MAX_IMGS))
    if (fileRef.current) fileRef.current.value = ''
  }

  async function enviar(texto: string) {
    const q = texto.trim()
    if ((!q && pend.length === 0) || loading) return
    if (gravando) { try { recRef.current?.stop() } catch {} ; setGravando(false) }
    setErro(null)
    const userMsg: Msg = { role: 'user', text: q, images: pend.length ? pend : undefined }
    const historico = [...msgs, userMsg]
    setMsgs(historico)
    setInput('')
    setPend([])
    setLoading(true)
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: AbortSignal.timeout(180_000),
        body: JSON.stringify({ agent: 'neo', messages: historico.map((m) => ({ role: m.role, content: toApiContent(m) })) }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data || data?.error) setErro(data?.error || 'O NEO não conseguiu responder agora. Tente de novo em instantes.')
      else {
        setMsgs([...historico, { role: 'assistant', text: data.reply || '(sem resposta)' }])
        if (VOZ_SAIDA && vozAtiva && data.reply) falar(data.reply)
      }
    } catch (e: any) {
      // Distingue "demorou demais" de "caiu a conexão" — dizer "erro de rede"
      // pra um timeout mandava o vendedor procurar problema no wi-fi dele.
      setErro(e?.name === 'TimeoutError' || e?.name === 'AbortError'
        ? 'A consulta passou de 3 minutos e foi interrompida. Tente algo mais específico — por exemplo, só o faturamento de hoje.'
        : 'Perdi a conexão no meio da consulta. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  const sev = ins ? SEV[ins.severidade] : null
  const vazio = msgs.length === 0

  return (
    <div className="neoRoot">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .neoRoot{ position:relative; height:100%; min-height:0; display:flex; flex-direction:column;
          background:#050505; border:1px solid rgba(240,180,41,.14); border-radius:22px; overflow:hidden;
          box-shadow: 0 30px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04); }
        /* atmosfera: aura dourada + grade fina + vinheta */
        .neoRoot::before{ content:''; position:absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(58% 42% at 50% -6%, rgba(240,180,41,.16), transparent 62%),
            radial-gradient(80% 60% at 50% 115%, rgba(240,180,41,.05), transparent 60%),
            repeating-linear-gradient(0deg, rgba(255,255,255,.018) 0 1px, transparent 1px 44px),
            repeating-linear-gradient(90deg, rgba(255,255,255,.018) 0 1px, transparent 1px 44px); }
        .neoRoot::after{ content:''; position:absolute; inset:0; pointer-events:none;
          background:radial-gradient(120% 90% at 50% 50%, transparent 60%, rgba(0,0,0,.5) 100%); }
        .neoIn{ position:relative; z-index:1; display:flex; flex-direction:column; height:100%; min-height:0; }

        /* ── Núcleo (orbe) ── */
        .neoOrb{ position:relative; width:46px; height:46px; border-radius:50%; flex-shrink:0;
          background: radial-gradient(circle at 32% 28%, #ffedb0 0%, #f0b429 36%, #8a5f06 70%, #1d1502 100%);
          box-shadow: 0 0 22px rgba(240,180,41,.5), 0 0 70px rgba(240,180,41,.16), inset 0 0 14px rgba(0,0,0,.5);
          animation: neoBreathe 4.4s ease-in-out infinite; }
        .neoOrb::after{ content:''; position:absolute; inset:-7px; border-radius:50%;
          border:1.5px solid rgba(240,180,41,0); border-top-color:rgba(240,180,41,.8); border-right-color:rgba(240,180,41,.25);
          animation: neoSpin 7s linear infinite; }
        .neoOrb.on{ animation-duration: 1.6s; }
        .neoOrb.on::after{ animation-duration: 1.1s; }
        .neoOrb.fala{ animation-duration: .9s; }
        @keyframes neoBreathe{ 0%,100%{ transform:scale(1); filter:brightness(1);} 50%{ transform:scale(1.07); filter:brightness(1.22);} }
        @keyframes neoSpin{ to{ transform:rotate(360deg);} }

        /* ── Cabeçalho ── */
        .neoHead{ display:flex; align-items:center; gap:14px; padding:18px 20px 14px;
          border-bottom:1px solid rgba(240,180,41,.1); animation:neoUp .5s ease both; }
        .neoTitle{ font-family:'Unbounded', sans-serif; font-weight:900; font-size:20px; letter-spacing:.14em;
          color:#f5efdf; line-height:1; }
        .neoTitle b{ color:#f0b429; font-weight:900; }
        .neoSub{ font-family:'IBM Plex Mono', monospace; font-size:9.5px; letter-spacing:.28em; text-transform:uppercase;
          color:rgba(240,180,41,.62); margin-top:6px; }
        .neoVoice{ margin-left:auto; display:flex; align-items:center; gap:8px;
          font-family:'IBM Plex Mono', monospace; font-size:10px; letter-spacing:.18em; text-transform:uppercase;
          color:rgba(245,239,223,.55); background:transparent; border:1px solid rgba(240,180,41,.22);
          border-radius:999px; padding:8px 14px; cursor:pointer; transition:all .25s; }
        .neoVoice:hover{ border-color:rgba(240,180,41,.5); color:#f5efdf; }
        .neoVozSel{ background:rgba(255,255,255,.04); border:1px solid rgba(240,180,41,.22); border-radius:999px;
          color:rgba(245,239,223,.8); font-family:'IBM Plex Mono', monospace; font-size:10.5px;
          padding:7px 10px; cursor:pointer; outline:none; max-width:150px; }
        .neoVozSel:hover{ border-color:rgba(240,180,41,.5); }
        .neoVozSel option{ background:#12121a; color:#f5efdf; }
        .neoVoice.on{ color:#0d0a02; background:#f0b429; border-color:#f0b429; font-weight:600;
          box-shadow:0 0 24px rgba(240,180,41,.35); }

        /* ── Insight ── */
        .neoInsight{ margin:16px 20px 0; position:relative; border-radius:14px; overflow:hidden;
          background:linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.012));
          border:1px solid rgba(255,255,255,.07); padding:15px 18px 15px 22px; animation:neoUp .55s .08s ease both; }
        .neoInsight::before{ content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
          background:var(--sev); box-shadow:0 0 18px var(--sev); }
        .neoInsTag{ display:flex; align-items:center; gap:8px; font-family:'IBM Plex Mono', monospace;
          font-size:9.5px; font-weight:600; letter-spacing:.26em; text-transform:uppercase; color:var(--sev); margin-bottom:8px; }
        .neoDot{ width:6px; height:6px; border-radius:50%; background:var(--sev); box-shadow:0 0 10px var(--sev);
          animation:neoBreathe 2s ease-in-out infinite; }
        .neoInsTxt{ font-size:14.5px; line-height:1.65; color:#e9e4d4; white-space:pre-wrap; }

        /* ── Conversa ── */
        .neoScroll{ flex:1; min-height:0; overflow-y:auto; padding:18px 20px 8px; display:flex; flex-direction:column; gap:18px;
          scrollbar-width:thin; scrollbar-color:rgba(240,180,41,.3) transparent; }
        .neoScroll::-webkit-scrollbar{ width:5px; }
        .neoScroll::-webkit-scrollbar-thumb{ background:rgba(240,180,41,.28); border-radius:99px; }

        .neoEmpty{ margin:auto; text-align:center; padding:12px 20px 28px; animation:neoUp .6s .15s ease both; }
        .neoEmptyOrb{ width:76px; height:76px; margin:0 auto 20px; }
        .neoEmptyT{ font-family:'Unbounded', sans-serif; font-weight:700; font-size:15px; letter-spacing:.06em; color:#f5efdf; margin-bottom:8px; }
        .neoEmptyS{ font-size:13px; color:rgba(233,228,212,.5); max-width:400px; margin:0 auto 22px; line-height:1.65; }
        .neoChips{ display:flex; flex-wrap:wrap; gap:9px; justify-content:center; }
        .neoChip{ font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:.06em;
          color:rgba(245,239,223,.75); background:rgba(240,180,41,.05); border:1px solid rgba(240,180,41,.2);
          border-radius:999px; padding:10px 16px; cursor:pointer; transition:all .25s; }
        .neoChip:hover{ background:rgba(240,180,41,.14); border-color:rgba(240,180,41,.55); color:#fff;
          transform:translateY(-1px); box-shadow:0 6px 20px rgba(240,180,41,.12); }

        .neoMsgU{ align-self:flex-end; max-width:82%; background:linear-gradient(135deg, rgba(240,180,41,.16), rgba(240,180,41,.07));
          border:1px solid rgba(240,180,41,.28); border-radius:16px 16px 4px 16px; padding:11px 15px;
          font-size:14.5px; line-height:1.6; color:#f5efdf; white-space:pre-wrap; word-break:break-word; animation:neoUp .3s ease both; }
        .neoMsgN{ align-self:stretch; max-width:100%; padding:2px 0 2px 16px; position:relative; animation:neoUp .35s ease both; }
        .neoMsgN::before{ content:''; position:absolute; left:0; top:4px; bottom:4px; width:2px;
          background:linear-gradient(180deg, #f0b429, rgba(240,180,41,.05)); border-radius:99px; }
        .neoMsgTag{ font-family:'IBM Plex Mono', monospace; font-size:9px; font-weight:600; letter-spacing:.3em;
          color:rgba(240,180,41,.75); margin-bottom:7px; }
        .neoMsgTxt{ font-size:15px; line-height:1.72; color:#eae5d6; white-space:pre-wrap; word-break:break-word; }
        .neoMsgTxt strong{ color:#f0b429; font-weight:700; }
        .neoImg{ max-width:190px; max-height:190px; border-radius:10px; display:block; margin-bottom:8px; border:1px solid rgba(255,255,255,.1); }

        .neoTyping{ display:flex; align-items:center; gap:12px; padding-left:16px; animation:neoUp .3s ease both; }
        .neoTypingTxt{ font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:rgba(240,180,41,.7); }
        .neoScan{ width:70px; height:2px; border-radius:99px; overflow:hidden; background:rgba(240,180,41,.12); position:relative; }
        .neoScan::after{ content:''; position:absolute; top:0; bottom:0; width:36%; border-radius:99px;
          background:linear-gradient(90deg, transparent, #f0b429, transparent); animation:neoScanX 1.1s ease-in-out infinite; }
        @keyframes neoScanX{ 0%{ left:-36%; } 100%{ left:100%; } }

        .neoErr{ align-self:flex-start; font-size:13px; color:#ffb3b3; background:rgba(255,77,77,.08);
          border:1px solid rgba(255,77,77,.25); border-radius:12px; padding:10px 14px; }

        /* ── Entrada ── */
        .neoBar{ display:flex; align-items:center; gap:9px; padding:14px 16px 16px; border-top:1px solid rgba(240,180,41,.1);
          background:linear-gradient(180deg, transparent, rgba(240,180,41,.025)); }
        .neoIconBtn{ width:44px; height:46px; flex-shrink:0; display:grid; place-items:center; cursor:pointer;
          background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.1); border-radius:13px;
          color:rgba(245,239,223,.7); font-size:17px; transition:all .25s; }
        .neoIconBtn:hover{ border-color:rgba(240,180,41,.45); color:#f0b429; }
        .neoIconBtn:disabled{ opacity:.35; cursor:default; }
        .neoIconBtn.rec{ color:#fff; background:#e03131; border-color:#e03131; animation:neoRec 1.2s ease-in-out infinite;
          box-shadow:0 0 0 0 rgba(224,49,49,.5); }
        @keyframes neoRec{ 0%{ box-shadow:0 0 0 0 rgba(224,49,49,.45);} 70%{ box-shadow:0 0 0 12px rgba(224,49,49,0);} 100%{ box-shadow:0 0 0 0 rgba(224,49,49,0);} }
        .neoInput{ flex:1; min-width:0; height:46px; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.1);
          border-radius:13px; padding:0 16px; color:#f5efdf; font-size:14.5px; outline:none; transition:border .25s; }
        .neoInput::placeholder{ color:rgba(233,228,212,.35); }
        .neoInput:focus{ border-color:rgba(240,180,41,.5); box-shadow:0 0 0 3px rgba(240,180,41,.08); }
        .neoSend{ height:46px; padding:0 22px; flex-shrink:0; cursor:pointer; border:none; border-radius:13px;
          font-family:'Unbounded', sans-serif; font-weight:700; font-size:12px; letter-spacing:.1em;
          color:#0d0a02; background:linear-gradient(135deg, #ffd763, #f0b429);
          box-shadow:0 6px 24px rgba(240,180,41,.3); transition:all .25s; }
        .neoSend:hover{ transform:translateY(-1px); box-shadow:0 10px 30px rgba(240,180,41,.42); }
        .neoSend:disabled{ opacity:.55; transform:none; cursor:default; }

        .neoGpt{ align-self:flex-start; margin:14px 20px 0; display:inline-flex; align-items:center; gap:7px;
          font-family:'IBM Plex Mono', monospace; font-size:10px; letter-spacing:.14em; text-transform:uppercase;
          color:rgba(49,209,131,.85); background:rgba(49,209,131,.06); border:1px solid rgba(49,209,131,.25);
          border-radius:999px; padding:7px 13px; text-decoration:none; transition:all .25s; animation:neoUp .55s .12s ease both; }
        .neoGpt:hover{ background:rgba(49,209,131,.14); }

        .neoAviso{ margin:20px; padding:18px 20px; border-radius:14px; border:1px solid rgba(240,180,41,.2);
          border-left:3px solid #f0b429; background:rgba(240,180,41,.05); animation:neoUp .5s ease both; }
        .neoAvisoT{ font-family:'Unbounded', sans-serif; font-weight:700; font-size:14px; color:#f5efdf; margin-bottom:8px; }
        .neoAvisoTx{ font-size:13.5px; line-height:1.7; color:rgba(233,228,212,.65); }
        .neoAvisoTx b{ color:#f0b429; }

        @keyframes neoUp{ from{ opacity:0; transform:translateY(10px);} to{ opacity:1; transform:none;} }

        .neoSend .arr{ display:none; }
        @media (max-width:640px){
          .neoTitle{ font-size:16px; }
          .neoSub{ font-size:8.5px; letter-spacing:.2em; }
          .neoVoice span.lbl{ display:none; }
          .neoVoice{ padding:8px 11px; }
          .neoVozSel{ max-width:96px; font-size:10px; padding:7px 8px; }
          .neoHead{ padding:14px 14px 12px; gap:11px; }
          .neoOrb{ width:40px; height:40px; }
          .neoInsight{ margin:12px 14px 0; padding:13px 14px 13px 18px; }
          .neoInsTxt{ font-size:13.5px; }
          .neoScroll{ padding:14px 14px 6px; }
          .neoMsgTxt{ font-size:14px; }
          .neoBar{ padding:10px 10px 12px; gap:6px; }
          .neoIconBtn{ width:40px; height:44px; border-radius:11px; }
          .neoSend{ padding:0 15px; height:44px; border-radius:11px; }
          .neoSend .txt{ display:none; }
          .neoSend .arr{ display:inline; font-size:16px; }
          .neoInput{ height:44px; padding:0 12px; font-size:14px; }
          .neoGpt{ margin:12px 14px 0; }
        }
      `}</style>

      <div className="neoIn">
        {/* Cabeçalho */}
        <div className="neoHead">
          <div className={`neoOrb${loading ? ' on' : ''}${falando ? ' fala' : ''}`} />
          <div>
            <div className="neoTitle">AGENTE <b>NEO</b></div>
            <div className="neoSub">Inteligência · João Flório</div>
          </div>
          {VOZ_SAIDA && 'speechSynthesis' in (typeof window !== 'undefined' ? window : {} as any) && (
            <button
              className={`neoVoice${vozAtiva ? ' on' : ''}`}
              onClick={() => {
                if (vozAtiva) { try { window.speechSynthesis.cancel() } catch {} ; setFalando(false) }
                setVozAtiva((v) => !v)
              }}
              title={vozAtiva ? 'NEO responde em voz alta — clique para silenciar' : 'Fazer o NEO responder em voz alta'}
            >
              <span style={{ fontSize: 13, lineHeight: 1 }}>{vozAtiva ? '◉' : '○'}</span> <span className="lbl">{vozAtiva ? 'Voz ativa' : 'Voz'}</span>
            </button>
          )}

          {/* Seletor de voz — aparece com a voz ligada e mais de uma opção pt-BR.
              Cada aparelho traz um conjunto diferente de vozes instaladas, então
              a escolha final é do vendedor; a gente só chuta a masculina. */}
          {VOZ_SAIDA && vozAtiva && vozes.length > 1 && (
            <select className="neoVozSel" value={vozNome} title="Trocar a voz do NEO"
              onChange={(e) => {
                const nome = e.target.value
                setVozNome(nome)
                try { localStorage.setItem('neo_voz', nome) } catch {}
                const v = vozes.find((x) => x.name === nome)
                if (v) {   // prova na hora, pra não precisar mandar mensagem só pra ouvir
                  const u = new SpeechSynthesisUtterance('Bora. Sem rodeio, olha o número.')
                  u.voice = v; u.lang = 'pt-BR'; u.rate = 1.06; u.pitch = 0.92
                  window.speechSynthesis.cancel(); window.speechSynthesis.speak(u)
                }
              }}>
              {vozes.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
            </select>
          )}
        </div>

        {/* Sem Amazon conectada */}
        {semConexao && (
          <div className="neoAviso">
            <div className="neoAvisoT">Conecte sua conta Amazon primeiro</div>
            <div className="neoAvisoTx">
              O NEO trabalha em cima dos seus números reais — faturamento, margem, estoque, ACOS. Sem a conta conectada ele estaria chutando, e chute não ajuda ninguém.
              <br /><br />
              Vá em <b>Gestão</b> no menu e conecte sua conta. Leva um minuto. Dúvida sobre o Oráculo? Use o botão <b>Suporte</b> no canto da tela.
            </div>
          </div>
        )}

        {demo && (
          <div className="neoAviso">
            <div className="neoAvisoTx">Esta é a conta de demonstração. O NEO analisa dados reais da Amazon, então aqui ele fica indisponível — teste numa conta com a Amazon conectada.</div>
          </div>
        )}

        {!semConexao && !demo && (
          <>
            {/* Insight do dia */}
            {(carregandoIns || ins) && (
              <div className="neoInsight" style={{ ['--sev' as any]: sev?.cor || 'rgba(240,180,41,.5)' }}>
                {carregandoIns ? (
                  <div className="neoInsTag" style={{ marginBottom: 0 }}><span className="neoDot" />Lendo sua operação…</div>
                ) : ins && sev ? (
                  <>
                    <div className="neoInsTag"><span className="neoDot" />{sev.rotulo}</div>
                    <div className="neoInsTxt">{rico(ins.texto)}</div>
                  </>
                ) : null}
              </div>
            )}

            <a className="neoGpt" href={GPT_AGENT_URL} target="_blank" rel="noreferrer">◈ Gerar imagens no Agente GPT ↗</a>

            {/* Conversa */}
            <div ref={scrollRef} className="neoScroll">
              {vazio && !loading && (
                <div className="neoEmpty">
                  <div className="neoOrb neoEmptyOrb" />
                  <div className="neoEmptyT">Sem rodeio. Olha o número.</div>
                  <div className="neoEmptyS">Eu leio a sua operação de verdade — DRE, estoque, anúncios, histórico — e te aponto a decisão. Pergunta.</div>
                  <div className="neoChips">
                    {SUGESTOES.map((s) => <button key={s} className="neoChip" onClick={() => enviar(s)}>{s}</button>)}
                  </div>
                </div>
              )}

              {msgs.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="neoMsgU">
                    {m.images?.map((im, k) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={k} className="neoImg" src={`data:${im.mediaType};base64,${im.data}`} alt="anexo" />
                    ))}
                    {m.text}
                  </div>
                ) : (
                  <div key={i} className="neoMsgN">
                    <div className="neoMsgTag">NEO</div>
                    <div className="neoMsgTxt">{rico(m.text)}</div>
                  </div>
                )
              )}

              {loading && (
                <div className="neoTyping">
                  <span className="neoTypingTxt">{seg > 25 ? 'Cruzando os dados' : 'Lendo seus números'}</span>
                  <span className="neoScan" />
                  {seg > 6 && <span className="neoTypingTxt" style={{ opacity: .55 }}>{seg}s</span>}
                </div>
              )}
              {erro && <div className="neoErr">{erro}</div>}
            </div>

            {/* Miniaturas de anexos */}
            {pend.length > 0 && (
              <div style={{ display: 'flex', gap: 8, padding: '8px 20px 0' }}>
                {pend.map((im, k) => (
                  <div key={k} style={{ position: 'relative' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`data:${im.mediaType};base64,${im.data}`} alt="anexo" style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 9, border: '1px solid rgba(255,255,255,.15)' }} />
                    <button onClick={() => setPend((p) => p.filter((_, j) => j !== k))} aria-label="remover"
                      style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 999, background: '#111', border: '1px solid rgba(255,255,255,.2)', color: '#fff', fontSize: 11, lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Barra de entrada */}
            <div className="neoBar">
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => anexar(e.target.files)} />
              <button className="neoIconBtn" onClick={() => fileRef.current?.click()} disabled={loading || pend.length >= MAX_IMGS} title="Anexar imagem" aria-label="Anexar imagem">📎</button>
              {suportaMic && (
                <button className={`neoIconBtn${gravando ? ' rec' : ''}`} onClick={toggleMic} disabled={loading}
                  title={gravando ? 'Gravando — clique para parar' : 'Falar com o NEO'} aria-label="Falar">🎙</button>
              )}
              <input
                className="neoInput"
                value={input}
                placeholder={gravando ? 'Ouvindo você…' : 'Pergunte sobre sua operação…'}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') enviar(input) }}
                disabled={loading}
              />
              <button className="neoSend" onClick={() => enviar(input)} disabled={loading} aria-label="Enviar">
                {loading ? '···' : <><span className="txt">ENVIAR</span><span className="arr">↑</span></>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
