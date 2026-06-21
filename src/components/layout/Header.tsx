'use client'

import { Menu } from 'lucide-react'
import { NotificationBell } from './NotificationBell'

interface HeaderProps {
  onAbrirSidebar: () => void
  titulo?: string
}

export function Header({ onAbrirSidebar, titulo }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 sticky top-0 z-20">
      <button
        onClick={onAbrirSidebar}
        className="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {titulo && (
        <h1 className="text-sm font-semibold text-gray-900 hidden md:block">
          {titulo}
        </h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
      </div>
    </header>
  )
}
