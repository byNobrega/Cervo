'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileEdit, ChevronRight } from 'lucide-react'
import { lerRascunho } from '@/lib/rascunhoPedido'
import { formatDateTime } from '@/lib/utils'

// Aviso na tela Pedidos quando há uma lista em montagem salva no aparelho.
export function AvisoRascunho({ userId }: { userId: string }) {
  const [rascunho, setRascunho] = useState<{ qtd: number; em: string } | null>(null)

  useEffect(() => {
    const r = lerRascunho(userId)
    if (r) setRascunho({ qtd: r.itens.length, em: r.atualizadoEm })
  }, [userId])

  if (!rascunho) return null

  return (
    <Link
      href="/pedidos/novo"
      className="flex items-center gap-3 mb-4 bg-blue-50 border border-blue-100 rounded-xl p-4 hover:border-blue-200 transition-colors"
    >
      <FileEdit size={20} className="text-blue-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-900">Você tem uma lista em andamento</p>
        <p className="text-xs text-blue-700">
          {rascunho.qtd} {rascunho.qtd === 1 ? 'item' : 'itens'} · salva em {formatDateTime(rascunho.em)}
        </p>
      </div>
      <span className="text-sm font-medium text-blue-700 flex items-center gap-0.5 flex-shrink-0">
        Continuar <ChevronRight size={16} />
      </span>
    </Link>
  )
}
