'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginFormData) {
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.senha,
    })

    if (error) {
      setErro('E-mail ou senha incorretos')
      return
    }

    router.push('/painel')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-mail
        </label>
        <input
          {...register('email')}
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Senha
        </label>
        <div className="relative">
          <input
            {...register('senha')}
            type={verSenha ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••"
            className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setVerSenha(!verSenha)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {verSenha ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.senha && (
          <p className="text-red-500 text-xs mt-1">{errors.senha.message}</p>
        )}
      </div>

      {erro && (
        <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{erro}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        Entrar
      </button>
    </form>
  )
}
