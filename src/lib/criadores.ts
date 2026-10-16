import { createAdminClient } from '@/lib/supabase/server'

export type Criador = { id: string; nome: string; avatar_url: string | null }

// Nome e foto de quem criou cada pedido. Usa o admin porque o RLS de profiles
// não deixa o funcionário ler o perfil dos colegas (o join `criador:profiles`
// voltava vazio para ele). Só devolve nome e foto, nada de contato.
export async function buscarCriadores(ids: (string | null | undefined)[]) {
  const unicos = Array.from(new Set(ids.filter((i): i is string => !!i)))
  const mapa = new Map<string, Criador>()
  if (unicos.length === 0) return mapa

  const admin = await createAdminClient()
  const { data } = await admin.from('profiles').select('id, nome, avatar_url').in('id', unicos)
  for (const p of (data ?? []) as Criador[]) mapa.set(p.id, p)
  return mapa
}
