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

export async function aprovarSugestao(sugestaoId: string) {
  const supabase = await createClient()
  const admin = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: sugestao } = await supabase
    .from('sugestoes')
    .select('*')
    .eq('id', sugestaoId)
    .single()

  if (!sugestao) return

  let itemCriadoId: string | null = null

  if (sugestao.tipo === 'acessorio') {
    const { data: novo } = await supabase
      .from('acessorios')
      .insert({
        nome: sugestao.nome,
        marca: sugestao.marca,
        subcategoria_id: sugestao.subcategoria_id,
        foto_url: sugestao.foto_url ?? '',
      })
      .select('id')
      .single()

    itemCriadoId = novo?.id ?? null

    // Atualiza itens de pedido que referenciam esta sugestão
    if (itemCriadoId) {
      await supabase
        .from('pedido_itens')
        .update({ acessorio_id: itemCriadoId, sugestao_id: null })
        .eq('sugestao_id', sugestaoId)
    }
  } else if (sugestao.tipo === 'material') {
    const { data: novo } = await supabase
      .from('material_loja')
      .insert({ nome: sugestao.nome, foto_url: sugestao.foto_url })
      .select('id')
      .single()

    itemCriadoId = novo?.id ?? null
  } else if (sugestao.tipo === 'modelo') {
    // Cria o modelo de celular; ele passa a aparecer em todas as películas.
    // Coloca no fim da ordenação da marca (maior ordem + 1).
    const { data: ultimo } = await supabase
      .from('modelos_celular')
      .select('ordem')
      .order('ordem', { ascending: false })
      .limit(1)
      .single()
    const proximaOrdem = (ultimo?.ordem ?? 0) + 1

    const { data: novo } = await supabase
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

    itemCriadoId = novo?.id ?? null
  }

  await supabase
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
}

export async function rejeitarSugestao(sugestaoId: string) {
  const supabase = await createClient()
  const admin = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: sugestao } = await supabase
    .from('sugestoes')
    .select('sugerido_por, nome')
    .eq('id', sugestaoId)
    .single()

  await supabase
    .from('sugestoes')
    .update({
      status: 'rejeitado',
      revisado_por: user.id,
      revisado_em: new Date().toISOString(),
    })
    .eq('id', sugestaoId)

  if (sugestao) {
    await notificar(admin, [sugestao.sugerido_por], 'sugestao_rejeitada', 'Sugestão recusada', {
      mensagem: `"${sugestao.nome}" não foi aprovado pelo gerente.`,
    })
  }

  revalidatePath('/sugestoes')
}
