import { CadastroForm } from '@/components/auth/CadastroForm'
import Link from 'next/link'
export const dynamic = 'force-dynamic'

export default function CadastroPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Criar conta</h2>
      <CadastroForm />
      <p className="text-center text-sm text-gray-500 mt-6">
        Já tem conta?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Entrar
        </Link>
      </p>
    </>
  )
}
