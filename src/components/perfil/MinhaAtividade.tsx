'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { buscarPerfilPublico, type PerfilPublico } from '@/app/actions/perfilPublico'
import { AtividadeUsuario } from '@/components/shared/PerfilUsuarioModal'

// Bloco "Últimas listas / Últimas sugestões" da tela Meu Perfil.
export function MinhaAtividade({ usuarioId }: { usuarioId: string }) {
  const [dados, setDados] = useState<PerfilPublico | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    buscarPerfilPublico(usuarioId)
      .then((r) => (r.dados ? setDados(r.dados) : setErro(true)))
      .catch(() => setErro(true))
  }, [usuarioId])

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 [&>section:first-child]:mt-0">
      {erro ? (
        <p className="text-sm text-gray-400 text-center">Não foi possível carregar sua atividade</p>
      ) : !dados ? (
        <div className="flex justify-center text-gray-300">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (
        <AtividadeUsuario dados={dados} />
      )}
    </div>
  )
}
