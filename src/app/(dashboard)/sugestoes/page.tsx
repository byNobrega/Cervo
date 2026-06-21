import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SugestaoReviewList } from '@/components/sugestoes/SugestaoReviewList'
import { MinhasSugestoesList } from '@/components/sugestoes/MinhasSugestoesList'
export const dynamic = 'force-dynamic'

export default async function SugestoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', user.id)
    .single()

  const cargo = profile?.cargo ?? 'funcionario'

  // Funcionário: vê APENAS as próprias sugestões (pendentes/aprovadas/negadas).
  if (cargo === 'funcionario') {
    const [{ data: minhas }, { data: subcategorias }, { data: marcas }] = await Promise.all([
      supabase
        .from('sugestoes')
        .select('*, subcategoria:subcategorias_acessorio(nome)')
        .eq('sugerido_por', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('subcategorias_acessorio').select('id, nome').order('nome'),
      supabase.from('marcas_celular').select('id, nome').order('nome'),
    ])

    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Minhas Sugestões</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Itens que você sugeriu e o status de cada um
          </p>
        </div>
        <MinhasSugestoesList
          sugestoes={minhas ?? []}
          subcategorias={subcategorias ?? []}
          marcas={marcas ?? []}
        />
      </div>
    )
  }

  // Gerente/Dono: tela de revisão (aprovar/recusar).
  const [{ data: pendentes }, { data: revisadas }] = await Promise.all([
    supabase
      .from('sugestoes')
      .select('*, sugeridor:profiles!sugestoes_sugerido_por_fkey(nome), subcategoria:subcategorias_acessorio(nome), marca_rel:marcas_celular(nome)')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false }),
    supabase
      .from('sugestoes')
      .select('*, sugeridor:profiles!sugestoes_sugerido_por_fkey(nome), subcategoria:subcategorias_acessorio(nome), marca_rel:marcas_celular(nome)')
      .neq('status', 'pendente')
      .order('revisado_em', { ascending: false })
      .limit(20),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Sugestões</h2>
        <p className="text-gray-500 text-sm mt-0.5">Aprove ou recuse itens sugeridos</p>
      </div>
      <SugestaoReviewList pendentes={pendentes ?? []} revisadas={revisadas ?? []} />
    </div>
  )
}
