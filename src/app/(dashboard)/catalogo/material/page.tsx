import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MaterialCatalogo } from '@/components/catalogo/MaterialCatalogo'
export const dynamic = 'force-dynamic'

export default async function MaterialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: materiais }, { data: profile }] = await Promise.all([
    supabase.from('material_loja').select('*').eq('ativo', true).order('nome'),
    supabase.from('profiles').select('cargo').eq('id', user.id).single(),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Material de Loja</h2>
        <p className="text-gray-500 text-sm mt-0.5">Materiais e embalagens utilizados na loja</p>
      </div>
      <MaterialCatalogo
        materiais={materiais ?? []}
        cargo={profile?.cargo ?? 'funcionario'}
      />
    </div>
  )
}
