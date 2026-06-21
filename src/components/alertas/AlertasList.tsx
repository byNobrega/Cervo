'use client'

import { useTransition } from 'react'
import { type Alerta } from '@/types'
import { resolverAlerta } from '@/app/actions/alertas'
import { TrendingUp, AlertTriangle, Check, Bell } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function AlertasList({ alertas }: { alertas: Alerta[] }) {
  const ativos = alertas.filter((a) => !a.resolvido)
  const resolvidos = alertas.filter((a) => a.resolvido)

  if (alertas.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Bell size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Nenhum alerta. Clique em &quot;Recalcular&quot; para verificar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {ativos.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3">
            Ativos ({ativos.length})
          </h3>
          <div className="space-y-2">
            {ativos.map((a) => <AlertaCard key={a.id} alerta={a} />)}
          </div>
        </section>
      )}

      {resolvidos.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Resolvidos
          </h3>
          <div className="space-y-2 opacity-60">
            {resolvidos.slice(0, 10).map((a) => <AlertaCard key={a.id} alerta={a} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function AlertaCard({ alerta }: { alerta: Alerta }) {
  const [isPending, startTransition] = useTransition()
  const isFrequencia = alerta.tipo === 'frequencia_alta'

  return (
    <div
      className={cn(
        'bg-white border rounded-xl p-4 flex items-start gap-3',
        !alerta.resolvido && isFrequencia && 'border-orange-100',
        !alerta.resolvido && !isFrequencia && 'border-red-100',
        alerta.resolvido && 'border-gray-100'
      )}
    >
      <div
        className={cn(
          'p-2 rounded-lg flex-shrink-0',
          isFrequencia ? 'bg-orange-50' : 'bg-red-50'
        )}
      >
        {isFrequencia ? (
          <TrendingUp size={16} className="text-orange-500" />
        ) : (
          <AlertTriangle size={16} className="text-red-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm">{alerta.item_nome}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {isFrequencia
            ? `Pedido ${alerta.contagem}x no último mês — item muito demandado`
            : `Marcado como "Não tem" nas últimas 3 vezes — considere remover ou trocar fornecedor`}
        </p>
        <p className="text-[11px] text-gray-300 mt-1">
          {formatDate(alerta.created_at, 'dd/MM/yyyy')}
        </p>
      </div>

      {!alerta.resolvido && (
        <button
          onClick={() => startTransition(() => resolverAlerta(alerta.id))}
          disabled={isPending}
          className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-50 transition-colors flex-shrink-0"
          title="Marcar como resolvido"
        >
          <Check size={14} />
        </button>
      )}
    </div>
  )
}
