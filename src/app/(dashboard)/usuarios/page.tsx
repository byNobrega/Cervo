import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsuariosList } from '@/components/usuarios/UsuariosList'
import { SolicitacoesPerfilList, type SolicitacaoPerfil } from '@/components/perfil/SolicitacoesPerfilList'
export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', user.id)
    .single()

  if (profile?.cargo !== 'dono') redirect('/painel')

  const [{ data: usuarios }, { data: unidades }, { data: solicitacoesRaw }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, unidade:unidades!profiles_unidade_id_fkey(id, nome)')
      .neq('id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('unidades').select('id, nome').eq('ativo', true).order('nome'),
    supabase
      .from('solicitacoes_perfil')
      .select(`
        id, tipo, cargo_novo, cargo_atual, status,
        solicitante_rel:profiles!solicitacoes_perfil_solicitante_fkey(nome),
        unidade_atual_rel:unidades!solicitacoes_perfil_unidade_atual_fkey(nome),
        unidade_nova_rel:unidades!solicitacoes_perfil_unidade_nova_fkey(nome)
      `)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false }),
  ])

  const solicitacoes: SolicitacaoPerfil[] = (solicitacoesRaw ?? []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    tipo: s.tipo as 'cargo' | 'unidade',
    cargo_novo: (s.cargo_novo as string) ?? null,
    cargo_atual: (s.cargo_atual as string) ?? null,
    status: s.status as string,
    solicitante_nome: (s.solicitante_rel as { nome: string } | null)?.nome ?? null,
    unidade_atual_nome: (s.unidade_atual_rel as { nome: string } | null)?.nome ?? null,
    unidade_nova_nome: (s.unidade_nova_rel as { nome: string } | null)?.nome ?? null,
  }))

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Usuários</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Gerencie o acesso dos colaboradores
        </p>
      </div>
      <SolicitacoesPerfilList solicitacoes={solicitacoes} />
      <UsuariosList usuarios={usuarios ?? []} unidades={unidades ?? []} />
    </div>
  )
}
