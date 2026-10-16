'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { type TipoSugestao } from '@/types'
import { notificar, buscarIdsPorCargo } from '@/lib/notificacoes'

interface SugestaoInlineData {
  tipo: TipoSugestao
  nome: string
  marca?: string
  fotoUrl?: string
  subcategoriaId?: string
  marcaId?: string
  temTelaCurva?: boolean
}

export async function criarSugestaoInline(data: SugestaoInlineData): Promise<string> {
  const supabase = await createClient()
  const admin = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: sugestao } = await supabase
    .from('sugestoes')
    .insert({
      tipo: data.tipo,
      sugerido_por: user.id,
      nome: data.nome,
      marca: data.marca ?? null,
      foto_url: data.fotoUrl ?? null,
      subcategoria_id: data.subcategoriaId ?? null,
      marca_id: data.marcaId ?? null,
      tem_tela_curva: data.temTelaCurva ?? false,
    })
    .select('id')
    .single()

  if (!sugestao) throw new Error('Falha ao criar sugestão')

  // Notifica gerentes e dono
  const destinatarios = await buscarIdsPorCargo(admin, ['gerente', 'dono'])
  await notificar(admin, destinatarios, 'item_sugerido', 'Nova sugestão de item', {
    mensagem: `"${data.nome}" foi sugerido para o catálogo.`,
    link: '/sugestoes',
  })

  // Atualiza a lista "Minhas Sugestões" do funcionário
  revalidatePath('/sugestoes')

  return sugestao.id
}

// Retorna { erro } quando não foi possível criar o item no catálogo.
// Nesse caso a sugestão continua PENDENTE (não marca como aprovada à toa).
export async function aprovarSugestao(sugestaoId: string): Promise<{ erro?: string }> {
  const supabase = await createClient()
  const admin = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  // Só gerente/dono aprova. Depois disso as inserções usam o admin, porque o
  // RLS de alguns catálogos (ex: modelos_celular) só libera INSERT para o dono.
  const { data: perfil } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', user.id)
    .single()
  if (!['gerente', 'dono'].includes(perfil?.cargo ?? '')) {
    return { erro: 'Sem permissão para aprovar sugestões' }
  }

  const { data: sugestao } = await admin
    .from('sugestoes')
    .select('*')
    .eq('id', sugestaoId)
    .single()

  if (!sugestao) return { erro: 'Sugestão não encontrada' }
  if (sugestao.status !== 'pendente') return {}

  let itemCriadoId: string | null = null

  if (sugestao.tipo === 'acessorio') {
    const { data: novo, error } = await admin
      .from('acessorios')
      .insert({
        nome: sugestao.nome,
        marca: sugestao.marca,
        subcategoria_id: sugestao.subcategoria_id,
        foto_url: sugestao.foto_url ?? '',
      })
      .select('id')
      .single()

    if (error || !novo) return { erro: `Falha ao criar o acessório: ${error?.message ?? ''}` }
    itemCriadoId = novo.id

    // Atualiza itens de pedido que referenciam esta sugestão
    await admin
      .from('pedido_itens')
      .update({ acessorio_id: itemCriadoId, sugestao_id: null })
      .eq('sugestao_id', sugestaoId)
  } else if (sugestao.tipo === 'material') {
    // nome é UNIQUE: se já existe um material com esse nome, reaproveita.
    const { data: existente } = await admin
      .from('material_loja')
      .select('id')
      .ilike('nome', sugestao.nome)
      .maybeSingle()

    if (existente) {
      await admin.from('material_loja').update({ ativo: true }).eq('id', existente.id)
      itemCriadoId = existente.id
    } else {
      const { data: novo, error } = await admin
        .from('material_loja')
        .insert({ nome: sugestao.nome, foto_url: sugestao.foto_url })
        .select('id')
        .single()

      if (error || !novo) return { erro: `Falha ao criar o material: ${error?.message ?? ''}` }
      itemCriadoId = novo.id
    }
  } else if (sugestao.tipo === 'capa_subcategoria') {
    // nome é UNIQUE: se já existe uma subcategoria com esse nome, reativa ela.
    const { data: existente } = await admin
      .from('subcategorias_capa')
      .select('id')
      .ilike('nome', sugestao.nome)
      .maybeSingle()

    if (existente) {
      await admin.from('subcategorias_capa').update({ ativo: true }).eq('id', existente.id)
      itemCriadoId = existente.id
    } else {
      const { data: novo, error } = await admin
        .from('subcategorias_capa')
        .insert({ nome: sugestao.nome, foto_url: sugestao.foto_url })
        .select('id')
        .single()

      if (error || !novo) return { erro: `Falha ao criar a capa: ${error?.message ?? ''}` }
      itemCriadoId = novo.id

      // Sem marca vinculada a capa aparece como "Nenhuma marca associada" e não
      // dá para pedir. A sugestão não informa a marca, então vincula todas;
      // o gerente ajusta depois em Catálogo > Capas.
      const { data: marcas } = await admin.from('marcas_celular').select('id')
      if (marcas && marcas.length > 0) {
        await admin
          .from('subcategoria_capa_marcas')
          .insert(marcas.map((m) => ({ subcategoria_id: novo.id, marca_id: m.id })))
      }
    }
  } else if (sugestao.tipo === 'modelo') {
    // Cria o modelo de celular; ele passa a aparecer em todas as películas.
    // Coloca no fim da ordenação da marca (maior ordem + 1).
    const { data: ultimo } = await admin
      .from('modelos_celular')
      .select('ordem')
      .order('ordem', { ascending: false })
      .limit(1)
      .single()
    const proximaOrdem = (ultimo?.ordem ?? 0) + 1

    const { data: novo, error } = await admin
      .from('modelos_celular')
      .insert({
        nome: sugestao.nome,
        marca_id: sugestao.marca_id,
        tem_tela_curva: sugestao.tem_tela_curva ?? false,
        ativo: true,
        ordem: proximaOrdem,
      })
      .select('id')
      .single()

    if (error || !novo) return { erro: `Falha ao criar o aparelho: ${error?.message ?? ''}` }
    itemCriadoId = novo.id
  }

  await admin
    .from('sugestoes')
    .update({
      status: 'aprovado',
      revisado_por: user.id,
      revisado_em: new Date().toISOString(),
      item_criado_id: itemCriadoId,
    })
    .eq('id', sugestaoId)

  // Notifica o sugeridor
  await notificar(admin, [sugestao.sugerido_por], 'sugestao_aprovada', 'Sugestão aprovada!', {
    mensagem: `"${sugestao.nome}" foi aprovado e adicionado ao catálogo.`,
    link: '/catalogo',
  })

  revalidatePath('/sugestoes')
  revalidatePath('/catalogo', 'layout')
  revalidatePath('/pedidos', 'layout')
  return {}
}

export async function rejeitarSugestao(
  sugestaoId: string,
  motivo: string
): Promise<{ erro?: string }> {
  const supabase = await createClient()
  const admin = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', user.id)
    .single()
  if (!['gerente', 'dono'].includes(perfil?.cargo ?? '')) {
    return { erro: 'Sem permissão para recusar sugestões' }
  }

  const motivoLimpo = motivo.trim()
  if (!motivoLimpo) return { erro: 'Escreva o motivo da recusa' }

  const { data: sugestao } = await admin
    .from('sugestoes')
    .select('sugerido_por, nome, status')
    .eq('id', sugestaoId)
    .single()

  if (!sugestao) return { erro: 'Sugestão não encontrada' }
  if (sugestao.status !== 'pendente') return {}

  const revisao = {
    status: 'rejeitado',
    revisado_por: user.id,
    revisado_em: new Date().toISOString(),
  }
  const { error } = await admin
    .from('sugestoes')
    .update({ ...revisao, motivo_recusa: motivoLimpo })
    .eq('id', sugestaoId)

  // Se a migration 013 (coluna motivo_recusa) ainda não rodou, recusa mesmo
  // assim; o motivo segue na notificação.
  if (error) {
    const { error: erro2 } = await admin.from('sugestoes').update(revisao).eq('id', sugestaoId)
    if (erro2) return { erro: `Falha ao recusar: ${erro2.message}` }
  }

  await notificar(admin, [sugestao.sugerido_por], 'sugestao_rejeitada', 'Sugestão recusada', {
    mensagem: `"${sugestao.nome}" não foi aprovado. Motivo: ${motivoLimpo}`,
    link: '/sugestoes',
  })

  revalidatePath('/sugestoes')
  return {}
}
