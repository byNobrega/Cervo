import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PedidoView } from '@/components/pedidos/PedidoView'
export const dynamic = 'force-dynamic'

export default async function PedidoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: pedido }, { data: profile }] = await Promise.all([
    supabase
      .from('pedidos')
      .select(`
        *,
        criador:profiles!pedidos_criado_por_fkey(nome),
        unidade:unidades(nome),
        itens:pedido_itens(
          *,
          acessorio:acessorios(subcategoria:subcategorias_acessorio(nome)),
          modelo:modelos_celular(nome, ordem, marca:marcas_celular(nome))
        )
      `)
      .eq('id', params.id)
      .single(),
    supabase.from('profiles').select('cargo').eq('id', user.id).single(),
  ])

  if (!pedido) redirect('/pedidos')

  // Redireciona pedido concluído para histórico
  if (pedido.status === 'concluida') {
    redirect(`/historico/${params.id}`)
  }

  return (
    <PedidoView
      pedido={pedido}
      cargo={profile?.cargo ?? 'funcionario'}
      userId={user.id}
    />
  )
}
