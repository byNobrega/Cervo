'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'
import { ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type TemaCategoria } from '@/lib/constants'

interface Props {
  titulo: string
  qtdSelecionada: number
  tema: TemaCategoria
  children: ReactNode
  defaultAberta?: boolean
  /** Modo controlado: se passado, o estado de aberto/fechado é gerido pelo pai. */
  aberta?: boolean
  onToggle?: () => void
  /** Visual de subcategoria concluída (título riscado + check). */
  concluida?: boolean
  /** Foto de referência do tipo (ex: foto da Capa Vidro). */
  fotoUrl?: string | null
}

/**
 * Subcategoria colapsável usada nas abas do Novo Pedido e na visualização do pedido.
 * Funciona em modo não-controlado (estado interno) ou controlado (props `aberta`/`onToggle`).
 */
export function SubcategoriaAccordion({
  titulo,
  qtdSelecionada,
  tema,
  children,
  defaultAberta = false,
  aberta: abertaProp,
  onToggle,
  concluida = false,
  fotoUrl,
}: Props) {
  const [abertaInterna, setAbertaInterna] = useState(defaultAberta)
  const controlado = abertaProp !== undefined
  const aberta = controlado ? abertaProp : abertaInterna

  function toggle() {
    if (controlado) onToggle?.()
    else setAbertaInterna((v) => !v)
  }

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden transition-colors',
        concluida ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100'
      )}
    >
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-gray-50/60 transition-colors"
      >
        <ChevronRight
          size={16}
          className={cn(
            'text-gray-400 transition-transform flex-shrink-0',
            aberta && 'rotate-90'
          )}
        />
        {fotoUrl && (
          <div className="relative w-9 h-9 rounded-md overflow-hidden bg-gray-50 flex-shrink-0">
            <Image src={fotoUrl} alt={titulo} fill sizes="40px" className="object-cover" />
          </div>
        )}
        <span
          className={cn(
            'flex-1 text-xs font-semibold uppercase tracking-wide',
            concluida ? 'text-gray-400 line-through' : 'text-gray-600'
          )}
        >
          {titulo}
        </span>
        {concluida ? (
          <span
            className={cn(
              'flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0',
              tema.marcado
            )}
          >
            <Check size={12} className="text-white" />
          </span>
        ) : (
          qtdSelecionada > 0 && (
            <span
              className={cn(
                'text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
                tema.badge
              )}
            >
              {qtdSelecionada}
            </span>
          )
        )}
      </button>

      {aberta && (
        <div className="px-3 pb-3 pt-0.5 border-t border-gray-50">
          {children}
        </div>
      )}
    </div>
  )
}
