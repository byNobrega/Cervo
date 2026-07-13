import Image from 'next/image'

// Regras de logo por unidade: se o nome casar com o padrão, usa o logo/alt.
// Para adicionar um shopping novo, basta incluir uma entrada aqui.
const LOGOS: { padrao: RegExp; src: string; alt: string }[] = [
  { padrao: /top\s*shopping/i, src: '/logo-topshopping.png', alt: 'Top Shopping' },
  { padrao: /madureira/i, src: '/logo-madureira.png', alt: 'Madureira Shopping' },
]

function logoDaUnidade(nomeUnidade?: string | null) {
  if (!nomeUnidade) return null
  return LOGOS.find((l) => l.padrao.test(nomeUnidade)) ?? null
}

// True se a unidade tem um logo próprio configurado.
export function temLogoUnidade(nomeUnidade?: string | null): boolean {
  return logoDaUnidade(nomeUnidade) !== null
}

// Selo/ícone do shopping ao lado do nome da unidade.
// Renderiza em 2x o tamanho exibido para não pixelar em telas retina.
export function LogoUnidade({
  nomeUnidade,
  size = 22,
}: {
  nomeUnidade?: string | null
  size?: number
}) {
  const logo = logoDaUnidade(nomeUnidade)
  if (!logo) return null
  return (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={size * 2}
      height={size * 2}
      style={{ width: size, height: size }}
      className="inline-block rounded-[4px] flex-shrink-0 align-text-bottom object-contain"
    />
  )
}
