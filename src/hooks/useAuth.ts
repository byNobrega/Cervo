'use client'

import { useEffect, useState } from 'react'
import { type User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { type Profile } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchProfile(user.id)
      else setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else {
          setProfile(null)
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setIsLoading(false)
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[useAuth] erro no signOut:', err)
    }
    // Hard redirect para o login: garante que toda a sessão/estado em memória
    // seja descartada e o middleware revalide do zero. Evita a tela "congelada".
    window.location.href = '/login'
  }

  const cargo = profile?.cargo ?? (user?.app_metadata?.cargo as string | undefined)
  const status = profile?.status ?? (user?.app_metadata?.status as string | undefined)

  return {
    user,
    profile,
    isLoading,
    signOut,
    isDono: cargo === 'dono',
    isGerente: cargo === 'gerente',
    isFuncionario: cargo === 'funcionario',
    isAprovado: status === 'aprovado',
  }
}
