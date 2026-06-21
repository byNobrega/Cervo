import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NovoPedidoWizard } from '@/components/pedidos/NovoPedidoWizard'
export const dynamic = 'force-dynamic'

export default async function NovoPedidoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: subcatsAcessorio },
    { data: acessorios },
    { data: subcatsCapa },
    { data: marcas },
    { data: modelos },
    { data: peliculasMaquina },
    { data: peliculasTradicionais },
    { data: materiais },
  ] = await Promise.all([
    supabase.from('subcategorias_acessorio').select('*').order('nome'),
    supabase.from('acessorios').select('*, subcategoria:subcategorias_acessorio(id, nome)').eq('ativo', true).order('nome'),
    supabase.from('subcategorias_capa').select('*, marcas:subcategoria_capa_marcas(marca:marcas_celular(id, nome))').eq('ativo', true).order('nome'),
    supabase.from('marcas_celular').select('*').order('nome'),
    supabase.from('modelos_celular').select('*, marca:marcas_celular(id, nome)').eq('ativo', true).order('ordem').order('nome'),
    supabase.from('tipos_pelicula_maquina').select('*').order('nome'),
    supabase.from('tipos_pelicula_tradicional').select('*').order('nome'),
    supabase.from('material_loja').select('*').eq('ativo', true).order('nome'),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Novo Pedido</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Selecione os itens que estão faltando
        </p>
      </div>
      <NovoPedidoWizard
        subcatsAcessorio={subcatsAcessorio ?? []}
        acessorios={acessorios ?? []}
        subcatsCapa={subcatsCapa ?? []}
        marcas={marcas ?? []}
        modelos={modelos ?? []}
        peliculasMaquina={peliculasMaquina ?? []}
        peliculasTradicionais={peliculasTradicionais ?? []}
        materiais={materiais ?? []}
        userId={user.id}
      />
    </div>
  )
}
