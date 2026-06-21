'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { useNotificacoes } from '@/hooks/useNotificacoes'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { user } = useAuth()
  const { notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas } =
    useNotificacoes(user?.id)
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto(!aberto)}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {naoLidas > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">
              Notificações
            </span>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <Check size={12} />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Nenhuma notificação
              </div>
            ) : (
              notificacoes.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer',
                    !n.lida && 'bg-blue-50/50'
                  )}
                  onClick={() => {
                    if (!n.lida) marcarComoLida(n.id)
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !n.lida ? 'font-medium text-gray-900' : 'text-gray-600')}>
                        {n.titulo}
                      </p>
                      {n.mensagem && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {n.mensagem}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-300 mt-1">
                        {formatDateTime(n.created_at)}
                      </p>
                    </div>
                    {!n.lida && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                  {n.link && (
                    <Link
                      href={n.link}
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver →
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
