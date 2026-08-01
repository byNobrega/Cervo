'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { usePedidoStore } from '@/store/pedidoStore'
import { chaveItemSelecionado } from '@/lib/itemKey'
import { AbaAcessorios } from './AbaAcessorios'
import { AbaCapas } from './AbaCapas'
import { AbaPeliculas } from './AbaPeliculas'
import { AbaMaterial } from './AbaMaterial'
import { criarPedido, adicionarItensAoPedido } from '@/app/actions/pedidos'
import { celebrar } from '@/lib/efeitos'
import { Loader2, ShoppingCart, Plus, ChevronLeft, AlertTriangle } from 'lucide-react'
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
  // Quando presente, o wizard opera em modo "adicionar itens a um pedido
  // existente" (em vez de criar um novo pedido).
  pedidoExistenteId?: string
  // Chaves dos itens que já estão no pedido (modo adicionar), para avisar sobre
  // duplicatas conforme o usuário seleciona.
  chavesExistentes?: string[]
}

export function NovoPedidoWizard(props: Props) {
  const modoAdicionar = Boolean(props.pedidoExistenteId)
  const rotuloAcao = modoAdicionar ? 'Adicionar ao pedido' : 'Finalizar pedido'

  // null = mostrando a seleção de categorias; senão, dentro de uma categoria
  const [categoria, setCategoria] = useState<CategoriaPedido | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [modalFinalizar, setModalFinalizar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const { itens, limpar } = usePedidoStore()
  const router = useRouter()

  // No modo "adicionar", começa com a seleção vazia (só os itens novos).
  useEffect(() => {
    if (modoAdicionar) limpar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Itens que o usuário selecionou mas que JÁ estão no pedido (modo adicionar).
  const setExistentes = useMemo(
    () => new Set(props.chavesExistentes ?? []),
    [props.chavesExistentes]
  )
  const duplicados = itens.filter((i) => setExistentes.has(chaveItemSelecionado(i)))

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
    setErro(null)
    setSalvando(true)
    try {
      if (props.pedidoExistenteId) {
        const r = await adicionarItensAoPedido(props.pedidoExistenteId, props.userId, itens)
        if (!r.ok) {
          setErro(r.mensagem ?? 'Não foi possível adicionar os itens.')
          setModalFinalizar(false)
          return
        }
        limpar()
        router.push(`/pedidos/${props.pedidoExistenteId}`)
      } else {
        const pedidoId = await criarPedido(props.userId, itens)
        celebrar() // confete + trompete ao criar a lista
        limpar()
        router.push(`/pedidos/${pedidoId}`)
      }
    } finally {
      setSalvando(false)
    }
  }

  const bannerDuplicados =
    duplicados.length > 0 ? (
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700">
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold">
            {duplicados.length === 1
              ? 'Este item já está no pedido:'
              : 'Estes itens já estão no pedido:'}
          </p>
          <p className="mt-0.5">{duplicados.map((d) => d.nome).join(', ')}</p>
          <p className="mt-1 text-amber-600">Se adicionar, eles não serão duplicados.</p>
        </div>
      </div>
    ) : null

  // ---------- TELA 1: seleção exclusiva de categoria ----------
  if (categoria === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          {modoAdicionar
            ? 'Escolha os itens que faltam para adicionar a este pedido.'
            : 'Escolha uma categoria para começar. Você poderá adicionar outras depois.'}
        </p>

        {bannerDuplicados}

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

        {erro && <p className="text-sm text-red-500">{erro}</p>}

        {/* Resumo / salvar */}
        {itens.length > 0 && (
          <BarraResumo
            itens={itens}
            salvando={salvando}
            rotuloAcao={rotuloAcao}
            onSalvar={pedirFinalizacao}
          />
        )}

        <ModalFinalizar
          aberto={modalFinalizar}
          salvando={salvando}
          modoAdicionar={modoAdicionar}
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

      {bannerDuplicados}

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
          {rotuloAcao}
        </button>
      </div>

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      <ModalFinalizar
        aberto={modalFinalizar}
        salvando={salvando}
        modoAdicionar={modoAdicionar}
        onCancelar={() => setModalFinalizar(false)}
        onConfirmar={salvarPedido}
      />
    </div>
  )
}

function ModalFinalizar({
  aberto,
  salvando,
  modoAdicionar,
  onCancelar,
  onConfirmar,
}: {
  aberto: boolean
  salvando: boolean
  modoAdicionar: boolean
  onCancelar: () => void
  onConfirmar: () => void
}) {
  if (!aberto) return null
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        <div className="p-5">
          <h3 className="font-semibold text-gray-900 text-sm">
            {modoAdicionar ? 'Adicionar estes itens?' : 'Finalizar pedido?'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {modoAdicionar
              ? 'Os itens entram no pedido em aberto, marcados com a data de hoje.'
              : 'Tem certeza que não quer adicionar mais itens? O pedido será enviado para o gerente comprar.'}
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
            {modoAdicionar ? 'Sim, adicionar' : 'Sim, finalizar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BarraResumo({
  itens,
  salvando,
  rotuloAcao,
  onSalvar,
}: {
  itens: ReturnType<typeof usePedidoStore.getState>['itens']
  salvando: boolean
  rotuloAcao: string
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
          {rotuloAcao}
        </button>
      </div>
    </div>
  )
}
