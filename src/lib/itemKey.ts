// Identidade de um item de pedido, para detectar duplicatas ao adicionar itens
// a um pedido existente. Funciona tanto para o item do carrinho (ItemSelecionado,
// camelCase) quanto para o item já gravado (pedido_itens, snake_case), gerando a
// MESMA chave para a mesma seleção.

import { type ItemSelecionado } from '@/types'

// Itens de catálogo são identificados pelos seus ids (ex: capa = subcapa + modelo).
// Itens sem nenhum id (ex: sugestão pendente digitada à mão) usam o nome.
function montarChave(
  categoria: string,
  ids: (string | null | undefined)[],
  nome: string
): string {
  const temId = ids.some(Boolean)
  if (temId) return `${categoria}|${ids.map((v) => v ?? '').join('|')}`
  return `${categoria}|nome:${nome.trim().toLowerCase()}`
}

export function chaveItemSelecionado(i: ItemSelecionado): string {
  return montarChave(
    i.categoria,
    [i.acessorioId, i.subcapaId, i.modeloId, i.tipoPeliMaqId, i.tipoPeliTradId, i.materialId],
    i.nome
  )
}

export interface ItemPedidoChave {
  categoria: string
  acessorio_id?: string | null
  subcapa_id?: string | null
  modelo_id?: string | null
  tipo_peli_maq_id?: string | null
  tipo_peli_trad_id?: string | null
  material_id?: string | null
  nome_snapshot: string
}

export function chaveItemPedido(i: ItemPedidoChave): string {
  return montarChave(
    i.categoria,
    [i.acessorio_id, i.subcapa_id, i.modelo_id, i.tipo_peli_maq_id, i.tipo_peli_trad_id, i.material_id],
    i.nome_snapshot
  )
}
