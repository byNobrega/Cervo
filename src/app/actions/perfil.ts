'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notificar, buscarIdsPorCargo } from '@/lib/notificacoes'

// ==================== EDIÇÕES DIRETAS (sem aprovação) ====================

// Atualiza nome e/ou foto de perfil do usuário logado.
export async function atualizarPerfilBasico(dados: { nome?: string; avatarUrl?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const update: Record<string, unknown> = {}
  if (dados.nome !== undefined) update.nome = dados.nome.trim()
  if (dados.avatarUrl !== undefined) update.avatar_url = dados.avatarUrl
  if (Object.keys(update).length === 0) return

  await supabase.from('profiles').update(update).eq('id', user.id)
  revalidatePath('/perfil')
}

// Altera o número de WhatsApp, preservando o anterior (histórico / fallback Z-API).
export async function alterarNumero(novoNumero: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: perfil } = await supabase
    .from('profiles')
    .select('whatsapp')
    .eq('id', user.id)
    .single()

  const numeroAtual = perfil?.whatsapp ?? null

  await supabase
    .from('profiles')
    .update({
      whatsapp: novoNumero,
      whatsapp_anterior: numeroAtual,
      whatsapp_alterado_em: new Date().toISOString(),
    })
    .eq('id', user.id)

  revalidatePath('/perfil')
}

// Dispara o e-mail nativo do Supabase para redefinição de senha.
export async function enviarResetSenha(): Promise<{ ok: boolean; mensagem: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { ok: false, mensagem: 'E-mail não encontrado.' }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/login`,
  })
  if (error) return { ok: false, mensagem: 'Não foi possível enviar o e-mail.' }
  return { ok: true, mensagem: `Enviamos um link para ${user.email}.` }
}

// ==================== SOLICITAÇÕES (com aprovação) ====================

// Cria uma solicitação de mudança de cargo ou unidade e notifica gerente/dono.
export async function solicitarMudancaPerfil(dados: {
  tipo: 'cargo' | 'unidade'
  cargoNovo?: 'funcionario' | 'gerente'
  unidadeNova?: string | null
}): Promise<{ ok: boolean; mensagem: string }> {
  const supabase = await createClient()
  const admin = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, mensagem: 'Não autenticado' }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nome, cargo, unidade_id')
    .eq('id', user.id)
    .single()
  if (!perfil) return { ok: false, mensagem: 'Perfil não encontrado' }

  // Evita solicitação duplicada pendente do mesmo tipo
  const { data: jaPendente } = await supabase
    .from('solicitacoes_perfil')
    .select('id')
    .eq('solicitante', user.id)
    .eq('tipo', dados.tipo)
    .eq('status', 'pendente')
    .maybeSingle()
  if (jaPendente) {
    return { ok: false, mensagem: 'Você já tem uma solicitação pendente desse tipo.' }
  }

  await supabase.from('solicitacoes_perfil').insert({
    solicitante: user.id,
    tipo: dados.tipo,
    cargo_novo: dados.tipo === 'cargo' ? dados.cargoNovo ?? null : null,
    unidade_nova: dados.tipo === 'unidade' ? dados.unidadeNova ?? null : null,
    cargo_atual: perfil.cargo,
    unidade_atual: perfil.unidade_id,
  })

  // Notifica gerentes e dono
  const destinatarios = await buscarIdsPorCargo(admin, ['gerente', 'dono'])
  const oQue = dados.tipo === 'cargo' ? 'mudança de cargo' : 'mudança de unidade'
  await notificar(admin, destinatarios, 'solicitacao_perfil', 'Solicitação de perfil', {
    mensagem: `${perfil.nome} solicitou ${oQue}.`,
    link: '/usuarios',
  })

  revalidatePath('/perfil')
  revalidatePath('/usuarios')
  return { ok: true, mensagem: 'Solicitação enviada para aprovação do gerente.' }
}

// Gerente/dono aprova uma solicitação: aplica a mudança no profile.
export async function aprovarSolicitacaoPerfil(solicitacaoId: string) {
  const supabase = await createClient()
  const admin = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: solic } = await supabase
    .from('solicitacoes_perfil')
    .select('*')
    .eq('id', solicitacaoId)
    .single()
  if (!solic || solic.status !== 'pendente') return

  // Aplica a mudança (usa admin para garantir a escrita no profile alvo)
  if (solic.tipo === 'cargo' && solic.cargo_novo) {
    await admin.from('profiles').update({ cargo: solic.cargo_novo }).eq('id', solic.solicitante)
    await admin.auth.admin.updateUserById(solic.solicitante, {
      app_metadata: { cargo: solic.cargo_novo },
    })
    // Mantém gerente_unidades coerente: vira gerente da própria unidade; sai se rebaixou
    const { data: alvo } = await admin
      .from('profiles')
      .select('unidade_id')
      .eq('id', solic.solicitante)
      .single()
    if (solic.cargo_novo === 'gerente' && alvo?.unidade_id) {
      await admin.from('gerente_unidades').upsert({
        gerente_id: solic.solicitante,
        unidade_id: alvo.unidade_id,
      })
    } else if (solic.cargo_novo !== 'gerente') {
      await admin.from('gerente_unidades').delete().eq('gerente_id', solic.solicitante)
    }
  } else if (solic.tipo === 'unidade') {
    await admin
      .from('profiles')
      .update({ unidade_id: solic.unidade_nova })
      .eq('id', solic.solicitante)
  }

  await admin
    .from('solicitacoes_perfil')
    .update({ status: 'aprovado', revisado_por: user.id, revisado_em: new Date().toISOString() })
    .eq('id', solicitacaoId)

  await notificar(admin, [solic.solicitante], 'solicitacao_aprovada', 'Solicitação aprovada!', {
    mensagem:
      solic.tipo === 'cargo'
        ? 'Sua mudança de cargo foi aprovada.'
        : 'Sua mudança de unidade foi aprovada.',
    link: '/perfil',
  })

  revalidatePath('/usuarios')
  revalidatePath('/perfil')
}

// Gerente/dono recusa uma solicitação.
export async function recusarSolicitacaoPerfil(solicitacaoId: string) {
  const supabase = await createClient()
  const admin = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: solic } = await supabase
    .from('solicitacoes_perfil')
    .select('solicitante, tipo, status')
    .eq('id', solicitacaoId)
    .single()
  if (!solic || solic.status !== 'pendente') return

  await admin
    .from('solicitacoes_perfil')
    .update({ status: 'rejeitado', revisado_por: user.id, revisado_em: new Date().toISOString() })
    .eq('id', solicitacaoId)

  await notificar(admin, [solic.solicitante], 'solicitacao_rejeitada', 'Solicitação recusada', {
    mensagem:
      solic.tipo === 'cargo'
        ? 'Sua mudança de cargo foi recusada.'
        : 'Sua mudança de unidade foi recusada.',
    link: '/perfil',
  })

  revalidatePath('/usuarios')
  revalidatePath('/perfil')
}
