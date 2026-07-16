'use client'

import { useEffect } from 'react'
import { celebrar } from '@/lib/efeitos'

// Dispara a celebração (confete + trompete) uma única vez quando o funcionário
// abre uma lista que foi concluída/comprada. Usa sessionStorage para não repetir
// a cada refresh do mesmo pedido.
export function CelebracaoCompra({ pedidoId }: { pedidoId: string }) {
  useEffect(() => {
    const chave = `celebrou:${pedidoId}`
    if (sessionStorage.getItem(chave)) return
    sessionStorage.setItem(chave, '1')
    // pequeno atraso para a tela pintar antes do efeito
    const t = setTimeout(() => celebrar(true), 400)
    return () => clearTimeout(t)
  }, [pedidoId])

  return null
}
