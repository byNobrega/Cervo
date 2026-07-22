// Monta o texto da lista de uma categoria para enviar por WhatsApp,
// no padrão das listas antigas do zap (cabeçalho + tipos + modelos).
//
// Exemplo de saída:
//   BJ CASES - TOP SHOPPING por Duda 16/06/2026
//
//   Película 3D
//   iPhone 11
//   iPhone 12 Pro
//
//   Cerâmica Lisa
//   iPhone 13
//
// O agrupamento (subgrupo) e a ordem das marcas seguem a mesma lógica da
// tela do pedido (PedidoView).

import { CATEGORIA_LABEL } from '@/lib/constants'

// Forma mínima de item necessária para montar a lista (subset do item do pedido).
export interface ItemLista {
  categoria: string
  nome_snapshot: string
  modelo?: { nome: string; ordem: number; marca?: { nome: string } | null } | null
  acessorio?: { subcategoria?: { nome: string } | null } | null
}

const SEM_SUBCATEGORIA = 'Acessórios Variados'
const ORDEM_MARCAS = ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Redmi', 'Realme']
const MARCAS_SEM_PREFIXO = new Set(['Apple', 'Samsung', 'Motorola'])

function ordemDaMarca(marca: string | null | undefined): number {
  const i = ORDEM_MARCAS.indexOf(marca ?? '')
  return i === -1 ? ORDEM_MARCAS.length : i
}

// Subgrupo (tipo) de um item, igual ao da tela do pedido.
function subgrupoDoItem(item: ItemLista): string {
  if (item.categoria === 'acessorio') {
    return item.acessorio?.subcategoria?.nome ?? SEM_SUBCATEGORIA
  }
  if (item.categoria === 'capa' || item.categoria === 'pelicula_tradicional') {
    return item.nome_snapshot.split('—')[0]?.trim() || SEM_SUBCATEGORIA
  }
  if (item.categoria === 'pelicula_maquina') return 'Película Máquina'
  return SEM_SUBCATEGORIA
}

// Nome do item a exibir no texto.
// - itens com modelo (capas/películas tradicionais): nome do modelo conforme a marca
// - demais: o nome_snapshot sem o prefixo "Tipo — "
function nomeItem(item: ItemLista, subgrupo: string): string {
  if (item.modelo) {
    const marca = item.modelo.marca?.nome ?? ''
    const modelo = item.modelo.nome
    if (marca === 'Apple' || MARCAS_SEM_PREFIXO.has(marca)) return modelo
    return `${marca} ${modelo}`.trim()
  }
  const prefixo = `${subgrupo} —`
  return item.nome_snapshot.startsWith(prefixo)
    ? item.nome_snapshot.slice(prefixo.length).trim()
    : item.nome_snapshot
}

interface DadosLista {
  nomeUnidade: string
  criadorNome: string
  dataISO: string // created_at do pedido
  categoria: string
  itens: ItemLista[]
}

// Formata a data como dd/MM/yyyy (curto, padrão das listas do zap).
function dataCurta(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function gerarTextoLista({
  nomeUnidade,
  criadorNome,
  dataISO,
  categoria,
  itens,
}: DadosLista): string {
  const itensCategoria = itens.filter((i) => i.categoria === categoria)

  // Agrupa por subgrupo preservando a ordem de aparição.
  const ordem: string[] = []
  const porSub = new Map<string, ItemLista[]>()
  for (const item of itensCategoria) {
    const sub = subgrupoDoItem(item)
    if (!porSub.has(sub)) {
      porSub.set(sub, [])
      ordem.push(sub)
    }
    porSub.get(sub)!.push(item)
  }

  const cabecalho = `${nomeUnidade} por ${criadorNome} ${dataCurta(dataISO)}`
  const linhas: string[] = [cabecalho]

  for (const sub of ordem) {
    const itensSub = porSub.get(sub)!
    // Ordena por marca e depois pela ordem do modelo (quando houver modelo).
    const ordenados = itensSub.some((i) => i.modelo)
      ? [...itensSub].sort((a, b) => {
          const oma = ordemDaMarca(a.modelo?.marca?.nome)
          const omb = ordemDaMarca(b.modelo?.marca?.nome)
          if (oma !== omb) return oma - omb
          return (a.modelo?.ordem ?? 9999) - (b.modelo?.ordem ?? 9999)
        })
      : itensSub

    linhas.push('') // linha em branco antes de cada tipo
    linhas.push(sub)
    for (const item of ordenados) {
      linhas.push(nomeItem(item, sub))
    }
  }

  return linhas.join('\n')
}

// Rótulo amigável da categoria, para o botão e mensagens.
export function rotuloCategoria(categoria: string): string {
  return CATEGORIA_LABEL[categoria] ?? categoria
}
