'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const OPCOES = [
  { valor: '7', label: 'Últimos 7 dias' },
  { valor: '30', label: '30 dias' },
  { valor: '90', label: '90 dias' },
  { valor: 'tudo', label: 'Tudo' },
  { valor: 'custom', label: 'Customizado' },
]

export function SeletorPeriodo({
  periodoAtual,
  inicioAtual,
}: {
  periodoAtual: string
  inicioAtual?: string
}) {
  const router = useRouter()
  const [custom, setCustom] = useState(inicioAtual ?? '')

  function selecionar(valor: string) {
    if (valor === 'custom') {
      // espera a data ser escolhida no input
      router.push(`/analises?periodo=custom${custom ? `&inicio=${custom}` : ''}`)
      return
    }
    router.push(`/analises?periodo=${valor}`)
  }

  function aplicarCustom(data: string) {
    setCustom(data)
    if (data) router.push(`/analises?periodo=custom&inicio=${data}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {OPCOES.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => selecionar(o.valor)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            periodoAtual === o.valor
              ? 'bg-blue-600 text-white border-transparent'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
        >
          {o.label}
        </button>
      ))}

      {periodoAtual === 'custom' && (
        <input
          type="date"
          value={custom}
          onChange={(e) => aplicarCustom(e.target.value)}
          aria-label="Data de início do período"
          className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  )
}
