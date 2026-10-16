import { create } from 'zustand'
import { type ItemSelecionado } from '@/types'
import { gerarTempId } from '@/lib/utils'

// De onde vieram os itens que estão no store. O Novo Pedido usa isto para
// decidir se restaura o rascunho salvo: itens de "Reutilizar lista" ficam;
// sobras do modo "adicionar a um pedido existente" dão lugar ao rascunho.
export type OrigemItens = 'novo' | 'adicionar' | 'reutilizar' | null

interface PedidoStore {
  itens: ItemSelecionado[]
  pedidoBaseId: string | null // para pedido recorrente
  origem: OrigemItens
  setOrigem: (origem: OrigemItens) => void
  restaurar: (itens: ItemSelecionado[]) => void
  adicionarItem: (item: Omit<ItemSelecionado, 'tempId'>) => void
  removerItem: (tempId: string) => void
  atualizarObservacao: (tempId: string, observacao: string) => void
  carregarBase: (itens: ItemSelecionado[]) => void
  limpar: () => void
}

export const usePedidoStore = create<PedidoStore>((set) => ({
  itens: [],
  pedidoBaseId: null,
  origem: null,

  setOrigem: (origem) => set({ origem }),

  // Volta os itens de um rascunho salvo, mantendo os tempIds.
  restaurar: (itens) => set({ itens }),

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
    set({ itens: itens.map((i) => ({ ...i, tempId: gerarTempId() })), origem: 'reutilizar' }),

  limpar: () => set({ itens: [], pedidoBaseId: null }),
}))
