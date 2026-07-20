'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { type SubcategoriaAcessorio, type Acessorio } from '@/types'
import { acessorioSchema, type AcessorioFormData } from '@/lib/validations'
import { adicionarAcessorio, editarAcessorio, excluirAcessorio } from '@/app/actions/catalogo'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import { TEMA_CATEGORIA } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { ModalExcluir } from './ModalExcluir'
import { NovaSugestaoForm } from '@/components/sugestoes/NovaSugestaoForm'
import { ordenarNatural } from '@/lib/ordenarModelos'
import { filtrarPorBusca } from '@/lib/busca'
import { Plus, Package, Loader2, Search, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { useTransition } from 'react'

const TEMA = TEMA_CATEGORIA.acessorios

interface Props {
  subcategorias: SubcategoriaAcessorio[]
  acessorios: (Acessorio & { subcategoria: SubcategoriaAcessorio | null })[]
  cargo: string
}

export function AcessoriosCatalogo({ subcategorias, acessorios, cargo }: Props) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [fotoUrl, setFotoUrl] = useState('')
  const [busca, setBusca] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AcessorioFormData>({ resolver: zodResolver(acessorioSchema) })

  const podeGerenciar = ['gerente', 'dono'].includes(cargo)

  const termo = busca.trim()
  const filtrados = filtrarPorBusca(acessorios, termo, (a) => [a.nome, a.marca])

  const porSubcategoria = subcategorias.map((sub) => ({
    sub,
    itens: filtrados
      .filter((a) => a.subcategoria_id === sub.id)
      .sort((a, b) => ordenarNatural(a.nome, b.nome)),
  }))
  const nenhumResultado = termo && filtrados.length === 0

  async function onSubmit(data: AcessorioFormData) {
    await adicionarAcessorio(data)
    reset()
    setFotoUrl('')
    setMostrarForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou marca..."
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {nenhumResultado && (
        <p className="text-center py-8 text-sm text-gray-400">
          Nenhum acessório encontrado para &quot;{busca}&quot;
        </p>
      )}

      <div className="space-y-1.5">
        {porSubcategoria.map(({ sub, itens }) => {
          // ao buscar, esconde seções vazias para não poluir
          if (termo && itens.length === 0) return null
          return (
            <SubcategoriaCatalogo
              key={sub.id}
              titulo={sub.nome}
              itens={itens}
              // durante a busca, abre automaticamente para mostrar o resultado
              abertaInicial={!!termo}
              podeGerenciar={podeGerenciar}
              subcategorias={subcategorias}
            />
          )
        })}

      </div>

      {podeGerenciar && !termo && (
        <>
          {mostrarForm ? (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white border border-blue-100 rounded-xl p-4 space-y-3"
            >
              <h4 className="font-medium text-sm text-gray-900">Novo acessório</h4>

              <PhotoUpload
                value={fotoUrl}
                onChange={(url) => { setFotoUrl(url); setValue('foto_url', url) }}
                pasta="acessorios"
                obrigatoria
              />
              {errors.foto_url && (
                <p className="text-red-500 text-xs">{errors.foto_url.message}</p>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                <input
                  {...register('nome')}
                  placeholder="Nome do acessório"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.nome && (
                  <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Marca</label>
                <input
                  {...register('marca')}
                  placeholder="Marca (opcional)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subcategoria</label>
                <select
                  {...register('subcategoria_id')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Sem subcategoria</option>
                  {subcategorias.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
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
              onClick={() => setMostrarForm(true)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus size={16} />
              Adicionar acessório
            </button>
          )}
        </>
      )}

      {/* Funcionário: sugere um novo acessório (vai para o gerente aprovar) */}
      {!podeGerenciar && !termo && (
        <NovaSugestaoForm
          subcategorias={subcategorias}
          marcas={[]}
          tipoInicial="acessorio"
          tipoFixo
          variante="link"
          classeLink={TEMA.link}
          rotuloBotao="Sugerir novo acessório"
        />
      )}
    </div>
  )
}

// Accordion de uma subcategoria: clica no título → expande/recolhe os itens.
function SubcategoriaCatalogo({
  titulo,
  itens,
  abertaInicial = false,
  podeGerenciar,
  subcategorias,
}: {
  titulo: string
  itens: (Acessorio & { subcategoria?: SubcategoriaAcessorio | null })[]
  abertaInicial?: boolean
  podeGerenciar: boolean
  subcategorias: SubcategoriaAcessorio[]
}) {
  const [aberta, setAberta] = useState(abertaInicial)

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <ChevronRight
            size={15}
            className={cn('transition-transform', TEMA.textoForte, aberta && 'rotate-90')}
          />
          <span className={cn('text-sm font-semibold uppercase tracking-wide', TEMA.textoForte)}>
            {titulo}
          </span>
        </span>
        <span className="text-[11px] text-gray-400">{itens.length}</span>
      </button>
      {aberta && (
        <div className="px-2 pb-2 pt-0.5 space-y-1.5">
          {itens.length === 0 ? (
            <p className="text-sm text-gray-300 px-1 py-2">Nenhum item</p>
          ) : (
            itens.map((item) => (
              <AcessorioCard
                key={item.id}
                item={item}
                podeGerenciar={podeGerenciar}
                subcategorias={subcategorias}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function AcessorioCard({
  item,
  podeGerenciar,
  subcategorias,
}: {
  item: Acessorio
  podeGerenciar: boolean
  subcategorias: SubcategoriaAcessorio[]
}) {
  const [editando, setEditando] = useState(false)
  const [modalExcluir, setModalExcluir] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // form de edição
  const [nome, setNome] = useState(item.nome)
  const [marca, setMarca] = useState(item.marca ?? '')
  const [subId, setSubId] = useState(item.subcategoria_id ?? '')
  const [fotoUrl, setFotoUrl] = useState(item.foto_url ?? '')

  function salvarEdicao() {
    startTransition(async () => {
      await editarAcessorio(item.id, {
        nome: nome.trim() || item.nome,
        marca: marca.trim() || undefined,
        subcategoria_id: subId || undefined,
        foto_url: fotoUrl,
      })
      setEditando(false)
      router.refresh()
    })
  }

  function confirmarExcluir() {
    startTransition(async () => {
      await excluirAcessorio(item.id)
      setModalExcluir(false)
      router.refresh()
    })
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg">
      <div className="flex items-center gap-3 p-2">
        <div className="relative w-11 h-11 rounded-md overflow-hidden bg-gray-50 flex-shrink-0">
          {item.foto_url ? (
            <Image src={item.foto_url} alt={item.nome} fill sizes="60px" className="object-cover" />
          ) : (
            <Package size={18} className="absolute inset-0 m-auto text-gray-200" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{item.nome}</p>
          {item.marca && <p className="text-xs text-gray-400 truncate">{item.marca}</p>}
        </div>

        {podeGerenciar && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setEditando((v) => !v)}
              aria-label="Editar item"
              title="Editar"
              className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => setModalExcluir(true)}
              aria-label="Excluir item"
              title="Excluir"
              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Form de edição inline */}
      {editando && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-2">
          <div className="pt-2">
            <PhotoUpload value={fotoUrl} onChange={setFotoUrl} pasta="acessorios" label="Foto" />
          </div>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome"
            aria-label="Nome do acessório"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Marca (opcional)"
            aria-label="Marca"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            aria-label="Subcategoria"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="">Sem subcategoria</option>
            {subcategorias.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
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

