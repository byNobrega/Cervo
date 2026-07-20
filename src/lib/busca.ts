// Busca tolerante (fuzzy leve) para o catálogo e a criação de pedido.
// Ignora acentos, maiúsculas, hífens, espaços e outros símbolos, de modo que
// "kd 751" encontre "KD-751", "iphone 12 pro" encontre "iPhone 12 Pro", etc.

// Normaliza um texto: minúsculo, sem acentos e sem separadores.
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, '') // remove hífens, espaços, símbolos
}

// Retorna true se o item corresponde ao termo buscado.
// Casa por "contém" após normalizar; também casa se TODAS as palavras do termo
// aparecerem no texto (busca por múltiplos pedaços, ex: "fone kaidi").
export function correspondeBusca(texto: string, termo: string): boolean {
  const alvo = normalizar(texto)
  const buscaNorm = normalizar(termo)
  if (!buscaNorm) return true
  if (alvo.includes(buscaNorm)) return true

  // Fallback: cada palavra do termo (separada por espaço) deve aparecer
  const palavras = termo.trim().split(/\s+/).map(normalizar).filter(Boolean)
  return palavras.length > 0 && palavras.every((p) => alvo.includes(p))
}

// Filtra uma lista por um ou mais campos de texto usando a busca tolerante.
export function filtrarPorBusca<T>(
  lista: T[],
  termo: string,
  campos: (item: T) => (string | null | undefined)[]
): T[] {
  const t = termo.trim()
  if (!t) return lista
  return lista.filter((item) =>
    campos(item).some((c) => c && correspondeBusca(c, t))
  )
}
