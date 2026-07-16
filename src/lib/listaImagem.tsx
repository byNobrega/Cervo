import { ImageResponse } from 'next/og'

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

export async function gerarImagemLista(grupo: GrupoImagem): Promise<ArrayBuffer> {
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
          fontFamily: 'sans-serif',
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

        {/* Foto do produto no canto superior direito */}
        {grupo.fotoUrl ? (
          <div style={{ display: 'flex', width: 340, height: 340 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={grupo.fotoUrl}
              alt=""
              width={340}
              height={340}
              style={{ objectFit: 'cover', borderRadius: 12 }}
            />
          </div>
        ) : null}
      </div>
    ),
    { width: LARGURA, height: altura }
  )

  return img.arrayBuffer()
}
