'use client'

import { useState } from 'react'
import { usePedidoStore } from '@/store/pedidoStore'
import { type TipoPeliculaMaquina, type TipoPeliculaTradicional, type ModeloCelular, type MarcaCelular } from '@/types'
import { type TemaCategoria } from '@/lib/constants'
import { Check, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SubcategoriaAccordion } from './SubcategoriaAccordion'
import { NovaSugestaoForm } from '@/components/sugestoes/NovaSugestaoForm'

interface Props {
  maquina: TipoPeliculaMaquina[]
  tradicionais: TipoPeliculaTradicional[]
  modelos: (ModeloCelular & { marca: MarcaCelular })[]
  tema: TemaCategoria
}

export function AbaPeliculas({ maquina, tradicionais, modelos, tema }: Props) {
  const { itens, adicionarItem, removerItem } = usePedidoStore()

  const marcasDisponiveis = Array.from(new Set(modelos.map((m) => m.marca_id)))
    .map((id) => modelos.find((m) => m.marca_id === id)?.marca)
    .filter(Boolean) as MarcaCelular[]

  function isMaquinaSelected(id: string) {
    return itens.some((i) => i.tipoPeliMaqId === id)
  }

  function isTradSelected(tipoId: string, modeloId: string) {
    return itens.some((i) => i.tipoPeliTradId === tipoId && i.modeloId === modeloId)
  }

  function toggleMaquina(pelicula: TipoPeliculaMaquina) {
    if (isMaquinaSelected(pelicula.id)) {
      const t = itens.find((i) => i.tipoPeliMaqId === pelicula.id)?.tempId
      if (t) removerItem(t)
    } else {
      adicionarItem({
        categoria: 'pelicula_maquina',
        nome: `Película Máquina — ${pelicula.nome}`,
        fotoUrl: pelicula.foto_url,
        observacao: '',
        tipoPeliMaqId: pelicula.id,
      })
    }
  }

  function toggleTrad(tipo: TipoPeliculaTradicional, modelo: ModeloCelular & { marca: MarcaCelular }) {
    if (isTradSelected(tipo.id, modelo.id)) {
      const t = itens.find((i) => i.tipoPeliTradId === tipo.id && i.modeloId === modelo.id)?.tempId
      if (t) removerItem(t)
    } else {
      adicionarItem({
        categoria: 'pelicula_tradicional',
        nome: `${tipo.nome} — ${modelo.marca?.nome ?? ''} ${modelo.nome}`,
        fotoUrl: null,
        observacao: '',
        tipoPeliTradId: tipo.id,
        modeloId: modelo.id,
      })
    }
  }

  const qtdMaquina = maquina.filter((p) => isMaquinaSelected(p.id)).length

  return (
    <div className="space-y-2">
      {/* Máquina — lista direta dentro do accordion */}
      <SubcategoriaAccordion
        titulo="Máquina (TPU/Hidrogel)"
        qtdSelecionada={qtdMaquina}
        tema={tema}
      >
        <div className="space-y-1.5 pt-2">
          {maquina.map((p) => {
            const sel = isMaquinaSelected(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleMaquina(p)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-left',
                  sel ? tema.itemSelecionado : 'bg-white border-gray-100 hover:border-gray-200'
                )}
              >
                <span className={cn('text-sm', sel ? cn('font-medium', tema.textoForte) : 'text-gray-900')}>
                  {p.nome}
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
          })}
        </div>
      </SubcategoriaAccordion>

      {/* Tradicionais — um accordion por tipo (Vidro 3D, Cerâmica) */}
      {tradicionais.map((tipo) => {
        const qtd = itens.filter((i) => i.tipoPeliTradId === tipo.id).length
        return (
          <SubcategoriaAccordion
            key={tipo.id}
            titulo={tipo.nome}
            qtdSelecionada={qtd}
            tema={tema}
          >
            <PeliculaTradicional
              tipo={tipo}
              marcas={marcasDisponiveis}
              modelos={modelos}
              tema={tema}
              isTradSelected={isTradSelected}
              toggleTrad={toggleTrad}
            />
          </SubcategoriaAccordion>
        )
      })}

      <p className="text-[11px] text-gray-400 px-1">
        Modelos com tela curva não aparecem nas películas tradicionais.
      </p>

      {/* Sugerir aparelho/película novo (vai para o gerente aprovar) */}
      <div className="pt-1">
        <NovaSugestaoForm
          subcategorias={[]}
          marcas={marcasDisponiveis.map((m) => ({ id: m.id, nome: m.nome }))}
          tipoInicial="modelo"
          tipoFixo
          variante="link"
          classeLink={tema.link}
          rotuloBotao="Sugerir película nova"
          onEnviado={() => { /* só envia; não recarrega para preservar a lista */ }}
        />
      </div>
    </div>
  )
}

function PeliculaTradicional({
  tipo,
  marcas,
  modelos,
  tema,
  isTradSelected,
  toggleTrad,
}: {
  tipo: TipoPeliculaTradicional
  marcas: MarcaCelular[]
  modelos: (ModeloCelular & { marca: MarcaCelular })[]
  tema: TemaCategoria
  isTradSelected: (tipoId: string, modeloId: string) => boolean
  toggleTrad: (tipo: TipoPeliculaTradicional, modelo: ModeloCelular & { marca: MarcaCelular }) => void
}) {
  const [marcaSel, setMarcaSel] = useState<string | null>(null)
  const modelosFiltrados = marcaSel ? modelos.filter((m) => m.marca_id === marcaSel) : []

  if (!marcaSel) {
    return (
      <div className="space-y-1.5 pt-2">
        {marcas.map((marca) => {
          const qtdMarca = modelos.filter(
            (m) => m.marca_id === marca.id && isTradSelected(tipo.id, m.id)
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
        })}
      </div>
    )
  }

  const marcaNome = marcas.find((m) => m.id === marcaSel)?.nome ?? ''
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
      {modelosFiltrados.length === 0 ? (
        <p className="text-sm text-gray-400 py-2 text-center">Nenhum modelo cadastrado</p>
      ) : (
        modelosFiltrados.map((modelo) => {
          const sel = isTradSelected(tipo.id, modelo.id)
          return (
            <button
              key={modelo.id}
              type="button"
              onClick={() => toggleTrad(tipo, modelo)}
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
