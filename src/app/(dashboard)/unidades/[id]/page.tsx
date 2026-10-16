import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { UnidadeDashboard } from '@/components/unidades/UnidadeDashboard'
import { LogoUnidade, temLogoUnidade } from '@/components/shared/LogoUnidade'
import { unidadesVisiveis } from '@/lib/unidadesAcesso'
export const dynamic = 'force-dynamic'

type Membro = { id: string; nome: string; cargo: string; status: string; avatar_url: string | null }

export default async function UnidadePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const admin = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cargo, unidade_id')
    .eq('id', user.id)
    .single()
  const cargo = profile?.cargo ?? 'funcionario'

  // Acesso: dono todas, gerente as que gerencia, funcionário só a dele.
  // (O RLS de unidades libera leitura a todos, então a checagem é aqui.)
  const visiveis = await unidadesVisiveis(admin, {
    id: user.id,
    cargo,
    unidade_id: profile?.unidade_id ?? null,
  })
  if (visiveis !== null && !visiveis.includes(params.id)) redirect('/unidades')

  const { data: unidade } = await supabase
    .from('unidades')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!unidade) redirect('/unidades')

  // Equipe: quem tem esta loja como base + gerentes ligados a ela.
  // Lida com o admin porque o RLS de profiles não deixa o funcionário ver os
  // colegas; por isso só nome, cargo, status e foto (contato só no cartão de
  // perfil, e só para o dono).
  const [{ data: daLoja }, { data: vinculosGerentes }] = await Promise.all([
    admin.from('profiles').select('id, nome, cargo, status, avatar_url').eq('unidade_id', params.id),
    admin.from('gerente_unidades').select('gerente_id').eq('unidade_id', params.id),
  ])
  const idsGerentesExtras = (vinculosGerentes ?? [])
    .map((g) => g.gerente_id as string)
    .filter((id) => !(daLoja ?? []).some((p) => p.id === id))
  const { data: gerentesExtras } = idsGerentesExtras.length
    ? await admin.from('profiles').select('id, nome, cargo, status, avatar_url').in('id', idsGerentesExtras)
    : { data: [] as Membro[] }

  const ordemCargo: Record<string, number> = { dono: 0, gerente: 1, funcionario: 2 }
  const equipe = [...((daLoja ?? []) as Membro[]), ...((gerentesExtras ?? []) as Membro[])]
    // Pendentes/recusados só aparecem para dono e gerente
    .filter((m) => m.status === 'aprovado' || cargo !== 'funcionario')
    .sort(
      (a, b) =>
        (ordemCargo[a.cargo] ?? 9) - (ordemCargo[b.cargo] ?? 9) || a.nome.localeCompare(b.nome)
    )
  const nomePorId = new Map(equipe.map((m) => [m.id, m.nome]))

  // Pedidos da unidade (o RLS de pedidos já limita às lojas do usuário)
  const { data: pedidosRaw } = await supabase
    .from('pedidos')
    .select('id, status, created_at, criado_por, itens:pedido_itens(id, status)')
    .eq('unidade_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Nome do criador vem da equipe (o join com profiles voltaria vazio para o
  // funcionário); quem já saiu da loja cai no admin.
  const idsSemNome = (pedidosRaw ?? []).map((p) => p.criado_por).filter((id) => !nomePorId.has(id))
  if (idsSemNome.length) {
    const { data } = await admin.from('profiles').select('id, nome').in('id', Array.from(new Set(idsSemNome)))
    for (const p of data ?? []) nomePorId.set(p.id, p.nome)
  }
  const pedidos = (pedidosRaw ?? []).map((p) => ({
    ...p,
    criador: nomePorId.has(p.criado_por) ? { nome: nomePorId.get(p.criado_por)! } : null,
  }))

  // Sugestões pendentes feitas pelos membros da unidade
  const idsMembros = equipe.map((f) => f.id)
  let sugestoes: { id: string; nome: string; tipo: string; sugeridor: { nome: string } | null }[] = []
  if (idsMembros.length > 0) {
    const { data } = await supabase
      .from('sugestoes')
      .select('id, nome, tipo, sugerido_por')
      .eq('status', 'pendente')
      .in('sugerido_por', idsMembros)
      .order('created_at', { ascending: false })
    sugestoes = (data ?? []).map((s) => ({
      id: s.id,
      nome: s.nome,
      tipo: s.tipo,
      sugeridor: nomePorId.has(s.sugerido_por) ? { nome: nomePorId.get(s.sugerido_por)! } : null,
    }))
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/unidades"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft size={16} />
        Unidades
      </Link>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          {temLogoUnidade(unidade.nome) ? (
            <LogoUnidade nomeUnidade={unidade.nome} size={26} />
          ) : (
            '🏪'
          )}
          {unidade.nome}
        </h2>
        {unidade.endereco && <p className="text-gray-500 text-sm mt-0.5">{unidade.endereco}</p>}
      </div>

      <UnidadeDashboard
        unidadeId={unidade.id}
        unidadeNome={unidade.nome}
        cargo={cargo}
        funcionarios={equipe}
        pedidos={pedidos}
        sugestoes={sugestoes}
      />
    </div>
  )
}
