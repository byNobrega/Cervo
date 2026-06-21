'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/utils'
import { CARGOS_LABEL } from '@/lib/constants'
import { ShoppingCart, Users, Lightbulb, Clock, CheckCircle } from 'lucide-react'

type Funcionario = { id: string; nome: string; cargo: string; whatsapp: string | null; status: string }
type PedidoResumo = {
  id: string
  status: string
  created_at: string
  criador: { nome: string } | null
  itens: { id: string; status: string }[]
}
type SugestaoResumo = { id: string; nome: string; tipo: string; sugeridor: { nome: string } | null }

type Aba = 'pedidos' | 'funcionarios' | 'sugestoes'

interface Props {
  unidadeId: string
  cargo: string
  funcionarios: Funcionario[]
  pedidos: PedidoResumo[]
  sugestoes: SugestaoResumo[]
}

export function UnidadeDashboard({ funcionarios, pedidos, sugestoes }: Props) {
  const [aba, setAba] = useState<Aba>('pedidos')

  const abas: { id: Aba; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={15} />, count: pedidos.filter((p) => p.status === 'aberta').length },
    { id: 'funcionarios', label: 'Funcionários', icon: <Users size={15} />, count: funcionarios.length },
    { id: 'sugestoes', label: 'Sugestões', icon: <Lightbulb size={15} />, count: sugestoes.length },
  ]

  return (
    <div>
      {/* Abas */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors',
              aba === a.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {a.icon}
            {a.label}
            {a.count > 0 && (
              <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 rounded-full">{a.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Pedidos */}
      {aba === 'pedidos' && (
        <div className="space-y-2">
          {pedidos.length === 0 ? (
            <p className="text-center py-10 text-sm text-gray-400">Nenhum pedido nesta unidade</p>
          ) : (
            pedidos.map((p) => {
              const total = p.itens?.length ?? 0
              const aberto = p.status === 'aberta'
              return (
                <Link
                  key={p.id}
                  href={aberto ? `/pedidos/${p.id}` : `/historico/${p.id}`}
                  className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3.5 hover:border-gray-200 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {p.criador?.nome ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {total} {total === 1 ? 'item' : 'itens'} · {formatDateTime(p.created_at)}
                    </p>
                  </div>
                  <span className={cn(
                    'text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1',
                    aberto ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-700'
                  )}>
                    {aberto ? <Clock size={10} /> : <CheckCircle size={10} />}
                    {aberto ? 'Aberto' : 'Concluído'}
                  </span>
                </Link>
              )
            })
          )}
        </div>
      )}

      {/* Funcionários */}
      {aba === 'funcionarios' && (
        <div className="space-y-2">
          {funcionarios.length === 0 ? (
            <p className="text-center py-10 text-sm text-gray-400">Nenhum funcionário nesta unidade</p>
          ) : (
            funcionarios.map((f) => (
              <div key={f.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{f.nome}</p>
                  <p className="text-xs text-gray-400">
                    {CARGOS_LABEL[f.cargo] ?? f.cargo}
                    {f.whatsapp && ` · ${f.whatsapp}`}
                  </p>
                </div>
                {f.status !== 'aprovado' && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium">
                    {f.status}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Sugestões */}
      {aba === 'sugestoes' && (
        <div className="space-y-2">
          {sugestoes.length === 0 ? (
            <p className="text-center py-10 text-sm text-gray-400">Nenhuma sugestão pendente</p>
          ) : (
            sugestoes.map((s) => (
              <Link
                key={s.id}
                href="/sugestoes"
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3.5 hover:border-gray-200 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.nome}</p>
                  <p className="text-xs text-gray-400">Sugerido por {s.sugeridor?.nome ?? '—'}</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium">
                  pendente
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
