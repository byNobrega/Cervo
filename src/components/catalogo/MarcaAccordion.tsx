'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Accordion de uma marca dentro do catálogo de películas tradicionais.
// Clica na marca → expande/recolhe a lista de modelos (chips).
export function MarcaAccordion({
  marca,
  modelos,
  abertaInicial = false,
}: {
  marca: string
  modelos: { id: string; nome: string }[]
  abertaInicial?: boolean
}) {
  const [aberta, setAberta] = useState(abertaInicial)

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <ChevronRight
            size={15}
            className={cn('text-gray-400 transition-transform', aberta && 'rotate-90')}
          />
          <span className="text-sm font-medium text-gray-700">{marca}</span>
        </span>
        <span className="text-[11px] text-gray-400">{modelos.length}</span>
      </button>
      {aberta && (
        <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1">
          {modelos.map((m) => (
            <span
              key={m.id}
              className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600"
            >
              {m.nome}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
