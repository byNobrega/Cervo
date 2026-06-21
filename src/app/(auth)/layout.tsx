import Image from 'next/image'
import { FraseDoDia } from '@/components/auth/FraseDoDia'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <Image
            src="/logo-cervo.png"
            alt="CÊRVO"
            width={180}
            height={120}
            priority
            className="object-contain"
          />
          <p className="text-gray-500 mt-2 text-sm">Gestão de Pedidos</p>
        </div>
        <FraseDoDia />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {children}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 ByNobrega
        </p>
      </div>
    </div>
  )
}
