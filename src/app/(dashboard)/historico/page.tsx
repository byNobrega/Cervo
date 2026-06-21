import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { CATEGORIA_LABEL } from '@/lib/constants'
import { History, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { LogoUnidade } from '@/components/shared/LogoUnidade'
export const dynamic = 'force-dynamic'

const POR_PAGINA = 20

interface SearchParams {
  data_inicio?: string
  data_fim?: string
  categoria?: string
  apenas_nao_tem?: string
  pagina?: string
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const pagina = Math.max(1, parseInt(searchParams.pagina ?? '1', 10) || 1)
  const de = (pagina - 1) * POR_PAGINA
  const ate = de + POR_PAGINA - 1

  let query = supabase
    .from('pedidos')
    .select(
      `
      *,
      criador:profiles!pedidos_criado_por_fkey(nome),
      finalizador:profiles!pedidos_concluido_por_fkey(nome),
      unidade:unidades(nome),
      itens:pedido_itens(id, status, categoria, nome_snapshot)
    `,
      { count: 'exact' }
    )
    .eq('status', 'concluida')
    .order('concluido_em', { ascending: false })
    .range(de, ate)

  if (searchParams.data_inicio) {
    query = query.gte('concluido_em', searchParams.data_inicio)
  }
  if (searchParams.data_fim) {
    query = query.lte('concluido_em', searchParams.data_fim + 'T23:59:59')
  }

  const { data: pedidos, count } = await query

  const total = count ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const categoriaFiltro = searchParams.categoria || ''
  const apenasNaoTem = searchParams.apenas_nao_tem === '1'

  // Mantém os filtros atuais ao montar links de paginação
  function linkPagina(p: number) {
    const params = new URLSearchParams()
    if (searchParams.data_inicio) params.set('data_inicio', searchParams.data_inicio)
    if (searchParams.data_fim) params.set('data_fim', searchParams.data_fim)
    if (categoriaFiltro) params.set('categoria', categoriaFiltro)
    if (apenasNaoTem) params.set('apenas_nao_tem', '1')
    params.set('pagina', String(p))
    return `/historico?${params.toString()}`
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Histórico</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          {total} pedido{total !== 1 ? 's' : ''} concluído{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtros */}
      <form className="flex flex-wrap items-center gap-2 mb-6">
        <input
          type="date"
          name="data_inicio"
          defaultValue={searchParams.data_inicio}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          name="data_fim"
          defaultValue={searchParams.data_fim}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="categoria"
          aria-label="Filtrar por categoria"
          defaultValue={categoriaFiltro}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORIA_LABEL).map(([valor, label]) => (
            <option key={valor} value={valor}>{label}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-600 px-2">
          <input
            type="checkbox"
            name="apenas_nao_tem"
            value="1"
            defaultChecked={apenasNaoTem}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Só &quot;Não tem&quot;
        </label>
        <button
          type="submit"
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Filtrar
        </button>
        <Link
          href="/historico"
          className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
        >
          Limpar
        </Link>
      </form>

      {(pedidos ?? []).length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <History size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum pedido concluído</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(pedidos ?? []).map((pedido) => {
            let itens = pedido.itens as { id: string; status: string; categoria: string; nome_snapshot: string }[] ?? []

            // Filtros aplicados a nível de itens (a spec pede filtrar por categoria e só "não tem")
            if (categoriaFiltro) itens = itens.filter((i) => i.categoria === categoriaFiltro)
            if (apenasNaoTem) itens = itens.filter((i) => i.status === 'nao_tem')

            // Se filtro de item está ativo e este pedido não tem itens correspondentes, oculta
            if ((categoriaFiltro || apenasNaoTem) && itens.length === 0) return null

            const total = itens.length
            const comprados = itens.filter((i) => i.status === 'comprado').length
            const naoTem = itens.filter((i) => i.status === 'nao_tem').length

            return (
              <Link
                key={pedido.id}
                href={`/historico/${pedido.id}`}
                className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
                      <LogoUnidade nomeUnidade={(pedido.unidade as { nome: string } | null)?.nome} size={18} />
                      {(pedido.unidade as { nome: string } | null)?.nome ?? pedido.nome_loja}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Criado por {(pedido.criador as { nome: string })?.nome} ·{' '}
                      {pedido.concluido_em ? formatDateTime(pedido.concluido_em) : '—'}
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium flex-shrink-0 flex items-center gap-1">
                    <CheckCircle size={10} />
                    Concluído
                  </span>
                </div>

                {total > 0 && (
                  <div className="mt-3">
                    <div className="flex rounded-full overflow-hidden h-1.5 bg-gray-100">
                      <div
                        className="bg-green-400"
                        style={{ width: `${(comprados / total) * 100}%` }}
                      />
                      <div
                        className="bg-red-400"
                        style={{ width: `${(naoTem / total) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {total} iten{total !== 1 ? 's' : ''} · {comprados} comprado{comprados !== 1 ? 's' : ''} · {naoTem} não tem
                    </p>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {pagina > 1 ? (
            <Link
              href={linkPagina(pagina - 1)}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={14} />
              Anterior
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1.5 border border-gray-100 rounded-lg text-sm text-gray-300">
              <ChevronLeft size={14} />
              Anterior
            </span>
          )}
          <span className="text-sm text-gray-500 px-2">
            {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas ? (
            <Link
              href={linkPagina(pagina + 1)}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Próxima
              <ChevronRight size={14} />
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1.5 border border-gray-100 rounded-lg text-sm text-gray-300">
              Próxima
              <ChevronRight size={14} />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
