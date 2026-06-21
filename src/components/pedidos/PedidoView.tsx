'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { type Pedido, type PedidoItem } from '@/types'
import { atualizarStatusItem, finalizarPedido, excluirPedido, enviarListaWhatsApp } from '@/app/actions/pedidos'
import { CATEGORIA_LABEL, TEMA_CATEGORIA, type CategoriaPedido } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import { Check, X, Printer, Loader2, Package, AlertCircle, ChevronRight, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SubcategoriaAccordion } from './SubcategoriaAccordion'
import { LogoUnidade } from '@/components/shared/LogoUnidade'
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon'

// Item com dados aninhados vindos do JOIN na query
type PedidoItemComSub = PedidoItem & {
  acessorio?: { subcategoria?: { nome: string } | null } | null
  modelo?: { nome: string; ordem: number; marca?: { nome: string } | null } | null
}

interface Props {
  pedido: Pedido & {
    criador: { nome: string }
    itens: PedidoItemComSub[]
  }
  cargo: string
  userId: string
}

const SEM_SUBCATEGORIA = 'Outros'

// Categorias compradas de fornecedor externo (via WhatsApp).
// Só estas ganham o botão "Enviar lista para o WhatsApp".
const CATEGORIAS_FORNECEDOR = new Set(['capa', 'pelicula_maquina', 'pelicula_tradicional'])

// Nome da subcategoria de um item (só relevante para acessórios)
function nomeSubcategoria(item: PedidoItemComSub): string {
  return item.acessorio?.subcategoria?.nome ?? SEM_SUBCATEGORIA
}

// Nome do sub-grupo de um item dentro da sua categoria.
// Retorna null quando a categoria não tem sub-agrupamento (material).
// - acessorio: a subcategoria (Fones de Fio, Cabos...)
// - capa / pelicula_tradicional: o tipo, extraído do nome "Tipo — Marca Modelo"
// - pelicula_maquina: agrupa todas em "Película Máquina"
function subgrupoDoItem(item: PedidoItemComSub): string | null {
  if (item.categoria === 'acessorio') return nomeSubcategoria(item)
  if (item.categoria === 'capa' || item.categoria === 'pelicula_tradicional') {
    const tipo = item.nome_snapshot.split('—')[0]?.trim()
    return tipo || SEM_SUBCATEGORIA
  }
  if (item.categoria === 'pelicula_maquina') return 'Película Máquina'
  return null // material → lista direta
}

// Remove o prefixo "Subgrupo — " do nome, já que o subgrupo aparece no cabeçalho.
// Ex: dentro de "Capa Case", "Capa Case — Apple iPhone 8" vira "Apple iPhone 8".
function nomeSemPrefixo(item: PedidoItemComSub, subgrupo: string): string {
  const nome = item.nome_snapshot
  const prefixo = `${subgrupo} —`
  return nome.startsWith(prefixo) ? nome.slice(prefixo.length).trim() : nome
}

// Ordem de exibição das marcas dentro de uma subcategoria.
const ORDEM_MARCAS = ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Redmi', 'Realme']

// Marcas cujo nome NÃO precisa aparecer (o gerente reconhece pelo modelo).
const MARCAS_SEM_PREFIXO = new Set(['Apple', 'Samsung', 'Motorola'])

function ordemDaMarca(marca: string | null | undefined): number {
  const i = ORDEM_MARCAS.indexOf(marca ?? '')
  return i === -1 ? ORDEM_MARCAS.length : i // marcas desconhecidas vão para o fim
}

// Nome do modelo a exibir num accordion de capa/película, conforme a marca:
// - Apple: "iPhone 8" (remove "Apple", mantém "iPhone")
// - Samsung/Motorola: só o modelo (ex: "A03", "Edge 50")
// - Xiaomi/Redmi/Realme: "Marca Modelo" (ex: "Redmi Note 12")
function nomeModeloExibicao(item: PedidoItemComSub): string {
  const marca = item.modelo?.marca?.nome ?? ''
  const modelo = item.modelo?.nome ?? item.nome_snapshot
  if (marca === 'Apple') return modelo // o modelo já é "iPhone 8"
  if (MARCAS_SEM_PREFIXO.has(marca)) return modelo
  return `${marca} ${modelo}`.trim()
}

// Mapeia a categoria do item (no banco) para o tema de cor da categoria do pedido.
function temaDaCategoria(cat: string): CategoriaPedido {
  if (cat === 'acessorio') return 'acessorios'
  if (cat === 'capa') return 'capas'
  if (cat === 'pelicula_maquina' || cat === 'pelicula_tradicional') return 'peliculas'
  return 'material'
}

export function PedidoView({ pedido, cargo, userId }: Props) {
  const router = useRouter()
  const [modalAberto, setModalAberto] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [finalizando, setFinalizando] = useState(false)
  const [modalExcluir, setModalExcluir] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  // Envio da lista por WhatsApp (por categoria)
  const [enviandoCat, setEnviandoCat] = useState<string | null>(null)
  const [feedbackWhats, setFeedbackWhats] = useState<{ ok: boolean; msg: string } | null>(null)

  const itens = pedido.itens ?? []
  const total = itens.length
  const comprados = itens.filter((i) => i.status === 'comprado').length
  const naoTem = itens.filter((i) => i.status === 'nao_tem').length
  const pendentes = itens.filter((i) => i.status === 'pendente').length

  const porcComprado = total > 0 ? (comprados / total) * 100 : 0
  const porcNaoTem = total > 0 ? (naoTem / total) * 100 : 0

  const podeGerenciar = ['gerente', 'dono'].includes(cargo)

  // Quem pode excluir:
  // - dono/gerente: sempre
  // - funcionário: só o próprio pedido e dentro de 15 min da criação
  const ehCriador = pedido.criado_por === userId
  const minutosDesdeCriacao = (Date.now() - new Date(pedido.created_at).getTime()) / 60000
  const podeExcluir = podeGerenciar || (ehCriador && minutosDesdeCriacao <= 15)

  async function confirmarExcluir() {
    setExcluindo(true)
    try {
      await excluirPedido(pedido.id, userId)
      router.push('/pedidos')
    } catch (err) {
      setExcluindo(false)
      setModalExcluir(false)
      alert(err instanceof Error ? err.message : 'Erro ao excluir o pedido.')
    }
  }

  async function handleEnviarWhats(categoria: string) {
    setFeedbackWhats(null)
    setEnviandoCat(categoria)
    try {
      const r = await enviarListaWhatsApp(pedido.id, categoria, userId)
      setFeedbackWhats({ ok: r.ok, msg: r.mensagem })
    } catch {
      setFeedbackWhats({ ok: false, msg: 'Falha ao enviar pelo WhatsApp. Tente novamente.' })
    } finally {
      setEnviandoCat(null)
    }
  }

  // Agrupa itens por categoria (só categorias com itens)
  const categorias = Object.keys(CATEGORIA_LABEL) as Array<keyof typeof CATEGORIA_LABEL>
  const grupos = categorias
    .map((cat) => ({
      cat,
      label: CATEGORIA_LABEL[cat],
      tema: TEMA_CATEGORIA[temaDaCategoria(cat)],
      itens: itens.filter((i) => i.categoria === cat),
      pendentes: itens.filter((i) => i.categoria === cat && i.status === 'pendente').length,
    }))
    .filter((g) => g.itens.length > 0)

  // Abre por padrão a primeira categoria com itens pendentes (ou a primeira)
  const categoriaInicial =
    grupos.find((g) => g.pendentes > 0)?.cat ?? grupos[0]?.cat ?? null
  const [abaAberta, setAbaAberta] = useState<string | null>(categoriaInicial)

  // --- Subgrupos da categoria atualmente aberta (para accordion com auto-avanço) ---
  // Vale para acessórios (subcategorias), capas e películas (tipos).
  const itensDaAba = itens.filter((i) => i.categoria === abaAberta)
  const ordemSubs: string[] = []
  const pendentesPorSub = new Map<string, number>()
  for (const item of itensDaAba) {
    const sub = subgrupoDoItem(item)
    if (sub === null) continue
    if (!pendentesPorSub.has(sub)) {
      ordemSubs.push(sub)
      pendentesPorSub.set(sub, 0)
    }
    if (item.status === 'pendente') {
      pendentesPorSub.set(sub, pendentesPorSub.get(sub)! + 1)
    }
  }

  // Qual subgrupo está aberto (controlado para permitir auto-avanço)
  const primeiraSubPendente = ordemSubs.find((s) => (pendentesPorSub.get(s) ?? 0) > 0) ?? null
  const [subAberta, setSubAberta] = useState<string | null>(primeiraSubPendente)

  // Ao trocar de aba, reposiciona o subgrupo aberto para a primeira pendente da nova aba.
  useEffect(() => {
    setSubAberta(primeiraSubPendente)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaAberta])

  // Quando o subgrupo aberto fica sem pendentes, avança para o próximo pendente.
  useEffect(() => {
    if (subAberta && (pendentesPorSub.get(subAberta) ?? 0) === 0) {
      const proxima = ordemSubs.find((s) => (pendentesPorSub.get(s) ?? 0) > 0) ?? null
      setSubAberta(proxima)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comprados, naoTem])

  function handleFinalizar() {
    if (pendentes > 0) {
      setModalAberto(true)
    } else {
      confirmarFinalizar()
    }
  }

  async function confirmarFinalizar() {
    setModalAberto(false)
    setFinalizando(true)
    await finalizarPedido(pedido.id, userId)
    setFinalizando(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <LogoUnidade nomeUnidade={pedido.unidade?.nome} size={24} />
            {pedido.unidade?.nome ?? pedido.nome_loja}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Criado por {pedido.criador?.nome} · {formatDateTime(pedido.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href={`/pedidos/${pedido.id}/imprimir`}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Printer size={14} />
            Imprimir
          </Link>
          {podeExcluir && (
            <button
              type="button"
              onClick={() => setModalExcluir(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Excluir
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
        <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
          <div className="bg-green-400 transition-all duration-500" style={{ width: `${porcComprado}%` }} />
          <div className="bg-red-400 transition-all duration-500" style={{ width: `${porcNaoTem}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1 text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {comprados} comprado{comprados !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            {naoTem} não tem
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-200" />
            {pendentes} pendente{pendentes !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Abas compactas por categoria */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {grupos.map(({ cat, label, tema, pendentes: pend }) => {
          const ativa = abaAberta === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => { setAbaAberta(ativa ? null : cat); setFeedbackWhats(null) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                ativa
                  ? cn(tema.abaAtiva, 'border-transparent')
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              )}
            >
              <ChevronRight
                size={13}
                className={cn('transition-transform', ativa && 'rotate-90')}
              />
              {label}
              {pend > 0 && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 rounded-full',
                    ativa ? 'bg-white/25' : tema.badge
                  )}
                >
                  {pend}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Botão de enviar a lista da categoria aberta por WhatsApp */}
      {podeGerenciar && abaAberta && CATEGORIAS_FORNECEDOR.has(abaAberta) && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => handleEnviarWhats(abaAberta)}
            disabled={enviandoCat !== null}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {enviandoCat === abaAberta ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <WhatsAppIcon size={15} />
            )}
            Enviar lista de {CATEGORIA_LABEL[abaAberta as keyof typeof CATEGORIA_LABEL]} para o WhatsApp
          </button>
          {feedbackWhats && (
            <p
              className={cn(
                'text-xs mt-2',
                feedbackWhats.ok ? 'text-green-600' : 'text-orange-500'
              )}
            >
              {feedbackWhats.msg}
            </p>
          )}
        </div>
      )}

      {/* Conteúdo da aba aberta */}
      {grupos
        .filter((g) => g.cat === abaAberta)
        .map(({ cat, tema, itens: lista }) => {
          const onAtualizarItem = (id: string, status: 'comprado' | 'nao_tem') =>
            startTransition(() => atualizarStatusItem(id, status))

          // Sub-agrupa por subgrupo (subcategoria/tipo), preservando a ordem de aparição.
          const ordem: string[] = []
          const porSub = new Map<string, PedidoItemComSub[]>()
          for (const item of lista) {
            const sub = subgrupoDoItem(item)
            if (sub === null) continue
            if (!porSub.has(sub)) {
              porSub.set(sub, [])
              ordem.push(sub)
            }
            porSub.get(sub)!.push(item)
          }

          // Material (e qualquer categoria sem subgrupo): lista direta
          if (ordem.length === 0) {
            return (
              <div key={cat} className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-4">
                <div className="divide-y divide-gray-50">
                  {lista.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      podeGerenciar={podeGerenciar}
                      onAtualizar={(status) => onAtualizarItem(item.id, status)}
                    />
                  ))}
                </div>
              </div>
            )
          }

          // Demais: accordions por subgrupo, com riscar-ao-concluir e auto-avanço
          return (
            <div key={cat} className="space-y-2 mb-4">
              {ordem.map((sub) => {
                const itensSub = porSub.get(sub)!
                const pendentesSub = itensSub.filter((i) => i.status === 'pendente').length
                const concluida = pendentesSub === 0
                // Itens com modelo (capas/películas tradicionais) são ordenados por
                // marca (ORDEM_MARCAS) e, dentro da marca, pela ordem do modelo.
                const temModelo = itensSub.some((i) => i.modelo)
                const itensOrdenados = temModelo
                  ? [...itensSub].sort((a, b) => {
                      const oma = ordemDaMarca(a.modelo?.marca?.nome)
                      const omb = ordemDaMarca(b.modelo?.marca?.nome)
                      if (oma !== omb) return oma - omb
                      return (a.modelo?.ordem ?? 9999) - (b.modelo?.ordem ?? 9999)
                    })
                  : itensSub
                return (
                  <SubcategoriaAccordion
                    key={sub}
                    titulo={sub}
                    qtdSelecionada={pendentesSub}
                    tema={tema}
                    concluida={concluida}
                    aberta={subAberta === sub}
                    onToggle={() => setSubAberta(subAberta === sub ? null : sub)}
                  >
                    <div className="divide-y divide-gray-50 pt-1">
                      {itensOrdenados.map((item, idx) => {
                        // Insere um respiro entre grupos de marca diferentes
                        const marcaAtual = item.modelo?.marca?.nome ?? ''
                        const marcaAnterior = idx > 0 ? itensOrdenados[idx - 1].modelo?.marca?.nome ?? '' : marcaAtual
                        const novaMarca = temModelo && idx > 0 && marcaAtual !== marcaAnterior
                        return (
                          <div key={item.id} className={cn(novaMarca && 'border-t-4 border-t-gray-100')}>
                            <ItemRow
                              item={item}
                              podeGerenciar={podeGerenciar}
                              onAtualizar={(status) => onAtualizarItem(item.id, status)}
                              nomeExibicao={temModelo ? nomeModeloExibicao(item) : nomeSemPrefixo(item, sub)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </SubcategoriaAccordion>
                )
              })}
            </div>
          )
        })}

      {/* Botão finalizar */}
      {podeGerenciar && (
        <div className="mt-6">
          <button
            type="button"
            onClick={handleFinalizar}
            disabled={finalizando || isPending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {finalizando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Finalizar pedido
          </button>
        </div>
      )}

      {/* Modal de itens pendentes */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="text-orange-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {pendentes} item{pendentes !== 1 ? 's' : ''} pendente{pendentes !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Os seguintes itens não foram marcados:
                  </p>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto mb-4 space-y-1">
                {itens
                  .filter((i) => i.status === 'pendente')
                  .map((i) => (
                    <p key={i.id} className="text-xs text-gray-600 px-1">
                      · {i.nome_snapshot}
                    </p>
                  ))}
              </div>

              <p className="text-xs text-gray-400 mb-4">
                Se ignorar, eles serão marcados como &quot;Não tem&quot;.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-0 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100"
              >
                Voltar e revisar
              </button>
              <button
                type="button"
                onClick={confirmarFinalizar}
                className="py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Ignorar e concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {modalExcluir && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-5">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="text-red-500" size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Excluir este pedido?</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    O pedido e todos os seus {total} {total === 1 ? 'item' : 'itens'} serão
                    apagados permanentemente. Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-0 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalExcluir(false)}
                disabled={excluindo}
                className="py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarExcluir}
                disabled={excluindo}
                className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {excluindo && <Loader2 size={14} className="animate-spin" />}
                Excluir pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ItemRow({
  item,
  podeGerenciar,
  onAtualizar,
  nomeExibicao,
}: {
  item: PedidoItem
  podeGerenciar: boolean
  onAtualizar: (status: 'comprado' | 'nao_tem') => void
  /** Nome a exibir; se omitido, usa o nome_snapshot completo. */
  nomeExibicao?: string
}) {
  const isComprado = item.status === 'comprado'
  const isNaoTem = item.status === 'nao_tem'

  return (
    <div className="flex items-center gap-3 p-3">
      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
        {item.foto_url_snapshot ? (
          <>
            <Image
              src={item.foto_url_snapshot}
              alt={item.nome_snapshot}
              fill
              sizes="150px"
              className="object-cover"
            />
            {isComprado && (
              <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
            )}
            {isNaoTem && (
              <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                <X size={14} className="text-white" />
              </div>
            )}
          </>
        ) : (
          <Package size={16} className="absolute inset-0 m-auto text-gray-200" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm text-gray-900',
            (isComprado || isNaoTem) && 'line-through text-gray-400'
          )}
        >
          {nomeExibicao ?? item.nome_snapshot}
        </p>
        {item.observacao && (
          <p className="text-xs text-gray-400 mt-0.5">{item.observacao}</p>
        )}
        {item.sugestao_id && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">
            PENDENTE APROVAÇÃO
          </span>
        )}
      </div>

      {podeGerenciar && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => onAtualizar('comprado')}
            aria-label="Marcar como comprado"
            title="Comprado"
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isComprado
                ? 'bg-green-500 text-white'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            )}
          >
            <Check size={15} />
          </button>
          <button
            type="button"
            onClick={() => onAtualizar('nao_tem')}
            aria-label="Marcar como não tem"
            title="Não tem"
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isNaoTem
                ? 'bg-red-500 text-white'
                : 'bg-red-50 text-red-500 hover:bg-red-100'
            )}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
