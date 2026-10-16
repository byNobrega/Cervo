'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Mail, Phone, Store, Briefcase, X, Loader2, ShoppingCart, Lightbulb } from 'lucide-react'
import { CARGOS_LABEL } from '@/lib/constants'
import { formatDate, cn } from '@/lib/utils'
import { buscarPerfilPublico, type PerfilPublico } from '@/app/actions/perfilPublico'
import { Avatar } from './Avatar'
import { FotoAmpliavel } from './FotoAmpliavel'

// Dados já conhecidos de quem abre o cartão: aparecem na hora, enquanto o
// resto (contato, listas, sugestões) carrega.
export type PerfilResumo = {
  id: string
  nome: string
  cargo?: string
  avatar_url?: string | null
  unidade_nome?: string | null
}

const STATUS_SUGESTAO: Record<string, { label: string; cor: string }> = {
  pendente: { label: 'Pendente', cor: 'bg-orange-50 text-orange-600' },
  aprovado: { label: 'Aprovada', cor: 'bg-green-50 text-green-700' },
  rejeitado: { label: 'Negada', cor: 'bg-red-50 text-red-600' },
}

/**
 * Cartão de perfil de um usuário. Todos veem foto, cargo, loja, últimas listas
 * e últimas sugestões; e-mail e WhatsApp só o dono (decidido no servidor).
 */
export function PerfilUsuarioModal({
  inicial,
  onFechar,
}: {
  inicial: PerfilResumo
  onFechar: () => void
}) {
  const [dados, setDados] = useState<PerfilPublico | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    buscarPerfilPublico(inicial.id)
      .then((r) => {
        if (!ativo) return
        if (r.dados) setDados(r.dados)
        else setErro(r.erro ?? 'Não foi possível carregar o perfil')
      })
      .catch(() => ativo && setErro('Não foi possível carregar o perfil'))
    return () => {
      ativo = false
    }
  }, [inicial.id])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onFechar])

  const perfil = dados?.perfil ?? inicial
  const cargo = perfil.cargo ? CARGOS_LABEL[perfil.cargo] ?? perfil.cargo : '—'

  // stopPropagation: o cartão pode ser aberto de dentro de um <Link> (lista de
  // pedidos); os eventos do portal sobem pela árvore do React e acionariam o link.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Perfil de ${perfil.nome}`}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onFechar()
      }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          {perfil.avatar_url ? (
            // Com foto: clicar amplia em tela cheia
            <div className="relative w-24 h-24 rounded-full overflow-hidden mx-auto bg-gray-200">
              <FotoAmpliavel src={perfil.avatar_url} alt={perfil.nome} sizes="200px" />
            </div>
          ) : (
            <Avatar url={null} nome={perfil.nome} tamanho={96} className="mx-auto" />
          )}
          <h3 className="mt-3 text-lg font-semibold text-gray-900">{perfil.nome}</h3>
        </div>

        <div className="mt-4 space-y-2">
          <Linha icone={<Briefcase size={15} />} rotulo="Cargo" valor={cargo} />
          <Linha icone={<Store size={15} />} rotulo="Loja" valor={perfil.unidade_nome || 'Sem loja definida'} />
          {dados?.mostrarContato && (
            <>
              <Linha icone={<Mail size={15} />} rotulo="E-mail" valor={dados.perfil.email || '—'} />
              <Linha
                icone={<Phone size={15} />}
                rotulo="WhatsApp"
                valor={
                  dados.perfil.whatsapp ? (
                    <a
                      href={`https://wa.me/${dados.perfil.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      {dados.perfil.whatsapp}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
            </>
          )}
        </div>

        {erro ? (
          <p className="mt-5 text-center text-sm text-gray-400">{erro}</p>
        ) : !dados ? (
          <div className="mt-5 flex justify-center text-gray-300">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <AtividadeUsuario dados={dados} onNavegar={onFechar} />
        )}
      </div>
    </div>,
    document.body
  )
}

/** Últimas listas e últimas sugestões de um usuário (cartão de perfil e Meu Perfil). */
export function AtividadeUsuario({
  dados,
  onNavegar,
}: {
  dados: Pick<PerfilPublico, 'pedidos' | 'sugestoes'>
  onNavegar?: () => void
}) {
  return (
          <>
            <Secao icone={<ShoppingCart size={13} />} titulo="Últimas listas">
              {dados.pedidos.length === 0 ? (
                <Vazio texto="Nenhuma lista" />
              ) : (
                dados.pedidos.map((p) => {
                  const aberto = p.status === 'aberta'
                  return (
                    <Link
                      key={p.id}
                      href={aberto ? `/pedidos/${p.id}` : `/historico/${p.id}`}
                      onClick={onNavegar}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 truncate">{p.unidade_nome ?? 'Lista'}</p>
                        <p className="text-[11px] text-gray-400">
                          {formatDate(p.created_at, 'dd/MM/yyyy')} · {p.total_itens}{' '}
                          {p.total_itens === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                          aberto ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-700'
                        )}
                      >
                        {aberto ? 'Aberta' : 'Concluída'}
                      </span>
                    </Link>
                  )
                })
              )}
            </Secao>

            <Secao icone={<Lightbulb size={13} />} titulo="Últimas sugestões">
              {dados.sugestoes.length === 0 ? (
                <Vazio texto="Nenhuma sugestão" />
              ) : (
                dados.sugestoes.map((s) => {
                  const st = STATUS_SUGESTAO[s.status] ?? STATUS_SUGESTAO.pendente
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 truncate">{s.nome}</p>
                        <p className="text-[11px] text-gray-400">{formatDate(s.created_at, 'dd/MM/yyyy')}</p>
                      </div>
                      <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0', st.cor)}>
                        {st.label}
                      </span>
                    </div>
                  )
                })
              )}
            </Secao>
          </>
  )
}

function Linha({ icone, rotulo, valor }: { icone: React.ReactNode; rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
      <span className="text-gray-400">{icone}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{rotulo}</p>
        <p className="text-sm text-gray-900 truncate">{valor}</p>
      </div>
    </div>
  )
}

function Secao({ icone, titulo, children }: { icone: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        {icone} {titulo}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </section>
  )
}

function Vazio({ texto }: { texto: string }) {
  return <p className="text-sm text-gray-300 px-1">{texto}</p>
}
