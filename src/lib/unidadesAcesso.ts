import { createAdminClient } from '@/lib/supabase/server'

type Admin = Awaited<ReturnType<typeof createAdminClient>>

// Unidades que um usuário pode ver (mesma regra da função minhas_unidades()
// do banco, migration 004):
//   - dono: todas (retorna null = sem filtro)
//   - gerente: as que gerencia (gerente_unidades) + a sua unidade base
//   - funcionário: só a sua unidade base
export async function unidadesVisiveis(
  admin: Admin,
  usuario: { id: string; cargo: string; unidade_id: string | null }
): Promise<string[] | null> {
  if (usuario.cargo === 'dono') return null

  const ids = new Set<string>()
  if (usuario.unidade_id) ids.add(usuario.unidade_id)

  if (usuario.cargo === 'gerente') {
    const { data } = await admin
      .from('gerente_unidades')
      .select('unidade_id')
      .eq('gerente_id', usuario.id)
    for (const g of data ?? []) ids.add(g.unidade_id)
  }
  return Array.from(ids)
}

// Unidades a que um usuário PERTENCE (base + as que gerencia). Usado para
// saber se dois usuários são da mesma loja.
export async function unidadesDoUsuario(
  admin: Admin,
  usuario: { id: string; unidade_id: string | null }
): Promise<Set<string>> {
  const ids = new Set<string>()
  if (usuario.unidade_id) ids.add(usuario.unidade_id)
  const { data } = await admin
    .from('gerente_unidades')
    .select('unidade_id')
    .eq('gerente_id', usuario.id)
  for (const g of data ?? []) ids.add(g.unidade_id)
  return ids
}
