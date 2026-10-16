'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notificar, buscarIdsPorCargo } from '@/lib/notificacoes'

// As ações abaixo usam a chave de admin (passam por cima do RLS), então
// precisam conferir que quem chama é o dono. Sem isto, qualquer usuário logado
// poderia chamar a server action e se aprovar, mudar cargo ou excluir alguém.
async function exigirDono() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: perfil } = await supabase
    .from('profiles')
    .select('cargo, status')
    .eq('id', user.id)
    .single()
  if (perfil?.cargo !== 'dono' || perfil?.status !== 'aprovado') {
    throw new Error('Apenas o administrador pode fazer isso')
  }
}

// Avisa o(s) Dono(s) que há um novo cadastro aguardando aprovação.
// Notifica no app (sininho) e espelha no WhatsApp quando o Z-API estiver ativo.
// Chamado logo após o signup (o usuário novo entra como 'pendente').
export async function notificarCadastroPendente(dados: {
  nome: string
  cargo: string
  unidadeNome?: string | null
}) {
  const admin = await createAdminClient()
  const donos = await buscarIdsPorCargo(admin, ['dono'])
  if (donos.length === 0) return

  const cargoLabel = dados.cargo === 'gerente' ? 'gerente' : 'funcionário'
  const ondePart = dados.unidadeNome ? ` — ${dados.unidadeNome}` : ''

  await notificar(admin, donos, 'cadastro_pendente', 'Novo cadastro no Cervo', {
    mensagem: `${dados.nome} (${cargoLabel})${ondePart} se cadastrou e aguarda aprovação.`,
    link: '/usuarios',
  })
}

export async function aprovarUsuario(userId: string) {
  await exigirDono()
  const supabase = await createAdminClient()

  // Atualiza status no profile
  await supabase
    .from('profiles')
    .update({ status: 'aprovado' })
    .eq('id', userId)

  // Atualiza app_metadata no JWT para refletir no middleware sem query
  await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { status: 'aprovado' },
  })

  // Notifica o usuário aprovado
  await notificar(supabase, [userId], 'cadastro_aprovado', 'Cadastro aprovado!', {
    mensagem: 'Seu acesso ao CÊRVO foi aprovado. Bem-vindo!',
    link: '/painel',
  })

  revalidatePath('/usuarios')
}

// Edita dados do usuário (nome, cargo e lojas). Apenas dono usa isto.
// - unidade_id: loja principal (base)
// - lojasExtras: outras lojas onde ele também trabalha (gerente OU
//   funcionário). Ficam em gerente_unidades, que dá acesso no RLS
//   (minhas_unidades) e libera abrir lista para essas lojas.
export async function editarUsuario(
  userId: string,
  dados: {
    nome: string
    cargo: 'funcionario' | 'gerente'
    unidade_id: string | null
    lojasExtras: string[]
  }
) {
  await exigirDono()
  const supabase = await createAdminClient()

  await supabase
    .from('profiles')
    .update({ nome: dados.nome, cargo: dados.cargo, unidade_id: dados.unidade_id })
    .eq('id', userId)

  // Mantém o app_metadata do cargo sincronizado (usado pelo middleware/JWT)
  await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { cargo: dados.cargo },
  })

  // Substitui os vínculos pelas lojas marcadas. O gerente continua com o
  // vínculo da loja principal também (como antes), para constar como gestor dela.
  const lojas = new Set(dados.lojasExtras.filter(Boolean))
  if (dados.cargo === 'gerente' && dados.unidade_id) lojas.add(dados.unidade_id)
  if (dados.cargo !== 'gerente' && dados.unidade_id) lojas.delete(dados.unidade_id)

  await supabase.from('gerente_unidades').delete().eq('gerente_id', userId)
  if (lojas.size > 0) {
    await supabase
      .from('gerente_unidades')
      .insert(Array.from(lojas).map((unidade_id) => ({ gerente_id: userId, unidade_id })))
  }

  revalidatePath('/usuarios')
  revalidatePath('/unidades', 'layout')
}

// Remove o usuário do sistema por completo (auth + profile via CASCADE).
export async function excluirUsuario(userId: string) {
  await exigirDono()
  const supabase = await createAdminClient()
  // Apagar de auth.users remove o profile automaticamente (FK ON DELETE CASCADE)
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) {
    // fallback: ao menos remove o profile
    await supabase.from('profiles').delete().eq('id', userId)
  }
  revalidatePath('/usuarios')
}

export async function rejeitarUsuario(userId: string) {
  await exigirDono()
  const supabase = await createAdminClient()

  await supabase
    .from('profiles')
    .update({ status: 'rejeitado' })
    .eq('id', userId)

  await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { status: 'rejeitado' },
  })

  await notificar(supabase, [userId], 'cadastro_rejeitado', 'Cadastro recusado', {
    mensagem: 'Seu acesso foi recusado. Entre em contato com o responsável.',
  })

  revalidatePath('/usuarios')
}
