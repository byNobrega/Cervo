'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Cria uma nova unidade (apenas dono — garantido pelo RLS).
export async function criarUnidade(nome: string, endereco: string) {
  const supabase = await createClient()
  await supabase.from('unidades').insert({ nome, endereco: endereco || null })
  revalidatePath('/unidades')
}

// Ativa/desativa uma unidade.
export async function toggleUnidadeAtiva(id: string, ativo: boolean) {
  const supabase = await createClient()
  await supabase.from('unidades').update({ ativo }).eq('id', id)
  revalidatePath('/unidades')
}

// Designa (ou remove) um gerente em uma unidade.
export async function designarGerente(gerenteId: string, unidadeId: string, designar: boolean) {
  const supabase = await createClient()
  if (designar) {
    await supabase
      .from('gerente_unidades')
      .insert({ gerente_id: gerenteId, unidade_id: unidadeId })
  } else {
    await supabase
      .from('gerente_unidades')
      .delete()
      .eq('gerente_id', gerenteId)
      .eq('unidade_id', unidadeId)
  }
  revalidatePath(`/unidades/${unidadeId}`)
  revalidatePath('/unidades')
}
