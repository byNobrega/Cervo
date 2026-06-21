import Image from 'next/image'
import { type Sugestao } from '@/types'
import { formatDate } from '@/lib/utils'
import { Lightbulb, Clock, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NovaSugestaoForm } from './NovaSugestaoForm'

const STATUS_INFO: Record<
  Sugestao['status'],
  { label: string; chip: string; icon: React.ReactNode }
> = {
  pendente: {
    label: 'Pendente',
    chip: 'bg-orange-50 text-orange-600',
    icon: <Clock size={11} />,
  },
  aprovado: {
    label: 'Aprovada',
    chip: 'bg-green-50 text-green-700',
    icon: <Check size={11} />,
  },
  rejeitado: {
    label: 'Negada',
    chip: 'bg-red-50 text-red-600',
    icon: <X size={11} />,
  },
}

type Opcao = { id: string; nome: string }

export function MinhasSugestoesList({
  sugestoes,
  subcategorias,
  marcas,
}: {
  sugestoes: Sugestao[]
  subcategorias: Opcao[]
  marcas: Opcao[]
}) {
  const pendentes = sugestoes.filter((s) => s.status === 'pendente')
  const aprovadas = sugestoes.filter((s) => s.status === 'aprovado')
  const negadas = sugestoes.filter((s) => s.status === 'rejeitado')

  return (
    <div className="space-y-6">
      <NovaSugestaoForm subcategorias={subcategorias} marcas={marcas} />

      {sugestoes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Lightbulb size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Você ainda não sugeriu nenhum item</p>
          <p className="text-xs mt-1">
            Use o botão acima para sugerir um item novo ao gerente.
          </p>
        </div>
      ) : (
        <>
          <Secao titulo="Pendentes" cor="text-orange-600" itens={pendentes} icone={<Clock size={13} />} />
          <Secao titulo="Aprovadas" cor="text-green-600" itens={aprovadas} icone={<Check size={13} />} />
          <Secao titulo="Negadas" cor="text-red-500" itens={negadas} icone={<X size={13} />} />
        </>
      )}
    </div>
  )
}

function Secao({
  titulo,
  cor,
  itens,
  icone,
}: {
  titulo: string
  cor: string
  itens: Sugestao[]
  icone: React.ReactNode
}) {
  if (itens.length === 0) return null
  return (
    <section>
      <h3 className={cn('text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2', cor)}>
        {icone} {titulo} ({itens.length})
      </h3>
      <div className="space-y-1.5">
        {itens.map((s) => (
          <SugestaoCard key={s.id} sugestao={s} />
        ))}
      </div>
    </section>
  )
}

function SugestaoCard({ sugestao }: { sugestao: Sugestao }) {
  const info = STATUS_INFO[sugestao.status]
  // Data relevante: quando revisada, mostra a data da revisão; senão, a de criação.
  const data =
    sugestao.status !== 'pendente' && sugestao.revisado_em
      ? sugestao.revisado_em
      : sugestao.created_at

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg p-2.5">
      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-50 flex-shrink-0">
        {sugestao.foto_url ? (
          <Image src={sugestao.foto_url} alt={sugestao.nome} fill sizes="60px" className="object-cover" />
        ) : (
          <Lightbulb size={18} className="absolute inset-0 m-auto text-gray-200" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{sugestao.nome}</p>
        {sugestao.subcategoria?.nome && (
          <p className="text-xs text-gray-400 truncate">{sugestao.subcategoria.nome}</p>
        )}
        {sugestao.marca && <p className="text-xs text-gray-400 truncate">{sugestao.marca}</p>}
        <p className="text-[11px] text-gray-300 mt-0.5">{formatDate(data, 'dd/MM/yyyy')}</p>
      </div>
      <span
        className={cn(
          'text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0',
          info.chip
        )}
      >
        {info.icon}
        {info.label}
      </span>
    </div>
  )
}
