'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { type ModeloCelularFormData } from '@/lib/validations'

// Garante que quem chama é gerente ou dono. Lança se não for.
async function exigirGestor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: perfil } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', user.id)
    .single()
  if (!['gerente', 'dono'].includes(perfil?.cargo ?? '')) {
    throw new Error('Sem permissão')
  }
}

// Gerente/dono adicionam modelo direto (sem aprovação). Usa admin pois o RLS
// de insert em modelos_celular é só dono.
export async function adicionarModelo(data: ModeloCelularFormData) {
  await exigirGestor()
  const admin = await createAdminClient()
  // Coloca no fim da ordenação (maior ordem + 1)
  const { data: ultimo } = await admin
    .from('modelos_celular')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .single()
  await admin.from('modelos_celular').insert({
    marca_id: data.marca_id,
    nome: data.nome,
    tem_tela_curva: data.tem_tela_curva,
    ativo: true,
    ordem: (ultimo?.ordem ?? 0) + 1,
  })
  revalidatePath('/modelos')
}

export async function toggleModeloAtivo(id: string, ativo: boolean) {
  await exigirGestor()
  const admin = await createAdminClient()
  await admin.from('modelos_celular').update({ ativo }).eq('id', id)
  revalidatePath('/modelos')
}

export async function toggleTelaCurva(id: string, temTelaCurva: boolean) {
  await exigirGestor()
  const admin = await createAdminClient()
  await admin
    .from('modelos_celular')
    .update({ tem_tela_curva: temTelaCurva })
    .eq('id', id)
  revalidatePath('/modelos')
}
