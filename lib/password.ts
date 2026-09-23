import crypto from 'crypto'

// 23/09/2026: as senhas geradas (cliente novo, equipe, demo) vinham de Math.random
// com 6 caracteres e prefixo fixo (~2^34). Agora CSPRNG, 12 caracteres, sem
// ambiguidade visual (0/O, 1/l/I) — o cliente ainda digita do e-mail.
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
export function gerarSenha(prefixo = 'Orc#', tamanho = 12): string {
  let p = prefixo
  for (let i = 0; i < tamanho; i++) p += CHARS[crypto.randomInt(0, CHARS.length)]
  return p
}

/** Comparação de segredos em tempo constante (chaves x-admin-key etc.). */
export function segredoIgual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b))
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
}
