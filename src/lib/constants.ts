export const MARCAS_CELULAR = [
  'Apple',
  'Samsung',
  'Motorola',
  'Redmi',
  'Realme',
  'Xiaomi',
] as const

export const SUBCATEGORIAS_ACESSORIO = [
  'Carregadores',
  'Cabos',
  'Fones Bluetooth',
  'Fones de Fio',
  'Caixas de Som',
  'Joystick',
  'Acessórios Variados',
] as const

export const SUBCATEGORIAS_CAPA = [
  'Capa Case',
  'Case Transparente',
  'Space',
  'Space Transparente',
  'Capa Couro',
  'Capa Brilhosa com Indução',
  'Capa Vidro',
  'Capa Indução com Película de Câmera',
] as const

export const PELICULAS_MAQUINA = [
  'Soft',
  'Fosca (Gamer)',
  'Soft Privativa',
  'Fosca Privativa',
] as const

export const PELICULAS_TRADICIONAIS = ['Vidro 3D', 'Cerâmica'] as const

export const MATERIAL_INICIAL = ['Sacola Plástica', 'Papel 1', 'Papel 2'] as const

export const CARGOS_LABEL: Record<string, string> = {
  dono: 'Dono',
  gerente: 'Gerente',
  funcionario: 'Funcionário',
}

export const STATUS_ITEM_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  comprado: 'Comprado',
  nao_tem: 'Não tem',
}

export const CATEGORIA_LABEL: Record<string, string> = {
  acessorio: 'Acessório',
  capa: 'Capa',
  pelicula_maquina: 'Película Máquina',
  pelicula_tradicional: 'Película Tradicional',
  material: 'Material de Loja',
}

export const ADMIN_EMAIL = 'admin@lojaalce.com'

// Agrupa as categorias de item nos 4 grandes grupos exibidos no resumo do pedido.
const GRUPO_DE_CATEGORIA: Record<string, 'Acessórios' | 'Capas' | 'Películas' | 'Material'> = {
  acessorio: 'Acessórios',
  capa: 'Capas',
  pelicula_maquina: 'Películas',
  pelicula_tradicional: 'Películas',
  material: 'Material',
}

// Ordem fixa de exibição dos grupos.
const ORDEM_GRUPOS: Array<'Acessórios' | 'Capas' | 'Películas' | 'Material'> = [
  'Acessórios',
  'Capas',
  'Películas',
  'Material',
]

// Monta um resumo inteligente a partir das categorias dos itens do pedido:
//   1 grupo  -> "Apenas Acessórios"
//   2 grupos -> "Acessórios + Capas"
//   3+ grupos -> "Acessórios + Capas + Películas"
export function resumoCategorias(categorias: string[]): string {
  const presentes = ORDEM_GRUPOS.filter((g) =>
    categorias.some((c) => GRUPO_DE_CATEGORIA[c] === g)
  )
  if (presentes.length === 0) return 'Sem itens'
  if (presentes.length === 1) return `Apenas ${presentes[0]}`
  return presentes.join(' + ')
}

// Tema de cores por categoria de pedido.
// Classes Tailwind completas (não interpolar — o Tailwind precisa de strings estáticas).
export type CategoriaPedido = 'acessorios' | 'capas' | 'peliculas' | 'material'

export interface TemaCategoria {
  label: string
  // aba ativa
  abaAtiva: string
  // cabeçalho de subcategoria / texto de destaque
  textoForte: string
  // item selecionado (fundo + borda)
  itemSelecionado: string
  // checkbox / ícone marcado (fundo)
  marcado: string
  // botão de ação principal
  botao: string
  // texto de link / ações secundárias
  link: string
  // ponto/contador
  badge: string
}

export const TEMA_CATEGORIA: Record<CategoriaPedido, TemaCategoria> = {
  acessorios: {
    label: 'Acessórios',
    abaAtiva: 'bg-green-600 text-white shadow-sm',
    textoForte: 'text-green-700',
    itemSelecionado: 'bg-green-50 border-green-300',
    marcado: 'bg-green-600 border-green-600',
    botao: 'bg-green-600 hover:bg-green-700',
    link: 'text-green-600 hover:text-green-700',
    badge: 'bg-green-100 text-green-700',
  },
  capas: {
    label: 'Capas',
    abaAtiva: 'bg-sky-500 text-white shadow-sm',
    textoForte: 'text-sky-700',
    itemSelecionado: 'bg-sky-50 border-sky-300',
    marcado: 'bg-sky-500 border-sky-500',
    botao: 'bg-sky-500 hover:bg-sky-600',
    link: 'text-sky-600 hover:text-sky-700',
    badge: 'bg-sky-100 text-sky-700',
  },
  peliculas: {
    label: 'Películas',
    abaAtiva: 'bg-orange-500 text-white shadow-sm',
    textoForte: 'text-orange-700',
    itemSelecionado: 'bg-orange-50 border-orange-300',
    marcado: 'bg-orange-500 border-orange-500',
    botao: 'bg-orange-500 hover:bg-orange-600',
    link: 'text-orange-600 hover:text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
  },
  material: {
    label: 'Material',
    abaAtiva: 'bg-purple-600 text-white shadow-sm',
    textoForte: 'text-purple-700',
    itemSelecionado: 'bg-purple-50 border-purple-300',
    marcado: 'bg-purple-600 border-purple-600',
    botao: 'bg-purple-600 hover:bg-purple-700',
    link: 'text-purple-600 hover:text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
  },
}
