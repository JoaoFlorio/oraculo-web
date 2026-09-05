'use client'
import { useEffect, useRef, useState } from 'react'
import Carteira from './Carteira'
import { salvarGeradas, carregarGeradas, limparGeradas } from './idbGeradas'

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
// `envio` (opcional) é o que REALMENTE vai pro modelo quando o texto exibido
// na bolha é um resumo — usado pelo botão "Bora resolver" do insight, que
// mostra uma frase curta mas manda o diagnóstico inteiro como contexto.
// A ficha mostrava só `tokensSaida`, e isso enganava: a SAÍDA é a menor parte
// da conta. A persona + as ferramentas + o resultado da DRE reentram no
// contexto a cada rodada, então a ENTRADA costuma ser várias vezes maior — e
// era justamente ela que não aparecia em lugar nenhum. Agora vem entrada,
// quanto dela veio do cache (que é o que segura o preço) e o custo em real.
type Ficha = {
  provider?: string; model?: string; ms?: number
  tokensEntrada?: number; tokensCache?: number; tokensSaida?: number
  custoBrl?: number
}
type ImgGerada = { rotulo: string; mediaType: string; data: string }
type Msg = { role: 'user' | 'assistant'; text: string; envio?: string; images?: Img[]; ficha?: Ficha; geradas?: ImgGerada[]; id?: string }

// Id estável só pras mensagens com imagem gerada — é a chave que liga a mensagem
// (texto no localStorage) às imagens guardadas no IndexedDB ao reabrir a aba.
const novoId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
type Insight = { texto: string; severidade: 'critico' | 'atencao' | 'ok'; geradoEm: string } | null

const GPT_AGENT_URL = 'https://chatgpt.com/g/g-6a02736d422081918e58416c49426a3a-oraculo-ia-especialista-em-marketplace'
const SUGESTOES = [
  'Como está minha operação?',
  'Qual produto está caindo?',
  'Meu ACOS está saudável?',
  'Onde estou perdendo margem?',
]
const MAX_IMGS = 3

/** 16234 → "16,2k". A ficha do admin é uma linha; ordem de grandeza basta. */
const milhar = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')}k` : String(n)

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

/* 🚨 TODA IMAGEM VIRA JPEG AQUI, NO NAVEGADOR.
 *
 * A câmera do iPhone salva em HEIC, e HEIC não é lido por nenhum dos dois
 * motores do jeito que chegava: a imagem era descartada e o NEO respondia
 * "você esqueceu de mandar a foto" com a miniatura na tela do cliente.
 *
 * O navegador já sabe decodificar tudo que ele consegue EXIBIR — inclusive HEIC
 * no Safari e no macOS. Então quem converte é ele: decodifica, redesenha num
 * canvas e reexporta como JPEG. De quebra resolve o peso (foto de celular passa
 * de 5MB e batia no limite) sem o vendedor precisar saber de nada disso.
 *
 * ⚠️ Se o navegador NÃO souber abrir (HEIC no Chrome do Windows, por exemplo),
 * o erro tem que ser explícito na tela — falhar em silêncio aqui recria
 * exatamente o bug que isto veio consertar. */
const LADO_MAX = 1600   // além disso é pixel que o modelo não usa e token que o seller paga

/* Lê o ARQUIVO CRU em base64, sem converter. É o fallback pro caso do navegador
   não saber decodificar (HEIC no Chrome, por exemplo): o Gemini — motor padrão —
   lê HEIC/HEIF nativamente, então a imagem chega ao modelo mesmo sem a conversão.
   O tipo vem do próprio arquivo; se vier vazio (acontece com HEIC), inferimos da
   extensão. */
function lerCru(file: File): Promise<Img> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const m = /^data:([^;]+);base64,(.*)$/.exec(String(r.result || ''))
      if (!m || !m[2]) return reject(new Error('falha ao ler'))
      let mt = m[1]
      if (!mt || !mt.startsWith('image/')) {
        const ext = (file.name.split('.').pop() || '').toLowerCase()
        mt = ext === 'heic' || ext === 'heif' ? `image/${ext}` : ext === 'png' ? 'image/png' : 'image/jpeg'
      }
      resolve({ mediaType: mt, data: m[2] })
    }
    r.onerror = () => reject(new Error('falha ao ler'))
    r.readAsDataURL(file)
  })
}

/* Converte a imagem pra JPEG no navegador (encolhe e normaliza). É uma
   OTIMIZAÇÃO, não obrigação: se o navegador não decodificar o formato (o
   `new Image()` do Chrome não abre HEIC), CAI no arquivo cru — o backend e o
   Gemini leem HEIC direto. O que não pode é a imagem sumir por falta de
   conversão, que era o bug: o vendedor anexava a foto do iPhone e o NEO jurava
   não ter recebido nada. */
function lerImagem(file: File): Promise<Img> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        const escala = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight))
        const w = Math.max(1, Math.round(img.naturalWidth * escala))
        const h = Math.max(1, Math.round(img.naturalHeight * escala))
        const c = document.createElement('canvas')
        c.width = w; c.height = h
        const ctx = c.getContext('2d')
        if (!ctx) throw new Error('sem canvas')
        // Fundo branco: PNG com transparência viraria preto ao virar JPEG.
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = c.toDataURL('image/jpeg', 0.88)
        const m = /^data:(image\/jpeg);base64,(.*)$/.exec(dataUrl)
        if (!m || !m[2]) throw new Error('conversão vazia')
        resolve({ mediaType: 'image/jpeg', data: m[2] })
      } catch {
        // Canvas falhou (raro) — manda o arquivo como veio.
        lerCru(file).then(resolve).catch(() => resolve({ mediaType: 'image/jpeg', data: '' }))
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      // O navegador não decodifica este formato (HEIC no Chrome). Em vez de
      // recusar, manda os bytes crus — o Gemini abre.
      lerCru(file).then(resolve).catch(() => resolve({ mediaType: 'image/jpeg', data: '' }))
    }
    img.src = url
  })
}

function toApiContent(m: Msg): any {
  const texto = m.envio ?? m.text
  if (!m.images?.length) return texto
  return [
    ...m.images.map((im) => ({ type: 'image', source: { type: 'base64', media_type: im.mediaType, data: im.data } })),
    ...(texto ? [{ type: 'text', text: texto }] : []),
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

// Prévia da tarja recolhida: a primeira frase, sem os ** do negrito.
function primeiraFrase(t: string): string {
  const limpo = t.replace(/\*\*/g, '').trim()
  const fim = limpo.search(/[.!?](\s|$)/)
  const f = fim > 0 ? limpo.slice(0, fim + 1) : limpo
  return f.length > 96 ? f.slice(0, 95).trimEnd() + '…' : f
}

// Markdown mínimo e seguro: só **negrito** — o resto é texto puro do React.
function rico(texto: string) {
  const partes = texto.split(/\*\*(.+?)\*\*/g)
  return partes.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : p))
}

// ── A marca do NEO ───────────────────────────────────────────────────────────
// Monograma "N" com dois anéis de mira em contra-rotação e um nó de dados
// pulsando exatamente no meio da diagonal — HUD de sala de comando, não
// mascote. `on` acelera os anéis (o NEO trabalhando). Os pathLength são
// normalizados pra o tracejado fechar sem emenda.
function NeoMark({ size = 46, on = false }: { size?: number; on?: boolean }) {
  return (
    <div className={`neoMark${on ? ' on' : ''}`} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 100 100">
        <defs>
          <linearGradient id="neoG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffe9a8" />
            <stop offset=".55" stopColor="#f0b429" />
            <stop offset="1" stopColor="#b07c0c" />
          </linearGradient>
        </defs>
        {/* anel externo segmentado, giro lento */}
        <g className="nmRing">
          <circle cx="50" cy="50" r="46.5" fill="none" stroke="url(#neoG)" strokeWidth="1.6"
            pathLength={140} strokeDasharray="4 6" strokeLinecap="round" opacity=".5" />
        </g>
        {/* arco interno, contra-rotação */}
        <g className="nmArc">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#f0b429" strokeWidth="2.6"
            pathLength={100} strokeDasharray="24 76" strokeLinecap="round" />
        </g>
        {/* o N */}
        <path d="M33 70V30l34 40V30" fill="none" stroke="url(#neoG)"
          strokeWidth="8" strokeLinecap="square" />
        {/* nó de dados no centro da diagonal (a linha 33,30→67,70 passa em 50,50) */}
        <rect className="nmNode" x="45.6" y="45.6" width="8.8" height="8.8"
          transform="rotate(45 50 50)" fill="#ffedb0" />
      </svg>
    </div>
  )
}

export default function NeoChat({ isAdmin = false, userEmail = '' }: { isAdmin?: boolean; userEmail?: string }) {
  // Comparação de motores: SÓ admin. O cliente sempre recebe o motor padrão do
  // servidor — ninguém deve cair num motor ainda em avaliação.
  // null = deixa o servidor decidir (AGENT_PROVIDER). Só vira 'claude'/'gemini'
  // quando o admin escolhe DE PROPÓSITO no seletor.
  const [motor, setMotor] = useState<'claude' | 'gemini' | null>(null)
  // Motor que o SERVIDOR usou na última resposta — é o que o seletor mostra
  // quando o admin não forçou nada.
  const [motorAtivo, setMotorAtivo] = useState<'claude' | 'gemini' | null>(null)

  // Busca o motor padrão do servidor no carregamento — assim o seletor já
  // nasce marcado no motor certo, sem esperar a primeira resposta.
  useEffect(() => {
    fetch('/api/agent/config')
      .then(r => r.json())
      .then(d => { if (d?.provider === 'claude' || d?.provider === 'gemini') setMotorAtivo(d.provider) })
      .catch(() => {})
  }, [])
  const [ins, setIns] = useState<Insight>(null)
  const [carregandoIns, setCarregandoIns] = useState(true)
  const [semConexao, setSemConexao] = useState(false)
  // O insight nasce RECOLHIDO: aberto toda vez ele vira ruído e a pessoa para
  // de ler justamente o que é urgente. Quem quiser o detalhe, clica.
  const [insAberto, setInsAberto] = useState(false)
  const [insOculto, setInsOculto] = useState(false)

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')

  // ── Multi-chat (barra de conversas por tópico) ────────────────────────────
  // Modelo de BAIXO RISCO: o cache localStorage abaixo (a conversa ABERTA) fica
  // INTOCADO. Por cima, guardamos no SERVIDOR várias conversas + um ponteiro da
  // ativa. O NEO lê os RESUMOS das anteriores (backend) e fica mais afiado.
  type ConvItem = { id: string; titulo: string; resumo?: string | null; atualizadaEm: string; mensagens: number }
  const [conversas, setConversas] = useState<ConvItem[]>([])
  const [conversaId, setConversaId] = useState<string | null>(null)
  const [chatsAberto, setChatsAberto] = useState(false)
  const chaveConvAtiva = `oraculo_neo_conv_ativa:${userEmail || 'anon'}`

  // ── Persistência da conversa ──────────────────────────────────────────────
  // O componente do NEO desmonta ao trocar de aba (Gestão etc.), e antes a
  // conversa vivia só no estado — sumia toda vez. Agora ela fica no localStorage,
  // amarrada ao e-mail do usuário (pra não vazar entre contas num device
  // compartilhado), e volta quando ele reabre a aba.
  //
  // ⚠️ NÃO guardamos base64 de imagem (anexos do vendedor nem imagens geradas):
  // são enormes e estouram a cota de ~5MB do localStorage. Salvamos o TEXTO — a
  // análise, a copy, o raciocínio, que é o que ele não quer refazer. Ao recarregar
  // o texto continua; as imagens geradas ele rebaixa/regenera.
  const chaveConversa = `oraculo_neo_chat_v1:${userEmail || 'anon'}`
  const hidratadoRef = useRef(false)
  useEffect(() => {
    let vivo = true
    try {
      const raw = localStorage.getItem(chaveConversa)
      if (raw) {
        const salvo = JSON.parse(raw) as Msg[]
        if (Array.isArray(salvo) && salvo.length) {
          setMsgs(salvo)
          // As imagens geradas ficam no IndexedDB (não cabem no localStorage).
          // Reidrata por id — assim elas voltam quando ele reabre a conversa.
          carregarGeradas(chaveConversa).then((mapa) => {
            if (!vivo || !Object.keys(mapa).length) return
            setMsgs((atual) => atual.map((m) => (m.id && mapa[m.id] ? { ...m, geradas: mapa[m.id] } : m)))
          })
        }
      }
    } catch {}
    hidratadoRef.current = true
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveConversa])
  useEffect(() => {
    if (!hidratadoRef.current) return
    // Nunca sobrescreve com vazio: no 1º render pós-hidratação o estado ainda é
    // [] antes do setMsgs do load aplicar — salvar aqui apagaria a conversa
    // recém-carregada. Limpar de propósito é a função limparConversa (remove a chave).
    if (!msgs.length) return
    try {
      const leve = msgs.slice(-40).map(({ images, geradas, ...resto }) => resto)
      localStorage.setItem(chaveConversa, JSON.stringify(leve))
    } catch {}
  }, [msgs, chaveConversa])
  const limparConversa = () => {
    setMsgs([])
    ultimoEnvioRef.current = null
    try { localStorage.removeItem(chaveConversa) } catch {}
    void limparGeradas(chaveConversa)   // some com as imagens guardadas também
  }
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
  const ultimoEnvioRef = useRef<Msg[] | null>(null)   // p/ o botão "tentar de novo"

  // ── Multi-chat: funções da barra de conversas ─────────────────────────────
  const carregarConversas = async () => {
    try {
      const res = await fetch('/api/agent/conversas', { cache: 'no-store' })
      const d = await res.json().catch(() => null)
      if (Array.isArray(d?.conversas)) setConversas(d.conversas)
    } catch {}
  }
  // Restaura a conversa ativa (ponteiro) + carrega a lista ao montar.
  useEffect(() => {
    try { const a = localStorage.getItem(chaveConvAtiva); if (a) setConversaId(a) } catch {}
    void carregarConversas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveConvAtiva])
  const setAtiva = (id: string | null) => {
    setConversaId(id)
    try { id ? localStorage.setItem(chaveConvAtiva, id) : localStorage.removeItem(chaveConvAtiva) } catch {}
  }
  // Resume a conversa ATUAL (pro NEO ficar afiado nas próximas). Fire-and-forget.
  const resumirAtual = () => {
    if (!conversaId || !msgs.length) return
    fetch('/api/agent/conversas', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ op: 'resumir', id: conversaId }),
    }).then(() => carregarConversas()).catch(() => {})
  }
  const novoChat = () => {
    resumirAtual()
    limparConversa()
    setAtiva(null)
    setChatsAberto(false)
  }
  const abrirConversa = async (id: string) => {
    if (id === conversaId) { setChatsAberto(false); return }
    resumirAtual()
    setChatsAberto(false)
    try {
      const res = await fetch(`/api/agent/conversas?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      const d = await res.json().catch(() => null)
      const hist: Msg[] = Array.isArray(d?.mensagens)
        ? d.mensagens.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', text: String(m.conteudo || '') }))
        : []
      setMsgs(hist)
      ultimoEnvioRef.current = null
      setAtiva(id)
    } catch { setErro('Não consegui abrir essa conversa. Tente de novo.') }
  }
  const renomearChat = async (id: string, atual: string) => {
    const t = window.prompt('Novo nome do chat:', atual)
    if (t == null) return
    await fetch('/api/agent/conversas', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: 'renomear', id, titulo: t.trim() || 'Conversa' }) }).catch(() => {})
    void carregarConversas()
  }
  const apagarChat = async (id: string) => {
    if (!window.confirm('Apagar este chat? Não dá pra desfazer.')) return
    await fetch('/api/agent/conversas', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: 'apagar', id }) }).catch(() => {})
    if (id === conversaId) { limparConversa(); setAtiva(null) }
    void carregarConversas()
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)   // pro atalho de anúncio focar o campo

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
        // Conta demo: o NEO funciona normalmente (o backend serve dados fictícios
        // coerentes). Se vier um insight (d.texto), mostra; senão, sem card — mas
        // o chat fica ATIVO, nunca mais "indisponível".
        else if (d?.texto) {
          setIns(d)
          // Dispensa é POR INSIGHT (chave = quando foi gerado), não global —
          // insight novo volta a aparecer.
          try { if (localStorage.getItem('neo_insight_visto') === d.geradoEm) setInsOculto(true) } catch {}
        }
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

  /* ⭐ CATÁLOGO DE FORNECEDOR pelo CLIPE (Fase 2 do minerador, 05/09) — a visão
     do João: "o cliente upa o catálogo dentro do Oráculo e o NEO varre e lê
     tudo". PDF anexado (admin, por enquanto) NÃO vira mensagem: sobe pro
     backend, o Gemini extrai os produtos e o card abaixo acompanha; pronto, é
     só pedir "minera meu fornecedor". A AMOSTRA aparece pro usuário conferir o
     preço de olho — foi assim que o João pegou o erro de leitura do Thor. */
  const [catalogo, setCatalogo] = useState<any>(null)
  const catPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => { if (catPollRef.current) clearInterval(catPollRef.current) }, [])
  function vigiarCatalogo() {
    if (catPollRef.current) clearInterval(catPollRef.current)
    catPollRef.current = setInterval(async () => {
      try {
        const r = await fetch('/api/agent/fornecedor', { cache: 'no-store' })
        const s = await r.json()
        if (s?.status && s.status !== 'nenhum') setCatalogo(s)
        if (s?.status === 'pronto' || s?.status === 'erro') { if (catPollRef.current) clearInterval(catPollRef.current); catPollRef.current = null }
      } catch { /* tenta no próximo tick */ }
    }, 8000)
  }
  async function subirCatalogo(f: File) {
    setErro(null)
    if (f.size > 200 * 1048576) { setErro('Esse PDF passa de 200MB. Comprime ou divide o catálogo.') ; return }
    setCatalogo({ status: 'enviando', nome_arquivo: f.name })
    try {
      const r = await fetch(`/api/agent/fornecedor?nome=${encodeURIComponent(f.name)}`, { method: 'POST', body: f })
      const j = await r.json()
      if (!r.ok) { setCatalogo(null); setErro(j?.error || 'não consegui enviar o catálogo'); return }
      setCatalogo({ status: 'extraindo', nome_arquivo: f.name })
      vigiarCatalogo()
    } catch { setCatalogo(null); setErro('falha ao enviar o catálogo — tenta de novo') }
  }

  async function anexar(files: FileList | null) {
    if (!files?.length) return
    setErro(null)
    const novas: Img[] = []
    for (const f of Array.from(files)) {
      // PDF = catálogo de fornecedor (admin): rota própria, não vira mensagem.
      if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) {
        if (isAdmin) { subirCatalogo(f); continue }
        setErro('PDF ainda não é aceito aqui. Anexe uma foto (JPG, PNG ou do iPhone).')
        continue
      }
      if (pend.length + novas.length >= MAX_IMGS) break
      // ⚠️ Só aceita ARQUIVO DE IMAGEM. `accept="image/*"` no input não impede
      // arrastar um PDF pra cá — e aí a "conversão" viraria lixo.
      if (!f.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(f.name)) {
        setErro('Esse arquivo não é uma imagem. Anexe uma foto (JPG, PNG ou do iPhone).')
        continue
      }
      // ⚠️ `lerImagem` NUNCA rejeita: quando o navegador não converte (HEIC no
      // Chrome), ele cai no arquivo cru, que o Gemini lê. Só descarta o que
      // voltou vazio (leitura falhou de verdade).
      const img = await lerImagem(f)
      if (!img.data) { setErro('Não consegui abrir essa imagem. Tente salvar como JPG e reenviar.'); continue }
      // Teto no que chega ao envio: base64 acima de ~6,5MB estoura o limite do
      // backend (~5MB de imagem). A conversão normal deixa a foto pequena; só o
      // caminho cru (HEIC gigante) pode passar disso.
      if (img.data.length > 6_800_000) { setErro('Essa foto é grande demais. Tire um print ou salve como JPG que fica mais leve.'); continue }
      novas.push(img)
    }
    if (novas.length) setPend((p) => [...p, ...novas].slice(0, MAX_IMGS))
    if (fileRef.current) fileRef.current.value = ''
  }

  async function enviar(texto: string, contexto?: string) {
    const q = texto.trim()
    if ((!q && pend.length === 0) || loading) return
    if (gravando) { try { recRef.current?.stop() } catch {} ; setGravando(false) }
    setErro(null)
    const userMsg: Msg = { role: 'user', text: q, envio: contexto, images: pend.length ? pend : undefined }
    const historico = [...msgs, userMsg]
    setMsgs(historico)
    setInput('')
    setPend([])
    setLoading(true)
    ultimoEnvioRef.current = historico
    try {
      // Multi-chat: garante uma conversa ativa (cria no 1º envio) pra o backend
      // gravar o turno e injetar os resumos das conversas anteriores.
      let cid = conversaId
      if (!cid) {
        try {
          const r = await fetch('/api/agent/conversas', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: 'criar' }) })
          const dd = await r.json().catch(() => null)
          if (dd?.id) { cid = dd.id; setAtiva(cid) }
        } catch {}
      }
      const corpo = JSON.stringify({
        agent: 'neo',
        ...(isAdmin && motor ? { provider: motor } : {}),
        ...(cid ? { conversaId: cid } : {}),
        messages: historico.map((m) => ({ role: m.role, content: toApiContent(m) })),
      })

      // Tenta até 3 vezes. O caso clássico: deploy do backend derruba as
      // requisições por ~40s e devolve uma página de erro (nem JSON é). Sem
      // retry isso vira "o NEO não conseguiu responder" na frente do cliente —
      // com retry, vira só uma resposta um pouco mais lenta.
      let data: any = null, ultimoStatus = 0
      for (let t = 1; t <= 3; t++) {
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          signal: AbortSignal.timeout(180_000),
          body: corpo,
        })
        ultimoStatus = res.status
        data = await res.json().catch(() => null)
        // 4xx é erro nosso (nada a ganhar repetindo). 5xx / resposta não-JSON
        // é transitório: espera e tenta de novo.
        const transitorio = !data || (res.status >= 500 && res.status !== 504)
        if (!transitorio) break
        if (t < 3) { setSeg(0); await new Promise((r) => setTimeout(r, t * 2500)) }
      }

      if (!data || data?.error) {
        // O detalhe técnico vai pro console (dá pra depurar depois sem sujar a
        // tela do vendedor no meio de uma apresentação).
        console.error('[NEO] falhou:', ultimoStatus, data)
        setErro(data?.error || 'O NEO não conseguiu responder agora. Tente de novo em instantes.')
      } else {
        // Guarda qual motor o servidor usou de verdade — é o que o seletor
        // mostra enquanto o admin não força nenhum.
        if (data.provider === 'claude' || data.provider === 'gemini') setMotorAtivo(data.provider)
        const geradas = Array.isArray(data.imagens) && data.imagens.length ? (data.imagens as ImgGerada[]) : undefined
        const msg: Msg = {
          role: 'assistant', text: data.reply || '(sem resposta)',
          ficha: {
            provider: data.provider, model: data.model, ms: data.ms,
            tokensEntrada: data.usage?.input_tokens,
            tokensCache: data.usage?.cache_read_input_tokens,
            tokensSaida: data.usage?.output_tokens,
            custoBrl: data.custo?.brl,
          },
          geradas,
          id: geradas ? novoId() : undefined,
        }
        setMsgs([...historico, msg])
        void carregarConversas()   // título/horário da conversa mudaram no servidor
        if (geradas && msg.id) {
          // Guarda as imagens no IndexedDB (não cabem no localStorage) pra elas
          // não sumirem quando o seller trocar de aba e voltar.
          void salvarGeradas(chaveConversa, msg.id, geradas)
          // Gerou imagem = consumiu crédito: avisa a Carteira pra atualizar na hora.
          window.dispatchEvent(new Event('neo:creditos-mudou'))
        }
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

  // "Bora resolver": some com o card e joga o NEO direto no problema. A bolha
  // mostra uma frase curta; o diagnóstico inteiro vai como contexto pro modelo
  // (via `envio`), pra ele não precisar redescobrir o que já foi apurado.
  function resolverInsight() {
    if (!ins || loading) return
    setInsOculto(true)
    try { localStorage.setItem('neo_insight_visto', ins.geradoEm) } catch {}
    enviar('Bora resolver isso.', `Você abriu o dia com este diagnóstico da minha operação:\n\n"${ins.texto}"\n\nQuero resolver agora. Confirme os números com as ferramentas, me diga por onde começar e o passo a passo do que eu faço hoje.`)
  }

  function dispensarInsight() {
    if (!ins) return
    setInsOculto(true)
    try { localStorage.setItem('neo_insight_visto', ins.geradoEm) } catch {}
  }

  // Reenvia a última pergunta sem o vendedor precisar redigitar — em cima de
  // um palco, "tentar de novo" tem que ser um clique.
  async function tentarNovamente() {
    const h = ultimoEnvioRef.current
    if (!h || loading) return
    setErro(null)
    setMsgs(h)
    setLoading(true)
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: AbortSignal.timeout(180_000),
        body: JSON.stringify({ agent: 'neo', messages: h.map((m) => ({ role: m.role, content: toApiContent(m) })) }),
      })
      const data = await res.json().catch(() => null)
      if (!data || data?.error) setErro(data?.error || 'Ainda sem resposta. Aguarde alguns segundos e tente outra vez.')
      else setMsgs([...h, { role: 'assistant', text: data.reply || '(sem resposta)' }])
    } catch {
      setErro('Ainda sem resposta. Aguarde alguns segundos e tente outra vez.')
    } finally { setLoading(false) }
  }

  const sev = ins ? SEV[ins.severidade] : null
  const vazio = msgs.length === 0

  return (
    <div className="neoRoot">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        /* Página inteira: o ambiente É a tela, sem caixa flutuando no meio. */
        .neoRoot{ position:relative; height:100%; min-height:0; display:flex; flex-direction:column;
          background:#050508; overflow:hidden; }
        /* atmosfera: aura dourada + grade fina + vinheta */
        .neoRoot::before{ content:''; position:absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(60% 44% at 50% -8%, rgba(240,180,41,.17), transparent 62%),
            radial-gradient(90% 60% at 50% 118%, rgba(240,180,41,.06), transparent 60%),
            repeating-linear-gradient(0deg, rgba(255,255,255,.016) 0 1px, transparent 1px 46px),
            repeating-linear-gradient(90deg, rgba(255,255,255,.016) 0 1px, transparent 1px 46px); }
        .neoRoot::after{ content:''; position:absolute; inset:0; pointer-events:none;
          background:radial-gradient(130% 95% at 50% 45%, transparent 60%, rgba(0,0,0,.5) 100%); }
        .neoIn{ position:relative; z-index:1; display:flex; flex-direction:column; height:100%; min-height:0; }

        /* Coluna de leitura: o fundo é full-bleed, o conteúdo respira no centro. */
        .neoCol{ width:100%; max-width:1000px; margin:0 auto; padding:0 24px; box-sizing:border-box; }

        /* ── A marca (monograma N + anéis de mira) ── */
        .neoMark{ position:relative; flex-shrink:0; filter:drop-shadow(0 0 12px rgba(240,180,41,.32)); }
        .neoMark svg{ width:100%; height:100%; display:block; overflow:visible; }
        .nmRing{ transform-origin:50% 50%; animation:neoSpin 16s linear infinite; }
        .nmArc{ transform-origin:50% 50%; animation:neoSpinRev 7s linear infinite; }
        .nmNode{ animation:nmPulse 2.6s ease-in-out infinite; }
        .neoMark.on .nmRing{ animation-duration:2.4s; }
        .neoMark.on .nmArc{ animation-duration:1s; }
        @keyframes neoBreathe{ 0%,100%{ transform:scale(1); filter:brightness(1);} 50%{ transform:scale(1.07); filter:brightness(1.22);} }
        @keyframes neoSpin{ to{ transform:rotate(360deg);} }
        @keyframes neoSpinRev{ to{ transform:rotate(-360deg);} }
        @keyframes nmPulse{ 0%,100%{ opacity:.7; } 50%{ opacity:1; } }

        /* ── Cabeçalho ── */
        .neoHead{ border-bottom:1px solid rgba(240,180,41,.1); padding:18px 0 14px; animation:neoUp .5s ease both; }
        .neoHeadIn{ display:flex; align-items:center; gap:14px; }
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
        .neoMotor{ margin-left:auto; display:flex; gap:2px; padding:3px; border-radius:999px;
          background:rgba(255,255,255,.04); border:1px solid rgba(240,180,41,.2); }
        .neoMotor button{ font-family:'IBM Plex Mono', monospace; font-size:9.5px; letter-spacing:.14em;
          text-transform:uppercase; color:rgba(245,239,223,.5); background:transparent; border:none;
          border-radius:999px; padding:6px 12px; cursor:pointer; transition:all .2s; }
        .neoMotor button.on{ color:#0d0a02; background:#f0b429; font-weight:600; }
        .neoMotor button:disabled{ opacity:.5; cursor:default; }
        .neoFicha{ font-family:'IBM Plex Mono', monospace; font-size:9.5px; letter-spacing:.1em;
          color:rgba(240,180,41,.45); margin-top:9px; }
        .neoGerGrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:4px 0 12px; }
        @media (max-width:560px){ .neoGerGrid{ grid-template-columns:repeat(2,1fr); } }
        .neoGerCard{ display:block; border-radius:11px; overflow:hidden; border:1px solid rgba(240,180,41,.2);
          background:#000; text-decoration:none; transition:transform .2s, border-color .2s; }
        .neoGerCard:hover{ transform:translateY(-2px); border-color:rgba(240,180,41,.55); }
        .neoGerCard img{ width:100%; aspect-ratio:1; object-fit:cover; display:block; }
        .neoGerCard span{ display:block; font-size:9.5px; color:rgba(233,228,212,.7); padding:5px 7px; text-align:center; }
        .neoGerCard:hover span{ color:#f0b429; }
        .neoVozSel{ background:rgba(255,255,255,.04); border:1px solid rgba(240,180,41,.22); border-radius:999px;
          color:rgba(245,239,223,.8); font-family:'IBM Plex Mono', monospace; font-size:10.5px;
          padding:7px 10px; cursor:pointer; outline:none; max-width:150px; }
        .neoVozSel:hover{ border-color:rgba(240,180,41,.5); }
        .neoVozSel option{ background:#12121a; color:#f5efdf; }
        .neoVoice.on{ color:#0d0a02; background:#f0b429; border-color:#f0b429; font-weight:600;
          box-shadow:0 0 24px rgba(240,180,41,.35); }

        /* ── Insight ── */
        .neoInsight{ position:relative; border-radius:14px; overflow:hidden;
          background:linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.012));
          border:1px solid rgba(255,255,255,.07); padding:15px 18px 15px 22px; animation:neoUp .55s .08s ease both; }
        .neoInsight::before{ content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
          background:var(--sev); box-shadow:0 0 18px var(--sev); }
        .neoInsight{ transition:border-color .25s; }
        .neoInsight.aberto{ border-color:color-mix(in srgb, var(--sev) 30%, rgba(255,255,255,.07)); }

        /* Tarja: a linha discreta que fica visível o tempo todo */
        .neoInsBar{ width:100%; display:flex; align-items:center; gap:10px; padding:0; cursor:pointer;
          background:transparent; border:none; text-align:left; font-family:inherit; color:inherit; }
        .neoInsRot{ font-family:'IBM Plex Mono', monospace; font-size:9.5px; font-weight:600;
          letter-spacing:.26em; text-transform:uppercase; color:var(--sev); white-space:nowrap; flex-shrink:0; }
        .neoInsPrev{ font-size:13px; color:rgba(233,228,212,.5); overflow:hidden; text-overflow:ellipsis;
          white-space:nowrap; min-width:0; flex:1; }
        .neoInsSeta{ margin-left:auto; font-size:11px; color:rgba(233,228,212,.4); flex-shrink:0; padding-left:6px; }
        .neoInsBar:hover .neoInsPrev{ color:rgba(233,228,212,.75); }
        .neoInsBar:hover .neoInsSeta{ color:var(--sev); }

        .neoInsCorpo{ animation:neoUp .3s ease both; margin-top:12px; }
        .neoInsAcoes{ display:flex; gap:9px; margin-top:14px; flex-wrap:wrap; }
        .neoInsCta{ font-family:'Unbounded', sans-serif; font-weight:700; font-size:11px; letter-spacing:.08em;
          color:#0d0a02; background:linear-gradient(135deg,#ffd763,#f0b429); border:none; border-radius:999px;
          padding:9px 18px; cursor:pointer; transition:all .22s; box-shadow:0 4px 16px rgba(240,180,41,.25); }
        .neoInsCta:hover{ transform:translateY(-1px); box-shadow:0 8px 22px rgba(240,180,41,.38); }
        .neoInsCta:disabled{ opacity:.55; transform:none; cursor:default; }
        .neoInsGhost{ font-family:'IBM Plex Mono', monospace; font-size:10.5px; letter-spacing:.12em;
          text-transform:uppercase; color:rgba(233,228,212,.5); background:transparent;
          border:1px solid rgba(255,255,255,.14); border-radius:999px; padding:9px 16px; cursor:pointer; transition:all .22s; }
        .neoInsGhost:hover{ color:#f5efdf; border-color:rgba(255,255,255,.3); }
        .neoDot{ width:6px; height:6px; border-radius:50%; background:var(--sev); box-shadow:0 0 10px var(--sev);
          animation:neoBreathe 2s ease-in-out infinite; }
        .neoInsTxt{ font-size:14.5px; line-height:1.65; color:#e9e4d4; white-space:pre-wrap; }

        /* ── Conversa ── */
        .neoScroll{ flex:1; min-height:0; overflow-y:auto; padding:18px 0 8px;
          scrollbar-width:thin; scrollbar-color:rgba(240,180,41,.3) transparent; }
        .neoScroll::-webkit-scrollbar{ width:5px; }
        .neoScroll::-webkit-scrollbar-thumb{ background:rgba(240,180,41,.28); border-radius:99px; }
        .neoThread{ display:flex; flex-direction:column; gap:18px; min-height:100%; }

        .neoEmpty{ margin:auto; text-align:center; padding:12px 20px 28px; animation:neoUp .6s .15s ease both; }
        .neoEmptyMark{ display:flex; justify-content:center; margin-bottom:24px; }
        .neoEmptyT{ font-family:'Unbounded', sans-serif; font-weight:700; font-size:17px; letter-spacing:.06em; color:#f5efdf; margin-bottom:8px; }
        .neoEmptyS{ font-size:13.5px; color:rgba(233,228,212,.5); max-width:430px; margin:0 auto 24px; line-height:1.65; }
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
          border:1px solid rgba(255,77,77,.25); border-radius:12px; padding:10px 14px;
          display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .neoRetry{ font-family:'IBM Plex Mono', monospace; font-size:10.5px; letter-spacing:.12em;
          text-transform:uppercase; color:#f5efdf; background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.2); border-radius:999px; padding:6px 13px; cursor:pointer;
          transition:all .2s; white-space:nowrap; }
        .neoRetry:hover{ background:rgba(255,255,255,.13); border-color:rgba(255,255,255,.35); }
        .neoRetry:disabled{ opacity:.5; cursor:default; }

        /* ── Entrada ── */
        .neoBar{ padding:14px 0 16px; border-top:1px solid rgba(240,180,41,.1);
          background:linear-gradient(180deg, transparent, rgba(240,180,41,.025)); }
        .neoBarIn{ display:flex; align-items:center; gap:9px; }
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

        .neoImgBtn{ display:inline-flex; align-items:center; gap:7px; font-family:'IBM Plex Mono', monospace;
          font-size:11px; letter-spacing:.06em; font-weight:600; cursor:pointer;
          color:#0d0a02; background:linear-gradient(135deg,#ffd763,#f0b429); border:none; border-radius:999px;
          padding:9px 15px; box-shadow:0 4px 16px rgba(240,180,41,.25); transition:transform .2s; }
        .neoImgBtn:hover{ transform:translateY(-1px); }
        .neoGptAlt{ font-family:'IBM Plex Mono', monospace; font-size:10px; letter-spacing:.08em;
          color:rgba(233,228,212,.4); text-decoration:none; }
        .neoGptAlt:hover{ color:rgba(240,180,41,.7); }
        .neoGpt{ align-self:flex-start; display:inline-flex; align-items:center; gap:7px;
          font-family:'IBM Plex Mono', monospace; font-size:10px; letter-spacing:.14em; text-transform:uppercase;
          color:rgba(49,209,131,.85); background:rgba(49,209,131,.06); border:1px solid rgba(49,209,131,.25);
          border-radius:999px; padding:7px 13px; text-decoration:none; transition:all .25s; animation:neoUp .55s .12s ease both; }
        .neoGpt:hover{ background:rgba(49,209,131,.14); }

        .neoAviso{ margin:20px auto; width:calc(100% - 48px); max-width:952px; box-sizing:border-box;
          padding:18px 20px; border-radius:14px; border:1px solid rgba(240,180,41,.2);
          border-left:3px solid #f0b429; background:rgba(240,180,41,.05); animation:neoUp .5s ease both; }
        .neoAvisoT{ font-family:'Unbounded', sans-serif; font-weight:700; font-size:14px; color:#f5efdf; margin-bottom:8px; }
        .neoAvisoTx{ font-size:13.5px; line-height:1.7; color:rgba(233,228,212,.65); }
        .neoAvisoTx b{ color:#f0b429; }

        @keyframes neoUp{ from{ opacity:0; transform:translateY(10px);} to{ opacity:1; transform:none;} }

        .neoSend .arr{ display:none; }

        /* Tablet: coluna ganha respiro lateral maior */
        @media (min-width:641px) and (max-width:1080px){
          .neoCol{ padding:0 28px; }
        }
        @media (max-width:640px){
          .neoCol{ padding:0 14px; }
          .neoTitle{ font-size:16px; }
          .neoSub{ font-size:8.5px; letter-spacing:.2em; }
          .neoVoice span.lbl{ display:none; }
          .neoVoice{ padding:8px 11px; }
          .neoVozSel{ max-width:96px; font-size:10px; padding:7px 8px; }
          .neoMotor button{ padding:6px 9px; font-size:9px; }
          .neoHead{ padding:12px 0 11px; }
          .neoHeadIn{ gap:11px; }
          .neoHeadIn .neoMark{ width:38px !important; height:38px !important; }
          .neoInsight{ padding:13px 14px 13px 18px; }
          .neoInsPrev{ display:none; }
          .neoInsCta,.neoInsGhost{ flex:1; text-align:center; }
          .neoInsTxt{ font-size:13.5px; }
          .neoScroll{ padding:14px 0 6px; }
          .neoEmptyMark .neoMark{ width:72px !important; height:72px !important; }
          .neoEmptyT{ font-size:15px; }
          .neoMsgTxt{ font-size:14px; }
          .neoBar{ padding:10px 0 12px; }
          .neoBarIn{ gap:6px; }
          .neoIconBtn{ width:40px; height:44px; border-radius:11px; }
          .neoSend{ padding:0 15px; height:44px; border-radius:11px; }
          .neoSend .txt{ display:none; }
          .neoSend .arr{ display:inline; font-size:16px; }
          .neoInput{ height:44px; padding:0 12px; font-size:14px; }
          .neoAviso{ width:calc(100% - 28px); }
        }
        @media (prefers-reduced-motion: reduce){
          .nmRing,.nmArc,.nmNode,.neoDot{ animation:none !important; }
        }

        /* ── Multi-chat: botão + drawer de conversas ── */
        .neoChatsBtn{ position:absolute; top:16px; left:16px; z-index:30;
          display:flex; align-items:center; gap:7px; font-family:'IBM Plex Mono', monospace;
          font-size:10.5px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:#f0b429;
          background:rgba(10,10,18,.72); border:1px solid rgba(240,180,41,.5); border-radius:999px;
          padding:9px 16px; cursor:pointer; transition:all .2s; white-space:nowrap;
          box-shadow:0 0 16px -6px rgba(240,180,41,.5); backdrop-filter:blur(4px); }
        .neoChatsBtn span[aria-hidden]{ font-size:13px; }
        .neoChatsBtn:hover{ background:#f0b429; border-color:#f0b429; color:#0d0a02;
          box-shadow:0 4px 18px -4px rgba(240,180,41,.6); }
        .neoDrawerWrap{ position:absolute; inset:0; z-index:40; display:flex; }
        .neoDrawerBack{ position:absolute; inset:0; background:rgba(0,0,0,.55); }
        .neoDrawer{ position:relative; width:320px; max-width:82vw; height:100%;
          background:#0a0a12; border-right:1px solid rgba(240,180,41,.18); display:flex; flex-direction:column;
          box-shadow:8px 0 40px rgba(0,0,0,.5); animation:neoDrawerIn .18s ease both; }
        @keyframes neoDrawerIn{ from{ transform:translateX(-16px); opacity:.6 } to{ transform:none; opacity:1 } }
        .neoDrawerHead{ display:flex; align-items:center; gap:10px; padding:16px 16px 12px; border-bottom:1px solid rgba(240,180,41,.12); }
        .neoDrawerHead .t{ font-family:'Unbounded',sans-serif; font-weight:700; font-size:13px; letter-spacing:.12em; color:#f5efdf; }
        .neoDrawerHead .x{ margin-left:auto; background:none; border:none; color:rgba(245,239,223,.6); font-size:22px; cursor:pointer; line-height:1; }
        .neoNovoBtn{ margin:12px 16px; padding:11px 14px; border-radius:11px; border:1px solid rgba(240,180,41,.35);
          background:rgba(240,180,41,.1); color:#f0b429; font-family:'IBM Plex Mono',monospace; font-size:11px;
          letter-spacing:.12em; text-transform:uppercase; cursor:pointer; transition:all .2s; }
        .neoNovoBtn:hover{ background:rgba(240,180,41,.18); }
        .neoConvList{ flex:1; overflow-y:auto; padding:0 10px 14px; display:flex; flex-direction:column; gap:4px; }
        .neoConvItem{ display:flex; align-items:center; gap:8px; padding:10px; border-radius:10px; cursor:pointer;
          border:1px solid transparent; transition:all .15s; }
        .neoConvItem:hover{ background:rgba(255,255,255,.04); }
        .neoConvItem.on{ background:rgba(240,180,41,.1); border-color:rgba(240,180,41,.28); }
        .neoConvT{ flex:1; min-width:0; font-size:12.5px; color:#e9e4d4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .neoConvActs{ display:flex; gap:2px; }
        .neoConvActs button{ background:none; border:none; color:rgba(245,239,223,.45); cursor:pointer; font-size:12px; padding:3px 5px; border-radius:6px; }
        .neoConvActs button:hover{ color:#f0b429; background:rgba(240,180,41,.1); }
        .neoConvEmpty{ color:rgba(245,239,223,.4); font-size:12px; text-align:center; padding:24px 12px; }
      `}</style>

      {/* Multi-chat: drawer com os chats do seller (por tópico). Resumo automático
          por chat faz o NEO ficar mais afiado a cada conversa (backend). */}
      {chatsAberto && (
        <div className="neoDrawerWrap">
          <div className="neoDrawerBack" onClick={() => setChatsAberto(false)} />
          <div className="neoDrawer">
            <div className="neoDrawerHead">
              <span className="t">SEUS CHATS</span>
              <button className="x" onClick={() => setChatsAberto(false)} aria-label="Fechar">×</button>
            </div>
            <button className="neoNovoBtn" onClick={novoChat}>+ Novo chat</button>
            <div className="neoConvList">
              {conversas.length === 0 && <div className="neoConvEmpty">Nenhuma conversa ainda.<br/>Comece a falar com o NEO — cada chat vira um tópico aqui.</div>}
              {conversas.map((c) => (
                <div key={c.id} className={`neoConvItem${c.id === conversaId ? ' on' : ''}`} onClick={() => abrirConversa(c.id)}>
                  <span className="neoConvT">{c.titulo || 'Conversa'}</span>
                  <span className="neoConvActs">
                    <button title="Renomear" onClick={(e) => { e.stopPropagation(); renomearChat(c.id, c.titulo) }}>✎</button>
                    <button title="Apagar" onClick={(e) => { e.stopPropagation(); apagarChat(c.id) }}>🗑</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Botão dos chats no CANTO onde o painel abre (topo-esquerdo). Some quando
          o painel está aberto (o × dele fecha). */}
      {!chatsAberto && (
        <button className="neoChatsBtn" onClick={() => { void carregarConversas(); setChatsAberto(true) }} title="Seus chats por tópico">
          <span aria-hidden>☰</span> Chats
        </button>
      )}

      <div className="neoIn">
        {/* Cabeçalho */}
        <div className="neoHead">
         <div className="neoCol neoHeadIn">
          <NeoMark size={46} on={loading || falando} />
          <div>
            <div className="neoTitle">AGENTE <b>NEO</b></div>
            <div className="neoSub">Inteligência · João Flório</div>
          </div>
          {/* Comparador de motores — só admin. Manda a MESMA pergunta pros dois
              e a ficha técnica embaixo de cada resposta mostra quem foi, quanto
              demorou e quantos tokens saíram. */}
          {isAdmin && (
            <div className="neoMotor" title={motor
              ? 'Motor escolhido por você para as próximas perguntas (só você vê)'
              : 'Usando o motor padrão do servidor. Clique para forçar um específico e comparar.'}>
              {(['claude', 'gemini'] as const).map((m) => (
                // Sem escolha explícita, marca o motor que o servidor REALMENTE
                // usou na última resposta — antes o botão "Claude" nascia aceso
                // e mentia sobre qual motor estava rodando.
                <button key={m} className={(motor ?? motorAtivo) === m ? 'on' : ''}
                  onClick={() => setMotor(motor === m ? null : m)} disabled={loading}>
                  {m === 'claude' ? 'Claude' : 'Gemini'}
                </button>
              ))}
            </div>
          )}


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
        </div>

        {/* Saldo de créditos — some sozinho enquanto a carteira está desligada */}
        <Carteira />

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

        {!semConexao && (
          <>
            {/* Insight do dia — recolhido por padrão. Aberto o tempo todo ele
                vira paisagem e a pessoa para de ler justamente o que é urgente.
                Fica só a tarja: severidade + a primeira frase. Clicou, abre. */}
            {(carregandoIns || (ins && !insOculto)) && (
              <div className="neoCol" style={{ marginTop: 16 }}>
               <div className={`neoInsight${insAberto ? ' aberto' : ''}`} style={{ ['--sev' as any]: sev?.cor || 'rgba(240,180,41,.5)' }}>
                {carregandoIns ? (
                  <div className="neoInsBar"><span className="neoDot" /><span className="neoInsRot">Lendo sua operação…</span></div>
                ) : ins && sev ? (
                  <>
                    <button className="neoInsBar" onClick={() => setInsAberto((v) => !v)}
                      aria-expanded={insAberto} title={insAberto ? 'Recolher' : 'Ver o diagnóstico'}>
                      <span className="neoDot" />
                      <span className="neoInsRot">{sev.rotulo}</span>
                      {!insAberto && <span className="neoInsPrev">{primeiraFrase(ins.texto)}</span>}
                      <span className="neoInsSeta">{insAberto ? '▴' : '▾'}</span>
                    </button>

                    {insAberto && (
                      <div className="neoInsCorpo">
                        <div className="neoInsTxt">{rico(ins.texto)}</div>
                        <div className="neoInsAcoes">
                          <button className="neoInsCta" onClick={resolverInsight} disabled={loading}>Bora resolver</button>
                          <button className="neoInsGhost" onClick={dispensarInsight}>Depois</button>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
               </div>
              </div>
            )}

            <div className="neoCol" style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="neoImgBtn" onClick={() => {
                // Atalho: em vez de abrir modal, escreve a frase pronta no chat e
                // foca o campo — um caminho só (a conversa), o botão só ensina.
                setInput('Cria o anúncio completo desse produto: ')
                setTimeout(() => { const el = inputRef.current; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) } }, 30)
              }}>🎨 Criar anúncio completo</button>
              <a className="neoGptAlt" href={GPT_AGENT_URL} target="_blank" rel="noreferrer">ou usar o Agente GPT ↗</a>
            </div>

            {/* Conversa */}
            <div ref={scrollRef} className="neoScroll">
             <div className="neoCol neoThread">
              {vazio && !loading && (
                <div className="neoEmpty">
                  <div className="neoEmptyMark"><NeoMark size={96} /></div>
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
                      // HEIC não RENDERIZA no Chrome, mas FOI enviado — mostra um
                      // selo em vez de imagem quebrada, pra não parecer que falhou.
                      /jpe?g|png|webp|gif/i.test(im.mediaType)
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img key={k} className="neoImg" src={`data:${im.mediaType};base64,${im.data}`} alt="anexo" />
                        : <span key={k} className="neoImg" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.06)', color: '#8B8BAC', fontSize: 11, fontWeight: 600 }}>🖼 foto</span>
                    ))}
                    {m.text}
                  </div>
                ) : (
                  <div key={i} className="neoMsgN">
                      <div className="neoMsgTag">NEO</div>
                    {/* Imagens que o NEO gerou (Criador de Anúncio pelo chat) —
                        cada uma clicável pra baixar. */}
                    {m.geradas?.length ? (
                      <div className="neoGerGrid">
                        {m.geradas.map((g, k) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <a key={k} className="neoGerCard" href={`data:${g.mediaType};base64,${g.data}`} download={`anuncio-${k + 1}.png`} title={`${g.rotulo} — baixar`}>
                            <img src={`data:${g.mediaType};base64,${g.data}`} alt={g.rotulo} />
                            <span>{g.rotulo} ⬇</span>
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <div className="neoMsgTxt">{rico(m.text)}</div>
                    {isAdmin && m.ficha?.provider && (
                      <div className="neoFicha">
                        {m.ficha.provider === 'gemini' ? 'Gemini' : 'Claude'} · {m.ficha.model}
                        {m.ficha.ms ? ` · ${(m.ficha.ms / 1000).toFixed(1)}s` : ''}
                        {m.ficha.tokensEntrada ? ` · ${milhar(m.ficha.tokensEntrada)} entrada${
                          m.ficha.tokensCache ? ` (${Math.round(m.ficha.tokensCache / m.ficha.tokensEntrada * 100)}% cache)` : ''
                        }` : ''}
                        {m.ficha.tokensSaida ? ` · ${milhar(m.ficha.tokensSaida)} saída` : ''}
                        {/* O custo fecha a conta: sem ele os tokens são número solto.
                            Some quando o modelo não está na tabela de preços do
                            backend — melhor faltar que exibir um valor inventado. */}
                        {typeof m.ficha.custoBrl === 'number'
                          ? ` · R$ ${m.ficha.custoBrl.toFixed(m.ficha.custoBrl < 0.1 ? 3 : 2).replace('.', ',')}`
                          : ''}
                      </div>
                    )}
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
              {erro && (
                <div className="neoErr">
                  {erro}
                  {ultimoEnvioRef.current && (
                    <button className="neoRetry" onClick={tentarNovamente} disabled={loading}>Tentar de novo</button>
                  )}
                </div>
              )}
             </div>
            </div>

            {/* Miniaturas de anexos */}
            {pend.length > 0 && (
              <div className="neoCol" style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
                {pend.map((im, k) => (
                  <div key={k} style={{ position: 'relative' }}>
                    {/* HEIC não renderiza no Chrome; mostra um selo (a foto vai
                        do mesmo jeito — o Gemini lê). */}
                    {/jpe?g|png|webp|gif/i.test(im.mediaType)
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={`data:${im.mediaType};base64,${im.data}`} alt="anexo" style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 9, border: '1px solid rgba(255,255,255,.15)' }} />
                      : <span style={{ width: 46, height: 46, borderRadius: 9, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)', color: '#8B8BAC', fontSize: 9, fontWeight: 600, display: 'grid', placeItems: 'center', textAlign: 'center' as const }}>🖼<br/>foto</span>}
                    <button onClick={() => setPend((p) => p.filter((_, j) => j !== k))} aria-label="remover"
                      style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 999, background: '#111', border: '1px solid rgba(255,255,255,.2)', color: '#fff', fontSize: 11, lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* 📦 Card do catálogo de fornecedor (admin): acompanha o upload/extração
                e, pronto, mostra a AMOSTRA pra conferência de preço + o convite pra
                minerar. Dispensável no ×; o catálogo fica salvo no servidor. */}
            {catalogo && (
              <div style={{ margin: '0 0 8px', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,183,3,.25)', background: 'rgba(255,183,3,.06)', fontSize: 12, color: '#CFCFE8', position: 'relative' as const }}>
                <button onClick={() => setCatalogo(null)} aria-label="fechar" style={{ position: 'absolute', top: 6, right: 8, background: 'transparent', border: 'none', color: '#8B8BAC', cursor: 'pointer', fontSize: 13 }}>×</button>
                {catalogo.status === 'enviando' && <>📦 Enviando <b>{catalogo.nome_arquivo}</b>… (catálogo grande leva um minuto)</>}
                {catalogo.status === 'extraindo' && <>📦 <b>{catalogo.nome_arquivo}</b>: lendo o catálogo página por página… (2–4 min num catálogo grande — pode continuar usando o chat)</>}
                {catalogo.status === 'erro' && <>📦 <b>{catalogo.nome_arquivo}</b>: ❌ {catalogo.erro || 'não consegui extrair'} </>}
                {catalogo.status === 'pronto' && (
                  <>
                    📦 <b>{catalogo.nome_arquivo}</b>: ✅ <b>{catalogo.total} produtos</b> extraídos.
                    {Array.isArray(catalogo.amostra) && catalogo.amostra.length > 0 && (
                      <div style={{ marginTop: 5, fontSize: 11, color: '#8B8BAC' }}>
                        Confere a leitura: {catalogo.amostra.slice(0, 3).map((p: any) => `${p.nome} — R$ ${Number(p.custoUn).toFixed(2).replace('.', ',')}/un${p.pcx ? ` (${p.pcx}/cx)` : ''}`).join(' · ')}
                      </div>
                    )}
                    <div style={{ marginTop: 6 }}>
                      <button onClick={() => enviar('Minera meu fornecedor: pega os melhores produtos do catálogo que eu subi e aplica os 3 pilares na Amazon.')}
                        style={{ background: 'rgba(255,183,3,.14)', border: '1px solid rgba(255,183,3,.35)', color: '#FFB703', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                        ⛏️ Minerar este catálogo
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {/* Barra de entrada */}
            <div className="neoBar">
             <div className="neoCol neoBarIn">
              {/* Nova conversa — fica na barra de digitar (à mão, não escondido
                  no topo). Só aparece com histórico, já que a conversa persiste. */}
              {msgs.length > 0 && (
                <button className="neoIconBtn" onClick={limparConversa} disabled={loading}
                  title="Nova conversa (apaga o histórico salvo)" aria-label="Nova conversa">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 1 2.3 5.6M4 12V7m0 5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              <input ref={fileRef} type="file" accept={isAdmin ? 'image/*,application/pdf' : 'image/*'} multiple hidden onChange={(e) => anexar(e.target.files)} />
              <button className="neoIconBtn" onClick={() => fileRef.current?.click()} disabled={loading || pend.length >= MAX_IMGS} title={isAdmin ? 'Anexar imagem ou catálogo (PDF)' : 'Anexar imagem'} aria-label="Anexar imagem">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 11.5 12.6 19a5.1 5.1 0 0 1-7.2-7.2l8-8a3.4 3.4 0 0 1 4.8 4.8l-7.8 7.8a1.7 1.7 0 0 1-2.4-2.4l7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              </button>
              {suportaMic && (
                <button className={`neoIconBtn${gravando ? ' rec' : ''}`} onClick={toggleMic} disabled={loading}
                  title={gravando ? 'Gravando — clique para parar' : 'Falar com o NEO'} aria-label="Falar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                </button>
              )}
              <input
                ref={inputRef}
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
            </div>
          </>
        )}
      </div>
    </div>
  )
}
