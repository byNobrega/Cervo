import Image from 'next/image'

// Decide se uma unidade pertence ao Top Shopping a partir do nome.
// (genérico: qualquer unidade cujo nome contenha "TOP SHOPPING")
export function ehTopShopping(nomeUnidade?: string | null): boolean {
  return !!nomeUnidade && /top\s*shopping/i.test(nomeUnidade)
}

// Selo/ícone do shopping ao lado do nome da unidade.
// SVG vetorial em public/ — nunca pixela, escala em qualquer tamanho.
export function LogoUnidade({
  nomeUnidade,
  size = 22,
}: {
  nomeUnidade?: string | null
  size?: number
}) {
  if (!ehTopShopping(nomeUnidade)) return null
  return (
    <Image
      src="/logo-topshopping.png"
      alt="Top Shopping"
      width={size * 2}
      height={size * 2}
      style={{ width: size, height: size }}
      className="inline-block rounded-[4px] flex-shrink-0 align-text-bottom object-contain"
    />
  )
}
