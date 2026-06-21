import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CapaCard } from '@/components/catalogo/CapaCard'
import { AdicionarCapaForm } from '@/components/catalogo/AdicionarCapaForm'
export const dynamic = 'force-dynamic'

export default async function CapasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: subcategorias }, { data: perfil }, { data: marcas }] = await Promise.all([
    supabase
      .from('subcategorias_capa')
      .select(`
        *,
        marcas:subcategoria_capa_marcas(marca:marcas_celular(id, nome))
      `)
      .eq('ativo', true)
      .order('nome'),
    supabase.from('profiles').select('cargo').eq('id', user.id).single(),
    supabase.from('marcas_celular').select('id, nome').order('nome'),
  ])

  const podeGerenciar = ['gerente', 'dono'].includes(perfil?.cargo ?? '')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Capas</h2>
        <p className="text-gray-500 text-sm mt-0.5">Subcategorias de capas disponíveis</p>
      </div>

      <div className="space-y-1.5">
        {(subcategorias ?? []).map((sub) => {
          const marcas = sub.marcas?.map((m: { marca: { nome: string } }) => m.marca?.nome).filter(Boolean) ?? []
          return (
            <CapaCard
              key={sub.id}
              id={sub.id}
              nome={sub.nome}
              fotoUrl={sub.foto_url}
              marcas={marcas}
              podeGerenciar={podeGerenciar}
            />
          )
        })}
      </div>

      {(subcategorias ?? []).length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          Nenhuma subcategoria de capa cadastrada
        </div>
      )}

      {podeGerenciar && (
        <div className="mt-4">
          <AdicionarCapaForm marcas={marcas ?? []} />
        </div>
      )}
    </div>
  )
}
