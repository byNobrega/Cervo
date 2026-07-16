import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { CATEGORIA_LABEL } from '@/lib/constants'
import { Package, Printer, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReutilizarPedidoButton } from '@/components/historico/ReutilizarPedidoButton'
import { LogoUnidade } from '@/components/shared/LogoUnidade'
import { CelebracaoCompra } from '@/components/pedidos/CelebracaoCompra'
export const dynamic = 'force-dynamic'

export default async function HistoricoDetalhe({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: pedido }, { data: perfil }] = await Promise.all([
    supabase
      .from('pedidos')
      .select(`
        *,
        criador:profiles!pedidos_criado_por_fkey(nome),
        finalizador:profiles!pedidos_concluido_por_fkey(nome),
        unidade:unidades(nome),
        itens:pedido_itens(*)
      `)
      .eq('id', params.id)
      .single(),
    supabase.from('profiles').select('cargo').eq('id', user.id).single(),
  ])

  if (!pedido) redirect('/historico')

  // Celebra quando o FUNCIONÁRIO que criou a lista a vê já concluída (comprada).
  const ehFuncionarioCriador =
    perfil?.cargo === 'funcionario' && pedido.criado_por === user.id

  const itens = pedido.itens as { id: string; status: string; categoria: string; nome_snapshot: string; foto_url_snapshot: string | null; observacao: string | null }[] ?? []
  const total = itens.length
  const comprados = itens.filter((i) => i.status === 'comprado').length
  const naoTem = itens.filter((i) => i.status === 'nao_tem').length

  const categorias = Object.keys(CATEGORIA_LABEL) as Array<keyof typeof CATEGORIA_LABEL>
  const grupos = categorias
    .map((cat) => ({
      cat,
      label: CATEGORIA_LABEL[cat],
      itens: itens.filter((i) => i.categoria === cat),
    }))
    .filter((g) => g.itens.length > 0)

  return (
    <div className="max-w-3xl mx-auto">
      {ehFuncionarioCriador && <CelebracaoCompra pedidoId={pedido.id} />}
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <LogoUnidade nomeUnidade={(pedido.unidade as { nome: string } | null)?.nome} size={24} />
            {(pedido.unidade as { nome: string } | null)?.nome ?? pedido.nome_loja}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Concluído em {pedido.concluido_em ? formatDateTime(pedido.concluido_em) : '—'}
            {' · '}por {(pedido.finalizador as { nome: string } | null)?.nome ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/pedidos/${pedido.id}/imprimir`}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Printer size={13} />
            Imprimir
          </Link>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
        <div className="flex rounded-full overflow-hidden h-2 bg-gray-100">
          <div className="bg-green-400" style={{ width: `${(comprados / total) * 100}%` }} />
          <div className="bg-red-400" style={{ width: `${(naoTem / total) * 100}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {total} itens · {comprados} comprados · {naoTem} não tinha
        </p>
      </div>

      {/* Itens por categoria */}
      {grupos.map(({ cat, label, itens: lista }) => (
        <section key={cat} className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            {label}
          </h3>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y divide-gray-50">
                {lista.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 w-12">
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-50">
                        {item.foto_url_snapshot ? (
                          <Image src={item.foto_url_snapshot} alt={item.nome_snapshot} fill sizes="150px" className="object-cover" />
                        ) : (
                          <Package size={14} className="absolute inset-0 m-auto text-gray-200" />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <p className={cn('text-sm text-gray-900', item.status !== 'comprado' && 'line-through text-gray-400')}>
                        {item.nome_snapshot}
                      </p>
                      {item.observacao && (
                        <p className="text-xs text-gray-400">{item.observacao}</p>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {item.status === 'comprado' ? (
                        <Check size={14} className="text-green-500 ml-auto" />
                      ) : (
                        <X size={14} className="text-red-400 ml-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* Reutilizar pedido */}
      <ReutilizarPedidoButton pedidoId={pedido.id} itens={itens} />
    </div>
  )
}
