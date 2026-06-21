'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { type ItemSelecionado } from '@/types'
import { notificar, buscarIdsPorCargo } from '@/lib/notificacoes'
import { enviarTextoWhatsApp } from '@/lib/zapi'
import { gerarTextoLista, rotuloCategoria, type ItemLista } from '@/lib/listaWhatsApp'

export async function criarPedido(
  userId: string,
  itens: ItemSelecionado[]
): Promise<string> {
  const supabase = await createClient()
  const admin = await createAdminClient()

  // Descobre a unidade do criador para vincular o pedido
  const { data: perfil } = await supabase
    .from('profiles')
    .select('unidade_id')
    .eq('id', userId)
    .single()

  // Cria o pedido
  const { data: pedido } = await supabase
    .from('pedidos')
    .insert({ criado_por: userId, status: 'aberta', unidade_id: perfil?.unidade_id ?? null })
    .select('id')
    .single()

  if (!pedido) throw new Error('Falha ao criar pedido')

  // Insere os itens
  const inserts = itens.map((item) => ({
    pedido_id: pedido.id,
    categoria: item.categoria,
    acessorio_id: item.acessorioId ?? null,
    sugestao_id: item.sugestaoId ?? null,
    subcapa_id: item.subcapaId ?? null,
    modelo_id: item.modeloId ?? null,
    tipo_peli_maq_id: item.tipoPeliMaqId ?? null,
    tipo_peli_trad_id: item.tipoPeliTradId ?? null,
    material_id: item.materialId ?? null,
    nome_snapshot: item.nome,
    foto_url_snapshot: item.fotoUrl,
    observacao: item.observacao || null,
    status: 'pendente',
  }))

  await supabase.from('pedido_itens').insert(inserts)

  // Notifica gerentes e dono
  const destinatarios = await buscarIdsPorCargo(admin, ['gerente', 'dono'])
  await notificar(
    admin,
    destinatarios.filter((id) => id !== userId),
    'pedido_criado',
    'Novo pedido criado',
    {
      mensagem: `Um novo pedido com ${itens.length} item${itens.length !== 1 ? 's' : ''} foi criado.`,
      link: `/pedidos/${pedido.id}`,
    }
  )

  revalidatePath('/pedidos')
  return pedido.id
}

export async function atualizarStatusItem(itemId: string, status: 'comprado' | 'nao_tem') {
  const supabase = await createClient()
  await supabase.from('pedido_itens').update({ status }).eq('id', itemId)
  revalidatePath('/pedidos/[id]', 'page')
}

export async function excluirPedido(pedidoId: string, userId: string) {
  const supabase = await createClient()

  // Busca o pedido e o cargo de quem está pedindo a exclusão
  const [{ data: pedido }, { data: perfil }] = await Promise.all([
    supabase.from('pedidos').select('criado_por, created_at, status').eq('id', pedidoId).single(),
    supabase.from('profiles').select('cargo').eq('id', userId).single(),
  ])

  if (!pedido) throw new Error('Pedido não encontrado')

  const cargo = perfil?.cargo ?? 'funcionario'
  const ehGestor = cargo === 'dono' || cargo === 'gerente'
  const ehCriador = pedido.criado_por === userId

  // Regras de permissão:
  // - dono/gerente: podem excluir qualquer pedido em aberto
  // - funcionário: só o próprio pedido e dentro de 15 minutos da criação
  let autorizado = false
  if (ehGestor) {
    autorizado = true
  } else if (ehCriador) {
    const minutos = (Date.now() - new Date(pedido.created_at).getTime()) / 60000
    autorizado = minutos <= 15
  }

  if (!autorizado) {
    throw new Error('Você não tem permissão para excluir este pedido.')
  }

  // Deleta via client normal (a policy pedidos_delete no RLS autoriza).
  // Os itens são removidos automaticamente (FK ON DELETE CASCADE).
  const { error } = await supabase.from('pedidos').delete().eq('id', pedidoId)
  if (error) throw new Error(error.message)

  revalidatePath('/pedidos')
}

export async function finalizarPedido(pedidoId: string, userId: string) {
  const supabase = await createClient()
  const admin = await createAdminClient()

  // Itens pendentes viram 'nao_tem'
  await supabase
    .from('pedido_itens')
    .update({ status: 'nao_tem' })
    .eq('pedido_id', pedidoId)
    .eq('status', 'pendente')

  // Finaliza pedido
  await supabase
    .from('pedidos')
    .update({
      status: 'concluida',
      concluido_por: userId,
      concluido_em: new Date().toISOString(),
    })
    .eq('id', pedidoId)

  // Notifica funcionários e dono
  const destinatarios = await buscarIdsPorCargo(admin, ['funcionario', 'dono'])
  await notificar(admin, destinatarios, 'pedido_concluido', 'Pedido concluído', {
    mensagem: 'O pedido foi finalizado pelo gerente.',
    link: `/historico/${pedidoId}`,
  })

  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${pedidoId}`)
}

// Resultado do envio da lista por WhatsApp (para a UI dar feedback).
export type ResultadoListaWhats =
  | { ok: true; mensagem: string }
  | { ok: false; mensagem: string }

// Envia a lista de UMA categoria do pedido para o WhatsApp do próprio usuário
// que clicou (o gerente recebe a lista pronta e encaminha ao fornecedor).
// Permissão: apenas gerente/dono.
export async function enviarListaWhatsApp(
  pedidoId: string,
  categoria: string,
  userId: string
): Promise<ResultadoListaWhats> {
  const supabase = await createClient()

  // Cargo e WhatsApp de quem clicou
  const { data: perfil } = await supabase
    .from('profiles')
    .select('cargo, whatsapp')
    .eq('id', userId)
    .single()

  const cargo = perfil?.cargo ?? 'funcionario'
  if (cargo !== 'gerente' && cargo !== 'dono') {
    return { ok: false, mensagem: 'Apenas gerente ou dono podem enviar a lista.' }
  }

  // Pedido + itens (mesma forma do detalhe), com a unidade e o criador
  const { data: pedido } = await supabase
    .from('pedidos')
    .select(`
      nome_loja,
      created_at,
      criador:profiles!pedidos_criado_por_fkey(nome),
      unidade:unidades(nome),
      itens:pedido_itens(
        categoria,
        nome_snapshot,
        acessorio:acessorios(subcategoria:subcategorias_acessorio(nome)),
        modelo:modelos_celular(nome, ordem, marca:marcas_celular(nome))
      )
    `)
    .eq('id', pedidoId)
    .single()

  if (!pedido) {
    return { ok: false, mensagem: 'Pedido não encontrado.' }
  }

  const itens = (pedido.itens ?? []) as unknown as ItemLista[]
  const itensCategoria = itens.filter((i) => i.categoria === categoria)
  if (itensCategoria.length === 0) {
    return { ok: false, mensagem: 'Não há itens nesta categoria.' }
  }

  const nomeUnidade =
    (pedido.unidade as unknown as { nome: string } | null)?.nome ?? pedido.nome_loja ?? 'Loja'
  const criadorNome = (pedido.criador as unknown as { nome: string } | null)?.nome ?? 'Equipe'

  const texto = gerarTextoLista({
    nomeUnidade,
    criadorNome,
    dataISO: pedido.created_at,
    categoria,
    itens,
  })

  const envio = await enviarTextoWhatsApp(perfil?.whatsapp, texto)

  if (envio.ok) {
    return {
      ok: true,
      mensagem: `Lista de ${rotuloCategoria(categoria)} enviada para o seu WhatsApp.`,
    }
  }

  // Mensagens amigáveis por tipo de falha
  if (envio.motivo === 'nao_configurado') {
    return {
      ok: false,
      mensagem: 'O envio por WhatsApp ainda não está configurado (Z-API pendente).',
    }
  }
  if (envio.motivo === 'sem_numero') {
    return {
      ok: false,
      mensagem: 'Seu cadastro não tem um número de WhatsApp válido.',
    }
  }
  return { ok: false, mensagem: 'Falha ao enviar pelo WhatsApp. Tente novamente.' }
}
