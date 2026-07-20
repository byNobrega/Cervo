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

// Filtra uma lista por um ou mais campos de texto usando busca tolerante.
// Regra "casar pela maioria": o item aparece se o texto contiver o termo inteiro
// OU se a MAIORIA das palavras do termo casar (somando todos os campos). Assim
// "tipo c cabo" acha cabos (2 de 3 palavras casam), ignorando a palavra extra.
export function filtrarPorBusca<T>(
  lista: T[],
  termo: string,
  campos: (item: T) => (string | null | undefined)[]
): T[] {
  const t = termo.trim()
  if (!t) return lista
  const termoNorm = normalizar(t)

  const palavrasTermo = t.split(/\s+/).map(normalizar).filter(Boolean)

  return lista.filter((item) => {
    const textos = campos(item).filter((c): c is string => !!c)

    // 1) match direto: o termo inteiro aparece em algum campo
    if (textos.some((c) => normalizar(c).includes(termoNorm))) return true

    // 2) por palavras: uma palavra "casa" se aparecer em QUALQUER campo
    // (ex: "cabo" na subcategoria + "c" no nome).
    if (palavrasTermo.length === 0) return false
    const alvos = textos.map(normalizar)
    const casaram = palavrasTermo.filter((p) => alvos.some((a) => a.includes(p))).length

    // Até 2 palavras: exige TODAS (evita trazer lixo por uma palavra só).
    // 3+ palavras: permite 1 faltar (tolera palavra de enchimento, ex: "tipo").
    const necessarias =
      palavrasTermo.length <= 2 ? palavrasTermo.length : palavrasTermo.length - 1
    return casaram >= necessarias
  })
}

// Compatibilidade: verifica um único texto contra o termo (usa a mesma regra).
export function correspondeBusca(texto: string, termo: string): boolean {
  return filtrarPorBusca([texto], termo, (t) => [t]).length > 0
}
