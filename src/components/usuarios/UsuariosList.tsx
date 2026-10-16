'use client'

import { useState, useTransition } from 'react'
import { type Profile } from '@/types'
import { CARGOS_LABEL } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import {
  aprovarUsuario,
  rejeitarUsuario,
  editarUsuario,
  excluirUsuario,
} from '@/app/actions/usuarios'
import { Check, X, Clock, UserCheck, UserX, Pencil, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/shared/Avatar'
import { PerfilUsuarioModal } from '@/components/shared/PerfilUsuarioModal'

type UnidadeOpcao = { id: string; nome: string }

export function UsuariosList({
  usuarios,
  unidades,
  lojasExtras,
}: {
  usuarios: Profile[]
  unidades: UnidadeOpcao[]
  // id do usuário → lojas extras (além da principal) em que ele trabalha
  lojasExtras: Record<string, string[]>
}) {
  const pendentes = usuarios.filter((u) => u.status === 'pendente')
  const aprovados = usuarios.filter((u) => u.status === 'aprovado')
  const rejeitados = usuarios.filter((u) => u.status === 'rejeitado')

  return (
    <div className="space-y-6">
      {pendentes.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock size={13} /> Pendentes ({pendentes.length})
          </h3>
          <div className="space-y-2">
            {pendentes.map((u) => (
              <UsuarioCard key={u.id} usuario={u} unidades={unidades} extrasIniciais={lojasExtras[u.id] ?? []} />
            ))}
          </div>
        </section>
      )}

      {aprovados.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <UserCheck size={13} /> Aprovados ({aprovados.length})
          </h3>
          <div className="space-y-2">
            {aprovados.map((u) => (
              <UsuarioCard key={u.id} usuario={u} unidades={unidades} extrasIniciais={lojasExtras[u.id] ?? []} />
            ))}
          </div>
        </section>
      )}

      {rejeitados.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <UserX size={13} /> Recusados ({rejeitados.length})
          </h3>
          <div className="space-y-2">
            {rejeitados.map((u) => (
              <UsuarioCard key={u.id} usuario={u} unidades={unidades} extrasIniciais={lojasExtras[u.id] ?? []} />
            ))}
          </div>
        </section>
      )}

      {usuarios.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          Nenhum usuário cadastrado
        </div>
      )}
    </div>
  )
}

function UsuarioCard({
  usuario,
  unidades,
  extrasIniciais,
}: {
  usuario: Profile
  unidades: UnidadeOpcao[]
  extrasIniciais: string[]
}) {
  const [isPending, startTransition] = useTransition()
  const [editando, setEditando] = useState(false)
  const [modalExcluir, setModalExcluir] = useState(false)
  const [perfilAberto, setPerfilAberto] = useState(false)

  // form de edição
  const [nome, setNome] = useState(usuario.nome)
  const [cargo, setCargo] = useState<'funcionario' | 'gerente'>(
    usuario.cargo === 'gerente' ? 'gerente' : 'funcionario'
  )
  const [unidadeId, setUnidadeId] = useState(usuario.unidade_id ?? '')
  // Lojas extras (sem contar a principal, que já está no select acima)
  const [extras, setExtras] = useState<string[]>(
    extrasIniciais.filter((id) => id !== usuario.unidade_id)
  )

  const nomeUnidade = usuario.unidade?.nome
  const nomesExtras = extrasIniciais
    .filter((id) => id !== usuario.unidade_id)
    .map((id) => unidades.find((u) => u.id === id)?.nome)
    .filter(Boolean)

  function alternarExtra(id: string) {
    setExtras((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]))
  }

  function salvarEdicao() {
    startTransition(async () => {
      await editarUsuario(usuario.id, {
        nome: nome.trim() || usuario.nome,
        cargo,
        unidade_id: unidadeId || null,
        lojasExtras: extras.filter((id) => id !== unidadeId),
      })
      setEditando(false)
    })
  }

  function confirmarExcluir() {
    startTransition(async () => {
      await excluirUsuario(usuario.id)
      setModalExcluir(false)
    })
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setPerfilAberto(true)}
          title="Ver perfil"
          className="rounded-full flex-shrink-0"
        >
          <Avatar url={usuario.avatar_url} nome={usuario.nome} tamanho={40} />
        </button>

        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setPerfilAberto(true)}
            className="font-medium text-gray-900 text-sm hover:underline text-left"
          >
            {usuario.nome}
          </button>
          <p className="text-xs text-gray-400">
            {usuario.email} · {CARGOS_LABEL[usuario.cargo]}
          </p>
          {nomeUnidade && (
            <p className="text-xs text-gray-500">
              🏪 {nomeUnidade}
              {nomesExtras.length > 0 && <span className="text-gray-400"> + {nomesExtras.join(', ')}</span>}
            </p>
          )}
          {usuario.whatsapp && (
            <p className="text-xs text-gray-400">WhatsApp: {usuario.whatsapp}</p>
          )}
          <p className="text-xs text-gray-300 mt-0.5">
            Cadastro: {formatDate(usuario.created_at, 'dd/MM/yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={usuario.status} />

          {usuario.status === 'pendente' && (
            <>
              <button
                type="button"
                onClick={() => startTransition(() => aprovarUsuario(usuario.id))}
                disabled={isPending}
                className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 transition-colors"
                title="Aprovar"
              >
                <Check size={15} />
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => rejeitarUsuario(usuario.id))}
                disabled={isPending}
                className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
                title="Recusar"
              >
                <X size={15} />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            disabled={isPending}
            className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => setModalExcluir(true)}
            disabled={isPending}
            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
            title="Excluir do sistema"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Form de edição inline */}
      {editando && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              aria-label="Nome do usuário"
              placeholder="Nome"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
              <select
                value={cargo}
                onChange={(e) => setCargo(e.target.value as 'funcionario' | 'gerente')}
                aria-label="Cargo do usuário"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="funcionario">Funcionário</option>
                <option value="gerente">Gerente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Loja principal</label>
              <select
                value={unidadeId}
                onChange={(e) => setUnidadeId(e.target.value)}
                aria-label="Loja principal do usuário"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Sem unidade</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Outras lojas: libera ver a equipe e abrir lista nelas também */}
          {unidades.filter((u) => u.id !== unidadeId).length > 0 && (
            <div>
              <p className="block text-xs font-medium text-gray-600 mb-1">Também trabalha em</p>
              <div className="flex flex-wrap gap-2">
                {unidades
                  .filter((u) => u.id !== unidadeId)
                  .map((u) => {
                    const marcada = extras.includes(u.id)
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => alternarExtra(u.id)}
                        aria-pressed={marcada}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors',
                          marcada
                            ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {marcada && <Check size={12} />}
                        {u.nome}
                      </button>
                    )
                  })}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Ele vai poder abrir lista e ver a equipe dessas lojas também.
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={salvarEdicao}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {perfilAberto && (
        <PerfilUsuarioModal
          inicial={{ ...usuario, unidade_nome: nomeUnidade }}
          onFechar={() => setPerfilAberto(false)}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {modalExcluir && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="text-red-500" size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Expulsar {usuario.nome} do sistema?
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    O cadastro será removido permanentemente. A pessoa perderá o acesso
                    e precisará se cadastrar de novo. Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-0 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalExcluir(false)}
                disabled={isPending}
                className="py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarExcluir}
                disabled={isPending}
                className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'text-[11px] font-medium px-2 py-0.5 rounded-full',
        status === 'aprovado' && 'bg-green-50 text-green-700',
        status === 'pendente' && 'bg-orange-50 text-orange-600',
        status === 'rejeitado' && 'bg-red-50 text-red-600'
      )}
    >
      {status === 'aprovado' && 'Aprovado'}
      {status === 'pendente' && 'Pendente'}
      {status === 'rejeitado' && 'Recusado'}
    </span>
  )
}
