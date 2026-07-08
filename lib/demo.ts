import { prisma } from './db'
import { mergeDemoConfig, type DemoConfig } from './demoGestao'

// Se o usuário logado é a conta DEMO (role='demo'), devolve a config (do metadata.demo,
// com defaults). Senão, null → o proxy segue o fluxo real (SP-API). Uma query extra só
// para contas demo (raras — usadas em apresentação).
export async function demoConfigFor(user: { id: string; role?: string | null } | null): Promise<DemoConfig | null> {
  if (!user || user.role !== 'demo') return null
  try {
    const u = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } })
    const meta = (u?.metadata ?? {}) as Record<string, unknown>
    return mergeDemoConfig(meta?.demo)
  } catch {
    return mergeDemoConfig(null) // defaults se metadata falhar
  }
}
