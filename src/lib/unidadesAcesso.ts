import { createAdminClient } from '@/lib/supabase/server'

type Admin = Awaited<ReturnType<typeof createAdminClient>>

// Unidades a que um usuário PERTENCE: a loja base (profiles.unidade_id) + as
// lojas extras em gerente_unidades. Apesar do nome, essa tabela vale para
// qualquer cargo — é como o dono põe alguém (gerente ou funcionário) para
// trabalhar em mais de uma loja. Mesma regra de minhas_unidades() no banco.
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

// Unidades que um usuário pode VER: dono todas (null = sem filtro); os demais,
// as lojas a que pertencem.
export async function unidadesVisiveis(
  admin: Admin,
  usuario: { id: string; cargo: string; unidade_id: string | null }
): Promise<string[] | null> {
  if (usuario.cargo === 'dono') return null
  return Array.from(await unidadesDoUsuario(admin, usuario))
}
