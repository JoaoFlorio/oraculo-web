import { NextRequest, NextResponse } from 'next/server'
import { gerarSenha, segredoIgual } from '@/lib/password'
export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { prisma } from '@/lib/db'
import { getSession, getAdminSession, getClientsSession } from '@/lib/auth'

const ADMIN_KEY    = process.env.INTERNAL_KEY  || ''
const ADMIN_SECRET = process.env.ADMIN_SECRET  || ''
const BACKEND_URL  = process.env.BACKEND_URL   || 'https://central.oraculojf.com.br'
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.oraculojf.com.br'
const resend       = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// POST (criar cliente): admin OU funcionário (staff) OU SUPORTE OU backend interno.
// O suporte (Marli) e o staff criam cliente NOVO — sempre role='client' (o POST não
// aceita `role`). 05/10 (pentest): o POST também ATUALIZAVA quem já existia (plano,
// +dias, active=true) — era um bypass do PATCH (admin-only): suporte/staff davam
// vitalício e desfaziam reembolso. Agora só 'internal' (webhook) e 'admin' alteram
// conta existente; 'restrito' (staff/support) só cria, e com plano da lista fechada.
async function postLevel(req: NextRequest): Promise<'internal' | 'admin' | 'restrito' | null> {
  if (segredoIgual(req.headers.get('x-admin-key'), ADMIN_KEY)) return 'internal'  // backend interno (timing-safe)
  const s = await getSession()
  if (!s) return null
  if (s.role === 'admin') return 'admin'
  if (s.role === 'staff' || s.role === 'support') return 'restrito'
  return null
}
// Planos que staff/support podem dar na CRIAÇÃO. Vitalício (e qualquer outro) = só admin.
const PLANOS_RESTRITO = new Set(['monthly', 'biannual', 'annual'])
// PATCH (mudar plano / desativar): só admin OU backend interno.
async function checkAdmin(req: NextRequest) {
  if (segredoIgual(req.headers.get('x-admin-key'), ADMIN_KEY)) return true
  return !!(await getAdminSession())
}
// GET (listar) e PUT (reenviar senha): admin OU support OU backend interno.
// Devolve o "nível" pra as rotas aplicarem a guarda fina do support (que faz SÓ
// isso — não cria (POST=staff), não muda plano/desativa (PATCH=admin), e só
// enxerga/reseta CLIENTE, nunca admin/staff/outro support).
async function clientsLevel(req: NextRequest): Promise<'internal' | 'admin' | 'support' | null> {
  if (segredoIgual(req.headers.get('x-admin-key'), ADMIN_KEY)) return 'internal'
  const s = await getClientsSession()
  if (!s) return null
  return s.role === 'admin' ? 'admin' : 'support'
}

const DAY_MS = 24 * 60 * 60 * 1000
/** Soma meses de CALENDÁRIO em UTC, travando no último dia do mês (31/08 + 6 = 28/02). MESMA regra do backend
 *  (src/lib/duracaoPlano.ts) — licença e conta web precisam bater no dia. */
function somaMesesUTC(base: Date, n: number): Date {
  const d = new Date(base.getTime()); const dia = d.getUTCDate()
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n)
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(dia, ultimo))
  return d
}
function calcExpiry(plan: string, base?: Date | null): Date | null {
  if (plan === 'lifetime') return null
  // 24/09: renovação/upgrade parte do vencimento atual (se ainda vale) — o cliente não perde os dias que faltavam.
  const d    = base && base.getTime() > Date.now() ? new Date(base.getTime()) : new Date()
  // 06/10 (João: "semestral bateu 6 meses, anual bateu 1 ano"): semestral/anual por mês de calendário (antes 180/365 dias).
  if (plan === 'biannual') return somaMesesUTC(d, 6)
  if (plan === 'annual') return somaMesesUTC(d, 12)
  d.setTime(d.getTime() + 30 * DAY_MS)
  return d
}
/** 06/10: espelha na LICENÇA da extensão o que o admin mudou na conta (plano/validade/ativo) — antes o PATCH só mexia
 *  na conta web e a extensão seguia com a validade antiga (ou funcionando depois do bloqueio). Best-effort. */
async function sincronizarLicenca(email: string, plan: string, expiresAt: Date | null, active: boolean, converter = false): Promise<boolean> {
  return (await sincronizarLicencaComChave(email, plan, expiresAt, active, converter)).ok
}
async function sincronizarLicencaComChave(email: string, plan: string, expiresAt: Date | null, active: boolean, converter = false): Promise<{ ok: boolean; key: string | null }> {
  try {
    const r = await fetch(`${BACKEND_URL}/api/license/admin-sync`, {
      method: 'POST', signal: AbortSignal.timeout(15_000),
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_KEY || '' },
      body: JSON.stringify({ email: email.toLowerCase(), plan, expiresAt: plan === 'lifetime' ? null : expiresAt ? expiresAt.toISOString() : null, active, converter }),
    })
    const d = r.ok ? await r.json().catch(() => ({})) : {}
    return { ok: r.ok, key: typeof d?.key === 'string' ? d.key : null }
  } catch { return { ok: false, key: null } }
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuito', monthly: 'Mensal', biannual: 'Semestral', annual: 'Anual', lifetime: 'Vitalício',
}

async function sendAccessEmail(opts: {
  to: string; name: string; password: string; key: string; plan: string
}) {
  if (!resend) { console.warn('[admin/users] RESEND_API_KEY não configurado — email não enviado'); return }
  const { to, name, password, key, plan } = opts
  const label = PLAN_LABEL[plan] ?? plan
  await resend.emails.send({
    from:    'ORÁCULO <noreply@oraculojf.com.br>',
    to,
    subject: `🔮 Acesso ORÁCULO ${label} — seus dados de login`,
    html: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:-apple-system,Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#13131F;border-radius:16px;border:1px solid rgba(240,180,41,0.2);overflow:hidden;">
  <div style="background:linear-gradient(135deg,rgba(240,180,41,0.15),rgba(240,180,41,0.04));padding:28px 32px;border-bottom:1px solid rgba(240,180,41,0.15);text-align:center;">
    <div style="font-size:32px;margin-bottom:6px;">🔮</div>
    <div style="font-size:22px;font-weight:900;letter-spacing:0.1em;color:#F0B429;">ORÁCULO</div>
    <div style="font-size:10px;color:#64748B;letter-spacing:0.15em;margin-top:2px;">AMAZON INTELLIGENCE</div>
  </div>
  <div style="padding:28px 32px;">
    <p style="font-size:16px;color:#CBD5E1;margin:0 0 6px;">Olá, <strong style="color:#E2E8F0;">${name.split(' ')[0]}</strong>! 🎉</p>
    <p style="font-size:14px;color:#94A3B8;margin:0 0 24px;line-height:1.6;">Aqui estão seus dados de acesso ao <strong style="color:#F0B429;">ORÁCULO ${label}</strong>. Guarde este e-mail!</p>
    <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:20px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:700;color:#10B981;letter-spacing:0.06em;margin-bottom:14px;">🖥️ ACESSO AO PAINEL WEB</div>
      <div style="background:#0A0A0F;border-radius:8px;padding:12px 16px;margin-bottom:10px;">
        <div style="font-size:10px;color:#475569;margin-bottom:3px;">URL</div>
        <a href="${FRONTEND_URL}" style="color:#10B981;font-weight:700;font-size:13px;">${FRONTEND_URL}</a>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="background:#0A0A0F;border-radius:8px;padding:10px 14px;">
          <div style="font-size:10px;color:#475569;margin-bottom:3px;">E-MAIL</div>
          <div style="font-size:12px;font-weight:700;color:#E2E8F0;">${to}</div>
        </div>
        <div style="background:#0A0A0F;border-radius:8px;padding:10px 14px;">
          <div style="font-size:10px;color:#475569;margin-bottom:3px;">SENHA</div>
          <div style="font-family:monospace;font-size:15px;font-weight:800;color:#10B981;">${password}</div>
        </div>
      </div>
    </div>
    <div style="background:rgba(240,180,41,0.06);border:1px solid rgba(240,180,41,0.2);border-radius:12px;padding:20px;">
      <div style="font-size:12px;font-weight:700;color:#F0B429;letter-spacing:0.06em;margin-bottom:10px;">🧩 CHAVE DA EXTENSÃO CHROME</div>
      <div style="background:#0A0A0F;border:1px solid rgba(240,180,41,0.2);border-radius:8px;padding:14px;text-align:center;">
        <div style="font-family:monospace;font-size:15px;font-weight:800;color:#F0B429;letter-spacing:0.06em;word-break:break-all;">${key}</div>
      </div>
    </div>
    <p style="font-size:11px;color:#64748B;margin:20px 0 0;line-height:1.6;">
      Dúvidas? <a href="mailto:atendimento@oraculojf.com.br" style="color:#F0B429;">atendimento@oraculojf.com.br</a>
    </p>
  </div>
</div></body></html>`,
  })
}

/** Gera senha aleatória legível: ex. Orc#8f2kL */
function genPassword() { return gerarSenha('Orc#') }   // 23/09: CSPRNG, 12 caracteres (lib/password.ts)

/** Cria licença no backend. Retorna a chave gerada ou null em caso de falha. */
async function createBackendLicense(email: string, plan: string): Promise<string | null> {
  try {
    const backendPlan = plan === 'free' ? 'monthly' : plan  // free não existe no backend
    const url = `${BACKEND_URL}/api/license/generate`
    console.log(`[admin/users] createBackendLicense → POST ${url} | plan=${backendPlan} | secret=${ADMIN_SECRET ? 'ok' : '(vazio!)'}`)
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body:    JSON.stringify({ email: email.toLowerCase(), plan: backendPlan }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[admin/users] backend retornou ${res.status}: ${body}`)
      return null
    }
    const data = await res.json()
    console.log(`[admin/users] licença gerada: ${data.key}`)
    return data.key || null
  } catch (err: any) {
    console.error(`[admin/users] falha ao chamar backend:`, err?.message ?? err)
    return null
  }
}

// GET /api/admin/users → lista os usuários (support enxerga SÓ clientes)
export async function GET(req: NextRequest) {
  const level = await clientsLevel(req)
  if (!level) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const users = await prisma.user.findMany({
    where: level === 'support' ? { role: 'client' } : undefined,   // support não vê admin/staff
    select: { id: true, name: true, email: true, phone: true, role: true, plan: true, active: true, expiresAt: true, createdAt: true, metadata: true },
    orderBy: { createdAt: 'desc' },
  })
  // 06/10: teste grátis ≠ pagante — a lista mostra "Teste grátis"/"Teste encerrado" (só a marca; o resto do metadata não sai).
  const agora = Date.now()
  return NextResponse.json({ users: users.map(({ metadata, ...u }) => {
    const t = (metadata as Record<string, any> | null)?.teste
    return { ...u, teste: t?.ate ? (Date.parse(t.ate) > agora ? 'ativo' : 'encerrado') : null }
  }) })
}

// POST /api/admin/users → cria ou atualiza usuário + gera licença
export async function POST(req: NextRequest) {
  const nivel = await postLevel(req)
  if (!nivel) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const restrito = nivel === 'restrito'

  const { email, name, plan, phone, skipLicense: skipDoChamador, licenseKey: providedKey, password: senhaDoChamador, expiresAt: validadeDoChamador, teste: testeDoChamador } = await req.json()
  if (!email || typeof email !== 'string') return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })
  // 23/09 (achado 41): o webhook da Greenn manda a senha que vai no e-mail de acesso, mas esta
  // rota gerava OUTRA e gravava a sua — o cliente recebia uma senha que não abria. Só o chamador
  // INTERNO (x-admin-key) pode fornecer a senha; painel/suporte continuam com a gerada aqui.
  const senhaFornecida = nivel === 'internal' && typeof senhaDoChamador === 'string' && senhaDoChamador.length >= 8 ? senhaDoChamador : null
  // skipLicense/licenseKey são do webhook: staff/support sempre geram licença + mandam o e-mail.
  const skipLicense = restrito ? false : skipDoChamador

  const phoneVal = phone ? String(phone).trim() : null
  const targetPlan = plan || 'monthly'
  // 05/10 (pentest): staff/support só escolhem plano da lista fechada — vitalício é do admin.
  if (restrito && !PLANOS_RESTRITO.has(targetPlan))
    return NextResponse.json({ error: 'Plano não permitido — vitalício só o admin libera.' }, { status: 400 })
  const exists     = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  // 05/10 (pentest): staff/support NÃO alteram conta existente (plano, dias, reativação) — isso é
  // o PATCH, admin-only. Antes o POST virava o atalho: vitalício + active=true desfazia reembolso.
  if (exists && restrito)
    return NextResponse.json({ error: 'Cliente já existe — peça ao admin pra alterar o plano/acesso.' }, { status: 409 })
  // 01/10 — TESTE GRÁTIS (webhook da Greenn, só chamador INTERNO): validade exata (7 dias) e a marca
  // `metadata.teste` (a tela troca "renove" por "teste até dd/mm"). Venda paga do webhook vem SEM teste → limpa a marca.
  const interno = nivel === 'internal'
  const validadeTeste = interno && typeof validadeDoChamador === 'string' && !isNaN(Date.parse(validadeDoChamador)) ? new Date(validadeDoChamador) : null
  const marcaTeste = interno && testeDoChamador && typeof testeDoChamador.ate === 'string' ? { ate: testeDoChamador.ate, creditos: Number(testeDoChamador.creditos) || 10, ...(testeDoChamador.origem === 'oraculo' ? { origem: 'oraculo' } : {}) } : null
  const expiry     = validadeTeste ?? calcExpiry(targetPlan, exists && exists.plan !== 'lifetime' ? exists.expiresAt : null)
  const metaBase   = (exists?.metadata && typeof exists.metadata === 'object' ? exists.metadata : {}) as Record<string, unknown>
  // 08/10: compra nova/renovação limpa a marca de "pediu reembolso" (voltou a pagar).
  const metadataNova = interno ? (() => { const m = { ...metaBase }; if (marcaTeste) m.teste = marcaTeste; else delete m.teste; delete m.reclamacao; return m })() : undefined

  if (exists) {
    // Atualiza plano do usuário existente. Reativa a conta (active=true): uma
    // compra/renovação sempre restaura o acesso de quem estava bloqueado/expirado.
    const updated = await prisma.user.update({
      where: { id: exists.id },
      data:  { plan: targetPlan, expiresAt: expiry, active: true, ...(phoneVal ? { phone: phoneVal } : {}), ...(metadataNova ? { metadata: metadataNova as object } : {}) },
    })
    // Gera licença só se não vier uma pronta (skipLicense = chamada via webhook)
    const licKey = skipLicense ? (providedKey || null) : await createBackendLicense(email, targetPlan)
    return NextResponse.json({
      ok: true, action: 'updated',
      user: { email: updated.email, plan: updated.plan },
      licenseKey: licKey,
    })
  }

  // Novo usuário: senha do chamador interno (webhook) ou gerada aqui
  const password = senhaFornecida || genPassword()
  const hash     = await bcrypt.hash(password, 12)
  const user     = await prisma.user.create({
    data: {
      name:      name || email.split('@')[0],
      email:     email.toLowerCase(),
      password:  hash,
      plan:      targetPlan,
      active:    true,
      expiresAt: expiry,
      phone:     phoneVal,
      ...(marcaTeste ? { metadata: { teste: marcaTeste } } : {}),
    },
  })

  // Gera licença no backend (só se não vier uma pronta)
  const licKey = skipLicense ? (providedKey || null) : await createBackendLicense(email, targetPlan)

  // ⭐ ENVIA O E-MAIL DE ACESSO NA HORA (João, 06/08): antes o "Criar acesso" NÃO
  // mandava e-mail — tinha que clicar em "Reenviar". Agora sai automático na
  // criação MANUAL (admin/staff/suporte). O webhook (skipLicense=true) NÃO entra:
  // ele dispara o próprio e-mail de acesso (greenn.ts), então evita duplicar.
  let emailEnviado = false
  if (!skipLicense) {
    try {
      await sendAccessEmail({ to: user.email, name: user.name || user.email, password, key: licKey || '—', plan: user.plan })
      emailEnviado = true
    } catch (e: any) { console.error('[admin/users] falha ao enviar email de acesso na criação:', e?.message ?? e) }
  }

  return NextResponse.json({
    ok: true, action: 'created',
    user:       { email: user.email, plan: user.plan },
    password,   // senha gerada automaticamente
    licenseKey: licKey,
    emailEnviado,
  })
}

// PATCH /api/admin/users → muda plano e/ou ativa/desativa a conta
export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { email, plan, active } = await req.json()
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })
  if (!plan && typeof active !== 'boolean')
    return NextResponse.json({ error: 'informe plan ou active' }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // Trava anti-tiro-no-pé: desativar um admin fecha a porta do próprio painel, e
  // aí não sobra caminho de volta a não ser mexer no banco na mão.
  if (active === false && target.role === 'admin')
    return NextResponse.json({ error: 'Conta admin não pode ser desativada por aqui' }, { status: 400 })

  if (plan && !['monthly', 'biannual', 'annual', 'lifetime'].includes(String(plan)))
    return NextResponse.json({ error: 'plano inválido' }, { status: 400 })
  const data: { plan?: string; expiresAt?: Date | null; active?: boolean; metadata?: object } = {}
  if (plan) {
    data.plan = plan
    // 06/10: conta bloqueada/reembolsada ou no teste grátis conta a partir de HOJE (não devolve os dias cortados nem soma o teste)
    const meta = (target.metadata && typeof target.metadata === 'object' ? target.metadata : {}) as Record<string, unknown>
    const emTeste = !!(meta.teste as any)?.ate
    data.expiresAt = calcExpiry(plan, target.active && !emTeste && target.plan !== 'lifetime' ? target.expiresAt : null)
    // Admin deu um plano a quem estava no teste: deixa de ser teste (a marca sai; o backend marca a conversão no admin-sync)
    if (emTeste) { const m = { ...meta }; delete m.teste; data.metadata = m }
  }
  if (typeof active === 'boolean') data.active = active
  // 08/10: desbloquear quem tinha pedido reembolso (desistiu) apaga a marca — senão um bloqueio futuro mostraria "você pediu reembolso".
  if (active === true) {
    const meta = (data.metadata ?? (target.metadata && typeof target.metadata === 'object' ? target.metadata : {})) as Record<string, unknown>
    if (meta.reclamacao) { const m = { ...meta }; delete m.reclamacao; data.metadata = m }
  }

  const user = await prisma.user.update({ where: { email: target.email }, data })
  // converter=true só quando o admin DEU um plano (tira do teste grátis); bloquear/desbloquear não converte
  const licencaSincronizada = await sincronizarLicenca(user.email, user.plan || 'monthly', user.expiresAt ?? null, user.active, !!plan)

  // Bloquear só a conta deixaria a EXTENSÃO funcionando (licença é outra chave) — o admin-sync acima derruba as duas
  // juntas. 06/10: antes isto chamava /by-email com o header errado (x-admin-secret) e NUNCA derrubava a licença.
  const licencaDesativada: boolean | null = active === false ? licencaSincronizada : null

  return NextResponse.json({
    ok: true, licencaDesativada, licencaSincronizada,
    user: { email: user.email, plan: user.plan, active: user.active },
  })
}

// PUT /api/admin/users → reseta senha + reenvia email de acesso
export async function PUT(req: NextRequest) {
  const level = await clientsLevel(req)
  if (!level) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // 🔒 ANTI-ESCALONAMENTO: support só reseta senha de CLIENTE. Sem isso, ele
  // poderia resetar a senha do admin por email e tomar a conta.
  if (level === 'support' && user.role !== 'client') {
    return NextResponse.json({ error: 'Sem permissão para este usuário' }, { status: 403 })
  }
  // 🔒 23/09: conta ADMIN nunca é resetada por aqui (nem pelo caminho interno, nem por
  // outro admin) — o admin troca a própria senha logado (/api/user/change-password).
  // Era o atalho: INTERNAL_KEY vazada = senha do João em claro na resposta.
  if (user.role === 'admin') {
    return NextResponse.json({ error: 'Conta admin: troque a senha pelo perfil, logado.' }, { status: 403 })
  }

  // Gera nova senha e atualiza no banco
  const password = genPassword()
  const hash     = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { email: user.email },
    data:  { password: hash },
  })

  // Busca chave de licença no backend — se não existir, cria uma nova
  // 06/10: o header era x-admin-secret e o backend só aceita x-internal-key → a busca SEMPRE falhava e cada
  // "Reenviar" criava uma licença NOVA de 30 dias (no teste grátis = extensão de graça por 30 dias). Agora só cria
  // quando o backend responde "não existe" (404), e NUNCA pra quem está no teste grátis.
  let licKey = '—'
  let licencaInexistente = false
  try {
    const r = await fetch(`${BACKEND_URL}/api/license/by-email?email=${encodeURIComponent(user.email)}`, {
      headers: { 'x-internal-key': process.env.INTERNAL_KEY || '' }, signal: AbortSignal.timeout(15_000),
    })
    if (r.ok) {
      const d = await r.json()
      licKey = d.key || d.license?.key || '—'
    } else if (r.status === 404) licencaInexistente = true
  } catch { /* segue */ }
  const noTeste = !!((user.metadata as Record<string, any> | null)?.teste?.ate)

  // Se não tem chave, gera uma nova
  if ((!licKey || licKey === '—') && licencaInexistente && !noTeste && user.plan && user.plan !== 'free') {
    // nasce com a MESMA validade da conta (antes: 30 dias fixos do /generate, mesmo pra anual/vencido)
    const nova = await sincronizarLicencaComChave(user.email, user.plan, user.expiresAt ?? null, user.active)
    if (nova.key) licKey = nova.key
  }

  // Envia email com novos dados
  await sendAccessEmail({ to: user.email, name: user.name || user.email, password, key: licKey, plan: user.plan })

  // 23/09: a senha nova vai pelo e-mail; a resposta só a devolve pra um humano logado (support/admin), nunca pro caminho interno.
  return NextResponse.json({ ok: true, password: level === 'internal' ? undefined : password, licenseKey: licKey })
}
