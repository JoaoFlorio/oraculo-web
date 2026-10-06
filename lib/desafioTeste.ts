// 05/10 — ANTI-ROBÔ DO CADASTRO DO TESTE GRÁTIS (pedido do João: "captcha no cadastro").
//
// Camada 1 (sempre ligada, sem conta em serviço nenhum): PROVA DE TRABALHO. O servidor entrega um desafio assinado
// (sal + validade + dificuldade, HMAC com segredo derivado do JWT_SECRET); o navegador procura um número que, junto do
// sal, dá um SHA-256 com N bits zerados no começo (18 bits ≈ 1 s no computador, alguns segundos no celular). Cada desafio vale 1 vez e por 10 min. Pra quem
// se cadastra é um "verificando…" de segundos; pra quem dispara milhares de cadastros vira custo de CPU por tentativa.
// + campo-isca invisível (robô de formulário preenche, gente não vê).
//
// Camada 2 (opcional — liga sozinha com as 2 chaves no Railway): Cloudflare TURNSTILE, o captcha de verdade (detecta
// robô pelo navegador). NEXT_PUBLIC_TURNSTILE_SITE_KEY (página) + TURNSTILE_SECRET_KEY (servidor). Sem as chaves, nada muda.
import crypto from 'crypto'

const BITS = Math.min(22, Math.max(8, Number(process.env.TESTE_POW_BITS) || 18))
const VALIDADE_MS = 10 * 60_000
const chave = () => crypto.createHash('sha256').update('oraculo-teste-desafio-v1:' + (process.env.JWT_SECRET || 'oraculo-secret-dev-only')).digest()
const assinar = (corpo: string) => crypto.createHmac('sha256', chave()).update(corpo).digest('base64url')

/** `sal.validade.bits.assinatura` — o navegador resolve e devolve junto com o nonce. */
export function novoDesafio(): string {
  const corpo = `${crypto.randomBytes(16).toString('hex')}.${Date.now() + VALIDADE_MS}.${BITS}`
  return `${corpo}.${assinar(corpo)}`
}

/** Bits zerados no começo do hash (a mesma conta que a página faz). Pura — testável. */
export function bitsZerados(hash: Buffer | Uint8Array): number {
  let n = 0
  for (const byte of hash) {
    if (byte === 0) { n += 8; continue }
    n += Math.clz32(byte) - 24
    break
  }
  return n
}

const usados = new Map<string, number>()   // sal → validade (cada desafio vale 1 vez)

export function conferirDesafio(desafio: string, nonce: string): boolean {
  const p = String(desafio || '').split('.')
  if (p.length !== 4) return false
  const [sal, validade, bits, sig] = p
  const esperado = Buffer.from(assinar(`${sal}.${validade}.${bits}`))
  const recebido = Buffer.from(sig)
  if (esperado.length !== recebido.length || !crypto.timingSafeEqual(esperado, recebido)) return false
  if (!(Number(validade) > Date.now()) || Number(bits) < 8) return false
  if (!/^\d{1,12}$/.test(String(nonce || ''))) return false
  if (bitsZerados(crypto.createHash('sha256').update(`${sal}:${nonce}`).digest()) < Number(bits)) return false
  const agora = Date.now()
  for (const [s, v] of usados) if (v < agora) usados.delete(s)
  if (usados.has(sal)) return false
  usados.set(sal, Number(validade))
  return true
}

/** Turnstile: sem a chave secreta configurada, não exige (camada opcional). */
export async function conferirTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', signal: AbortSignal.timeout(8000),
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    })
    const d = await r.json().catch(() => ({}))
    return d?.success === true
  } catch { return false }
}
