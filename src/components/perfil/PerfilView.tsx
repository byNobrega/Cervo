'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { type Profile } from '@/types'
import { CARGOS_LABEL } from '@/lib/constants'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import {
  atualizarPerfilBasico,
  alterarNumero,
  enviarResetSenha,
  solicitarMudancaPerfil,
} from '@/app/actions/perfil'
import { useAuth } from '@/hooks/useAuth'
import { Pencil, Check, Loader2, LogOut, KeyRound, Clock } from 'lucide-react'

type Opcao = { id: string; nome: string }
type SolicPendente = { id: string; tipo: string; status: string; created_at: string }

// Máscara de telefone BR: (21) 98777-5267
function aplicarMascara(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function PerfilView({
  profile,
  unidades,
  solicitacoesPendentes,
}: {
  profile: Profile & { unidade?: { id: string; nome: string } | null }
  unidades: Opcao[]
  solicitacoesPendentes: SolicPendente[]
}) {
  const router = useRouter()
  const { signOut } = useAuth()

  const temCargoPendente = solicitacoesPendentes.some((s) => s.tipo === 'cargo')
  const temUnidadePendente = solicitacoesPendentes.some((s) => s.tipo === 'unidade')

  return (
    <div className="space-y-4">
      {/* ====== Cartão principal: foto + nome ====== */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center gap-4">
          <AvatarEditavel profile={profile} onAtualizado={() => router.refresh()} />
          <NomeEditavel nome={profile.nome} onSalvar={() => router.refresh()} />
        </div>
      </div>

      {/* ====== Cargo e Unidade (com aprovação) ====== */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <LinhaComPedido
          rotulo="Cargo"
          valorAtual={CARGOS_LABEL[profile.cargo]}
          pendente={temCargoPendente}
          ehDono={profile.cargo === 'dono'}
        >
          <PedirCargo cargoAtual={profile.cargo} />
        </LinhaComPedido>

        <LinhaComPedido
          rotulo="Unidade"
          valorAtual={profile.unidade?.nome ?? 'Sem unidade'}
          pendente={temUnidadePendente}
          ehDono={profile.cargo === 'dono'}
        >
          <PedirUnidade unidades={unidades} unidadeAtual={profile.unidade_id} />
        </LinhaComPedido>
      </div>

      {/* ====== Contato ====== */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contato</h3>
        <NumeroEditavel whatsapp={profile.whatsapp} onSalvar={() => router.refresh()} />
        <div>
          <p className="text-xs text-gray-400">E-mail</p>
          <p className="text-sm text-gray-700">{profile.email}</p>
        </div>
      </div>

      {/* ====== Segurança ====== */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Segurança</h3>
        <AlterarSenha />
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
        >
          <LogOut size={15} />
          Sair da conta
        </button>
      </div>
    </div>
  )
}

// ---------- Avatar ----------
function AvatarEditavel({
  profile,
  onAtualizado,
}: {
  profile: Profile
  onAtualizado: () => void
}) {
  const [editando, setEditando] = useState(false)
  const [, startTransition] = useTransition()

  function handleFoto(url: string) {
    startTransition(async () => {
      await atualizarPerfilBasico({ avatarUrl: url })
      setEditando(false)
      onAtualizado()
    })
  }

  if (editando) {
    return (
      <div className="flex flex-col gap-2">
        <PhotoUpload value={profile.avatar_url ?? ''} onChange={handleFoto} pasta="avatares" label="" />
        <button type="button" onClick={() => setEditando(false)} className="text-xs text-gray-400 hover:text-gray-600">
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      className="relative w-16 h-16 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center flex-shrink-0 group"
      title="Editar foto"
    >
      {profile.avatar_url ? (
        <Image src={profile.avatar_url} alt={profile.nome} fill sizes="80px" className="object-cover" />
      ) : (
        <span className="text-blue-700 font-semibold text-xl">{profile.nome.charAt(0).toUpperCase()}</span>
      )}
      <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Pencil size={16} className="text-white" />
      </span>
    </button>
  )
}

// ---------- Nome ----------
function NomeEditavel({ nome, onSalvar }: { nome: string; onSalvar: () => void }) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(nome)
  const [isPending, startTransition] = useTransition()

  function salvar() {
    startTransition(async () => {
      await atualizarPerfilBasico({ nome: valor })
      setEditando(false)
      onSalvar()
    })
  }

  if (!editando) {
    return (
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">Nome</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-gray-900 truncate">{nome}</p>
          <button type="button" onClick={() => setEditando(true)} aria-label="Editar nome" className="text-gray-300 hover:text-gray-500">
            <Pencil size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center gap-2">
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        aria-label="Nome"
        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={salvar}
        disabled={isPending || !valor.trim()}
        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        Confirmar
      </button>
    </div>
  )
}

// ---------- Número com máscara ----------
function NumeroEditavel({ whatsapp, onSalvar }: { whatsapp: string | null; onSalvar: () => void }) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(aplicarMascara(whatsapp ?? ''))
  const [isPending, startTransition] = useTransition()

  function salvar() {
    startTransition(async () => {
      await alterarNumero(valor)
      setEditando(false)
      onSalvar()
    })
  }

  return (
    <div>
      <p className="text-xs text-gray-400">WhatsApp</p>
      {!editando ? (
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-700">{whatsapp ? aplicarMascara(whatsapp) : '—'}</p>
          <button type="button" onClick={() => setEditando(true)} aria-label="Editar WhatsApp" className="text-gray-300 hover:text-gray-500">
            <Pencil size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-1">
          <input
            value={valor}
            onChange={(e) => setValor(aplicarMascara(e.target.value))}
            placeholder="(21) 98777-5267"
            inputMode="numeric"
            aria-label="Número de WhatsApp"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={salvar}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Confirmar
          </button>
        </div>
      )}
      {editando && (
        <p className="text-[11px] text-gray-400 mt-1">
          As próximas notificações por WhatsApp irão para este número.
        </p>
      )}
    </div>
  )
}

// ---------- Linha com botão de pedir mudança ----------
function LinhaComPedido({
  rotulo,
  valorAtual,
  pendente,
  ehDono,
  children,
}: {
  rotulo: string
  valorAtual: string
  pendente: boolean
  ehDono: boolean
  children: React.ReactNode
}) {
  const [aberto, setAberto] = useState(false)
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{rotulo}</p>
          <p className="text-sm text-gray-700">{valorAtual}</p>
        </div>
        {ehDono ? null : pendente ? (
          <span className="flex items-center gap-1 text-[11px] text-orange-500 font-medium">
            <Clock size={11} /> Aguardando aprovação
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Pedir mudança
          </button>
        )}
      </div>
      {aberto && !pendente && <div className="mt-3">{children}</div>}
    </div>
  )
}

// ---------- Pedir cargo ----------
function PedirCargo({ cargoAtual }: { cargoAtual: string }) {
  const router = useRouter()
  const [cargo, setCargo] = useState<'funcionario' | 'gerente'>(
    cargoAtual === 'gerente' ? 'funcionario' : 'gerente'
  )
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState('')

  function enviar() {
    startTransition(async () => {
      const r = await solicitarMudancaPerfil({ tipo: 'cargo', cargoNovo: cargo })
      setMsg(r.mensagem)
      if (r.ok) router.refresh()
    })
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <p className="text-xs text-gray-500">Mudar para:</p>
      <select
        value={cargo}
        onChange={(e) => setCargo(e.target.value as 'funcionario' | 'gerente')}
        aria-label="Novo cargo"
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
      >
        <option value="funcionario">Funcionário</option>
        <option value="gerente">Gerente</option>
      </select>
      <button
        type="button"
        onClick={enviar}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        Solicitar
      </button>
      {msg && <p className="text-xs text-gray-500">{msg}</p>}
    </div>
  )
}

// ---------- Pedir unidade ----------
function PedirUnidade({ unidades, unidadeAtual }: { unidades: Opcao[]; unidadeAtual: string | null }) {
  const router = useRouter()
  const [unidade, setUnidade] = useState(unidadeAtual ?? '')
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState('')

  function enviar() {
    startTransition(async () => {
      const r = await solicitarMudancaPerfil({ tipo: 'unidade', unidadeNova: unidade || null })
      setMsg(r.mensagem)
      if (r.ok) router.refresh()
    })
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <p className="text-xs text-gray-500">Mudar para:</p>
      <select
        value={unidade}
        onChange={(e) => setUnidade(e.target.value)}
        aria-label="Nova unidade"
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
      >
        <option value="">Sem unidade</option>
        {unidades.map((u) => (
          <option key={u.id} value={u.id}>{u.nome}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={enviar}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        Solicitar
      </button>
      {msg && <p className="text-xs text-gray-500">{msg}</p>}
    </div>
  )
}

// ---------- Alterar senha ----------
function AlterarSenha() {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState('')

  function enviar() {
    startTransition(async () => {
      const r = await enviarResetSenha()
      setMsg(r.mensagem)
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={enviar}
        disabled={isPending}
        className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
        Alterar senha (link por e-mail)
      </button>
      {msg && <p className="text-xs text-green-600 mt-1">{msg}</p>}
    </div>
  )
}
