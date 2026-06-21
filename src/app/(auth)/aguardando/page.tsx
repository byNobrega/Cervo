'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Clock, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AguardandoPage() {
  const { profile, isLoading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && profile?.status === 'aprovado') {
      router.replace('/painel')
    }
  }, [profile, isLoading, router])

  const rejeitado = profile?.status === 'rejeitado'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        {rejeitado ? (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Cadastro recusado
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Seu acesso foi recusado pelo administrador. Entre em contato com o
              responsável pela loja para mais informações.
            </p>
          </>
        ) : (
          <>
            <Clock className="w-14 h-14 text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Aguardando aprovação
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Seu cadastro está sendo revisado pelo administrador. Você receberá
              acesso assim que for aprovado.
            </p>
          </>
        )}
        <button
          onClick={signOut}
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}
