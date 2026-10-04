'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { type ItemSelecionado, type Cargo } from '@/types'
import { notificar, buscarIdsPorCargo } from '@/lib/notificacoes'
import { verificarConexaoWhatsApp, enviarImagemWhatsApp, enviarWhatsApp } from '@/lib/whatsapp'
import { gerarImagemLista, type GrupoImagem } from '@/lib/listaImagem'
import { rotuloCategoria, type ItemLista } from '@/lib/listaWhatsApp'
import { chaveItemSelecionado, chaveItemPedido } from '@/lib/itemKey'
import { resumoCategorias } from '@/lib/constants'
import { ordenarModeloNatural } from '@/lib/ordenarModelos'
import { dataCurtaBR } from '@/lib/utils'
import { unidadesDisponiveis } from '@/lib/unidades'

export async function criarPedido(
  userId: string,
  itens: ItemSelecionado[],
  opcoes?: {
    // Loja escolhida na tela. Quando ausente, a lista sai na unidade base do
    // criador — o dono não tem unidade base, então para ele a tela sempre pede.
    unidadeId?: string | null
    // Pedido emergente: item acabou e não dá para esperar a próxima compra.
    // Muda o aviso que o gerente recebe e o destaque da lista na tela.
    emergente?: boolean
  }
): Promise<string> {
  const unidadeId = opcoes?.unidadeId ?? null
  const emergente = opcoes?.emergente === true

  const supabase = await createClient()
  const admin = await createAdminClient()

  // Perfil do criador: unidade base (padrão da lista), cargo (define quais
  // lojas ele pode escolher) e nome (para a notificação).
  const { data: perfil } = await supabase
    .from('profiles')
    .select('cargo, unidade_id, nome, unidade:unidades!profiles_unidade_id_fkey(nome)')
    .eq('id', userId)
    .single()

  let unidadeFinalId = perfil?.unidade_id ?? null
  let unidadeFinalNome =
    (perfil?.unidade as unknown as { nome: string } | null)?.nome ?? null

  // Revalida a escolha no servidor: só vale uma loja a que o usuário tem
  // acesso de verdade (as mesmas que minhas_unidades() devolve no RLS).
  if (unidadeId) {
    const permitidas = await unidadesDisponiveis(
      supabase,
      userId,
      (perfil?.cargo as Cargo) ?? null,
      perfil?.unidade_id ?? null
    )
    const escolhida = permitidas.find((u) => u.id === unidadeId)
    if (!escolhida) throw new Error('Você não tem acesso a esta loja.')
    unidadeFinalId = escolhida.id
    unidadeFinalNome = escolhida.nome
  }

  // Cria o pedido. nome_loja é só o rótulo de reserva (usado quando a unidade
  // some), por isso só sobrescreve o default da coluna quando sabemos o nome.
  const { data: pedido, error: erroPedido } = await supabase
    .from('pedidos')
    .insert({
      criado_por: userId,
      status: 'aberta',
      unidade_id: unidadeFinalId,
      ...(unidadeFinalNome ? { nome_loja: unidadeFinalNome } : {}),
      // Só manda a coluna quando for emergente — 'normal' é o DEFAULT do
      // banco, então criar lista comum continua funcionando mesmo que a
      // migration 012 ainda não tenha sido rodada.
      ...(emergente ? { tipo: 'emergente' } : {}),
    })
    .select('id')
    .single()

  // Repassa o motivo real do banco (RLS, constraint, coluna faltando) em vez
  // de um "falha ao criar" genérico, que não dizia nada na tela.
  if (erroPedido || !pedido) {
    throw new Error(erroPedido?.message ?? 'Falha ao criar pedido')
  }

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
    subgrupo_snapshot: item.subgrupo ?? null,
    observacao: item.observacao || null,
    status: 'pendente',
  }))

  await supabase.from('pedido_itens').insert(inserts)

  // Notifica gerentes e dono (app + WhatsApp) com uma mensagem rica:
  // "Lista criada por Fulano — Unidade. Contém: Acessórios + Capas. Ver: link"
  // Quando é emergente, o aviso sai marcado para o gerente comprar na hora.
  // Envolvido em try/catch para nunca quebrar a criação do pedido se a
  // notificação/WhatsApp falhar.
  try {
    const criadorNome = perfil?.nome ?? 'Funcionário'
    const unidadeNome = unidadeFinalNome
    const resumoCat = resumoCategorias(itens.map((i) => i.categoria))

    const partes = [
      emergente
        ? `PEDIDO EMERGENTE de ${criadorNome}`
        : `Lista criada por ${criadorNome}`,
    ]
    if (unidadeNome) partes.push(`— ${unidadeNome}`)
    const cabecalho = partes.join(' ')

    const destinatarios = await buscarIdsPorCargo(admin, ['gerente', 'dono'])
    const alvos = destinatarios.filter((id) => id !== userId)

    const titulo = emergente ? '🚨 Pedido EMERGENTE' : 'Lista criada'
    const chamada = emergente
      ? 'Precisa comprar o quanto antes para não perder venda.'
      : 'Dê uma olhada nos pedidos.'

    await notificar(admin, alvos, 'pedido_criado', titulo, {
      mensagem: `${cabecalho}.\nContém: ${resumoCat}.\n${chamada}`,
      link: `/pedidos/${pedido.id}`,
    })
  } catch (e) {
    console.error('[criarPedido] falha ao notificar gestores:', e)
  }

  revalidatePath('/pedidos')
  return pedido.id
}

// Adiciona itens a um pedido JÁ EXISTENTE que ainda esteja EM ABERTO (aguardando
// o gerente comprar). Depois de comprado (status 'concluida'), o pedido vira
// imutável e vai para o histórico — por isso aqui recusamos pedidos concluídos.
// Permissão: dono (admin) ou quem criou a lista.
export async function adicionarItensAoPedido(
  pedidoId: string,
  userId: string,
  itens: ItemSelecionado[]
): Promise<{ ok: boolean; mensagem?: string }> {
  if (itens.length === 0) return { ok: false, mensagem: 'Nenhum item para adicionar.' }

  const supabase = await createClient()
  const admin = await createAdminClient()

  const [{ data: pedido }, { data: perfil }] = await Promise.all([
    supabase.from('pedidos').select('criado_por, status').eq('id', pedidoId).single(),
    supabase.from('profiles').select('cargo, nome').eq('id', userId).single(),
  ])

  if (!pedido) return { ok: false, mensagem: 'Pedido não encontrado.' }

  // Só pedidos em aberto (ainda não comprados) podem receber itens.
  if (pedido.status !== 'aberta') {
    return { ok: false, mensagem: 'Este pedido já foi comprado e não pode mais ser alterado.' }
  }

  // Permissão: dono ou quem criou a lista.
  const ehDono = perfil?.cargo === 'dono'
  const ehCriador = pedido.criado_por === userId
  if (!ehDono && !ehCriador) {
    return { ok: false, mensagem: 'Apenas o dono ou quem criou a lista pode adicionar itens.' }
  }

  // Ignora itens que JÁ estão no pedido (evita duplicata). A tela também avisa
  // antes, mas aqui é a trava definitiva.
  const { data: existentes } = await supabase
    .from('pedido_itens')
    .select(
      'categoria, acessorio_id, subcapa_id, modelo_id, tipo_peli_maq_id, tipo_peli_trad_id, material_id, nome_snapshot'
    )
    .eq('pedido_id', pedidoId)
  const chavesExistentes = new Set((existentes ?? []).map(chaveItemPedido))
  const novos = itens.filter((i) => !chavesExistentes.has(chaveItemSelecionado(i)))
  const pulados = itens.length - novos.length

  if (novos.length === 0) {
    return { ok: false, mensagem: 'Todos os itens selecionados já estavam no pedido.' }
  }

  // Insere via admin (já validamos a permissão). O created_at atual de cada item
  // é o que marca "Adicionado em DD/MM" na tela do pedido e no histórico.
  const inserts = novos.map((item) => ({
    pedido_id: pedidoId,
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
    subgrupo_snapshot: item.subgrupo ?? null,
    observacao: item.observacao || null,
    status: 'pendente' as const,
  }))

  const { error } = await admin.from('pedido_itens').insert(inserts)
  if (error) return { ok: false, mensagem: 'Falha ao adicionar os itens. Tente novamente.' }

  // Avisa gerentes/dono (quem vai comprar) que itens novos entraram no pedido.
  try {
    const quem = perfil?.nome ?? 'Alguém'
    const resumoCat = resumoCategorias(novos.map((i) => i.categoria))
    const destinatarios = (await buscarIdsPorCargo(admin, ['gerente', 'dono'])).filter(
      (id) => id !== userId
    )
    await notificar(admin, destinatarios, 'pedido_criado', 'Itens adicionados', {
      mensagem: `${quem} adicionou ${novos.length} item(ns) a um pedido em aberto.\nNovos: ${resumoCat}.`,
      link: `/pedidos/${pedidoId}`,
      semWhatsApp: true, // só sininho — não notifica no WhatsApp (evita spam)
    })
  } catch (e) {
    console.error('[adicionarItensAoPedido] falha ao notificar:', e)
  }

  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/pedidos')
  const aviso = pulados > 0 ? ` (${pulados} já estava(m) no pedido)` : ''
  return { ok: true, mensagem: `${novos.length} item(ns) adicionado(s) ao pedido${aviso}.` }
}

// Autoriza remover/editar UM item: o pedido precisa estar em aberto e quem pede
// precisa ser dono ou o criador da lista. Não é um server action (não exportado).
async function autorizarAlteracaoItem(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  itemId: string,
  userId: string
): Promise<{ ok: true; pedidoId: string } | { ok: false; mensagem: string }> {
  const { data: item } = await supabase
    .from('pedido_itens')
    .select('pedido_id')
    .eq('id', itemId)
    .single()
  if (!item) return { ok: false, mensagem: 'Item não encontrado.' }

  const [{ data: pedido }, { data: perfil }] = await Promise.all([
    supabase.from('pedidos').select('criado_por, status').eq('id', item.pedido_id).single(),
    supabase.from('profiles').select('cargo').eq('id', userId).single(),
  ])
  if (!pedido) return { ok: false, mensagem: 'Pedido não encontrado.' }
  if (pedido.status !== 'aberta') {
    return { ok: false, mensagem: 'Este pedido já foi comprado e não pode mais ser alterado.' }
  }
  const autorizado = perfil?.cargo === 'dono' || pedido.criado_por === userId
  if (!autorizado) {
    return { ok: false, mensagem: 'Apenas o dono ou quem criou a lista pode alterar itens.' }
  }
  return { ok: true, pedidoId: item.pedido_id }
}

// Remove um item de um pedido em aberto (dono ou criador).
export async function removerItemDoPedido(
  itemId: string,
  userId: string
): Promise<{ ok: boolean; mensagem?: string }> {
  const supabase = await createClient()
  const auth = await autorizarAlteracaoItem(supabase, itemId, userId)
  if (!auth.ok) return auth

  const admin = await createAdminClient()
  const { error } = await admin.from('pedido_itens').delete().eq('id', itemId)
  if (error) return { ok: false, mensagem: 'Falha ao remover o item. Tente novamente.' }

  revalidatePath(`/pedidos/${auth.pedidoId}`)
  revalidatePath('/pedidos')
  return { ok: true }
}

// Edita a observação (texto) de um item de um pedido em aberto (dono ou criador).
export async function editarObservacaoItem(
  itemId: string,
  userId: string,
  observacao: string
): Promise<{ ok: boolean; mensagem?: string }> {
  const supabase = await createClient()
  const auth = await autorizarAlteracaoItem(supabase, itemId, userId)
  if (!auth.ok) return auth

  const admin = await createAdminClient()
  const { error } = await admin
    .from('pedido_itens')
    .update({ observacao: observacao.trim() || null })
    .eq('id', itemId)
  if (error) return { ok: false, mensagem: 'Falha ao salvar a observação. Tente novamente.' }

  revalidatePath(`/pedidos/${auth.pedidoId}`)
  return { ok: true }
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
        subcapa:subcategorias_capa(nome, foto_url, foto_url_outras),
        peli_maq:tipos_pelicula_maquina(nome, foto_url),
        peli_trad:tipos_pelicula_tradicional(nome, foto_url)
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

  const numero = perfil?.whatsapp
  if (!numero) {
    return { ok: false, mensagem: 'Seu cadastro não tem um número de WhatsApp válido.' }
  }

  // Confere a conexão ANTES de gerar as imagens, para dar um aviso claro.
  const problema = await verificarConexaoWhatsApp()
  if (problema === 'nao_configurado') {
    return { ok: false, mensagem: 'O envio por WhatsApp ainda não está configurado.' }
  }
  if (problema === 'sem_assinatura') {
    return {
      ok: false,
      mensagem: 'O WhatsApp do sistema está inativo (assinatura do Z-API expirada). Reative para enviar listas.',
    }
  }
  if (problema === 'desconectado') {
    return {
      ok: false,
      mensagem: 'O WhatsApp do sistema está desconectado. Reconecte o número (QR Code) no Z-API.',
    }
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
    `*${nomeUnidade}*\nLista de ${rotuloCategoria(categoria)} — por ${criadorNome} · ${dataCurtaBR(pedido.created_at)}\n${tipos}`
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
  subcapa?: { nome: string; foto_url: string | null; foto_url_outras: string | null } | null
  peli_maq?: { nome: string; foto_url: string | null } | null
  peli_trad?: { nome: string; foto_url: string | null } | null
}

// Agrupa os itens por tipo (subcategoria de capa / tipo de película) e, dentro
// de cada tipo, por marca. Cada tipo guarda a foto do iPhone/Apple e a foto das
// demais marcas (capas), para a imagem mostrar a referência certa por marca.
function agruparPorTipo(itens: ItemComTipo[]): GrupoImagem[] {
  const porTipo = new Map<
    string,
    { fotoApple: string | null; fotoOutras: string | null; marcas: Map<string, string[]> }
  >()

  for (const item of itens) {
    const tipoNome =
      item.subcapa?.nome ??
      item.peli_maq?.nome ??
      item.peli_trad?.nome ??
      item.nome_snapshot.split('—')[0]?.trim() ??
      'Itens'
    // foto_url = referência para Apple; foto_url_outras = demais marcas.
    // Películas usam a mesma foto para todas as marcas.
    const fotoPeli = item.peli_maq?.foto_url ?? item.peli_trad?.foto_url ?? null
    const fotoApple = item.subcapa?.foto_url ?? fotoPeli ?? null
    const fotoOutras = item.subcapa?.foto_url_outras ?? fotoPeli ?? null

    if (!porTipo.has(tipoNome)) {
      porTipo.set(tipoNome, { fotoApple, fotoOutras, marcas: new Map() })
    }
    const grupo = porTipo.get(tipoNome)!
    if (!grupo.fotoApple && fotoApple) grupo.fotoApple = fotoApple
    if (!grupo.fotoOutras && fotoOutras) grupo.fotoOutras = fotoOutras

    const marca = item.modelo?.marca?.nome ?? 'Outros'
    const nomeModelo = item.modelo?.nome ?? item.nome_snapshot
    if (!grupo.marcas.has(marca)) grupo.marcas.set(marca, [])
    grupo.marcas.get(marca)!.push(nomeModelo)
  }

  const ORDEM_MARCAS = ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Redmi', 'Realme']
  const ordemDaMarca = (m: string) => {
    const i = ORDEM_MARCAS.indexOf(m)
    return i === -1 ? ORDEM_MARCAS.length : i
  }

  return Array.from(porTipo.entries()).map(([titulo, dados]) => ({
    titulo,
    fotoUrl: dados.fotoApple ?? dados.fotoOutras, // fallback geral
    marcas: Array.from(dados.marcas.entries())
      .sort((a, b) => ordemDaMarca(a[0]) - ordemDaMarca(b[0]))
      .map(([marca, modelos]) => ({
        marca,
        // Apple usa a foto do iPhone; as demais usam a foto "outras".
        fotoUrl: marca === 'Apple' ? dados.fotoApple : dados.fotoOutras ?? dados.fotoApple,
        modelos: [...modelos].sort(ordenarModeloNatural),
      })),
  }))
}
