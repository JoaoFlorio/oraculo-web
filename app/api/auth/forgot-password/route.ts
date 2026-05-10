import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/db'
import { Resend } from 'resend'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const resend   = new Resend(process.env.RESEND_API_KEY)
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://oraculo-web-production.up.railway.app'
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    // Sempre retorna sucesso para não revelar se o email existe
    if (!user) return NextResponse.json({ ok: true })

    // Gera token único com validade de 1 hora
    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpAt: expiry },
    })

    const resetUrl = `${BASE_URL}/reset-password?token=${token}`

    await resend.emails.send({
      from: 'ORÁCULO <noreply@oraculojf.com.br>',
      to: user.email,
      subject: '🔮 Redefinição de senha — ORÁCULO',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#03030A;font-family:'Inter',system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#03030A;padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#09091A;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,rgba(240,180,41,0.12),rgba(240,180,41,0.04));padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06)">
          <div style="font-size:28px;margin-bottom:8px">🔮</div>
          <div style="font-size:20px;font-weight:800;letter-spacing:0.2em;color:#F0B429">ORÁCULO</div>
          <div style="font-size:10px;color:#686890;letter-spacing:0.15em;margin-top:4px">AMAZON INTELLIGENCE</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px">
          <h2 style="color:#F2F2FC;font-size:18px;font-weight:700;margin:0 0 12px">Redefinição de senha</h2>
          <p style="color:#A0A0C8;font-size:14px;line-height:1.6;margin:0 0 28px">
            Olá, <strong style="color:#F2F2FC">${user.name}</strong>!<br><br>
            Recebemos uma solicitação para redefinir a senha da sua conta no ORÁCULO.
            Clique no botão abaixo para criar uma nova senha.
          </p>

          <div style="text-align:center;margin-bottom:28px">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#F5C842,#C48F10);color:#02020A;font-weight:700;font-size:13px;letter-spacing:0.08em;padding:14px 36px;border-radius:10px;text-decoration:none;text-transform:uppercase">
              Redefinir Senha
            </a>
          </div>

          <p style="color:#686890;font-size:12px;line-height:1.6;margin:0 0 8px">
            Ou copie e cole este link no seu navegador:
          </p>
          <p style="background:#03030A;border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px 14px;font-size:11px;color:#A0A0C8;word-break:break-all;margin:0 0 24px">
            ${resetUrl}
          </p>

          <div style="background:rgba(240,180,41,0.06);border:1px solid rgba(240,180,41,0.15);border-radius:8px;padding:14px 16px">
            <p style="color:#A0A0C8;font-size:12px;margin:0;line-height:1.6">
              ⏰ Este link expira em <strong style="color:#F0B429">1 hora</strong>.<br>
              Se você não solicitou a redefinição, ignore este email — sua senha permanece a mesma.
            </p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
          <p style="color:#686890;font-size:11px;margin:0">© 2025 ORÁCULO Amazon Intelligence. Todos os direitos reservados.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[forgot-password]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
