'use client'

import { useState } from 'react'
import Image from 'next/image'
import { usePedidoStore } from '@/store/pedidoStore'
import { type MaterialLoja } from '@/types'
import { type TemaCategoria } from '@/lib/constants'
import { Check, ShoppingBag, MessageSquare, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SugestaoInlineForm } from './SugestaoInlineForm'

interface Props {
  materiais: MaterialLoja[]
  tema: TemaCategoria
}

export function AbaMaterial({ materiais, tema }: Props) {
  const { itens, adicionarItem, removerItem, atualizarObservacao } = usePedidoStore()
  const [obsAberta, setObsAberta] = useState<string | null>(null)
  const [mostrarSugestao, setMostrarSugestao] = useState(false)

  function isSelected(materialId: string) {
    return itens.some((i) => i.materialId === materialId)
  }

  function getTempId(materialId: string) {
    return itens.find((i) => i.materialId === materialId)?.tempId
  }

  function toggle(material: MaterialLoja) {
    if (isSelected(material.id)) {
      const t = getTempId(material.id)
      if (t) removerItem(t)
    } else {
      adicionarItem({
        categoria: 'material',
        nome: material.nome,
        fotoUrl: material.foto_url,
        observacao: '',
        materialId: material.id,
      })
    }
  }

  return (
    <div className="space-y-2">
      {materiais.map((mat) => {
        const sel = isSelected(mat.id)
        const tempId = getTempId(mat.id)
        const obsAtual = itens.find((i) => i.materialId === mat.id)?.observacao ?? ''
        const mostrandoObs = obsAberta === mat.id

        return (
          <div
            key={mat.id}
            className={cn(
              'border rounded-xl transition-all',
              sel ? tema.itemSelecionado : 'bg-white border-gray-100'
            )}
          >
            <div className="flex items-center gap-3 p-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                {mat.foto_url ? (
                  <Image src={mat.foto_url} alt={mat.nome} fill sizes="150px" className="object-cover" />
                ) : (
                  <ShoppingBag size={16} className="absolute inset-0 m-auto text-gray-200" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{mat.nome}</p>
                {sel && obsAtual && (
                  <p className={cn('text-xs mt-0.5 truncate', tema.textoForte)}>&quot;{obsAtual}&quot;</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {sel && tempId && (
                  <button
                    type="button"
                    onClick={() => setObsAberta(mostrandoObs ? null : mat.id)}
                    title="Adicionar observação"
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      mostrandoObs || obsAtual
                        ? tema.badge
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    )}
                  >
                    <MessageSquare size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggle(mat)}
                  aria-label={sel ? 'Remover material' : 'Adicionar material'}
                  className={cn(
                    'w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all',
                    sel ? tema.marcado : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {sel && <Check size={13} className="text-white" />}
                </button>
              </div>
            </div>

            {mostrandoObs && sel && tempId && (
              <div className="px-3 pb-3">
                <input
                  type="text"
                  value={obsAtual}
                  onChange={(e) => atualizarObservacao(tempId, e.target.value)}
                  placeholder="Observação..."
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            )}
          </div>
        )
      })}

      {!mostrarSugestao ? (
        <button
          type="button"
          onClick={() => setMostrarSugestao(true)}
          className={cn('flex items-center gap-2 text-sm font-medium mt-1', tema.link)}
        >
          <Plus size={15} />
          Sugerir material novo
        </button>
      ) : (
        <SugestaoInlineForm tipo="material" onFechar={() => setMostrarSugestao(false)} />
      )}
    </div>
  )
}
