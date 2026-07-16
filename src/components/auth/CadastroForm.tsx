'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notificarCadastroPendente } from '@/app/actions/usuarios'
import { enviarCodigoVerificacao, validarCodigoVerificacao } from '@/app/actions/verificacao'
import { cadastroSchema, type CadastroFormData } from '@/lib/validations'
import { type Unidade } from '@/types'
import { Eye, EyeOff, Loader2, CheckCircle, MessageCircle, ChevronLeft } from 'lucide-react'

export function CadastroForm() {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [verSenha, setVerSenha] = useState(false)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  // Etapa de confirmação do número por WhatsApp (antes de criar a conta)
  const [etapaCodigo, setEtapaCodigo] = useState(false)
  const [dadosPendentes, setDadosPendentes] = useState<CadastroFormData | null>(null)
  const [codigo, setCodigo] = useState('')
  const [infoCodigo, setInfoCodigo] = useState('')
  const [enviandoCodigo, setEnviandoCodigo] = useState(false)
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

  // ETAPA 1: valida o form e dispara o código de confirmação no WhatsApp.
  // A conta só é criada depois que o código for confirmado (etapa 2).
  async function onSubmit(data: CadastroFormData) {
    setErro('')
    setEnviandoCodigo(true)
    try {
      const r = await enviarCodigoVerificacao(data.whatsapp)
      if (!r.ok) {
        setErro(r.mensagem)
        return
      }
      setDadosPendentes(data)
      setInfoCodigo(r.mensagem)
      setEtapaCodigo(true)
    } finally {
      setEnviandoCodigo(false)
    }
  }

  // Reenvia o código para o mesmo número.
  async function reenviarCodigo() {
    if (!dadosPendentes) return
    setErro('')
    setEnviandoCodigo(true)
    try {
      const r = await enviarCodigoVerificacao(dadosPendentes.whatsapp)
      if (r.ok) setInfoCodigo(r.mensagem)
      else setErro(r.mensagem)
    } finally {
      setEnviandoCodigo(false)
    }
  }

  // ETAPA 2: confere o código e, se válido, cria a conta de fato.
  async function confirmarCodigo() {
    if (!dadosPendentes) return
    setErro('')
    setEnviandoCodigo(true)
    try {
      const v = await validarCodigoVerificacao(dadosPendentes.whatsapp, codigo)
      if (!v.ok) {
        setErro(v.mensagem)
        return
      }
      await criarConta(dadosPendentes)
    } finally {
      setEnviandoCodigo(false)
    }
  }

  async function criarConta(data: CadastroFormData) {
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

  // Etapa 2: confirmar o código recebido no WhatsApp
  if (etapaCodigo) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="text-green-600" size={22} />
          </div>
          <h3 className="font-semibold text-gray-900">Confirme seu WhatsApp</h3>
          <p className="text-sm text-gray-500 mt-1">
            Enviamos um código para <strong>{dadosPendentes?.whatsapp}</strong>.
            Digite-o abaixo para concluir o cadastro.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código de 6 dígitos
          </label>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="000000"
            aria-label="Código de confirmação"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-center text-lg tracking-[0.4em] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {infoCodigo && !erro && (
          <p className="text-green-600 text-xs text-center">{infoCodigo}</p>
        )}
        {erro && (
          <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{erro}</p>
        )}

        <button
          type="button"
          onClick={confirmarCodigo}
          disabled={enviandoCodigo || codigo.length !== 6}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {enviandoCodigo && <Loader2 size={16} className="animate-spin" />}
          Confirmar e criar conta
        </button>

        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => { setEtapaCodigo(false); setCodigo(''); setErro('') }}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft size={13} />
            Corrigir número
          </button>
          <button
            type="button"
            onClick={reenviarCodigo}
            disabled={enviandoCodigo}
            className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            Reenviar código
          </button>
        </div>
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
        disabled={isSubmitting || enviandoCodigo}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {(isSubmitting || enviandoCodigo) && <Loader2 size={16} className="animate-spin" />}
        Continuar
      </button>
      <p className="text-[11px] text-gray-400 text-center">
        Enviaremos um código no seu WhatsApp para confirmar o número.
      </p>
    </form>
  )
}
