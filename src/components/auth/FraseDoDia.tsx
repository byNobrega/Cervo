'use client'

import { useState, useEffect } from 'react'

// Frases motivacionais de vendas. Autor opcional.
const FRASES: { texto: string; autor?: string }[] = [
  { texto: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.' },
  { texto: 'Não espere por oportunidades, crie-as!' },
  { texto: 'Ou você corre o dia ou o dia corre você!' },
  { texto: 'Sua atitude, não sua aptidão, determinará sua altitude.' },
  { texto: 'O insucesso é apenas uma oportunidade para recomeçar com mais inteligência.' },
  { texto: 'Ignore o caos ao seu redor e mantenha o foco no seu objetivo.' },
  { texto: 'Se você não cuidar do seu cliente, o seu concorrente irá.' },
  { texto: 'As pessoas farão negócios com você se confiarem em você.' },
  { texto: 'Aborde cada cliente para resolver um problema, não apenas para vender.' },
  { texto: 'Grandes vendedores são solucionadores de problemas, não faladores de vantagens.', autor: 'Jeffrey Gitomer' },
  { texto: 'Não encontre clientes para os seus produtos, encontre produtos para os seus clientes.', autor: 'Seth Godin' },
  { texto: 'Torne-se a pessoa que atrairia os resultados que você deseja.', autor: 'Jim Rohn' },
  { texto: "Cada 'não' te aproxima mais de um 'sim'.", autor: 'William Clement Stone' },
  { texto: 'O segredo de vender algo é focar no que o cliente ganha, não no que ele paga.', autor: 'Jeffrey Gitomer' },
  { texto: 'Preço é o que você paga. Valor é o que você leva.', autor: 'Warren Buffett' },
  { texto: 'Vendas dependem da atitude do vendedor, não da atitude do cliente.', autor: 'W. Clement Stone' },
  { texto: 'Faça do cliente o herói da sua história.', autor: 'Ann Handley' },
  { texto: 'Ninguém gosta que lhe vendam algo, mas todo mundo adora comprar.', autor: 'Jeffrey Gitomer' },
  { texto: 'Clientes não compram o que você faz, eles compram o porquê você faz.', autor: 'Simon Sinek' },
]

export function FraseDoDia() {
  // Sorteio acontece SÓ no cliente (no useEffect), evitando hydration mismatch:
  // o servidor renderiza vazio e o cliente preenche + faz o fade-in.
  const [frase, setFrase] = useState<{ texto: string; autor?: string } | null>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    setFrase(FRASES[Math.floor(Math.random() * FRASES.length)])
    const t = setTimeout(() => setVisivel(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      // min-h reserva o espaço para o layout não "pular" quando a frase aparece
      className={`max-w-sm mx-auto mb-8 min-h-[3rem] transition-opacity duration-[1500ms] ease-out ${
        visivel ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {frase && (
        <>
          <p className="text-sm text-gray-600 italic leading-relaxed text-center">
            “{frase.texto}”
          </p>
          {frase.autor && (
            <p className="text-xs text-gray-400 text-center mt-1.5">— {frase.autor}</p>
          )}
        </>
      )}
    </div>
  )
}
