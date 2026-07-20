'use client'

import { useState } from 'react'
import { usePedidoStore } from '@/store/pedidoStore'
import { type SubcategoriaCapa, type MarcaCelular, type ModeloCelular } from '@/types'
import { type TemaCategoria } from '@/lib/constants'
import { Check, ChevronLeft, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SugestaoInlineForm } from './SugestaoInlineForm'
import { SubcategoriaAccordion } from './SubcategoriaAccordion'
import { ordenarModeloNatural } from '@/lib/ordenarModelos'
import { filtrarPorBusca } from '@/lib/busca'

interface Props {
  subcategorias: (SubcategoriaCapa & { marcas: { marca: MarcaCelular }[] })[]
  marcas: MarcaCelular[]
  modelos: (ModeloCelular & { marca: MarcaCelular })[]
  tema: TemaCategoria
}

export function AbaCapas({ subcategorias, modelos, tema }: Props) {
  const [mostrarSugestao, setMostrarSugestao] = useState(false)
  const { itens, adicionarItem, removerItem } = usePedidoStore()

  function isSelected(subcapaId: string, modeloId: string) {
    return itens.some((i) => i.subcapaId === subcapaId && i.modeloId === modeloId)
  }

  function getTempId(subcapaId: string, modeloId: string) {
    return itens.find((i) => i.subcapaId === subcapaId && i.modeloId === modeloId)?.tempId
  }

  function toggle(
    subcat: SubcategoriaCapa,
    modelo: ModeloCelular & { marca: MarcaCelular }
  ) {
    if (isSelected(subcat.id, modelo.id)) {
      const tempId = getTempId(subcat.id, modelo.id)
      if (tempId) removerItem(tempId)
    } else {
      adicionarItem({
        categoria: 'capa',
        nome: `${subcat.nome} — ${modelo.marca?.nome ?? ''} ${modelo.nome}`,
        fotoUrl: subcat.foto_url,
        observacao: '',
        subcapaId: subcat.id,
        modeloId: modelo.id,
      })
    }
  }

  return (
    <div className="space-y-2">
      {subcategorias.map((sub) => {
        const qtd = itens.filter((i) => i.subcapaId === sub.id).length
        return (
          <SubcategoriaAccordion
            key={sub.id}
            titulo={sub.nome}
            qtdSelecionada={qtd}
            tema={tema}
            fotoUrl={sub.foto_url}
          >
            <CapaSubcategoria
              subcat={sub}
              modelos={modelos}
              tema={tema}
              isSelected={isSelected}
              toggle={toggle}
            />
          </SubcategoriaAccordion>
        )
      })}

      {!mostrarSugestao ? (
        <button
          type="button"
          onClick={() => setMostrarSugestao(true)}
          className={cn('flex items-center gap-2 text-sm font-medium mt-1', tema.link)}
        >
          <Plus size={15} />
          Sugerir capa nova
        </button>
      ) : (
        <SugestaoInlineForm tipo="capa_subcategoria" onFechar={() => setMostrarSugestao(false)} />
      )}
    </div>
  )
}

/**
 * Conteúdo de uma subcategoria de capa expandida: escolhe a marca,
 * depois marca os modelos faltantes.
 */
function CapaSubcategoria({
  subcat,
  modelos,
  tema,
  isSelected,
  toggle,
}: {
  subcat: SubcategoriaCapa & { marcas: { marca: MarcaCelular }[] }
  modelos: (ModeloCelular & { marca: MarcaCelular })[]
  tema: TemaCategoria
  isSelected: (subcapaId: string, modeloId: string) => boolean
  toggle: (subcat: SubcategoriaCapa, modelo: ModeloCelular & { marca: MarcaCelular }) => void
}) {
  const [marcaSel, setMarcaSel] = useState<string | null>(null)
  const [buscaModelo, setBuscaModelo] = useState('')

  const marcasDisponiveis = subcat.marcas.map((m) => m.marca).filter(Boolean)
  const modelosFiltrados = marcaSel
    ? filtrarPorBusca(
        modelos.filter((m) => m.marca_id === marcaSel),
        buscaModelo.trim(),
        (m) => [m.nome]
      ).sort((a, b) => ordenarModeloNatural(a.nome, b.nome))
    : []

  // Etapa 1: escolher marca
  if (!marcaSel) {
    return (
      <div className="space-y-1.5 pt-2">
        {marcasDisponiveis.length === 0 ? (
          <p className="text-sm text-gray-300 py-1">Nenhuma marca associada</p>
        ) : (
          marcasDisponiveis.map((marca) => {
            const qtdMarca = modelos.filter(
              (m) => m.marca_id === marca.id && isSelected(subcat.id, m.id)
            ).length
            return (
              <button
                key={marca.id}
                type="button"
                onClick={() => setMarcaSel(marca.id)}
                className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2.5 transition-colors"
              >
                <span className="text-sm font-medium text-gray-800">{marca.nome}</span>
                {qtdMarca > 0 && (
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', tema.badge)}>
                    {qtdMarca}
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>
    )
  }

  // Etapa 2: modelos da marca
  const marcaNome = marcasDisponiveis.find((m) => m.id === marcaSel)?.nome ?? ''
  return (
    <div className="space-y-1.5 pt-2">
      <button
        type="button"
        onClick={() => setMarcaSel(null)}
        className={cn('flex items-center gap-1 text-xs font-medium mb-1', tema.link)}
      >
        <ChevronLeft size={13} />
        {marcaNome} — trocar marca
      </button>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          value={buscaModelo}
          onChange={(e) => setBuscaModelo(e.target.value)}
          placeholder="Buscar modelo..."
          className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {modelosFiltrados.length === 0 ? (
        <p className="text-sm text-gray-400 py-2 text-center">Nenhum modelo encontrado</p>
      ) : (
        modelosFiltrados.map((modelo) => {
          const sel = isSelected(subcat.id, modelo.id)
          return (
            <button
              key={modelo.id}
              type="button"
              onClick={() => toggle(subcat, modelo)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-left',
                sel ? tema.itemSelecionado : 'bg-white border-gray-100 hover:border-gray-200'
              )}
            >
              <span className={cn('text-sm', sel ? cn('font-medium', tema.textoForte) : 'text-gray-900')}>
                {modelo.nome}
              </span>
              <span
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                  sel ? tema.marcado : 'border-gray-200'
                )}
              >
                {sel && <Check size={12} className="text-white" />}
              </span>
            </button>
          )
        })
      )}
    </div>
  )
}
