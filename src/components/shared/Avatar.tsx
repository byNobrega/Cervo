import Image from 'next/image'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Foto de perfil redonda. Sem foto, mostra o "boneco" genérico de usuário
 * (como nas redes sociais) em vez da inicial do nome.
 */
export function Avatar({
  url,
  nome,
  tamanho = 40,
  className,
}: {
  url: string | null | undefined
  nome: string
  tamanho?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-gray-200 flex items-end justify-center flex-shrink-0',
        className
      )}
      style={{ width: tamanho, height: tamanho }}
    >
      {url ? (
        <Image src={url} alt={nome} fill sizes={`${tamanho * 2}px`} className="object-cover" />
      ) : (
        <User
          aria-label={nome}
          className="text-gray-400 fill-gray-400 translate-y-[12%]"
          style={{ width: tamanho * 0.8, height: tamanho * 0.8 }}
          strokeWidth={1}
        />
      )}
    </div>
  )
}
