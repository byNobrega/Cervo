import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModelosList } from '@/components/modelos/ModelosList'
export const dynamic = 'force-dynamic'

export default async function ModelosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', user.id)
    .single()

  if (!['gerente', 'dono'].includes(profile?.cargo ?? '')) redirect('/painel')

  const [{ data: marcas }, { data: modelos }] = await Promise.all([
    supabase.from('marcas_celular').select('*').order('nome'),
    supabase
      .from('modelos_celular')
      .select('*, marca:marcas_celular(id, nome)')
      .order('ordem')
      .order('nome'),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Modelos de Celular</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Gerencie os modelos disponíveis para capas e películas
        </p>
      </div>
      <ModelosList marcas={marcas ?? []} modelos={modelos ?? []} />
    </div>
  )
}
