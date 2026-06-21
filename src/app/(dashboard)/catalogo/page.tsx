import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// /catalogo não tem conteúdo próprio — redireciona para a primeira aba.
export default function CatalogoPage() {
  redirect('/catalogo/acessorios')
}
