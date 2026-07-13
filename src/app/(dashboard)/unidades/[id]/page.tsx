import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { UnidadeDashboard } from '@/components/unidades/UnidadeDashboard'
import { LogoUnidade, temLogoUnidade } from '@/components/shared/LogoUnidade'
export const dynamic = 'force-dynamic'

export default async function UnidadePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', user.id)
    .single()
  const cargo = profile?.cargo ?? 'funcionario'

  // A unidade (RLS garante que o usuário só acessa as suas)
  const { data: unidade } = await supabase
    .from('unidades')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!unidade) redirect('/unidades')

  // Funcionários/gerentes da unidade
  const { data: funcionarios } = await supabase
    .from('profiles')
    .select('id, nome, cargo, whatsapp, status')
    .eq('unidade_id', params.id)
    .order('nome')

  // Pedidos da unidade (em aberto e concluídos recentes)
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('id, status, created_at, criador:profiles!pedidos_criado_por_fkey(nome), itens:pedido_itens(id, status)')
    .eq('unidade_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // IDs dos membros da unidade, para filtrar sugestões pendentes feitas por eles
  const idsMembros = (funcionarios ?? []).map((f) => f.id)
  let sugestoes: { id: string; nome: string; tipo: string; sugeridor: { nome: string } | null }[] = []
  if (idsMembros.length > 0) {
    const { data } = await supabase
      .from('sugestoes')
      .select('id, nome, tipo, sugeridor:profiles!sugestoes_sugerido_por_fkey(nome)')
      .eq('status', 'pendente')
      .in('sugerido_por', idsMembros)
      .order('created_at', { ascending: false })
    sugestoes = (data as unknown as typeof sugestoes) ?? []
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/unidades"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft size={16} />
        Unidades
      </Link>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          {temLogoUnidade(unidade.nome) ? (
            <LogoUnidade nomeUnidade={unidade.nome} size={26} />
          ) : (
            '🏪'
          )}
          {unidade.nome}
        </h2>
        {unidade.endereco && <p className="text-gray-500 text-sm mt-0.5">{unidade.endereco}</p>}
      </div>

      <UnidadeDashboard
        unidadeId={unidade.id}
        cargo={cargo}
        funcionarios={funcionarios ?? []}
        pedidos={(pedidos as never) ?? []}
        sugestoes={sugestoes}
      />
    </div>
  )
}
