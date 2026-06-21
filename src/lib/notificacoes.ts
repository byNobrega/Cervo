import { type SupabaseClient } from '@supabase/supabase-js'
import { type TipoNotificacao } from '@/types'
import { whatsappAtivo, enviarWhatsAppEmMassa } from '@/lib/whatsapp'

export async function notificar(
  supabase: SupabaseClient,
  destinatarios: string[],
  tipo: TipoNotificacao,
  titulo: string,
  opcoes?: { mensagem?: string; link?: string; payload?: Record<string, unknown> }
) {
  if (destinatarios.length === 0) return

  const inserts = destinatarios.map((para_id) => ({
    para_id,
    tipo,
    titulo,
    mensagem: opcoes?.mensagem ?? null,
    link: opcoes?.link ?? null,
    payload: opcoes?.payload ?? null,
  }))

  await supabase.from('notificacoes').insert(inserts)

  // Espelha a notificação no WhatsApp quando a integração Z-API estiver ativa.
  // No-op silencioso enquanto não configurada.
  if (whatsappAtivo()) {
    const { data: perfis } = await supabase
      .from('profiles')
      .select('whatsapp, whatsapp_anterior')
      .in('id', destinatarios)

    // Usa o número ATUAL; se vazio, cai no anterior (fallback do histórico).
    const numeros = (perfis ?? []).map(
      (p: { whatsapp: string | null; whatsapp_anterior: string | null }) =>
        p.whatsapp || p.whatsapp_anterior
    )
    const texto = opcoes?.mensagem ? `*${titulo}*\n${opcoes.mensagem}` : titulo
    await enviarWhatsAppEmMassa(numeros, texto)
  }
}

export async function buscarIdsPorCargo(
  supabase: SupabaseClient,
  cargos: string[]
): Promise<string[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .in('cargo', cargos)
    .eq('status', 'aprovado')

  return (data ?? []).map((p: { id: string }) => p.id)
}
