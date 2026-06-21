import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Entrar</h2>
      <LoginForm />
      <p className="text-center text-sm text-gray-500 mt-6">
        Não tem conta?{' '}
        <Link href="/cadastro" className="text-blue-600 hover:underline font-medium">
          Cadastre-se
        </Link>
      </p>
    </>
  )
}
