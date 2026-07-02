import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getAdminSession } from '@/lib/auth'

const ADMIN_KEY    = process.env.INTERNAL_KEY   || ''
const ADMIN_SECRET = process.env.ADMIN_SECRET   || ''
const BACKEND_URL  = process.env.BACKEND_URL    || 'https://central.oraculojf.com.br'

async function checkAuth(req: NextRequest) {
  if (ADMIN_KEY && req.headers.get('x-admin-key') === ADMIN_KEY) return true
  return !!(await getAdminSession())
}

function backendHeaders() {
  return { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET }
}

// GET /api/admin/licenses → exporta todas as licenças
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const res = await fetch(`${BACKEND_URL}/api/license/export`, { headers: backendHeaders() })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

// POST /api/admin/licenses  body: { action:'deactivate'|'renew', key, plan? }
export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { action, key, plan } = await req.json()

  if (action === 'deactivate') {
    const res = await fetch(`${BACKEND_URL}/api/license/deactivate`, {
      method: 'POST', headers: backendHeaders(),
      body: JSON.stringify({ key }),
    })
    return NextResponse.json(await res.json(), { status: res.status })
  }

  if (action === 'renew') {
    const res = await fetch(`${BACKEND_URL}/api/license/renew`, {
      method: 'POST', headers: backendHeaders(),
      body: JSON.stringify({ key, plan: plan || 'monthly' }),
    })
    return NextResponse.json(await res.json(), { status: res.status })
  }

  return NextResponse.json({ error: 'Action inválida' }, { status: 400 })
}
