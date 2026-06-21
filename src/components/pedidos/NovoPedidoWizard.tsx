'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePedidoStore } from '@/store/pedidoStore'
import { AbaAcessorios } from './AbaAcessorios'
import { AbaCapas } from './AbaCapas'
import { AbaPeliculas } from './AbaPeliculas'
import { AbaMaterial } from './AbaMaterial'
import { criarPedido } from '@/app/actions/pedidos'
import { Loader2, ShoppingCart, Plus, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEMA_CATEGORIA, type CategoriaPedido } from '@/lib/constants'
import type {
  SubcategoriaAcessorio, Acessorio, SubcategoriaCapa, MarcaCelular,
  ModeloCelular, TipoPeliculaMaquina, TipoPeliculaTradicional, MaterialLoja
} from '@/types'

const ORDEM_CATEGORIAS: CategoriaPedido[] = ['acessorios', 'capas', 'peliculas', 'material']

interface Props {
  subcatsAcessorio: SubcategoriaAcessorio[]
  acessorios: (Acessorio & { subcategoria: SubcategoriaAcessorio | null })[]
  subcatsCapa: (SubcategoriaCapa & { marcas: { marca: MarcaCelular }[] })[]
  marcas: MarcaCelular[]
  modelos: (ModeloCelular & { marca: MarcaCelular })[]
  peliculasMaquina: TipoPeliculaMaquina[]
  peliculasTradicionais: TipoPeliculaTradicional[]
  materiais: MaterialLoja[]
  userId: string
}

export function NovoPedidoWizard(props: Props) {
  // null = mostrando a seleção de categorias; senão, dentro de uma categoria
  const [categoria, setCategoria] = useState<CategoriaPedido | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [modalFinalizar, setModalFinalizar] = useState(false)
  const { itens, limpar } = usePedidoStore()
  const router = useRouter()

  // Conta itens por categoria (mapeando as categorias internas dos itens)
  function qtdNaCategoria(cat: CategoriaPedido): number {
    return itens.filter((i) => {
      if (cat === 'acessorios') return i.categoria === 'acessorio'
      if (cat === 'capas') return i.categoria === 'capa'
      if (cat === 'peliculas') return i.categoria === 'pelicula_maquina' || i.categoria === 'pelicula_tradicional'
      if (cat === 'material') return i.categoria === 'material'
      return false
    }).length
  }

  function pedirFinalizacao() {
    if (itens.length === 0) return
    setModalFinalizar(true)
  }

  async function salvarPedido() {
    if (itens.length === 0) return
    setSalvando(true)
    try {
      const pedidoId = await criarPedido(props.userId, itens)
      limpar()
      router.push(`/pedidos/${pedidoId}`)
    } finally {
      setSalvando(false)
    }
  }

  // ---------- TELA 1: seleção exclusiva de categoria ----------
  if (categoria === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Escolha uma categoria para começar. Você poderá adicionar outras depois.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {ORDEM_CATEGORIAS.map((cat) => {
            const tema = TEMA_CATEGORIA[cat]
            const qtd = qtdNaCategoria(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoria(cat)}
                className={cn(
                  'relative flex items-center justify-center py-8 rounded-2xl text-base font-semibold text-white transition-transform hover:scale-[1.02] shadow-sm',
                  tema.botao
                )}
              >
                {tema.label}
                {qtd > 0 && (
                  <span className="absolute top-2 right-2 text-[11px] font-bold bg-white/25 px-2 py-0.5 rounded-full">
                    {qtd}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Resumo / salvar */}
        {itens.length > 0 && (
          <BarraResumo
            itens={itens}
            salvando={salvando}
            onSalvar={pedirFinalizacao}
          />
        )}

        <ModalFinalizar
          aberto={modalFinalizar}
          salvando={salvando}
          onCancelar={() => setModalFinalizar(false)}
          onConfirmar={salvarPedido}
        />
      </div>
    )
  }

  // ---------- TELA 2: dentro de uma categoria ----------
  const tema = TEMA_CATEGORIA[categoria]
  const qtd = qtdNaCategoria(categoria)

  return (
    <div className="space-y-4">
      {/* Cabeçalho da categoria ativa */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCategoria(null)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
        <span
          className={cn(
            'px-3 py-1 rounded-lg text-sm font-semibold',
            tema.abaAtiva
          )}
        >
          {tema.label}
        </span>
        {qtd > 0 && (
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', tema.badge)}>
            {qtd} selecionado{qtd !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="min-h-48">
        {categoria === 'acessorios' && (
          <AbaAcessorios
            subcategorias={props.subcatsAcessorio}
            acessorios={props.acessorios}
            tema={tema}
          />
        )}
        {categoria === 'capas' && (
          <AbaCapas
            subcategorias={props.subcatsCapa}
            marcas={props.marcas}
            modelos={props.modelos}
            tema={tema}
          />
        )}
        {categoria === 'peliculas' && (
          <AbaPeliculas
            maquina={props.peliculasMaquina}
            tradicionais={props.peliculasTradicionais}
            modelos={props.modelos.filter((m) => !m.tem_tela_curva)}
            tema={tema}
          />
        )}
        {categoria === 'material' && (
          <AbaMaterial materiais={props.materiais} tema={tema} />
        )}
      </div>

      {/* Ações: adicionar outro tipo / salvar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setCategoria(null)}
          className="flex items-center justify-center gap-2 flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Plus size={16} />
          Escolher outro tipo
        </button>
        <button
          type="button"
          onClick={pedirFinalizacao}
          disabled={itens.length === 0 || salvando}
          className={cn(
            'flex items-center justify-center gap-2 flex-1 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
            tema.botao
          )}
        >
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
          Finalizar pedido
        </button>
      </div>

      <ModalFinalizar
        aberto={modalFinalizar}
        salvando={salvando}
        onCancelar={() => setModalFinalizar(false)}
        onConfirmar={salvarPedido}
      />
    </div>
  )
}

function ModalFinalizar({
  aberto,
  salvando,
  onCancelar,
  onConfirmar,
}: {
  aberto: boolean
  salvando: boolean
  onCancelar: () => void
  onConfirmar: () => void
}) {
  if (!aberto) return null
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        <div className="p-5">
          <h3 className="font-semibold text-gray-900 text-sm">Finalizar pedido?</h3>
          <p className="text-xs text-gray-500 mt-1">
            Tem certeza que não quer adicionar mais itens? O pedido será enviado para
            o gerente comprar.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-0 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancelar}
            disabled={salvando}
            className="py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={salvando}
            className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {salvando && <Loader2 size={14} className="animate-spin" />}
            Sim, finalizar
          </button>
        </div>
      </div>
    </div>
  )
}

function BarraResumo({
  itens,
  salvando,
  onSalvar,
}: {
  itens: ReturnType<typeof usePedidoStore.getState>['itens']
  salvando: boolean
  onSalvar: () => void
}) {
  const pendentes = itens.filter((i) => i.isPendenteSugestao).length
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {itens.length} iten{itens.length !== 1 ? 's' : ''} no pedido
          </p>
          {pendentes > 0 && (
            <p className="text-xs text-orange-500 mt-0.5">
              {pendentes} sugestão pendente de aprovação
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onSalvar}
          disabled={salvando}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
          Finalizar pedido
        </button>
      </div>
    </div>
  )
}
