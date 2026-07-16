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
  fotoUrl?: string | null // foto do produto (cadastrada no catálogo)
  // Modelos agrupados por marca, na ordem de exibição
  marcas: { marca: string; modelos: string[] }[]
}

const LARGURA = 900

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
  const fotoData = grupo.fotoUrl ? await fotoParaDataUri(grupo.fotoUrl) : null

  // Altura cresce com a quantidade de linhas (título + modelos + espaços)
  const totalLinhas = grupo.marcas.reduce((acc, m) => acc + m.modelos.length + 1, 0)
  const altura = Math.max(600, 160 + totalLinhas * 46)

  const img = new ImageResponse(
    (
      <div
        style={{
          width: LARGURA,
          height: altura,
          background: '#000',
          display: 'flex',
          padding: 40,
          fontFamily: 'Noto Sans',
        }}
      >
        {/* Coluna da esquerda: título + modelos */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div
            style={{
              color: '#fff',
              fontSize: 48,
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            {grupo.titulo}
          </div>

          {grupo.marcas.map((bloco) => (
            <div key={bloco.marca} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Marca só aparece quando há mais de uma, para não poluir */}
              {grupo.marcas.length > 1 && (
                <div
                  style={{
                    color: '#9ca3af',
                    fontSize: 24,
                    fontWeight: 600,
                    marginTop: 16,
                    marginBottom: 6,
                  }}
                >
                  {bloco.marca}
                </div>
              )}
              {bloco.modelos.map((m) => (
                <div key={m} style={{ color: '#fff', fontSize: 30, lineHeight: 1.5 }}>
                  {m}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Foto do produto no canto superior direito (convertida para JPEG) */}
        {fotoData ? (
          <div style={{ display: 'flex', width: 340, height: 340 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoData}
              alt=""
              width={340}
              height={340}
              style={{ objectFit: 'cover', borderRadius: 12 }}
            />
          </div>
        ) : null}
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
