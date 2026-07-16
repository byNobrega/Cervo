'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { enviarWhatsApp, whatsappAtivo, normalizarNumero } from '@/lib/whatsapp'

const VALIDADE_MINUTOS = 30
const MAX_TENTATIVAS = 5
// Espera mínima entre reenvios, para não floodar o WhatsApp da pessoa.
const REENVIO_SEGUNDOS = 60

type Resultado = { ok: boolean; mensagem: string }

function gerarCodigo(): string {
  return String(Math.floor(100000 + Math.random() * 900000)) // 6 dígitos
}

// Gera um código, salva e envia por WhatsApp para o número informado.
export async function enviarCodigoVerificacao(whatsapp: string): Promise<Resultado> {
  const telefone = normalizarNumero(whatsapp)
  if (!telefone || telefone.length < 12) {
    return { ok: false, mensagem: 'Número de WhatsApp inválido.' }
  }
  if (!whatsappAtivo()) {
    return { ok: false, mensagem: 'Envio por WhatsApp indisponível no momento.' }
  }

  const admin = await createAdminClient()

  // Evita reenvio em sequência (anti-flood)
  const { data: ultimo } = await admin
    .from('verificacoes_whatsapp')
    .select('created_at')
    .eq('telefone', telefone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (ultimo) {
    const segundos = (Date.now() - new Date(ultimo.created_at).getTime()) / 1000
    if (segundos < REENVIO_SEGUNDOS) {
      const faltam = Math.ceil(REENVIO_SEGUNDOS - segundos)
      return { ok: false, mensagem: `Aguarde ${faltam}s para reenviar o código.` }
    }
  }

  const codigo = gerarCodigo()
  const expira = new Date(Date.now() + VALIDADE_MINUTOS * 60_000).toISOString()

  await admin.from('verificacoes_whatsapp').insert({
    telefone,
    codigo,
    expira_em: expira,
  })

  const enviado = await enviarWhatsApp(
    telefone,
    `🦌 *Cervo*\n\nSeu código de confirmação é: *${codigo}*\n\nEle vale por ${VALIDADE_MINUTOS} minutos. Se não foi você, ignore esta mensagem.`
  )

  if (!enviado) {
    return { ok: false, mensagem: 'Não conseguimos enviar o código. Confira o número.' }
  }

  return { ok: true, mensagem: 'Código enviado para o seu WhatsApp.' }
}

// Confere o código digitado. Marca como usado quando válido.
export async function validarCodigoVerificacao(
  whatsapp: string,
  codigo: string
): Promise<Resultado> {
  const telefone = normalizarNumero(whatsapp)
  if (!telefone) return { ok: false, mensagem: 'Número inválido.' }

  const admin = await createAdminClient()

  const { data: registro } = await admin
    .from('verificacoes_whatsapp')
    .select('*')
    .eq('telefone', telefone)
    .eq('usado', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!registro) {
    return { ok: false, mensagem: 'Nenhum código pendente. Peça um novo.' }
  }
  if (new Date(registro.expira_em).getTime() < Date.now()) {
    return { ok: false, mensagem: 'Código expirado. Peça um novo.' }
  }
  if (registro.tentativas >= MAX_TENTATIVAS) {
    return { ok: false, mensagem: 'Muitas tentativas. Peça um novo código.' }
  }

  if (registro.codigo !== codigo.trim()) {
    await admin
      .from('verificacoes_whatsapp')
      .update({ tentativas: registro.tentativas + 1 })
      .eq('id', registro.id)
    return { ok: false, mensagem: 'Código incorreto.' }
  }

  await admin.from('verificacoes_whatsapp').update({ usado: true }).eq('id', registro.id)
  return { ok: true, mensagem: 'Número confirmado!' }
}
