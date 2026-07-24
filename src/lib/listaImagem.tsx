import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

// Carrega a fonte do disco explicitamente. Sem isso, o @vercel/og tenta resolver
// a fonte padrão por um caminho de arquivo que quebra no Windows quando a pasta
// do projeto tem espaço/caracteres especiais (ERR_INVALID_URL).
let fonteCache: Buffer | null = null
async function carregarFonte(): Promise<Buffer> {
  if (fonteCache) return fonteCache
  const p = path.join(
    process.cwd(),
    'node_modules',
    'next',
    'dist',
    'compiled',
    '@vercel',
    'og',
    'noto-sans-v27-latin-regular.ttf'
  )
  fonteCache = await readFile(p)
  return fonteCache
}

// Gera a imagem da lista de um tipo (ex: "Capa Vidro") no formato usado nas
// listas de WhatsApp da loja: fundo preto, título grande à esquerda, modelos
// listados abaixo e a foto do produto no canto superior direito.

export interface GrupoImagem {
  titulo: string // ex: "Capa Vidro"
  fotoUrl?: string | null // foto padrão (fallback)
  // Modelos agrupados por marca, na ordem de exibição. Cada bloco pode ter a
  // sua própria foto de referência (ex: iPhone usa uma capa, Samsung outra).
  marcas: { marca: string; modelos: string[]; fotoUrl?: string | null }[]
}

const LARGURA = 900
const FOTO = 360 // lado da foto de referência (px)

// Baixa a foto do produto e converte para JPEG (data URI). O @vercel/og não
// renderiza WebP; convertendo garantimos que a foto apareça na imagem.
async function fotoParaDataUri(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url)
    if (!resp.ok) return null
    const buf = Buffer.from(await resp.arrayBuffer())
    const { default: sharp } = await import('sharp')
    const jpeg = await sharp(buf).resize(680, 680, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`
  } catch (e) {
    console.error('[listaImagem] falha ao converter foto:', e)
    return null
  }
}

export async function gerarImagemLista(grupo: GrupoImagem): Promise<ArrayBuffer> {
  const fonte = await carregarFonte()

  // Converte cada foto usada uma única vez (cache por URL).
  const cacheFoto = new Map<string, string | null>()
  async function foto(url?: string | null): Promise<string | null> {
    if (!url) return null
    if (!cacheFoto.has(url)) cacheFoto.set(url, await fotoParaDataUri(url))
    return cacheFoto.get(url) ?? null
  }

  // Para cada bloco de marca, resolve a foto (a do bloco ou a padrão do grupo).
  // Marca a foto só quando ela MUDA em relação ao bloco anterior, para não
  // repetir a mesma imagem em blocos consecutivos.
  const blocos: { marca: string; modelos: string[]; foto: string | null }[] = []
  let ultimaUrl: string | null | undefined = undefined
  for (const b of grupo.marcas) {
    const url = b.fotoUrl ?? grupo.fotoUrl ?? null
    const mostraFoto = url !== ultimaUrl
    ultimaUrl = url
    blocos.push({
      marca: b.marca,
      modelos: b.modelos,
      foto: mostraFoto ? await foto(url) : null,
    })
  }

  // Altura de cada bloco = o maior entre a coluna de modelos e a foto ao lado
  // (a foto pode ser mais alta que a lista daquela marca). Sem isso, um bloco
  // com poucos modelos e foto grande teria o rodapé cortado.
  const temLabel = grupo.marcas.length > 1
  const LINHA = 46
  const alturaConteudo = blocos.reduce((acc, b) => {
    const alturaModelos = (temLabel ? 56 : 0) + b.modelos.length * LINHA
    const alturaFoto = b.foto ? FOTO + 24 : 0
    return acc + Math.max(alturaModelos, alturaFoto)
  }, 0)
  const altura = Math.max(600, 190 + alturaConteudo)

  const img = new ImageResponse(
    (
      <div
        style={{
          width: LARGURA,
          height: altura,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          padding: 40,
          fontFamily: 'Noto Sans',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: '#fff',
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.1,
            paddingBottom: 48,
          }}
        >
          {grupo.titulo}
        </div>

        {blocos.map((bloco, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
            {/* Modelos do bloco (coluna esquerda) */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {grupo.marcas.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    color: '#9ca3af',
                    fontSize: 24,
                    fontWeight: 600,
                    // respiro entre o título e "Apple" (1º bloco) e entre marcas
                    paddingTop: i === 0 ? 12 : 22,
                    paddingBottom: 8,
                  }}
                >
                  {bloco.marca}
                </div>
              )}
              {bloco.modelos.map((m) => (
                <div key={m} style={{ display: 'flex', color: '#fff', fontSize: 30, lineHeight: 1.5 }}>
                  {m}
                </div>
              ))}
            </div>

            {/* Foto de referência ao lado (só quando a foto muda de marca) */}
            {bloco.foto ? (
              <div style={{ display: 'flex', width: FOTO, height: FOTO, marginLeft: 24 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bloco.foto}
                  alt=""
                  width={FOTO}
                  height={FOTO}
                  style={{ objectFit: 'cover', borderRadius: 14 }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    ),
    {
      width: LARGURA,
      height: altura,
      fonts: [{ name: 'Noto Sans', data: fonte, weight: 400, style: 'normal' }],
    }
  )

  return img.arrayBuffer()
}
