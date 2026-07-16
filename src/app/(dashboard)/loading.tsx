import { Loader2 } from 'lucide-react'

// Exibido automaticamente pelo Next enquanto qualquer página do dashboard
// carrega (busca de dados no servidor). Dá o feedback de "está acontecendo"
// no lugar da tela parada.
export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="animate-spin text-blue-600" size={28} />
      <p className="text-sm text-gray-400">Carregando...</p>
    </div>
  )
}
