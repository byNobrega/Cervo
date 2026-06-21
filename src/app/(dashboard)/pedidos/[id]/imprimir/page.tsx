import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { CATEGORIA_LABEL } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import { Package } from 'lucide-react'
import { BotoesImpressao } from '@/components/pedidos/BotoesImpressao'
export const dynamic = 'force-dynamic'

export default async function ImprimirPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pedido } = await supabase
    .from('pedidos')
    .select(`
      *,
      criador:profiles!pedidos_criado_por_fkey(nome),
      unidade:unidades(nome),
      itens:pedido_itens(*)
    `)
    .eq('id', params.id)
    .single()

  if (!pedido) redirect('/pedidos')

  const itens = pedido.itens as {
    id: string; categoria: string; nome_snapshot: string;
    foto_url_snapshot: string | null; observacao: string | null; status: string
  }[] ?? []

  const categorias = Object.keys(CATEGORIA_LABEL)
  const grupos = categorias
    .map((cat) => ({
      label: CATEGORIA_LABEL[cat as keyof typeof CATEGORIA_LABEL],
      itens: itens.filter((i) => i.categoria === cat),
    }))
    .filter((g) => g.itens.length > 0)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Botões interativos (client component; ocultos na impressão) */}
      <BotoesImpressao />

      {/* Cabeçalho */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {(pedido.unidade as { nome: string } | null)?.nome ?? pedido.nome_loja}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Data: {formatDateTime(pedido.created_at)} ·
          Criado por: {(pedido.criador as { nome: string })?.nome}
        </p>
      </div>

      {/* Tabela de itens por categoria */}
      {grupos.map(({ label, itens: lista }) => (
        <section key={label} className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            {label}
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-3 font-medium text-gray-500 w-12">Foto</th>
                <th className="text-left py-2 font-medium text-gray-500">Item</th>
                <th className="text-left py-2 font-medium text-gray-500 w-28">Status</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-2 pr-3">
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-50">
                      {item.foto_url_snapshot ? (
                        <Image src={item.foto_url_snapshot} alt={item.nome_snapshot} fill sizes="150px" className="object-cover" />
                      ) : (
                        <Package size={14} className="absolute inset-0 m-auto text-gray-200" />
                      )}
                    </div>
                  </td>
                  <td className="py-2">
                    <p className="text-gray-900">{item.nome_snapshot}</p>
                    {item.observacao && (
                      <p className="text-xs text-gray-400">{item.observacao}</p>
                    )}
                  </td>
                  <td className="py-2">
                    <span className={
                      item.status === 'comprado' ? 'text-green-600 font-medium' :
                      item.status === 'nao_tem' ? 'text-red-500 font-medium' :
                      'text-gray-400'
                    }>
                      {item.status === 'comprado' ? '✓ Comprado' :
                       item.status === 'nao_tem' ? '✗ Não tem' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <p className="text-xs text-gray-300 text-center mt-8">
        CÊRVO · Sistema de Gestão de Pedidos
      </p>
    </div>
  )
}
