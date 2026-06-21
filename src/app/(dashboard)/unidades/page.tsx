import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Store, ChevronRight } from 'lucide-react'
import { GerenciarUnidades } from '@/components/unidades/GerenciarUnidades'
import { LogoUnidade, ehTopShopping } from '@/components/shared/LogoUnidade'
export const dynamic = 'force-dynamic'

export default async function UnidadesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', user.id)
    .single()

  const cargo = profile?.cargo ?? 'funcionario'
  const ehDono = cargo === 'dono'

  // RLS já filtra: dono vê todas, gerente vê só as suas.
  const { data: unidades } = await supabase
    .from('unidades')
    .select('*')
    .order('nome')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Unidades</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          {ehDono ? 'Todas as lojas do sistema' : 'Lojas que você gerencia'}
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
              {ehTopShopping(u.nome) ? (
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
