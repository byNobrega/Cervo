import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ShoppingCart, Clock } from 'lucide-react'
import { formatDateTime, cn } from '@/lib/utils'
import { resumoCategorias } from '@/lib/constants'
import { LogoUnidade } from '@/components/shared/LogoUnidade'
import { SeloEmergente } from '@/components/shared/SeloEmergente'
export const dynamic = 'force-dynamic'

export default async function PedidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select(`
      *,
      criador:profiles!pedidos_criado_por_fkey(nome),
      unidade:unidades(nome),
      itens:pedido_itens(id, status, categoria)
    `)
    .eq('status', 'aberta')
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', user.id)
    .single()

  // Emergentes no topo: são compras que não podem esperar. Dentro de cada
  // grupo vale a ordem que veio do banco (mais recentes primeiro) — o sort
  // do JS é estável, então o empate preserva essa ordem.
  const lista = [...(pedidos ?? [])].sort(
    (a, b) =>
      (a.tipo === 'emergente' ? 0 : 1) - (b.tipo === 'emergente' ? 0 : 1)
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Pedidos</h2>
          <p className="text-gray-500 text-sm mt-0.5">Pedidos em aberto</p>
        </div>
        {['funcionario', 'gerente', 'dono'].includes(profile?.cargo ?? '') && (
          <Link
            href="/pedidos/novo"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Novo pedido
          </Link>
        )}
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum pedido em aberto</p>
          <Link
            href="/pedidos/novo"
            className="text-blue-600 text-sm hover:underline mt-2 inline-block"
          >
            Criar novo pedido
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((pedido) => {
            const itens = pedido.itens as { id: string; status: string; categoria: string }[] ?? []
            const total = itens.length
            const comprados = itens.filter((i) => i.status === 'comprado').length
            const naoTem = itens.filter((i) => i.status === 'nao_tem').length
            const pendentes = itens.filter((i) => i.status === 'pendente').length

            const nomeUnidade = (pedido.unidade as { nome: string } | null)?.nome ?? pedido.nome_loja
            const resumo = resumoCategorias(itens.map((i) => i.categoria))

            return (
              <Link
                key={pedido.id}
                href={`/pedidos/${pedido.id}`}
                className={cn(
                  'block rounded-xl p-4 border hover:shadow-sm transition-all',
                  pedido.tipo === 'emergente'
                    ? 'bg-red-50/50 border-red-200 hover:border-red-300'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
                      <LogoUnidade nomeUnidade={nomeUnidade} size={20} />
                      <span>
                        {nomeUnidade}
                        {total > 0 && (
                          <span className="text-gray-400 font-normal"> ({resumo})</span>
                        )}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Por {(pedido.criador as { nome: string })?.nome} · {formatDateTime(pedido.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {pedido.tipo === 'emergente' && <SeloEmergente />}
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium flex items-center gap-1">
                      <Clock size={10} />
                      Aberto
                    </span>
                  </div>
                </div>

                {total > 0 && (
                  <div className="mt-3">
                    <div className="flex rounded-full overflow-hidden h-1.5 bg-gray-100">
                      <div
                        className="bg-green-400 transition-all"
                        style={{ width: `${(comprados / total) * 100}%` }}
                      />
                      <div
                        className="bg-red-400 transition-all"
                        style={{ width: `${(naoTem / total) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {total} iten{total !== 1 ? 's' : ''} · {comprados} comprado{comprados !== 1 ? 's' : ''} · {pendentes} pendente{pendentes !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
