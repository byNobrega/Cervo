'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { TEMA_CATEGORIA, type CategoriaPedido } from '@/lib/constants'

const ABAS: { href: string; label: string; cat: CategoriaPedido }[] = [
  { href: '/catalogo/acessorios', label: 'Acessórios', cat: 'acessorios' },
  { href: '/catalogo/capas', label: 'Capas', cat: 'capas' },
  { href: '/catalogo/peliculas', label: 'Películas', cat: 'peliculas' },
  { href: '/catalogo/material', label: 'Material', cat: 'material' },
]

export function CatalogoTabs() {
  const pathname = usePathname()

  return (
    <div className="max-w-3xl mx-auto mb-6">
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
        {ABAS.map((aba) => {
          const ativa = pathname === aba.href
          const tema = TEMA_CATEGORIA[aba.cat]
          return (
            <Link
              key={aba.href}
              href={aba.href}
              className={cn(
                'flex-1 text-center whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                ativa
                  ? tema.abaAtiva
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {aba.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
