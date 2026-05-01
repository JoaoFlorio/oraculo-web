import { NextRequest, NextResponse } from 'next/server'
import { COOKIE, invalidateToken } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (token) await invalidateToken(token)

  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE)
  return res
}
