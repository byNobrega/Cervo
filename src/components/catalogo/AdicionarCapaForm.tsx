'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import { adicionarSubcategoriaCapa } from '@/app/actions/catalogo'
import { Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Marca = { id: string; nome: string }

export function AdicionarCapaForm({ marcas }: { marcas: Marca[] }) {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [marcaIds, setMarcaIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState('')
  const router = useRouter()

  function toggleMarca(id: string) {
    setMarcaIds((atual) =>
      atual.includes(id) ? atual.filter((m) => m !== id) : [...atual, id]
    )
  }

  function resetar() {
    setNome('')
    setFotoUrl('')
    setMarcaIds([])
    setErro('')
  }

  function salvar() {
    setErro('')
    if (!nome.trim()) {
      setErro('Dê um nome à capa.')
      return
    }
    startTransition(async () => {
      await adicionarSubcategoriaCapa(nome.trim(), fotoUrl || null, marcaIds)
      resetar()
      setAberto(false)
      router.refresh()
    })
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 font-medium"
      >
        <Plus size={16} />
        Adicionar capa
      </button>
    )
  }

  return (
    <div className="bg-white border border-sky-100 rounded-xl p-4 space-y-3">
      <h4 className="font-medium text-sm text-gray-900">Nova capa</h4>

      <PhotoUpload value={fotoUrl} onChange={setFotoUrl} pasta="capas" label="Foto (opcional)" />

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Capa Anti-Impacto"
          aria-label="Nome da capa"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Marcas que essa capa atende
        </label>
        <div className="flex flex-wrap gap-1.5">
          {marcas.map((m) => {
            const sel = marcaIds.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMarca(m.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  sel
                    ? 'bg-sky-500 text-white border-transparent'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                {m.nome}
              </button>
            )
          })}
        </div>
      </div>

      {erro && <p className="text-red-500 text-xs">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Adicionar
        </button>
        <button
          type="button"
          onClick={() => { setAberto(false); resetar() }}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
