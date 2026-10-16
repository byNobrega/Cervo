import { createClient, createAdminClient } from '@/lib/supabase/server'
import { unidadesVisiveis } from '@/lib/unidadesAcesso'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Store, ChevronRight } from 'lucide-react'
import { GerenciarUnidades } from '@/components/unidades/GerenciarUnidades'
import { LogoUnidade, temLogoUnidade } from '@/components/shared/LogoUnidade'
export const dynamic = 'force-dynamic'

export default async function UnidadesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cargo, unidade_id')
    .eq('id', user.id)
    .single()

  const cargo = profile?.cargo ?? 'funcionario'
  const ehDono = cargo === 'dono'

  // O RLS de unidades libera leitura a todos (o cadastro precisa listar as
  // lojas), então o filtro é feito aqui: dono vê todas, gerente as que
  // gerencia, funcionário só a dele.
  const admin = await createAdminClient()
  const visiveis = await unidadesVisiveis(admin, {
    id: user.id,
    cargo,
    unidade_id: profile?.unidade_id ?? null,
  })
  let consulta = supabase.from('unidades').select('*').order('nome')
  if (visiveis !== null) {
    // lista vazia: nenhuma unidade (o .in() com [] não filtra no PostgREST)
    consulta = consulta.in('id', visiveis.length ? visiveis : ['00000000-0000-0000-0000-000000000000'])
  }
  const { data: unidades } = await consulta

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Unidades</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          {ehDono
            ? 'Todas as lojas do sistema'
            : cargo === 'gerente'
              ? 'Lojas que você gerencia'
              : (unidades ?? []).length > 1
                ? 'Suas lojas e seus colegas de trabalho'
                : 'Sua loja e seus colegas de trabalho'}
        </p>
      </div>

      <div className="space-y-3">
        {(unidades ?? []).map((u) => (
          <Link
            key={u.id}
            href={`/unidades/${u.id}`}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {temLogoUnidade(u.nome) ? (
                <LogoUnidade nomeUnidade={u.nome} size={40} />
              ) : (
                <Store size={18} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{u.nome}</p>
              {u.endereco && <p className="text-xs text-gray-400 truncate">{u.endereco}</p>}
              {!u.ativo && <span className="text-[11px] text-red-500">inativa</span>}
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </Link>
        ))}

        {(unidades ?? []).length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">
            <Store size={40} className="mx-auto mb-3 opacity-30" />
            Nenhuma unidade {ehDono ? 'cadastrada' : 'atribuída a você'}
          </div>
        )}
      </div>

      {/* Apenas o dono pode criar/gerenciar unidades */}
      {ehDono && <GerenciarUnidades />}
    </div>
  )
}
