// Helpers de WhatsApp específicos do envio de LISTA por categoria (pedidos).
// Reaproveita a integração base de src/lib/whatsapp.ts (mesmas env vars
// ZAPI_INSTANCE_ID / ZAPI_TOKEN / ZAPI_CLIENT_TOKEN) para não duplicar config.

import { whatsappAtivo, enviarWhatsApp, normalizarNumero } from '@/lib/whatsapp'

type ResultadoEnvio =
  | { ok: true }
  | { ok: false; motivo: 'nao_configurado' | 'sem_numero' | 'falha'; detalhe?: string }

export function zapiConfigurado(): boolean {
  return whatsappAtivo()
}

// Descobre o número de WhatsApp ATIVO de um usuário para receber notificações.
// Usa o número atual do profile; se vazio/inválido, faz fallback ao anterior.
// Recebe um client Supabase já criado (admin ou normal).
export async function obterNumeroAtivo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('whatsapp, whatsapp_anterior')
    .eq('id', userId)
    .single()
  if (!data) return null
  // normalizarNumero exige string; trata vazios
  const atual = data.whatsapp ? normalizarNumero(data.whatsapp) : null
  if (atual && atual.length >= 12) return atual
  const anterior = data.whatsapp_anterior ? normalizarNumero(data.whatsapp_anterior) : null
  return anterior && anterior.length >= 12 ? anterior : null
}

export async function enviarTextoWhatsApp(
  whatsapp: string | null | undefined,
  mensagem: string
): Promise<ResultadoEnvio> {
  if (!whatsappAtivo()) {
    return { ok: false, motivo: 'nao_configurado' }
  }
  if (!whatsapp) {
    return { ok: false, motivo: 'sem_numero' }
  }
  const ok = await enviarWhatsApp(whatsapp, mensagem)
  return ok ? { ok: true } : { ok: false, motivo: 'falha' }
}
