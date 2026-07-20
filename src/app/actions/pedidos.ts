'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { type ItemSelecionado } from '@/types'
import { notificar, buscarIdsPorCargo } from '@/lib/notificacoes'
import { whatsappAtivo, enviarImagemWhatsApp, enviarWhatsApp } from '@/lib/whatsapp'
import { gerarImagemLista, type GrupoImagem } from '@/lib/listaImagem'
import { rotuloCategoria, type ItemLista } from '@/lib/listaWhatsApp'
import { resumoCategorias } from '@/lib/constants'
import { ordenarModeloNatural } from '@/lib/ordenarModelos'

export async function criarPedido(
  userId: string,
  itens: ItemSelecionado[]
): Promise<string> {
  const supabase = await createClient()
  const admin = await createAdminClient()

  // Descobre a unidade do criador para vincular o pedido (e para a notificação)
  const { data: perfil } = await supabase
    .from('profiles')
    .select('unidade_id, nome, unidade:unidades!profiles_unidade_id_fkey(nome)')
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

  // Notifica gerentes e dono (app + WhatsApp) com uma mensagem rica:
  // "Lista criada por Fulano — Unidade. Contém: Acessórios + Capas. Ver: link"
  // Envolvido em try/catch para nunca quebrar a criação do pedido se a
  // notificação/WhatsApp falhar.
  try {
    const criadorNome = perfil?.nome ?? 'Funcionário'
    const unidadeNome =
      (perfil?.unidade as unknown as { nome: string } | null)?.nome ?? null
    const resumoCat = resumoCategorias(itens.map((i) => i.categoria))

    const partes = [`Lista criada por ${criadorNome}`]
    if (unidadeNome) partes.push(`— ${unidadeNome}`)
    const cabecalho = partes.join(' ')

    const destinatarios = await buscarIdsPorCargo(admin, ['gerente', 'dono'])
    const alvos = destinatarios.filter((id) => id !== userId)

    await notificar(admin, alvos, 'pedido_criado', 'Lista criada', {
      mensagem: `${cabecalho}.\nContém: ${resumoCat}.\nDê uma olhada nos pedidos.`,
      link: `/pedidos/${pedido.id}`,
    })
  } catch (e) {
    console.error('[criarPedido] falha ao notificar gestores:', e)
  }

  revalidatePath('/pedidos')
  return pedido.id
}

export async function atualizarStatusItem(
  itemId: string,
  status: 'comprado' | 'nao_tem' | 'pendente'
) {
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

  // Pedido + itens (mesma forma do detalhe), com a unidade e o criador.
  // Traz também o TIPO (subcategoria de capa / tipo de película) com a foto,
  // usados para montar a imagem da lista.
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
        modelo:modelos_celular(nome, ordem, marca:marcas_celular(nome)),
        subcapa:subcategorias_capa(nome, foto_url),
        peli_maq:tipos_pelicula_maquina(nome, foto_url),
        peli_trad:tipos_pelicula_tradicional(nome)
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

  if (!whatsappAtivo()) {
    return {
      ok: false,
      mensagem: 'O envio por WhatsApp ainda não está configurado (Z-API pendente).',
    }
  }
  const numero = perfil?.whatsapp
  if (!numero) {
    return { ok: false, mensagem: 'Seu cadastro não tem um número de WhatsApp válido.' }
  }

  // Agrupa por TIPO (ex: "Capa Vidro", "Cerâmica") e, dentro dele, por marca.
  const grupos = agruparPorTipo(itensCategoria as unknown as ItemComTipo[])
  if (grupos.length === 0) {
    return { ok: false, mensagem: 'Não há itens nesta categoria.' }
  }

  const admin = await createAdminClient()

  // Mensagem de contexto enviada UMA VEZ, ANTES das imagens. As imagens vão
  // "limpas" (sem legenda) para poderem ser encaminhadas direto ao fornecedor.
  const tipos = grupos.map((g) => g.titulo).join(', ')
  await enviarWhatsApp(
    numero,
    `*${nomeUnidade}*\nLista de ${rotuloCategoria(categoria)} — por ${criadorNome} · ${dataCurta(pedido.created_at)}\n${tipos}`
  )

  let enviados = 0
  for (const grupo of grupos) {
    let enviouImagem = false
    try {
      // 1) Gera a imagem da lista deste tipo
      const png = await gerarImagemLista(grupo)

      // 2) Sobe no Storage (bucket público) para o Z-API conseguir baixar
      const caminho = `listas/${pedidoId}-${Date.now()}-${enviados}.png`
      const { error: upErr } = await admin.storage
        .from('fotos-itens')
        .upload(caminho, png, { contentType: 'image/png', upsert: true })
      if (upErr) throw new Error(upErr.message)

      const { data: pub } = admin.storage.from('fotos-itens').getPublicUrl(caminho)

      // 3) Envia a imagem SEM legenda (limpa para encaminhar ao fornecedor)
      enviouImagem = await enviarImagemWhatsApp(numero, pub.publicUrl)
      if (enviouImagem) enviados++
    } catch (e) {
      console.error('[lista-whats] falha ao gerar/enviar imagem do grupo', grupo.titulo, e)
    }

    // Fallback: se a imagem falhou (ex: bug do @vercel/og no Windows local),
    // envia a lista em TEXTO para não deixar o gerente sem a informação.
    if (!enviouImagem) {
      const linhas = [`*${grupo.titulo}*`, '']
      for (const bloco of grupo.marcas) {
        if (grupo.marcas.length > 1) linhas.push(bloco.marca)
        linhas.push(...bloco.modelos)
        linhas.push('')
      }
      const ok = await enviarWhatsApp(numero, linhas.join('\n').trim())
      if (ok) enviados++
    }
  }

  if (enviados === 0) {
    return { ok: false, mensagem: 'Falha ao enviar pelo WhatsApp. Tente novamente.' }
  }
  return {
    ok: true,
    mensagem: `${enviados} lista${enviados > 1 ? 's' : ''} de ${rotuloCategoria(
      categoria
    )} enviada${enviados > 1 ? 's' : ''} para o seu WhatsApp.`,
  }
}

// Item com os joins de tipo usados na montagem da imagem.
interface ItemComTipo extends ItemLista {
  subcapa?: { nome: string; foto_url: string | null } | null
  peli_maq?: { nome: string; foto_url: string | null } | null
  peli_trad?: { nome: string } | null
}

function dataCurta(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// Agrupa os itens por tipo (subcategoria de capa / tipo de película) e, dentro
// de cada tipo, por marca — na ordem em que aparecem.
function agruparPorTipo(itens: ItemComTipo[]): GrupoImagem[] {
  const porTipo = new Map<string, { foto: string | null; marcas: Map<string, string[]> }>()

  for (const item of itens) {
    // Nome e foto do tipo, conforme a categoria
    const tipoNome =
      item.subcapa?.nome ??
      item.peli_maq?.nome ??
      item.peli_trad?.nome ??
      item.nome_snapshot.split('—')[0]?.trim() ??
      'Itens'
    const foto = item.subcapa?.foto_url ?? item.peli_maq?.foto_url ?? null

    if (!porTipo.has(tipoNome)) porTipo.set(tipoNome, { foto, marcas: new Map() })
    const grupo = porTipo.get(tipoNome)!
    if (!grupo.foto && foto) grupo.foto = foto

    const marca = item.modelo?.marca?.nome ?? 'Outros'
    const nomeModelo = item.modelo?.nome ?? item.nome_snapshot
    if (!grupo.marcas.has(marca)) grupo.marcas.set(marca, [])
    grupo.marcas.get(marca)!.push(nomeModelo)
  }

  // Ordem de exibição das marcas (mesma do resto do app).
  const ORDEM_MARCAS = ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Redmi', 'Realme']
  const ordemDaMarca = (m: string) => {
    const i = ORDEM_MARCAS.indexOf(m)
    return i === -1 ? ORDEM_MARCAS.length : i
  }

  return Array.from(porTipo.entries()).map(([titulo, dados]) => ({
    titulo,
    fotoUrl: dados.foto,
    marcas: Array.from(dados.marcas.entries())
      // marcas na ordem padrão
      .sort((a, b) => ordemDaMarca(a[0]) - ordemDaMarca(b[0]))
      .map(([marca, modelos]) => ({
        marca,
        // modelos em ordem natural (16 < 16e < 16 Pro < 17...), independente
        // da ordem em que foram clicados ao montar o pedido
        modelos: [...modelos].sort(ordenarModeloNatural),
      })),
  }))
}
