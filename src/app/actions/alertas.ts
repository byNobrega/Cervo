'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { notificar, buscarIdsPorCargo } from '@/lib/notificacoes'

export async function calcularAlertas() {
  const supabase = await createAdminClient()

  const trintaDiasAtras = new Date()
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

  // Busca itens dos últimos 30 dias
  const { data: itens30d } = await supabase
    .from('pedido_itens')
    .select('nome_snapshot, categoria, pedido_id, pedidos!inner(created_at)')
    .gte('pedidos.created_at', trintaDiasAtras.toISOString())

  // Contagem por item
  const contagem: Record<string, { count: number; categoria: string }> = {}
  for (const item of itens30d ?? []) {
    const key = item.nome_snapshot
    if (!contagem[key]) contagem[key] = { count: 0, categoria: item.categoria }
    contagem[key].count++
  }

  // Alertas de frequência alta (≥ 4 vezes no mês)
  const frequenciaAlta = Object.entries(contagem)
    .filter(([, v]) => v.count >= 4)

  // Busca itens marcados "nao_tem" nas últimas 3 ocorrências
  const { data: itensConcluidos } = await supabase
    .from('pedido_itens')
    .select('nome_snapshot, status, pedido_id, pedidos!inner(concluido_em)')
    .eq('pedidos.status', 'concluida')
    .not('pedidos.concluido_em', 'is', null)
    .order('pedidos.concluido_em', { ascending: false })

  // Agrupar por item e pegar últimas 3 ocorrências
  const porItem: Record<string, string[]> = {}
  for (const item of itensConcluidos ?? []) {
    if (!porItem[item.nome_snapshot]) porItem[item.nome_snapshot] = []
    if (porItem[item.nome_snapshot].length < 3) {
      porItem[item.nome_snapshot].push(item.status)
    }
  }

  const naoTemRecorrente = Object.entries(porItem).filter(
    ([, statuses]) => statuses.length === 3 && statuses.every((s) => s === 'nao_tem')
  )

  // Limpa alertas antigos não resolvidos e recria
  await supabase.from('alertas').delete().eq('resolvido', false)

  const novosAlertas = [
    ...frequenciaAlta.map(([nome, dados]) => ({
      tipo: 'frequencia_alta' as const,
      item_nome: nome,
      categoria: dados.categoria,
      contagem: dados.count,
      periodo_inicio: trintaDiasAtras.toISOString().split('T')[0],
      periodo_fim: new Date().toISOString().split('T')[0],
    })),
    ...naoTemRecorrente.map(([nome]) => ({
      tipo: 'nao_tem_recorrente' as const,
      item_nome: nome,
      contagem: 3,
    })),
  ]

  if (novosAlertas.length > 0) {
    await supabase.from('alertas').insert(novosAlertas)

    const destinatarios = await buscarIdsPorCargo(supabase, ['gerente', 'dono'])
    await notificar(
      supabase,
      destinatarios,
      'alerta',
      `${novosAlertas.length} alerta${novosAlertas.length !== 1 ? 's' : ''} gerado${novosAlertas.length !== 1 ? 's' : ''}`,
      { link: '/alertas' }
    )
  }

  revalidatePath('/alertas')
}

export async function resolverAlerta(alertaId: string) {
  const supabase = await createAdminClient()
  await supabase.from('alertas').update({ resolvido: true }).eq('id', alertaId)
  revalidatePath('/alertas')
}
