'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Layers, Pencil, Trash2, Loader2 } from 'lucide-react'
import { editarSubcategoriaCapa, excluirSubcategoriaCapa } from '@/app/actions/catalogo'
import { ModalExcluir } from './ModalExcluir'
import { PhotoUpload } from '@/components/shared/PhotoUpload'

// Card de uma subcategoria de capa, com editar (nome/foto) e excluir.
// A foto é usada também na imagem da lista enviada por WhatsApp.
export function CapaCard({
  id,
  nome,
  fotoUrl,
  fotoUrlOutras,
  marcas,
  podeGerenciar,
}: {
  id: string
  nome: string
  fotoUrl: string | null
  fotoUrlOutras: string | null
  marcas: string[]
  podeGerenciar: boolean
}) {
  const [editando, setEditando] = useState(false)
  const [modalExcluir, setModalExcluir] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [valorNome, setValorNome] = useState(nome)
  const [valorFoto, setValorFoto] = useState(fotoUrl ?? '')
  const [valorFotoOutras, setValorFotoOutras] = useState(fotoUrlOutras ?? '')
  const router = useRouter()

  // Só a Capa Vidro tem foto de referência diferente por marca (a caixa do
  // iPhone difere da de Samsung/Motorola). Nas demais capas a foto é a mesma
  // para todas as marcas, então o rótulo "iPhone / Apple" não se aplica.
  const ehVidro = /vidro/i.test(nome)

  function salvar() {
    startTransition(async () => {
      // null em marcaIds = mantém os vínculos de marca como estão
      await editarSubcategoriaCapa(
        id,
        valorNome.trim() || nome,
        valorFoto || null,
        null,
        valorFotoOutras || null
      )
      setEditando(false)
      router.refresh() // recarrega a lista para refletir a mudança
    })
  }
  function confirmarExcluir() {
    startTransition(async () => {
      await excluirSubcategoriaCapa(id)
      setModalExcluir(false)
      router.refresh() // recarrega a lista para o item sumir da tela
    })
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg">
      <div className="flex items-center gap-3 p-2">
        <div className="relative w-11 h-11 rounded-md overflow-hidden bg-gray-50 flex-shrink-0">
          {fotoUrl ? (
            <Image src={fotoUrl} alt={nome} fill sizes="60px" className="object-cover" />
          ) : (
            <Layers size={18} className="absolute inset-0 m-auto text-gray-200" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{nome}</p>
          {marcas.length > 0 && <p className="text-xs text-gray-400 truncate">{marcas.join(', ')}</p>}
        </div>
        {podeGerenciar && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setEditando((v) => !v)}
              aria-label="Editar subcategoria"
              title="Editar"
              className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => setModalExcluir(true)}
              aria-label="Excluir subcategoria"
              title="Excluir"
              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {editando && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-2">
          <div className="pt-2 flex gap-4 flex-wrap">
            <PhotoUpload
              value={valorFoto}
              onChange={setValorFoto}
              pasta="capas"
              label={ehVidro ? 'Foto — iPhone / Apple' : 'Foto'}
            />
            <PhotoUpload
              value={valorFotoOutras}
              onChange={setValorFotoOutras}
              pasta="capas"
              label={ehVidro ? 'Foto — outras marcas' : 'Foto — outras marcas (opcional)'}
            />
          </div>
          <input
            value={valorNome}
            onChange={(e) => setValorNome(e.target.value)}
            placeholder="Nome da subcategoria"
            aria-label="Nome da subcategoria"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={salvar}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
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
    </div>
  )
}
