'use client'

import { Trash2, Loader2 } from 'lucide-react'

// Modal de confirmação de exclusão (aviso em vermelho). Reutilizável no catálogo.
export function ModalExcluir({
  nome,
  isPending,
  onCancelar,
  onConfirmar,
}: {
  nome: string
  isPending: boolean
  onCancelar: () => void
  onConfirmar: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <Trash2 className="text-red-500" size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-red-600 text-sm">
                Tem certeza que deseja excluir este item?
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                &quot;{nome}&quot; será removido do catálogo permanentemente. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-0 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancelar}
            disabled={isPending}
            className="py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={isPending}
            className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Sim, excluir
          </button>
        </div>
      </div>
    </div>
  )
}
