// Agregações para a aba de Análises.
// Recebe os pedidos (com itens) já filtrados por período/escopo e devolve
// as métricas, rankings, distribuição por categoria e série temporal.

import { type CategoriaPedido } from '@/lib/constants'

export interface ItemAnalise {
  categoria: string
  nome_snapshot: string
  status: 'pendente' | 'comprado' | 'nao_tem'
}

export interface PedidoAnalise {
  id: string
  status: 'aberta' | 'concluida'
  created_at: string
  itens: ItemAnalise[]
}

// Mapeia a categoria do item para o grupo exibido nos gráficos.
function grupoCategoria(cat: string): CategoriaPedido {
  if (cat === 'acessorio') return 'acessorios'
  if (cat === 'capa') return 'capas'
  if (cat === 'pelicula_maquina' || cat === 'pelicula_tradicional') return 'peliculas'
  return 'material'
}

const GRUPO_LABEL: Record<CategoriaPedido, string> = {
  acessorios: 'Acessórios',
  capas: 'Capas',
  peliculas: 'Películas',
  material: 'Material',
}

export interface MetricasAnalise {
  // Card pedidos
  totalPedidos: number
  concluidos: number
  abertos: number
  pctConcluidos: number
  pctAbertos: number
  // Card taxa de conclusão
  taxaConclusao: number
  statusTaxa: { label: string; cor: 'verde' | 'amarelo' | 'vermelho' }
  // Card itens não tem
  totalItens: number
  itensNaoTem: number
  pedidosComNaoTem: number
  pctPedidosComNaoTem: number
  mediaNaoTemPorPedido: number
  // Distribuição por categoria (para a pizza): itens por grupo
  porCategoria: { nome: string; chave: CategoriaPedido; valor: number }[]
  // Série temporal: pedidos criados por dia
  porDia: { dia: string; pedidos: number }[]
  // Rankings
  itensMaisPedidos: { nome: string; qtd: number }[]
  itensMaisNaoTem: { nome: string; qtd: number }[]
}

function classificarTaxa(taxa: number): MetricasAnalise['statusTaxa'] {
  if (taxa >= 75) return { label: 'Muito bom!', cor: 'verde' }
  if (taxa >= 50) return { label: 'Razoável', cor: 'amarelo' }
  return { label: 'Precisa atenção', cor: 'vermelho' }
}

// dd/MM a partir de ISO
function diaCurto(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function calcularMetricas(pedidos: PedidoAnalise[]): MetricasAnalise {
  const totalPedidos = pedidos.length
  const concluidos = pedidos.filter((p) => p.status === 'concluida').length
  const abertos = totalPedidos - concluidos
  const pct = (n: number) => (totalPedidos > 0 ? Math.round((n / totalPedidos) * 100) : 0)

  const taxaConclusao = pct(concluidos)

  // Itens
  const todosItens = pedidos.flatMap((p) => p.itens)
  const totalItens = todosItens.length
  const itensNaoTem = todosItens.filter((i) => i.status === 'nao_tem').length
  const pedidosComNaoTem = pedidos.filter((p) =>
    p.itens.some((i) => i.status === 'nao_tem')
  ).length
  const mediaNaoTemPorPedido =
    totalPedidos > 0 ? Math.round((itensNaoTem / totalPedidos) * 10) / 10 : 0

  // Distribuição por categoria
  const contagemCat = new Map<CategoriaPedido, number>()
  for (const item of todosItens) {
    const g = grupoCategoria(item.categoria)
    contagemCat.set(g, (contagemCat.get(g) ?? 0) + 1)
  }
  const ordemCat: CategoriaPedido[] = ['acessorios', 'capas', 'peliculas', 'material']
  const porCategoria = ordemCat
    .map((chave) => ({ nome: GRUPO_LABEL[chave], chave, valor: contagemCat.get(chave) ?? 0 }))
    .filter((c) => c.valor > 0)

  // Série temporal (por dia de criação)
  const contagemDia = new Map<string, { ordem: number; n: number }>()
  for (const p of pedidos) {
    const dia = diaCurto(p.created_at)
    const ordem = new Date(p.created_at).setHours(0, 0, 0, 0)
    const atual = contagemDia.get(dia)
    if (atual) atual.n += 1
    else contagemDia.set(dia, { ordem, n: 1 })
  }
  const porDia = Array.from(contagemDia.entries())
    .map(([dia, v]) => ({ dia, pedidos: v.n, ordem: v.ordem }))
    .sort((a, b) => a.ordem - b.ordem)
    .map(({ dia, pedidos }) => ({ dia, pedidos }))

  // Rankings por nome do item (snapshot)
  const cont = (filtro: (i: ItemAnalise) => boolean) => {
    const m = new Map<string, number>()
    for (const i of todosItens) {
      if (!filtro(i)) continue
      m.set(i.nome_snapshot, (m.get(i.nome_snapshot) ?? 0) + 1)
    }
    return Array.from(m.entries())
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5)
  }
  const itensMaisPedidos = cont(() => true)
  const itensMaisNaoTem = cont((i) => i.status === 'nao_tem')

  return {
    totalPedidos,
    concluidos,
    abertos,
    pctConcluidos: pct(concluidos),
    pctAbertos: pct(abertos),
    taxaConclusao,
    statusTaxa: classificarTaxa(taxaConclusao),
    totalItens,
    itensNaoTem,
    pedidosComNaoTem,
    pctPedidosComNaoTem: pct(pedidosComNaoTem),
    mediaNaoTemPorPedido,
    porCategoria,
    porDia,
    itensMaisPedidos,
    itensMaisNaoTem,
  }
}

// Converte o parâmetro de período em data de início (ISO) ou null (tudo).
export function inicioDoPeriodo(periodo: string, customInicio?: string): string | null {
  const agora = new Date()
  if (periodo === 'custom' && customInicio) {
    return new Date(customInicio).toISOString()
  }
  const dias = periodo === '7' ? 7 : periodo === '90' ? 90 : periodo === 'tudo' ? null : 30
  if (dias === null) return null
  const d = new Date(agora)
  d.setDate(d.getDate() - dias)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
