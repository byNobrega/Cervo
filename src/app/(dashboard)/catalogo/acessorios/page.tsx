import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcessoriosCatalogo } from '@/components/catalogo/AcessoriosCatalogo'
export const dynamic = 'force-dynamic'

export default async function AcessoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: subcategorias }, { data: acessorios }, { data: profile }] = await Promise.all([
    supabase.from('subcategorias_acessorio').select('*').order('nome'),
    supabase
      .from('acessorios')
      .select('*, subcategoria:subcategorias_acessorio(id, nome)')
      .eq('ativo', true)
      .order('nome'),
    supabase.from('profiles').select('cargo').eq('id', user.id).single(),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Acessórios</h2>
        <p className="text-gray-500 text-sm mt-0.5">Catálogo de acessórios da loja</p>
      </div>
      <AcessoriosCatalogo
        subcategorias={subcategorias ?? []}
        acessorios={acessorios ?? []}
        cargo={profile?.cargo ?? 'funcionario'}
      />
    </div>
  )
}
