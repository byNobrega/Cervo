import { create } from 'zustand'
import { type ItemSelecionado } from '@/types'
import { gerarTempId } from '@/lib/utils'

interface PedidoStore {
  itens: ItemSelecionado[]
  pedidoBaseId: string | null // para pedido recorrente
  adicionarItem: (item: Omit<ItemSelecionado, 'tempId'>) => void
  removerItem: (tempId: string) => void
  atualizarObservacao: (tempId: string, observacao: string) => void
  carregarBase: (itens: ItemSelecionado[]) => void
  limpar: () => void
}

export const usePedidoStore = create<PedidoStore>((set) => ({
  itens: [],
  pedidoBaseId: null,

  adicionarItem: (item) =>
    set((state) => ({
      itens: [...state.itens, { ...item, tempId: gerarTempId() }],
    })),

  removerItem: (tempId) =>
    set((state) => ({
      itens: state.itens.filter((i) => i.tempId !== tempId),
    })),

  atualizarObservacao: (tempId, observacao) =>
    set((state) => ({
      itens: state.itens.map((i) =>
        i.tempId === tempId ? { ...i, observacao } : i
      ),
    })),

  carregarBase: (itens) =>
    set({ itens: itens.map((i) => ({ ...i, tempId: gerarTempId() })) }),

  limpar: () => set({ itens: [], pedidoBaseId: null }),
}))
