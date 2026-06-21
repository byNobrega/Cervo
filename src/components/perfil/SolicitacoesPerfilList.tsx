'use client'

import { useTransition } from 'react'
import { CARGOS_LABEL } from '@/lib/constants'
import { aprovarSolicitacaoPerfil, recusarSolicitacaoPerfil } from '@/app/actions/perfil'
import { Check, X, ArrowRight, UserCog } from 'lucide-react'

export type SolicitacaoPerfil = {
  id: string
  tipo: 'cargo' | 'unidade'
  cargo_novo: string | null
  cargo_atual: string | null
  status: string
  solicitante_nome: string | null
  unidade_atual_nome: string | null
  unidade_nova_nome: string | null
}

export function SolicitacoesPerfilList({ solicitacoes }: { solicitacoes: SolicitacaoPerfil[] }) {
  if (solicitacoes.length === 0) return null

  return (
    <section className="mb-6">
      <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
        <UserCog size={13} /> Solicitações de perfil ({solicitacoes.length})
      </h3>
      <div className="space-y-2">
        {solicitacoes.map((s) => (
          <Card key={s.id} s={s} />
        ))}
      </div>
    </section>
  )
}

function Card({ s }: { s: SolicitacaoPerfil }) {
  const [isPending, startTransition] = useTransition()

  const de =
    s.tipo === 'cargo'
      ? CARGOS_LABEL[(s.cargo_atual ?? 'funcionario') as keyof typeof CARGOS_LABEL] ?? s.cargo_atual
      : s.unidade_atual_nome ?? 'Sem unidade'
  const para =
    s.tipo === 'cargo'
      ? CARGOS_LABEL[(s.cargo_novo ?? 'funcionario') as keyof typeof CARGOS_LABEL] ?? s.cargo_novo
      : s.unidade_nova_nome ?? 'Sem unidade'

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {s.solicitante_nome ?? 'Usuário'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {s.tipo === 'cargo' ? 'Mudança de cargo' : 'Mudança de unidade'}:{' '}
            <span className="text-gray-700">{de}</span>
            <ArrowRight size={11} className="inline mx-1 text-gray-400" />
            <span className="text-blue-600 font-medium">{para}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => startTransition(() => aprovarSolicitacaoPerfil(s.id))}
            disabled={isPending}
            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 transition-colors"
            title="Aprovar"
            aria-label="Aprovar solicitação"
          >
            <Check size={15} />
          </button>
          <button
            type="button"
            onClick={() => startTransition(() => recusarSolicitacaoPerfil(s.id))}
            disabled={isPending}
            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
            title="Recusar"
            aria-label="Recusar solicitação"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
