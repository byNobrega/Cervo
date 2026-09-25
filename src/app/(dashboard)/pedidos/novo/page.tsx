import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NovoPedidoWizard } from '@/components/pedidos/NovoPedidoWizard'
import { unidadesDisponiveis } from '@/lib/unidades'
import { type Cargo } from '@/types'
export const dynamic = 'force-dynamic'

export default async function NovoPedidoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Para qual loja vai a lista: o dono não tem unidade base (as listas dele
  // saíam sem unidade, aparecendo como "Loja Alce"), então ele escolhe na tela.
  const { data: perfil } = await supabase
    .from('profiles')
    .select('cargo, unidade_id')
    .eq('id', user.id)
    .single()

  const opcoesUnidade = await unidadesDisponiveis(
    supabase,
    user.id,
    (perfil?.cargo as Cargo) ?? null,
    perfil?.unidade_id ?? null
  )

  // Já vem marcada a loja do próprio usuário, quando ele tem uma.
  const unidadePadraoId =
    opcoesUnidade.find((u) => u.id === perfil?.unidade_id)?.id ??
    (opcoesUnidade.length === 1 ? opcoesUnidade[0].id : null)

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
        opcoesUnidade={opcoesUnidade}
        unidadePadraoId={unidadePadraoId}
      />
    </div>
  )
}
