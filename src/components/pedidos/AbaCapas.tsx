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
import { filtrarPorBusca, filtrarPorBuscaEstrita } from '@/lib/busca'

interface Props {
  subcategorias: (SubcategoriaCapa & { marcas: { marca: MarcaCelular }[] })[]
  marcas: MarcaCelular[]
  modelos: (ModeloCelular & { marca: MarcaCelular })[]
  tema: TemaCategoria
}

export function AbaCapas({ subcategorias, modelos, tema }: Props) {
  const [mostrarSugestao, setMostrarSugestao] = useState(false)
  const [busca, setBusca] = useState('')
  const { itens, adicionarItem, removerItem } = usePedidoStore()

  // Nome padrão do item de capa (usado no fallback por nome, para pedidos
  // antigos cujos itens não têm subcapaId/modeloId).
  function nomeCapa(subcat: SubcategoriaCapa, modelo: ModeloCelular & { marca: MarcaCelular }) {
    return `${subcat.nome} — ${modelo.marca?.nome ?? ''} ${modelo.nome}`
  }

  function itemDoCarrinho(subcat: SubcategoriaCapa, modelo: ModeloCelular & { marca: MarcaCelular }) {
    return itens.find(
      (i) =>
        (i.subcapaId === subcat.id && i.modeloId === modelo.id) ||
        (!i.subcapaId && i.categoria === 'capa' && i.nome === nomeCapa(subcat, modelo))
    )
  }

  function isSelected(subcapaId: string, modeloId: string) {
    const subcat = subcategorias.find((s) => s.id === subcapaId)
    const modelo = modelos.find((m) => m.id === modeloId)
    return subcat && modelo ? !!itemDoCarrinho(subcat, modelo) : false
  }

  function getTempId(subcapaId: string, modeloId: string) {
    const subcat = subcategorias.find((s) => s.id === subcapaId)
    const modelo = modelos.find((m) => m.id === modeloId)
    return subcat && modelo ? itemDoCarrinho(subcat, modelo)?.tempId : undefined
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
        nome: nomeCapa(subcat, modelo),
        fotoUrl: subcat.foto_url,
        observacao: '',
        subcapaId: subcat.id,
        modeloId: modelo.id,
        subgrupo: subcat.nome,
      })
    }
  }

  // Busca: pelo tipo de capa ("silicone") mantém o fluxo marca → modelo;
  // pelo aparelho ("iphone 13", ou "vidro iphone 13") lista direto os modelos
  // que batem em cada subcategoria, sem precisar escolher a marca antes.
  const termo = busca.trim()
  const resultados = subcategorias
    .map((sub) => {
      if (!termo) return { sub, modelosBusca: null }
      if (filtrarPorBusca([sub], termo, (s) => [s.nome]).length > 0) {
        return { sub, modelosBusca: null }
      }
      const marcaIds = new Set(sub.marcas.map((m) => m.marca?.id).filter(Boolean))
      const modelosBusca = filtrarPorBuscaEstrita(
        modelos.filter((m) => marcaIds.has(m.marca_id)),
        termo,
        (m) => [sub.nome, m.marca?.nome, m.nome]
      ).sort((a, b) => ordenarModeloNatural(a.nome, b.nome))
      return { sub, modelosBusca }
    })
    // ao buscar, esconde as subcategorias sem resultado
    .filter(({ modelosBusca }) => modelosBusca === null || modelosBusca.length > 0)

  return (
    <div className="space-y-2">
      {/* Busca inteligente (ignora hífen/acento/caixa) */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar capa ou aparelho (ex: silicone, iPhone 13)..."
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {termo && resultados.length === 0 && (
        <p className="text-center py-6 text-sm text-gray-400">Nenhuma capa encontrada</p>
      )}

      {resultados.map(({ sub, modelosBusca }) => {
        const qtd = itens.filter((i) => i.subcapaId === sub.id).length
        return (
          <SubcategoriaAccordion
            // key muda com a busca para o accordion abrir já com o resultado
            key={`${sub.id}-${termo ? 'busca' : 'normal'}`}
            titulo={sub.nome}
            qtdSelecionada={qtd}
            tema={tema}
            fotoUrl={sub.foto_url}
            defaultAberta={!!termo}
          >
            {modelosBusca ? (
              <div className="space-y-1.5 pt-2">
                {modelosBusca.map((modelo) => (
                  <ModeloLinha
                    key={modelo.id}
                    rotulo={`${modelo.marca?.nome ?? ''} ${modelo.nome}`.trim()}
                    selecionado={isSelected(sub.id, modelo.id)}
                    tema={tema}
                    onClick={() => toggle(sub, modelo)}
                  />
                ))}
              </div>
            ) : (
              <CapaSubcategoria
                subcat={sub}
                modelos={modelos}
                tema={tema}
                isSelected={isSelected}
                toggle={toggle}
              />
            )}
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
        modelosFiltrados.map((modelo) => (
          <ModeloLinha
            key={modelo.id}
            rotulo={modelo.nome}
            selecionado={isSelected(subcat.id, modelo.id)}
            tema={tema}
            onClick={() => toggle(subcat, modelo)}
          />
        ))
      )}
    </div>
  )
}

// Linha de um modelo de aparelho com checkbox (marca/desmarca a capa).
function ModeloLinha({
  rotulo,
  selecionado: sel,
  tema,
  onClick,
}: {
  rotulo: string
  selecionado: boolean
  tema: TemaCategoria
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-left',
        sel ? tema.itemSelecionado : 'bg-white border-gray-100 hover:border-gray-200'
      )}
    >
      <span className={cn('text-sm', sel ? cn('font-medium', tema.textoForte) : 'text-gray-900')}>
        {rotulo}
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
}
