'use client'

import { useRouter } from 'next/navigation'
import { usePedidoStore } from '@/store/pedidoStore'
import { type ItemSelecionado, type CategoriaItem } from '@/types'
import { RotateCcw } from 'lucide-react'
import { gerarTempId } from '@/lib/utils'

interface Props {
  pedidoId: string
  itens: {
    id: string
    status: string
    categoria: string
    nome_snapshot: string
    foto_url_snapshot: string | null
    observacao: string | null
  }[]
}

export function ReutilizarPedidoButton({ itens }: Props) {
  const router = useRouter()
  const { carregarBase } = usePedidoStore()

  function reutilizar() {
    const itensMapeados: ItemSelecionado[] = itens.map((item) => ({
      tempId: gerarTempId(),
      categoria: item.categoria as CategoriaItem,
      nome: item.nome_snapshot,
      fotoUrl: item.foto_url_snapshot,
      observacao: item.observacao ?? '',
    }))

    carregarBase(itensMapeados)
    router.push('/pedidos/novo')
  }

  return (
    <button
      onClick={reutilizar}
      className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
    >
      <RotateCcw size={16} />
      Usar como base para novo pedido
    </button>
  )
}
