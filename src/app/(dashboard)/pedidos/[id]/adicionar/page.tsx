import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { NovoPedidoWizard } from '@/components/pedidos/NovoPedidoWizard'
import { chaveItemPedido } from '@/lib/itemKey'
export const dynamic = 'force-dynamic'

export default async function AdicionarItensPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Pedido + cargo, para validar a permissão antes de carregar o catálogo.
  const [{ data: pedido }, { data: perfil }] = await Promise.all([
    supabase
      .from('pedidos')
      .select(`
        id, criado_por, status,
        unidade:unidades(nome),
        itens:pedido_itens(categoria, acessorio_id, subcapa_id, modelo_id, tipo_peli_maq_id, tipo_peli_trad_id, material_id, nome_snapshot)
      `)
      .eq('id', params.id)
      .single(),
    supabase.from('profiles').select('cargo').eq('id', user.id).single(),
  ])

  if (!pedido) redirect('/pedidos')
  // Pedido já comprado é imutável → manda para o histórico.
  if (pedido.status !== 'aberta') redirect(`/historico/${params.id}`)
  // Só dono ou quem criou a lista pode adicionar itens.
  const podeAdicionar = perfil?.cargo === 'dono' || pedido.criado_por === user.id
  if (!podeAdicionar) redirect(`/pedidos/${params.id}`)

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

  const unidadeNome = (pedido.unidade as unknown as { nome: string } | null)?.nome ?? null

  // Chaves dos itens que já estão no pedido, para o wizard avisar sobre duplicatas.
  const itensExistentes = (pedido.itens as unknown as Parameters<typeof chaveItemPedido>[0][]) ?? []
  const chavesExistentes = itensExistentes.map(chaveItemPedido)

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/pedidos/${params.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
      >
        <ChevronLeft size={16} />
        Voltar ao pedido
      </Link>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Adicionar itens</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          {unidadeNome ? `${unidadeNome} · ` : ''}os itens novos entram marcados com a data de hoje
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
        pedidoExistenteId={params.id}
        chavesExistentes={chavesExistentes}
      />
    </div>
  )
}
