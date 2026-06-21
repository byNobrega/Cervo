'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { type MaterialLoja } from '@/types'
import { materialSchema, type MaterialFormData } from '@/lib/validations'
import { adicionarMaterial, editarMaterial, excluirMaterial } from '@/app/actions/catalogo'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import { Plus, ShoppingBag, Loader2, Search, Pencil, Trash2 } from 'lucide-react'
import { ModalExcluir } from './ModalExcluir'

interface Props {
  materiais: MaterialLoja[]
  cargo: string
}

export function MaterialCatalogo({ materiais, cargo }: Props) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [fotoUrl, setFotoUrl] = useState('')
  const [busca, setBusca] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormData>({ resolver: zodResolver(materialSchema) })

  const podeGerenciar = ['gerente', 'dono'].includes(cargo)

  const termo = busca.trim().toLowerCase()
  const filtrados = termo
    ? materiais.filter((m) => m.nome.toLowerCase().includes(termo))
    : materiais

  async function onSubmit(data: MaterialFormData) {
    await adicionarMaterial(data)
    reset()
    setFotoUrl('')
    setMostrarForm(false)
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar material..."
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {termo && filtrados.length === 0 && (
        <p className="text-center py-8 text-sm text-gray-400">
          Nenhum material encontrado para &quot;{busca}&quot;
        </p>
      )}

      <div className="space-y-1.5">
        {filtrados.map((item) => (
          <MaterialCard key={item.id} item={item} podeGerenciar={podeGerenciar} />
        ))}
      </div>

      {podeGerenciar && !termo && (
        <>
          {mostrarForm ? (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white border border-blue-100 rounded-xl p-4 space-y-3"
            >
              <h4 className="font-medium text-sm text-gray-900">Novo material</h4>

              <PhotoUpload
                value={fotoUrl}
                onChange={(url) => { setFotoUrl(url); setValue('foto_url', url) }}
                pasta="material"
                label="Foto (opcional)"
              />

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                <input
                  {...register('nome')}
                  placeholder="Ex: Sacola Plástica"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.nome && (
                  <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => { setMostrarForm(false); reset(); setFotoUrl('') }}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setMostrarForm(true)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus size={16} />
              Adicionar material
            </button>
          )}
        </>
      )}
    </div>
  )
}

function MaterialCard({ item, podeGerenciar }: { item: MaterialLoja; podeGerenciar: boolean }) {
  const [editando, setEditando] = useState(false)
  const [modalExcluir, setModalExcluir] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [nome, setNome] = useState(item.nome)
  const [fotoUrl, setFotoUrl] = useState(item.foto_url ?? '')

  function salvarEdicao() {
    startTransition(async () => {
      await editarMaterial(item.id, { nome: nome.trim() || item.nome, foto_url: fotoUrl || undefined })
      setEditando(false)
    })
  }
  function confirmarExcluir() {
    startTransition(async () => {
      await excluirMaterial(item.id)
      setModalExcluir(false)
    })
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg">
      <div className="flex items-center gap-3 p-2">
        <div className="relative w-11 h-11 rounded-md overflow-hidden bg-gray-50 flex-shrink-0">
          {item.foto_url ? (
            <Image src={item.foto_url} alt={item.nome} fill sizes="60px" className="object-cover" />
          ) : (
            <ShoppingBag size={18} className="absolute inset-0 m-auto text-gray-200" />
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 truncate flex-1">{item.nome}</p>
        {podeGerenciar && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setEditando((v) => !v)}
              aria-label="Editar material"
              title="Editar"
              className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => setModalExcluir(true)}
              aria-label="Excluir material"
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
          <div className="pt-2">
            <PhotoUpload value={fotoUrl} onChange={setFotoUrl} pasta="material" label="Foto (opcional)" />
          </div>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome"
            aria-label="Nome do material"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={salvarEdicao}
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
          nome={item.nome}
          isPending={isPending}
          onCancelar={() => setModalExcluir(false)}
          onConfirmar={confirmarExcluir}
        />
      )}
    </div>
  )
}
