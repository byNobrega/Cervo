'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Overlay de carregamento entre páginas.
//
// Como o App Router do Next 14 não expõe eventos de navegação, detectamos o
// início pelo clique em um <a> interno (captura no document) e o fim pela troca
// do pathname. Dá o feedback imediato de "está carregando" no clique, em vez de
// a tela ficar parada até a página nova chegar.
export function LoadingOverlay() {
  const pathname = usePathname()
  const [carregando, setCarregando] = useState(false)

  // Quando o pathname muda, a navegação terminou.
  useEffect(() => {
    setCarregando(false)
  }, [pathname])

  useEffect(() => {
    function aoClicar(e: MouseEvent) {
      // Ignora cliques com modificadores (abrir em nova aba, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return

      const alvo = (e.target as HTMLElement | null)?.closest('a')
      if (!alvo) return

      const href = alvo.getAttribute('href')
      if (!href || href.startsWith('#')) return
      if (alvo.target === '_blank') return
      // Só links internos
      if (/^https?:\/\//i.test(href)) return
      // Já está nessa página
      if (href === pathname) return

      setCarregando(true)
    }

    document.addEventListener('click', aoClicar)
    return () => document.removeEventListener('click', aoClicar)
  }, [pathname])

  // Rede de segurança: se algo impedir a navegação, não trava o overlay.
  useEffect(() => {
    if (!carregando) return
    const t = setTimeout(() => setCarregando(false), 8000)
    return () => clearTimeout(t)
  }, [carregando])

  if (!carregando) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-white/60 backdrop-blur-sm transition-opacity">
      <Loader2 className="animate-spin text-blue-600" size={32} />
      <p className="text-sm font-medium text-gray-500">Carregando...</p>
    </div>
  )
}
