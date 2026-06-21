'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import { type Sugestao } from '@/types'
import { aprovarSugestao, rejeitarSugestao } from '@/app/actions/sugestoes'
import { Check, X, Package, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const TIPO_LABEL: Record<string, string> = {
  acessorio: 'Acessório',
  capa_subcategoria: 'Subcategoria de Capa',
  material: 'Material de Loja',
  modelo: 'Aparelho (película)',
}

type SugestaoComJoins = Sugestao & {
  sugeridor: { nome: string } | null
  subcategoria: { nome: string } | null
  marca_rel: { nome: string } | null
}

interface Props {
  pendentes: SugestaoComJoins[]
  revisadas: SugestaoComJoins[]
}

export function SugestaoReviewList({ pendentes, revisadas }: Props) {
  return (
    <div className="space-y-6">
      {pendentes.length === 0 && revisadas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Clock size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma sugestão registrada</p>
        </div>
      ) : null}

      {pendentes.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock size={12} /> Pendentes ({pendentes.length})
          </h3>
          <div className="space-y-3">
            {pendentes.map((s) => (
              <SugestaoCard key={s.id} sugestao={s} pendente />
            ))}
          </div>
        </section>
      )}

      {revisadas.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Revisadas
          </h3>
          <div className="space-y-2">
            {revisadas.map((s) => (
              <SugestaoCard key={s.id} sugestao={s} pendente={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SugestaoCard({
  sugestao,
  pendente,
}: {
  sugestao: SugestaoComJoins
  pendente: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-start gap-3">
        {/* Foto */}
        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
          {sugestao.foto_url ? (
            <Image src={sugestao.foto_url} alt={sugestao.nome} fill sizes="150px" className="object-cover" />
          ) : (
            <Package size={20} className="absolute inset-0 m-auto text-gray-200" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-gray-900 text-sm">{sugestao.nome}</p>
              {/* Para modelo: mostra a marca do aparelho; para os demais, a marca livre */}
              {sugestao.tipo === 'modelo'
                ? sugestao.marca_rel?.nome && (
                    <p className="text-xs text-gray-400">{sugestao.marca_rel.nome}</p>
                  )
                : sugestao.marca && (
                    <p className="text-xs text-gray-400">{sugestao.marca}</p>
                  )}
              <p className="text-xs text-gray-400 mt-0.5">
                {TIPO_LABEL[sugestao.tipo]}
                {sugestao.subcategoria?.nome && ` · ${sugestao.subcategoria.nome}`}
                {sugestao.tipo === 'modelo' && ` · ${sugestao.tem_tela_curva ? 'tela curva' : 'tela reta'}`}
                {' · por '}{sugestao.sugeridor?.nome ?? '—'}
              </p>
              <p className="text-[11px] text-gray-300 mt-0.5">
                {formatDate(sugestao.created_at, 'dd/MM/yyyy')}
              </p>
            </div>

            {/* Status badge (revisadas) */}
            {!pendente && (
              <span
                className={cn(
                  'text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                  sugestao.status === 'aprovado'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                )}
              >
                {sugestao.status === 'aprovado' ? 'Aprovado' : 'Recusado'}
              </span>
            )}
          </div>

          {/* Botões de ação */}
          {pendente && (
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => startTransition(() => aprovarSugestao(sugestao.id))}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 disabled:opacity-50 transition-colors"
              >
                <Check size={13} />
                Aprovar
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => rejeitarSugestao(sugestao.id))}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <X size={13} />
                Recusar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
