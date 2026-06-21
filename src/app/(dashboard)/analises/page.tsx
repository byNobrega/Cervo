import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calcularMetricas, inicioDoPeriodo, type PedidoAnalise } from '@/lib/analises'
import { SeletorPeriodo } from '@/components/analises/SeletorPeriodo'
import { AnalisesDashboard } from '@/components/analises/AnalisesDashboard'
export const dynamic = 'force-dynamic'

interface SearchParams {
  periodo?: string
  inicio?: string
}

export default async function AnalisesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', user.id)
    .single()

  if (!['gerente', 'dono'].includes(profile?.cargo ?? '')) redirect('/painel')

  const periodo = searchParams.periodo ?? '30'
  const inicio = inicioDoPeriodo(periodo, searchParams.inicio)

  // RLS de pedidos já filtra por minhas_unidades(): gerente vê só as suas, dono vê tudo.
  let query = supabase
    .from('pedidos')
    .select('id, status, created_at, itens:pedido_itens(categoria, nome_snapshot, status)')
    .order('created_at', { ascending: true })

  if (inicio) query = query.gte('created_at', inicio)

  const { data: pedidos } = await query

  const metricas = calcularMetricas((pedidos ?? []) as unknown as PedidoAnalise[])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Análises</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Métricas e insights sobre os pedidos
          {profile?.cargo === 'gerente' && ' das suas unidades'}
        </p>
      </div>

      <SeletorPeriodo periodoAtual={periodo} inicioAtual={searchParams.inicio} />

      <AnalisesDashboard metricas={metricas} />
    </div>
  )
}
