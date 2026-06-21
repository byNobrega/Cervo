import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calcularAlertas } from '@/app/actions/alertas'
import { AlertasList } from '@/components/alertas/AlertasList'
import { type Alerta } from '@/types'
export const dynamic = 'force-dynamic'

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cargo')
    .eq('id', user.id)
    .single()

  if (!['gerente', 'dono'].includes(profile?.cargo ?? '')) redirect('/painel')

  const { data: alertas } = await supabase
    .from('alertas')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Alertas</h2>
          <p className="text-gray-500 text-sm mt-0.5">Tendências e padrões de compra</p>
        </div>
        <form action={calcularAlertas}>
          <button
            type="submit"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Recalcular
          </button>
        </form>
      </div>
      <AlertasList alertas={(alertas ?? []) as Alerta[]} />
    </div>
  )
}
