// 2FA (TOTP) — 23/09/2026, "blindar o admin". Segredo em User.metadata.totp
// (sem migração de schema). otplib v13 (API funcional) + QR gerado no servidor
// (nada sai pra terceiro). Obrigatório só depois que o próprio usuário ativa.
import { generateSecret, generateURI, verify } from 'otplib'
import QRCode from 'qrcode'

export const TOTP_ISSUER = 'Oráculo'

export function novoSegredoTotp(): string { return generateSecret() }
export function uriTotp(email: string, secret: string): string { return generateURI({ issuer: TOTP_ISSUER, label: email, secret }) }
export async function qrTotp(uri: string): Promise<string> { return QRCode.toDataURL(uri, { margin: 1, width: 220 }) }
export async function codigoTotpValido(secret: string, token: string): Promise<boolean> {
  const t = String(token || '').replace(/\D/g, '')
  if (t.length !== 6 || !secret) return false
  try { const r = await verify({ secret, token: t }); return !!r?.valid } catch { return false }
}
export function totpDe(metadata: unknown): { secret: string; enabledAt?: string } | null {
  const m = (metadata ?? {}) as any
  return m?.totp?.secret ? m.totp : null
}
