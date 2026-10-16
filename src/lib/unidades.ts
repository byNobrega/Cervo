import { type SupabaseClient } from '@supabase/supabase-js'
import { type Cargo } from '@/types'

export interface OpcaoUnidade {
  id: string
  nome: string
}

// Lojas em que o usuário pode ABRIR uma lista.
// Espelha em TypeScript o que a função minhas_unidades() faz no banco
// (004_unidades.sql), para a tela mostrar as mesmas opções que o RLS aceita:
//   - dono                → todas as unidades ativas
//   - gerente/funcionário → a sua unidade base + as lojas extras ligadas a
//     ele em gerente_unidades (apesar do nome, a tabela vale para qualquer
//     cargo: é como o dono põe alguém para trabalhar em mais de uma loja)
export async function unidadesDisponiveis(
  supabase: SupabaseClient,
  userId: string,
  cargo: Cargo | null,
  unidadeBaseId: string | null
): Promise<OpcaoUnidade[]> {
  const { data } = await supabase
    .from('unidades')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')

  const ativas = (data ?? []) as OpcaoUnidade[]
  if (cargo === 'dono') return ativas

  const permitidas = new Set<string>()
  if (unidadeBaseId) permitidas.add(unidadeBaseId)

  const { data: extras } = await supabase
    .from('gerente_unidades')
    .select('unidade_id')
    .eq('gerente_id', userId)
  for (const g of extras ?? []) permitidas.add(g.unidade_id as string)

  return ativas.filter((u) => permitidas.has(u.id))
}
