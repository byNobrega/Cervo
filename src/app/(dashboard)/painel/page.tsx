import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, History, Package, Users, Bell, Lightbulb } from 'lucide-react'
export const dynamic = 'force-dynamic'

export default async function PainelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'aprovado') redirect('/aguardando')

  const cargo = profile.cargo

  // Buscar contagens relevantes
  const [pedidosAbertos, sugestoesPendentes, usuariosPendentes, alertasAtivos] = await Promise.all([
    supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('status', 'aberta'),
    cargo !== 'funcionario'
      ? supabase.from('sugestoes').select('id', { count: 'exact', head: true }).eq('status', 'pendente')
      : Promise.resolve({ count: 0 }),
    cargo === 'dono'
      ? supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pendente')
      : Promise.resolve({ count: 0 }),
    cargo !== 'funcionario'
      ? supabase.from('alertas').select('id', { count: 'exact', head: true }).eq('resolvido', false)
      : Promise.resolve({ count: 0 }),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Olá, {profile.nome.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Bem-vindo ao sistema de pedidos do CÊRVO
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          href="/pedidos"
          icon={<ShoppingCart className="text-blue-500" size={20} />}
          label="Pedidos abertos"
          valor={pedidosAbertos.count ?? 0}
          cor="blue"
        />
        <StatCard
          href="/historico"
          icon={<History className="text-gray-400" size={20} />}
          label="Histórico"
          valor={null}
          cor="gray"
        />
        <StatCard
          href="/catalogo"
          icon={<Package className="text-purple-500" size={20} />}
          label="Catálogo"
          valor={null}
          cor="purple"
        />
        {cargo !== 'funcionario' && (
          <StatCard
            href="/sugestoes"
            icon={<Lightbulb className="text-yellow-500" size={20} />}
            label="Sugestões"
            valor={sugestoesPendentes.count ?? 0}
            badge={sugestoesPendentes.count ? 'Pendentes' : undefined}
            cor="yellow"
          />
        )}
        {cargo === 'funcionario' && (
          <StatCard
            href="/sugestoes"
            icon={<Lightbulb className="text-yellow-500" size={20} />}
            label="Minhas Sugestões"
            valor={null}
            cor="yellow"
          />
        )}
        {cargo !== 'funcionario' && (
          <StatCard
            href="/alertas"
            icon={<Bell className="text-red-400" size={20} />}
            label="Alertas"
            valor={alertasAtivos.count ?? 0}
            badge={alertasAtivos.count ? 'Ativos' : undefined}
            cor="red"
          />
        )}
        {cargo === 'dono' && (
          <StatCard
            href="/usuarios"
            icon={<Users className="text-green-500" size={20} />}
            label="Usuários"
            valor={usuariosPendentes.count ?? 0}
            badge={usuariosPendentes.count ? 'Pendentes' : undefined}
            cor="green"
          />
        )}
      </div>

      {cargo === 'funcionario' && (
        <div className="mt-6">
          <Link
            href="/pedidos/novo"
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <ShoppingCart size={18} />
            Criar novo pedido
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({
  href,
  icon,
  label,
  valor,
  badge,
}: {
  href: string
  icon: React.ReactNode
  label: string
  valor: number | null
  badge?: string
  cor: string
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
          {icon}
        </div>
        {badge && valor ? (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
            {valor} {badge}
          </span>
        ) : null}
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {valor !== null ? valor : '→'}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </Link>
  )
}
