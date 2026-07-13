'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notificarCadastroPendente } from '@/app/actions/usuarios'
import { cadastroSchema, type CadastroFormData } from '@/lib/validations'
import { type Unidade } from '@/types'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

export function CadastroForm() {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [verSenha, setVerSenha] = useState(false)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormData>({ resolver: zodResolver(cadastroSchema) })

  // Carrega as unidades disponíveis para o dropdown
  useEffect(() => {
    supabase
      .from('unidades')
      .select('*')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => setUnidades(data ?? []))
  }, [supabase])

  async function onSubmit(data: CadastroFormData) {
    setErro('')
    // Email é opcional para o usuário, mas o Supabase Auth exige um email.
    // Se não informado, gera um placeholder a partir do WhatsApp.
    const emailLogin = data.email && data.email.trim()
      ? data.email.trim()
      : `user${data.whatsapp}@cervo.com.br`

    const { error } = await supabase.auth.signUp({
      email: emailLogin,
      password: data.senha,
      options: {
        data: {
          nome: data.nome,
          cargo: data.cargo,
          whatsapp: data.whatsapp,
          unidade_id: data.unidade_id,
        },
      },
    })

    if (error) {
      console.error('[Cadastro] erro do signUp:', error)
      if (error.message.includes('already registered')) {
        setErro('Este e-mail já está cadastrado')
      } else {
        setErro(`Erro ao criar conta: ${error.message}`)
      }
      return
    }

    // Avisa o dono (app + WhatsApp) que há um novo cadastro pendente.
    // Não bloqueia o fluxo se falhar — o cadastro já foi criado.
    try {
      const unidadeNome = unidades.find((u) => u.id === data.unidade_id)?.nome ?? null
      await notificarCadastroPendente({
        nome: data.nome,
        cargo: data.cargo,
        unidadeNome,
      })
    } catch (e) {
      console.error('[Cadastro] falha ao notificar o dono:', e)
    }

    setSucesso(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  if (sucesso) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">Cadastro enviado!</h3>
        <p className="text-sm text-gray-500">
          Aguarde a aprovação do administrador. Você será redirecionado em
          instantes.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome completo
        </label>
        <input
          {...register('nome')}
          type="text"
          placeholder="Seu nome"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.nome && (
          <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cargo
        </label>
        <select
          {...register('cargo')}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">Selecione...</option>
          <option value="funcionario">Funcionário</option>
          <option value="gerente">Gerente</option>
        </select>
        {errors.cargo && (
          <p className="text-red-500 text-xs mt-1">{errors.cargo.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          WhatsApp
        </label>
        <input
          {...register('whatsapp')}
          type="tel"
          placeholder="11999999999"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.whatsapp && (
          <p className="text-red-500 text-xs mt-1">{errors.whatsapp.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Unidade
        </label>
        <select
          {...register('unidade_id')}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">Selecione a loja...</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
        {errors.unidade_id && (
          <p className="text-red-500 text-xs mt-1">{errors.unidade_id.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-mail <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <input
          {...register('email')}
          type="email"
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
            placeholder="Mínimo 6 caracteres"
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar senha
        </label>
        <input
          {...register('confirmarSenha')}
          type="password"
          placeholder="Repita a senha"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.confirmarSenha && (
          <p className="text-red-500 text-xs mt-1">
            {errors.confirmarSenha.message}
          </p>
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
        Criar conta
      </button>
    </form>
  )
}
