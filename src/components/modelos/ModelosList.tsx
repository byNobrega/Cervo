'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type MarcaCelular, type ModeloCelular } from '@/types'
import { modeloCelularSchema, type ModeloCelularFormData } from '@/lib/validations'
import { adicionarModelo, toggleModeloAtivo, toggleTelaCurva } from '@/app/actions/modelos'
import { Plus, Loader2, Smartphone, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  marcas: MarcaCelular[]
  modelos: (ModeloCelular & { marca: MarcaCelular })[]
}

// Ordena nomes de modelo de forma "natural", entendendo os números do aparelho,
// para que a lista fique coerente mesmo quando modelos são adicionados fora de
// ordem. Ex: 16 < 16e < 16 Pro < 16 Pro Max < 17 < 17 Pro.
//
// Estratégia:
//  1) compara o primeiro NÚMERO do nome (16 antes de 17);
//  2) em empate, usa um peso pela variante (base < "e" < Plus/+ < FE < Pro <
//     Pro Max < Ultra < Air), que reflete a hierarquia usual das linhas;
//  3) por fim, ordem alfabética como desempate final.
function pesoVariante(nome: string): number {
  const n = nome.toLowerCase()
  if (/\bpro\s*max\b/.test(n)) return 6
  if (/\bultra\b/.test(n)) return 7
  if (/\bpro\b/.test(n)) return 5
  if (/\bmax\b/.test(n)) return 6
  if (/\bfe\b/.test(n)) return 4
  if (/\bair\b/.test(n)) return 8
  if (/(\+|\bplus\b)/.test(n)) return 3
  if (/\d+\s*e\b/.test(n) || /\be\b/.test(n)) return 1 // "16e"
  if (/\bmini\b/.test(n)) return 0
  return 2 // modelo base (ex: "16", "S24")
}

function primeiroNumero(nome: string): number {
  const n = nome.toLowerCase()

  // Casos especiais da Apple sem número na geração:
  // linha X (X, XS, XR, XS Max) é a geração 10, entre o 8 e o 11.
  if (/\biphone\s+x/.test(n)) return 10

  // iPhone SE: numera pela geração aproximada (ano de lançamento).
  if (/\bse\b/.test(n)) {
    if (/2016/.test(n)) return 6      // SE 1ª geração (época do 6s)
    if (/2022/.test(n)) return 13     // SE 3ª geração (época do 13)
    return 11                          // SE 2ª geração (2020, época do 11)
  }

  const m = nome.match(/\d+/)
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER
}

// Prefixo de letras antes do número (ex: "A", "S", "M", "Note", "Edge",
// "iPhone", "Moto G"...). Agrupa as famílias antes de comparar números.
function prefixoFamilia(nome: string): string {
  let base = nome.toLowerCase()
  // Linha X e SE da Apple: normaliza o prefixo para "iphone" para que a
  // geração (10 do X, ano do SE) seja comparada pelo número, não pelo texto.
  base = base.replace(/iphone\s+x[a-z ]*/, 'iphone ')
  base = base.replace(/iphone\s+se[\s()0-9]*/, 'iphone ')
  const m = base.match(/^([^\d]*)/)
  return (m ? m[1] : '').trim()
}

function ordenarModeloNatural(a: string, b: string): number {
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

export function ModelosList({ marcas, modelos }: Props) {
  const [marcaSelecionada, setMarcaSelecionada] = useState(marcas[0]?.id ?? '')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ModeloCelularFormData>({
    resolver: zodResolver(modeloCelularSchema),
    defaultValues: { marca_id: marcaSelecionada, tem_tela_curva: false },
  })

  const modelosFiltrados = modelos
    .filter((m) => m.marca_id === marcaSelecionada)
    .sort((a, b) => ordenarModeloNatural(a.nome, b.nome))

  async function onSubmit(data: ModeloCelularFormData) {
    // Usa SEMPRE a marca da aba atualmente selecionada (não o valor interno do
    // form, que pode estar defasado ao trocar de aba). Corrige o bug de modelo
    // cair na marca errada.
    await adicionarModelo({ ...data, marca_id: marcaSelecionada })
    reset({ marca_id: marcaSelecionada, tem_tela_curva: false })
    setMostrarForm(false)
  }

  return (
    <div className="space-y-4">
      {/* Abas de marcas */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {marcas.map((m) => (
          <button
            key={m.id}
            onClick={() => setMarcaSelecionada(m.id)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              marcaSelecionada === m.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            {m.nome}
          </button>
        ))}
      </div>

      {/* Lista de modelos */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {modelosFiltrados.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Nenhum modelo cadastrado para esta marca
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {modelosFiltrados.map((modelo) => (
              <div
                key={modelo.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  !modelo.ativo && 'opacity-50'
                )}
              >
                <Smartphone size={16} className="text-gray-300 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-900">{modelo.nome}</span>

                {modelo.tem_tela_curva && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                    Tela curva
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      startTransition(() => toggleTelaCurva(modelo.id, !modelo.tem_tela_curva))
                    }
                    className={cn(
                      'text-xs px-2 py-1 rounded-lg transition-colors',
                      modelo.tem_tela_curva
                        ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    )}
                    title="Tela curva"
                  >
                    <Wifi size={13} />
                  </button>
                  <button
                    onClick={() =>
                      startTransition(() => toggleModeloAtivo(modelo.id, !modelo.ativo))
                    }
                    className={cn(
                      'text-xs px-2 py-1 rounded-lg transition-colors',
                      modelo.ativo
                        ? 'bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-600'
                        : 'bg-red-50 text-red-500 hover:bg-green-50 hover:text-green-600'
                    )}
                  >
                    {modelo.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulário de adicionar */}
      {mostrarForm ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white border border-blue-100 rounded-xl p-4 space-y-3"
        >
          {/* A marca é injetada no onSubmit a partir da aba selecionada */}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nome do modelo
            </label>
            <input
              {...register('nome')}
              placeholder="Ex: Galaxy S24"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.nome && (
              <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" {...register('tem_tela_curva')} className="rounded" />
            Tela curva (bloqueia Películas Tradicionais)
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setMostrarForm(true)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus size={16} />
          Adicionar modelo
        </button>
      )}
    </div>
  )
}
