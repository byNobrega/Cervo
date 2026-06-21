'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Notificacao } from '@/types'

export function useNotificacoes(userId: string | undefined) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    // Busca inicial
    supabase
      .from('notificacoes')
      .select('*')
      .eq('para_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) {
          setNotificacoes(data as Notificacao[])
          setNaoLidas(data.filter((n) => !n.lida).length)
        }
      })

    // Realtime: ouve novas notificações
    const channel = supabase
      .channel(`notificacoes:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `para_id=eq.${userId}`,
        },
        (payload) => {
          const nova = payload.new as Notificacao
          setNotificacoes((prev) => [nova, ...prev])
          setNaoLidas((n) => n + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  async function marcarComoLida(id: string) {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    )
    setNaoLidas((n) => Math.max(0, n - 1))
  }

  async function marcarTodasComoLidas() {
    if (!userId) return
    await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('para_id', userId)
      .eq('lida', false)
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
    setNaoLidas(0)
  }

  return { notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas }
}
