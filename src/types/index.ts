export type Cargo = 'dono' | 'gerente' | 'funcionario'
export type StatusUsuario = 'pendente' | 'aprovado' | 'rejeitado'
export type StatusPedido = 'aberta' | 'concluida'
export type StatusItem = 'pendente' | 'comprado' | 'nao_tem'
export type StatusSugestao = 'pendente' | 'aprovado' | 'rejeitado'
export type CategoriaItem =
  | 'acessorio'
  | 'capa'
  | 'pelicula_maquina'
  | 'pelicula_tradicional'
  | 'material'
export type TipoSugestao = 'acessorio' | 'capa_subcategoria' | 'material' | 'modelo'
export type TipoNotificacao =
  | 'pedido_criado'
  | 'item_sugerido'
  | 'pedido_concluido'
  | 'cadastro_pendente'
  | 'sugestao_aprovada'
  | 'sugestao_rejeitada'
  | 'cadastro_aprovado'
  | 'cadastro_rejeitado'
  | 'alerta'
  | 'solicitacao_perfil'
  | 'solicitacao_aprovada'
  | 'solicitacao_rejeitada'

export interface Unidade {
  id: string
  nome: string
  endereco: string | null
  ativo: boolean
  created_at: string
}

export interface Profile {
  id: string
  nome: string
  cargo: Cargo
  whatsapp: string | null
  email: string
  status: StatusUsuario
  unidade_id: string | null
  avatar_url: string | null
  whatsapp_anterior: string | null
  whatsapp_alterado_em: string | null
  created_at: string
  updated_at: string
  unidade?: Unidade | null
}

export interface MarcaCelular {
  id: string
  nome: string
}

export interface ModeloCelular {
  id: string
  marca_id: string
  nome: string
  tem_tela_curva: boolean
  ativo: boolean
  ordem: number
  created_at: string
  marca?: MarcaCelular
}

export interface SubcategoriaAcessorio {
  id: string
  nome: string
}

export interface Acessorio {
  id: string
  nome: string
  marca: string | null
  subcategoria_id: string | null
  foto_url: string
  ativo: boolean
  created_at: string
  subcategoria?: SubcategoriaAcessorio
}

export interface SubcategoriaCapa {
  id: string
  nome: string
  foto_url: string | null
  ativo: boolean
  created_at: string
}

export interface TipoPeliculaMaquina {
  id: string
  nome: string
  tipo: 'maquina'
  foto_url: string | null
}

export interface TipoPeliculaTradicional {
  id: string
  nome: string
}

export interface MaterialLoja {
  id: string
  nome: string
  foto_url: string | null
  ativo: boolean
  created_at: string
}

export interface Sugestao {
  id: string
  tipo: TipoSugestao
  sugerido_por: string
  nome: string
  marca: string | null
  subcategoria_id: string | null
  marca_id: string | null
  tem_tela_curva: boolean
  foto_url: string | null
  status: StatusSugestao
  revisado_por: string | null
  revisado_em: string | null
  item_criado_id: string | null
  created_at: string
  sugeridor?: Profile
  subcategoria?: SubcategoriaAcessorio
}

export interface Pedido {
  id: string
  criado_por: string
  concluido_por: string | null
  status: StatusPedido
  nome_loja: string
  observacao_geral: string | null
  unidade_id: string | null
  created_at: string
  concluido_em: string | null
  criador?: Profile
  finalizador?: Profile
  itens?: PedidoItem[]
  unidade?: Unidade | null
}

export interface PedidoItem {
  id: string
  pedido_id: string
  categoria: CategoriaItem
  acessorio_id: string | null
  sugestao_id: string | null
  subcapa_id: string | null
  modelo_id: string | null
  tipo_peli_maq_id: string | null
  tipo_peli_trad_id: string | null
  material_id: string | null
  nome_snapshot: string
  foto_url_snapshot: string | null
  observacao: string | null
  status: StatusItem
  created_at: string
}

export interface Notificacao {
  id: string
  para_id: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string | null
  lida: boolean
  link: string | null
  payload: Record<string, unknown> | null
  created_at: string
}

export interface Alerta {
  id: string
  tipo: 'frequencia_alta' | 'nao_tem_recorrente'
  item_nome: string
  categoria: string | null
  item_id: string | null
  contagem: number
  periodo_inicio: string | null
  periodo_fim: string | null
  resolvido: boolean
  created_at: string
}

// Tipo auxiliar para item em criação de pedido (estado local)
export interface ItemSelecionado {
  tempId: string // ID temporário para o store local
  categoria: CategoriaItem
  nome: string
  fotoUrl: string | null
  observacao: string
  // referências
  acessorioId?: string
  sugestaoId?: string
  subcapaId?: string
  modeloId?: string
  tipoPeliMaqId?: string
  tipoPeliTradId?: string
  materialId?: string
  // flag visual
  isPendenteSugestao?: boolean
}
