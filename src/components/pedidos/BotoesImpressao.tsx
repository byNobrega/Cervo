'use client'

import { useRouter } from 'next/navigation'
import { Printer, ChevronLeft } from 'lucide-react'

// Botões interativos da página de impressão.
// Precisam de 'use client' por usarem window.print() e navegação no browser.
export function BotoesImpressao() {
  const router = useRouter()
  return (
    <div className="no-print mb-6 flex gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <Printer size={15} />
        Imprimir / Salvar PDF
      </button>
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
      >
        <ChevronLeft size={15} />
        Voltar
      </button>
    </div>
  )
}
