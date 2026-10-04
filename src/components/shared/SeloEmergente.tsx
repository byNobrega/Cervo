import { Siren } from 'lucide-react'
import { cn } from '@/lib/utils'

// Selo do pedido EMERGENTE: itens que acabaram e não podem esperar a próxima
// compra do gerente. Aparece na lista de pedidos, no detalhe, no histórico e
// na impressão — sempre em vermelho, para o gerente bater o olho e priorizar.
//
// Sem 'use client' de propósito: é só marcação, então funciona tanto nas
// páginas do servidor quanto dentro do PedidoView (que é client).
export function SeloEmergente({
  tamanho = 'sm',
  className,
}: {
  tamanho?: 'sm' | 'md'
  className?: string
}) {
  const md = tamanho === 'md'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 flex-shrink-0 rounded-full border border-red-200 bg-red-50 font-bold uppercase tracking-wide text-red-600',
        md ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]',
        className
      )}
    >
      <Siren size={md ? 14 : 11} className="text-red-500" />
      Emergente
    </span>
  )
}
