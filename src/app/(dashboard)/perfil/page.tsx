import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PerfilView } from '@/components/perfil/PerfilView'
export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: unidades }, { data: solicitacoes }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, unidade:unidades!profiles_unidade_id_fkey(id, nome)')
      .eq('id', user.id)
      .single(),
    supabase.from('unidades').select('id, nome').eq('ativo', true).order('nome'),
    supabase
      .from('solicitacoes_perfil')
      .select('id, tipo, status, created_at')
      .eq('solicitante', user.id)
      .eq('status', 'pendente'),
  ])

  if (!profile) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Meu Perfil</h2>
        <p className="text-gray-500 text-sm mt-0.5">Gerencie seus dados e segurança</p>
      </div>
      <PerfilView
        profile={profile}
        unidades={unidades ?? []}
        solicitacoesPendentes={solicitacoes ?? []}
      />
    </div>
  )
}
