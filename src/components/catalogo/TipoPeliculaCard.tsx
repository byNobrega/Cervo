'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Shield, Pencil, Trash2, Loader2 } from 'lucide-react'
import { editarTipoPelicula, excluirTipoPelicula } from '@/app/actions/catalogo'
import { ModalExcluir } from './ModalExcluir'
import { PhotoUpload } from '@/components/shared/PhotoUpload'

// Card de um TIPO de película (Máquina ou Tradicional), com editar (nome) e excluir.
// Usado no cabeçalho de cada tipo no catálogo de películas.
export function TipoPeliculaCard({
  tabela,
  id,
  nome,
  fotoUrl = null,
  podeGerenciar,
}: {
  tabela: 'maquina' | 'tradicional'
  id: string
  nome: string
  fotoUrl?: string | null
  podeGerenciar: boolean
}) {
  const [editando, setEditando] = useState(false)
  const [modalExcluir, setModalExcluir] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [valorNome, setValorNome] = useState(nome)
  const [valorFoto, setValorFoto] = useState(fotoUrl ?? '')
  const router = useRouter()

  function salvar() {
    startTransition(async () => {
      await editarTipoPelicula(tabela, id, valorNome.trim() || nome, valorFoto || null)
      setEditando(false)
      router.refresh()
    })
  }
  function confirmarExcluir() {
    startTransition(async () => {
      await excluirTipoPelicula(tabela, id)
      setModalExcluir(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {fotoUrl !== undefined && fotoUrl !== null ? (
          <div className="relative w-9 h-9 rounded-md overflow-hidden bg-gray-50 flex-shrink-0">
            <Image src={fotoUrl} alt={nome} fill sizes="40px" className="object-cover" />
          </div>
        ) : tabela === 'maquina' ? (
          <Shield size={15} className="text-gray-300 flex-shrink-0" />
        ) : null}
        <span className="text-sm font-medium text-gray-700 flex-1">{nome}</span>
        {podeGerenciar && (
          <span className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setEditando((v) => !v)}
              aria-label="Editar tipo"
              title="Editar"
              className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => setModalExcluir(true)}
              aria-label="Excluir tipo"
              title="Excluir"
              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </span>
        )}
      </div>

      {editando && (
        <div className="mt-2 space-y-2">
          <PhotoUpload
            value={valorFoto}
            onChange={setValorFoto}
            pasta="peliculas"
            label="Foto (usada na lista do WhatsApp)"
          />
          <div className="flex gap-2">
            <input
              value={valorNome}
              onChange={(e) => setValorNome(e.target.value)}
              aria-label="Nome do tipo de película"
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={salvar}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {modalExcluir && (
        <ModalExcluir
          nome={nome}
          isPending={isPending}
          onCancelar={() => setModalExcluir(false)}
          onConfirmar={confirmarExcluir}
        />
      )}
    </>
  )
}
