'use client'

import { useState } from 'react'
import Image from 'next/image'
import { usePedidoStore } from '@/store/pedidoStore'
import { type SubcategoriaAcessorio, type Acessorio } from '@/types'
import { type TemaCategoria } from '@/lib/constants'
import { Package, Check, MessageSquare, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SugestaoInlineForm } from './SugestaoInlineForm'
import { SubcategoriaAccordion } from './SubcategoriaAccordion'
import { ordenarNatural } from '@/lib/ordenarModelos'
import { filtrarPorBusca } from '@/lib/busca'

interface Props {
  subcategorias: SubcategoriaAcessorio[]
  acessorios: (Acessorio & { subcategoria: SubcategoriaAcessorio | null })[]
  tema: TemaCategoria
}

export function AbaAcessorios({ subcategorias, acessorios, tema }: Props) {
  const { itens, adicionarItem, removerItem, atualizarObservacao } = usePedidoStore()
  const [obsAberta, setObsAberta] = useState<string | null>(null)
  const [mostrarSugestao, setMostrarSugestao] = useState(false)
  const [busca, setBusca] = useState('')

  function isSelected(acessorioId: string) {
    return itens.some((i) => i.acessorioId === acessorioId)
  }

  function getTempId(acessorioId: string) {
    return itens.find((i) => i.acessorioId === acessorioId)?.tempId
  }

  function toggle(acessorio: Acessorio) {
    if (isSelected(acessorio.id)) {
      const tempId = getTempId(acessorio.id)
      if (tempId) removerItem(tempId)
    } else {
      adicionarItem({
        categoria: 'acessorio',
        nome: acessorio.nome,
        fotoUrl: acessorio.foto_url,
        observacao: '',
        acessorioId: acessorio.id,
      })
    }
  }

  const termo = busca.trim()
  const acessoriosFiltrados = filtrarPorBusca(acessorios, termo, (a) => [
    a.nome,
    a.marca,
    a.subcategoria?.nome,
  ])

  const porSubcategoria = subcategorias
    .map((sub) => ({
      sub,
      itens: acessoriosFiltrados
        .filter((a) => a.subcategoria_id === sub.id)
        .sort((a, b) => ordenarNatural(a.nome, b.nome)),
    }))
    // ao buscar, esconde as subcategorias sem resultado
    .filter(({ itens }) => !termo || itens.length > 0)

  function qtdSelecionada(lista: Acessorio[]) {
    return lista.filter((a) => isSelected(a.id)).length
  }

  return (
    <div className="space-y-2">
      {/* Busca inteligente (ignora hífen/acento/caixa: "kd 751" acha "KD-751") */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar acessório..."
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {termo && porSubcategoria.length === 0 && (
        <p className="text-center py-6 text-sm text-gray-400">
          Nenhum acessório encontrado
        </p>
      )}

      {porSubcategoria.map(({ sub, itens: lista }) => (
        <SubcategoriaAccordion
          key={sub.id}
          titulo={sub.nome}
          qtdSelecionada={qtdSelecionada(lista)}
          tema={tema}
          defaultAberta={!!termo}
        >
          {lista.length === 0 ? (
            <p className="text-sm text-gray-300 py-2 px-1">Nenhum item cadastrado</p>
          ) : (
            <div className="space-y-1.5 pt-2">
              {lista.map((a) => (
                <ItemAcessorio
                  key={a.id}
                  acessorio={a}
                  tema={tema}
                  selecionado={isSelected(a.id)}
                  onToggle={() => toggle(a)}
                  tempId={getTempId(a.id)}
                  obsAberta={obsAberta}
                  setObsAberta={setObsAberta}
                  atualizarObservacao={atualizarObservacao}
                  obsAtual={itens.find((i) => i.acessorioId === a.id)?.observacao ?? ''}
                />
              ))}
            </div>
          )}
        </SubcategoriaAccordion>
      ))}

      {!mostrarSugestao ? (
        <button
          type="button"
          onClick={() => setMostrarSugestao(true)}
          className={cn('flex items-center gap-2 text-sm font-medium mt-1', tema.link)}
        >
          <Plus size={15} />
          Sugerir novo item
        </button>
      ) : (
        <SugestaoInlineForm
          tipo="acessorio"
          subcategorias={subcategorias}
          onFechar={() => setMostrarSugestao(false)}
        />
      )}
    </div>
  )
}

function ItemAcessorio({
  acessorio,
  tema,
  selecionado,
  onToggle,
  tempId,
  obsAberta,
  setObsAberta,
  atualizarObservacao,
  obsAtual,
}: {
  acessorio: Acessorio
  tema: TemaCategoria
  selecionado: boolean
  onToggle: () => void
  tempId?: string
  obsAberta: string | null
  setObsAberta: (id: string | null) => void
  atualizarObservacao: (tempId: string, obs: string) => void
  obsAtual: string
}) {
  const mostrandoObs = obsAberta === acessorio.id

  return (
    <div
      className={cn(
        'border rounded-xl transition-all',
        selecionado ? tema.itemSelecionado : 'bg-white border-gray-100'
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
          {acessorio.foto_url ? (
            <Image src={acessorio.foto_url} alt={acessorio.nome} fill sizes="150px" className="object-cover" />
          ) : (
            <Package size={16} className="absolute inset-0 m-auto text-gray-200" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{acessorio.nome}</p>
          {acessorio.marca && (
            <p className="text-xs text-gray-400">{acessorio.marca}</p>
          )}
          {selecionado && obsAtual && (
            <p className={cn('text-xs mt-0.5 truncate', tema.textoForte)}>&quot;{obsAtual}&quot;</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selecionado && tempId && (
            <button
              type="button"
              onClick={() => setObsAberta(mostrandoObs ? null : acessorio.id)}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                mostrandoObs || obsAtual
                  ? tema.badge
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              )}
              title="Adicionar observação"
            >
              <MessageSquare size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={selecionado ? 'Remover item' : 'Adicionar item'}
            className={cn(
              'w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all',
              selecionado ? tema.marcado : 'border-gray-200 hover:border-gray-300'
            )}
          >
            {selecionado && <Check size={13} className="text-white" />}
          </button>
        </div>
      </div>

      {mostrandoObs && selecionado && tempId && (
        <div className="px-3 pb-3">
          <input
            type="text"
            value={obsAtual}
            onChange={(e) => atualizarObservacao(tempId, e.target.value)}
            placeholder="Ex: cores masculinas..."
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
            autoFocus
          />
        </div>
      )}
    </div>
  )
}
