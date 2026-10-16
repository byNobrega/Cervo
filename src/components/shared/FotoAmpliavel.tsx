'use client'

import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X } from 'lucide-react'

/**
 * Miniatura de produto que amplia em tela cheia ao clicar.
 * Substitui o <Image fill /> dentro de um container `relative` já dimensionado.
 *
 * O gatilho é um <span role="button"> (e não <button>) porque várias miniaturas
 * ficam dentro de botões (ex: cabeçalho do SubcategoriaAccordion), e botão
 * dentro de botão é HTML inválido. O clique não propaga, então ampliar a foto
 * não seleciona o item nem abre/fecha a subcategoria.
 */
export function FotoAmpliavel({
  src,
  alt,
  sizes = '60px',
}: {
  src: string
  alt: string
  sizes?: string
}) {
  const [aberta, setAberta] = useState(false)

  function abrir(e: MouseEvent | KeyboardEvent) {
    e.preventDefault()
    e.stopPropagation()
    setAberta(true)
  }

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        aria-label={`Ampliar foto: ${alt}`}
        title="Ampliar foto"
        onClick={abrir}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') abrir(e)
        }}
        className="absolute inset-0 cursor-zoom-in"
      >
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      </span>
      {aberta && <FotoModal src={src} alt={alt} onFechar={() => setAberta(false)} />}
    </>
  )
}

function FotoModal({ src, alt, onFechar }: { src: string; alt: string; onFechar: () => void }) {
  // Fecha com Esc e trava a rolagem da página enquanto a foto está aberta.
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', onKey)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflowAnterior
    }
  }, [onFechar])

  // Portal no <body>: escapa de containers com overflow-hidden e de cliques
  // dos elementos pais (o modal não fica "dentro" do item na árvore do DOM).
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={(e) => {
        e.stopPropagation()
        onFechar()
      }}
      className="fixed inset-0 z-[100] bg-black/85 flex flex-col items-center justify-center p-4 cursor-zoom-out"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onFechar()
        }}
        aria-label="Fechar foto"
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={22} />
      </button>
      <div className="relative w-full max-w-2xl h-[75vh]">
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 672px" className="object-contain" />
      </div>
      <p className="mt-3 text-sm text-white/90 text-center max-w-2xl">{alt}</p>
    </div>,
    document.body
  )
}
