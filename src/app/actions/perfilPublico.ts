'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { unidadesDoUsuario } from '@/lib/unidadesAcesso'

export type AtividadePedido = {
  id: string
  status: string
  created_at: string
  unidade_nome: string | null
  total_itens: number
}

export type AtividadeSugestao = {
  id: string
  nome: string
  status: string
  created_at: string
}

export type PerfilPublico = {
  perfil: {
    id: string
    nome: string
    cargo: string
    avatar_url: string | null
    unidade_nome: string | null
    // só para o dono (administrador)
    email?: string | null
    whatsapp?: string | null
  }
  mostrarContato: boolean
  pedidos: AtividadePedido[]
  sugestoes: AtividadeSugestao[]
}

// Perfil de outro usuário + últimas listas e sugestões dele.
// - Dono: vê tudo, inclusive e-mail e WhatsApp.
// - Gerente: foto, cargo e loja de qualquer usuário.
// - Funcionário: foto, cargo e loja só de colegas da MESMA loja.
// O perfil é lido com o admin (o RLS de profiles não deixa o funcionário ler
// outros perfis), por isso só os campos permitidos são devolvidos. Já as
// listas usam o client do usuário: o RLS de pedidos garante que ele só vê as
// listas das lojas dele.
export async function buscarPerfilPublico(
  usuarioId: string
): Promise<{ dados?: PerfilPublico; erro?: string }> {
  const supabase = await createClient()
  const admin = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  const [{ data: eu }, { data: alvo }] = await Promise.all([
    admin.from('profiles').select('cargo, status, unidade_id').eq('id', user.id).single(),
    admin
      .from('profiles')
      .select('id, nome, cargo, avatar_url, email, whatsapp, unidade_id, unidade:unidades!profiles_unidade_id_fkey(nome)')
      .eq('id', usuarioId)
      .single(),
  ])

  if (!eu || eu.status !== 'aprovado') return { erro: 'Sem permissão' }
  if (!alvo) return { erro: 'Usuário não encontrado' }

  const ehDono = eu.cargo === 'dono'
  // Funcionário: só quem divide pelo menos uma loja com ele (contando as lojas
  // extras de cada um, ex: o gerente que gerencia a loja dele).
  if (eu.cargo === 'funcionario' && usuarioId !== user.id) {
    const [minhas, dele] = await Promise.all([
      unidadesDoUsuario(admin, { id: user.id, unidade_id: eu.unidade_id }),
      unidadesDoUsuario(admin, alvo),
    ])
    if (!Array.from(minhas).some((id) => dele.has(id))) {
      return { erro: 'Este usuário é de outra loja' }
    }
  }

  const [{ data: pedidos }, { data: sugestoes }] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, status, created_at, unidade:unidades(nome), itens:pedido_itens(id)')
      .eq('criado_por', usuarioId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('sugestoes')
      .select('id, nome, status, created_at')
      .eq('sugerido_por', usuarioId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const unidadeAlvo = alvo.unidade as unknown as { nome: string } | null

  return {
    dados: {
      perfil: {
        id: alvo.id,
        nome: alvo.nome,
        cargo: alvo.cargo,
        avatar_url: alvo.avatar_url,
        unidade_nome: unidadeAlvo?.nome ?? null,
        ...(ehDono ? { email: alvo.email, whatsapp: alvo.whatsapp } : {}),
      },
      mostrarContato: ehDono,
      pedidos: (pedidos ?? []).map((p) => ({
        id: p.id,
        status: p.status,
        created_at: p.created_at,
        unidade_nome: (p.unidade as unknown as { nome: string } | null)?.nome ?? null,
        total_itens: (p.itens as unknown as { id: string }[] | null)?.length ?? 0,
      })),
      sugestoes: sugestoes ?? [],
    },
  }
}
