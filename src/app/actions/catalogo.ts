'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { type AcessorioFormData, type MaterialFormData } from '@/lib/validations'

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

export async function adicionarAcessorio(data: AcessorioFormData) {
  const supabase = await createClient()
  await supabase.from('acessorios').insert({
    nome: data.nome,
    marca: data.marca ?? null,
    subcategoria_id: data.subcategoria_id ?? null,
    foto_url: data.foto_url,
  })
  revalidatePath('/catalogo/acessorios')
}

// Edita um acessório existente (gerente/dono).
export async function editarAcessorio(id: string, data: AcessorioFormData) {
  await exigirGestor()
  const admin = await createAdminClient()
  await admin
    .from('acessorios')
    .update({
      nome: data.nome,
      marca: data.marca ?? null,
      subcategoria_id: data.subcategoria_id ?? null,
      foto_url: data.foto_url,
    })
    .eq('id', id)
  revalidatePath('/catalogo/acessorios')
}

// Exclui um acessório do catálogo (gerente/dono). Usa admin para permitir
// que o gerente também exclua (o RLS de DELETE é só dono).
export async function excluirAcessorio(id: string) {
  await exigirGestor()
  const admin = await createAdminClient()
  const { error } = await admin.from('acessorios').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/catalogo/acessorios')
}

export async function adicionarMaterial(data: MaterialFormData) {
  const supabase = await createClient()
  await supabase.from('material_loja').insert({
    nome: data.nome,
    foto_url: data.foto_url ?? null,
  })
  revalidatePath('/catalogo/material')
}

// ==================== MATERIAL ====================
export async function editarMaterial(id: string, data: MaterialFormData) {
  await exigirGestor()
  const admin = await createAdminClient()
  await admin
    .from('material_loja')
    .update({ nome: data.nome, foto_url: data.foto_url ?? null })
    .eq('id', id)
  revalidatePath('/catalogo/material')
}

export async function excluirMaterial(id: string) {
  await exigirGestor()
  const admin = await createAdminClient()
  const { error } = await admin.from('material_loja').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/catalogo/material')
}

// ==================== SUBCATEGORIA DE CAPA ====================
export async function editarSubcategoriaCapa(
  id: string,
  nome: string,
  fotoUrl: string | null,
  // null = não mexer nas marcas; array = substituir os vínculos por estes
  marcaIds: string[] | null,
  fotoUrlOutras?: string | null
) {
  await exigirGestor()
  const admin = await createAdminClient()
  const update: Record<string, unknown> = { nome, foto_url: fotoUrl }
  if (fotoUrlOutras !== undefined) update.foto_url_outras = fotoUrlOutras
  await admin.from('subcategorias_capa').update(update).eq('id', id)
  if (marcaIds !== null) {
    await admin.from('subcategoria_capa_marcas').delete().eq('subcategoria_id', id)
    if (marcaIds.length > 0) {
      await admin
        .from('subcategoria_capa_marcas')
        .insert(marcaIds.map((marca_id) => ({ subcategoria_id: id, marca_id })))
    }
  }
  revalidatePath('/catalogo/capas')
}

export async function excluirSubcategoriaCapa(id: string) {
  await exigirGestor()
  const admin = await createAdminClient()
  // Remove os vínculos N:N primeiro (caso não haja cascade)
  await admin.from('subcategoria_capa_marcas').delete().eq('subcategoria_id', id)
  const { error } = await admin.from('subcategorias_capa').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/catalogo/capas')
}

// ==================== TIPOS DE PELÍCULA ====================
export async function editarTipoPelicula(
  tabela: 'maquina' | 'tradicional',
  id: string,
  nome: string,
  fotoUrl?: string | null
) {
  await exigirGestor()
  const admin = await createAdminClient()
  const t = tabela === 'maquina' ? 'tipos_pelicula_maquina' : 'tipos_pelicula_tradicional'
  const update: Record<string, unknown> = { nome }
  if (fotoUrl !== undefined) update.foto_url = fotoUrl
  await admin.from(t).update(update).eq('id', id)
  revalidatePath('/catalogo/peliculas')
}

export async function excluirTipoPelicula(tabela: 'maquina' | 'tradicional', id: string) {
  await exigirGestor()
  const admin = await createAdminClient()
  const t = tabela === 'maquina' ? 'tipos_pelicula_maquina' : 'tipos_pelicula_tradicional'
  const { error } = await admin.from(t).delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/catalogo/peliculas')
}

export async function adicionarSubcategoriaCapa(
  nome: string,
  fotoUrl: string | null,
  marcaIds: string[]
) {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('subcategorias_capa')
    .insert({ nome, foto_url: fotoUrl })
    .select('id')
    .single()

  if (sub && marcaIds.length > 0) {
    await supabase.from('subcategoria_capa_marcas').insert(
      marcaIds.map((marca_id) => ({ subcategoria_id: sub.id, marca_id }))
    )
  }

  revalidatePath('/catalogo/capas')
}
