'use client'

import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Avatar } from './Avatar'
import { PerfilUsuarioModal } from './PerfilUsuarioModal'

/**
 * Foto + nome de um usuário que abre o cartão de perfil ao clicar.
 * Usa <span role="button"> porque costuma ficar dentro de um <Link> (cards de
 * pedido); o clique não propaga, então não abre o pedido.
 */
export function UsuarioClicavel({
  id,
  nome,
  avatarUrl,
}: {
  id: string
  nome: string
  avatarUrl?: string | null
}) {
  const [aberto, setAberto] = useState(false)

  function abrir(e: MouseEvent | KeyboardEvent) {
    e.preventDefault()
    e.stopPropagation()
    setAberto(true)
  }

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        title={`Ver perfil de ${nome}`}
        onClick={abrir}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') abrir(e)
        }}
        className="inline-flex items-center gap-1 align-middle text-gray-600 hover:text-gray-900 hover:underline cursor-pointer"
      >
        <Avatar url={avatarUrl} nome={nome} tamanho={16} />
        {nome}
      </span>
      {aberto && (
        <PerfilUsuarioModal
          inicial={{ id, nome, avatar_url: avatarUrl }}
          onFechar={() => setAberto(false)}
        />
      )}
    </>
  )
}
