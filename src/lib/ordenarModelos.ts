// Ordenação "natural" de nomes de modelo de celular.
// Mantém a lista coerente mesmo quando modelos são adicionados fora de ordem.
// Ex: 16 < 16e < 16 Pro < 16 Pro Max < 17 < 17 Pro.
//
// Usada na aba Modelos, no catálogo de Películas e no Novo Pedido, para que a
// ordenação seja consistente em todo o app.

// Peso da variante dentro de uma mesma geração:
// mini < base < e < Plus/+ < FE < Pro < Pro Max < Ultra < Air
function pesoVariante(nome: string): number {
  const n = nome.toLowerCase()
  if (/\bmini\b/.test(n)) return 0
  if (/\bpro\s*max\b/.test(n)) return 6
  if (/\bultra\b/.test(n)) return 7
  if (/\bair\b/.test(n)) return 8
  if (/\bpro\b/.test(n)) return 5
  if (/\bmax\b/.test(n)) return 6
  if (/\bfe\b/.test(n)) return 4
  if (/(\+|\bplus\b)/.test(n)) return 3
  if (/\d+\s*e\b/.test(n) || /\be\b/.test(n)) return 2 // "16e" logo após o base
  return 1 // modelo base (ex: "16", "S24")
}

function primeiroNumero(nome: string): number {
  const n = nome.toLowerCase()

  // Linha X da Apple (X, XS, XR, XS Max) é a geração 10, entre o 8 e o 11.
  if (/\biphone\s+x/.test(n)) return 10

  // iPhone SE: numera pela geração aproximada (ano de lançamento).
  if (/\bse\b/.test(n)) {
    if (/2016/.test(n)) return 6 // SE 1ª geração
    if (/2022/.test(n)) return 13 // SE 3ª geração
    return 11 // SE 2ª geração (2020)
  }

  const m = nome.match(/\d+/)
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER
}

// Prefixo de letras antes do número (ex: "A", "S", "Note", "Edge", "iPhone",
// "Moto G"...). Agrupa as famílias antes de comparar números.
function prefixoFamilia(nome: string): string {
  let base = nome.toLowerCase()
  // Linha X e SE da Apple: normaliza o prefixo para "iphone" para que a geração
  // (10 do X, ano do SE) seja comparada pelo número, não pelo texto.
  base = base.replace(/iphone\s+x[a-z ]*/, 'iphone ')
  base = base.replace(/iphone\s+se[\s()0-9]*/, 'iphone ')
  const m = base.match(/^([^\d]*)/)
  return (m ? m[1] : '').trim()
}

// Comparador para usar em .sort(). Recebe os NOMES dos modelos.
export function ordenarModeloNatural(a: string, b: string): number {
  const pa = prefixoFamilia(a)
  const pb = prefixoFamilia(b)
  if (pa !== pb) return pa.localeCompare(pb, 'pt-BR')

  const na = primeiroNumero(a)
  const nb = primeiroNumero(b)
  if (na !== nb) return na - nb

  const va = pesoVariante(a)
  const vb = pesoVariante(b)
  if (va !== vb) return va - vb

  return a.localeCompare(b, 'pt-BR')
}

// Ordenação natural GENÉRICA para nomes (ex: acessórios). Quebra o nome em
// pedaços de texto e número e compara pedaço a pedaço, de modo que:
//  - "SM-30" venha antes de "SM-31" e "SM-100" (número, não alfabético);
//  - itens da mesma "linha"/prefixo fiquem agrupados ("USB-C..." juntos).
export function ordenarNatural(a: string, b: string): number {
  const pa = quebrar(a)
  const pb = quebrar(b)
  const n = Math.min(pa.length, pb.length)
  for (let i = 0; i < n; i++) {
    const x = pa[i]
    const y = pb[i]
    if (typeof x === 'number' && typeof y === 'number') {
      if (x !== y) return x - y
    } else {
      const cmp = String(x).localeCompare(String(y), 'pt-BR')
      if (cmp !== 0) return cmp
    }
  }
  return pa.length - pb.length
}

// Divide "USB-C 30W" em ["usb-c ", 30, "w"] (texto minúsculo e números).
function quebrar(s: string): (string | number)[] {
  const partes: (string | number)[] = []
  const regex = /(\d+)|(\D+)/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(s.toLowerCase())) !== null) {
    partes.push(m[1] !== undefined ? parseInt(m[1], 10) : m[2])
  }
  return partes
}
