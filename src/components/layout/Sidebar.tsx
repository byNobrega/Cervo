'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Package,
  Lightbulb,
  Users,
  Smartphone,
  Bell,
  Store,
  BarChart3,
  UserCircle,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  cargos: string[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/painel',
    label: 'Painel',
    icon: <LayoutDashboard size={18} />,
    cargos: ['dono', 'gerente', 'funcionario'],
  },
  {
    href: '/pedidos',
    label: 'Pedidos',
    icon: <ShoppingCart size={18} />,
    cargos: ['dono', 'gerente', 'funcionario'],
  },
  {
    href: '/historico',
    label: 'Histórico',
    icon: <History size={18} />,
    cargos: ['dono', 'gerente', 'funcionario'],
  },
  {
    href: '/unidades',
    label: 'Unidades',
    icon: <Store size={18} />,
    cargos: ['dono', 'gerente'],
  },
  {
    href: '/analises',
    label: 'Análises',
    icon: <BarChart3 size={18} />,
    cargos: ['dono', 'gerente'],
  },
  {
    href: '/catalogo',
    label: 'Catálogo',
    icon: <Package size={18} />,
    cargos: ['dono', 'gerente', 'funcionario'],
  },
  {
    href: '/sugestoes',
    label: 'Sugestões',
    icon: <Lightbulb size={18} />,
    cargos: ['dono', 'gerente', 'funcionario'],
  },
  {
    href: '/alertas',
    label: 'Alertas',
    icon: <Bell size={18} />,
    cargos: ['dono', 'gerente'],
  },
  {
    href: '/usuarios',
    label: 'Usuários',
    icon: <Users size={18} />,
    cargos: ['dono'],
  },
  {
    href: '/modelos',
    label: 'Modelos',
    icon: <Smartphone size={18} />,
    cargos: ['dono', 'gerente'],
  },
]

interface SidebarProps {
  aberta: boolean
  onFechar: () => void
}

export function Sidebar({ aberta, onFechar }: SidebarProps) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const cargo = profile?.cargo ?? ''

  const itensVisiveis = NAV_ITEMS.filter((item) =>
    item.cargos.includes(cargo)
  )

  return (
    <>
      {/* Overlay mobile */}
      {aberta && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={onFechar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-100 z-40 flex flex-col transition-transform duration-200',
          'md:translate-x-0 md:static md:z-auto',
          aberta ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header da sidebar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Image
            src="/logo-cervo.png"
            alt="CÊRVO"
            width={96}
            height={64}
            priority
            className="object-contain"
          />
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar menu"
            title="Fechar menu"
            className="md:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {itensVisiveis.map((item) => {
            const ativo = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onFechar}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  ativo
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span className={ativo ? 'text-blue-600' : 'text-gray-400'}>
                  {item.icon}
                </span>
                {item.label}
                {ativo && (
                  <ChevronRight size={14} className="ml-auto text-blue-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer: Meu Perfil (clicável) + Sair */}
        <div className="px-3 py-3 border-t border-gray-100">
          <Link
            href="/perfil"
            onClick={onFechar}
            className={cn(
              'flex items-center gap-3 px-2 py-2 rounded-lg mb-1 transition-colors',
              pathname.startsWith('/perfil') ? 'bg-blue-50' : 'hover:bg-gray-50'
            )}
            title="Meu Perfil"
          >
            <div className="relative w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-medium overflow-hidden flex-shrink-0">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile?.nome ?? ''} fill sizes="40px" className="object-cover" />
              ) : (
                profile?.nome?.charAt(0).toUpperCase() ?? '?'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile?.nome}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <UserCircle size={11} /> Meu Perfil
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 w-full px-2 py-1 transition-colors"
          >
            <LogOut size={13} />
            Sair
          </button>
          <p className="text-[10px] text-gray-300 text-center mt-2">
            Cervo · v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
