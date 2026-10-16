import { type ItemSelecionado } from '@/types'

// Rascunho da lista em montagem (Novo Pedido), salvo no aparelho.
// Sem isto a lista vivia só na memória da aba: se o navegador recarregasse
// (comum no celular depois de um tempo em segundo plano), tudo se perdia.
// A chave inclui o usuário para quem usa o mesmo aparelho não ver a lista do outro.

export interface RascunhoPedido {
  itens: ItemSelecionado[]
  unidadeId: string | null
  emergente: boolean
  atualizadoEm: string
}

function chave(userId: string) {
  return `cervo:rascunho-pedido:${userId}`
}

export function lerRascunho(userId: string): RascunhoPedido | null {
  try {
    const bruto = localStorage.getItem(chave(userId))
    if (!bruto) return null
    const r = JSON.parse(bruto) as RascunhoPedido
    return Array.isArray(r.itens) && r.itens.length > 0 ? r : null
  } catch {
    return null
  }
}

export function salvarRascunho(userId: string, dados: Omit<RascunhoPedido, 'atualizadoEm'>) {
  try {
    localStorage.setItem(
      chave(userId),
      JSON.stringify({ ...dados, atualizadoEm: new Date().toISOString() })
    )
  } catch {
    // aparelho sem espaço / modo privado: segue sem rascunho
  }
}

export function apagarRascunho(userId: string) {
  try {
    localStorage.removeItem(chave(userId))
  } catch {
    // ignora
  }
}
