/**
 * Integração com WhatsApp via Z-API.
 *
 * Estrutura preparada para o futuro: enquanto as variáveis de ambiente
 * (ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN) não estiverem definidas,
 * todas as funções viram no-op silencioso — o app continua funcionando
 * apenas com as notificações internas (sininho).
 *
 * Para ativar:
 *   1. Crie uma instância na Z-API (https://z-api.io)
 *   2. Preencha no .env.local:
 *        ZAPI_INSTANCE_ID=...
 *        ZAPI_TOKEN=...
 *        ZAPI_CLIENT_TOKEN=...   (Account Security Token, opcional dependendo da conta)
 *   3. As notificações relevantes passam a ser enviadas também via WhatsApp.
 */

const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID
const TOKEN = process.env.ZAPI_TOKEN
const CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN

/** Indica se a integração está configurada e pronta para enviar mensagens. */
export function whatsappAtivo(): boolean {
  return Boolean(INSTANCE_ID && TOKEN)
}

/**
 * Normaliza um número de WhatsApp para o formato esperado pela Z-API:
 * apenas dígitos, com DDI do Brasil (55) na frente.
 * Aceita entradas como "11999999999", "(11) 99999-9999", "+5511999999999".
 */
export function normalizarNumero(numero: string): string {
  const digitos = numero.replace(/\D/g, '')
  if (digitos.startsWith('55')) return digitos
  return `55${digitos}`
}

/**
 * Envia uma mensagem de texto via WhatsApp.
 * Retorna true se enviada, false se a integração está inativa ou falhou.
 * Nunca lança — falhas de WhatsApp não devem quebrar o fluxo principal.
 */
export async function enviarWhatsApp(
  numero: string | null | undefined,
  mensagem: string
): Promise<boolean> {
  if (!whatsappAtivo() || !numero) return false

  const phone = normalizarNumero(numero)
  const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CLIENT_TOKEN ? { 'Client-Token': CLIENT_TOKEN } : {}),
      },
      body: JSON.stringify({ phone, message: mensagem }),
    })
    return res.ok
  } catch (err) {
    console.error('[whatsapp] falha ao enviar:', err)
    return false
  }
}

/**
 * Envia uma imagem via WhatsApp.
 * `imagem` pode ser uma URL pública ou um data URI (data:image/png;base64,...).
 * `legenda` é opcional e aparece abaixo da foto.
 * Nunca lança — falhas não devem quebrar o fluxo principal.
 */
export async function enviarImagemWhatsApp(
  numero: string | null | undefined,
  imagem: string,
  legenda?: string
): Promise<boolean> {
  if (!whatsappAtivo() || !numero) return false

  const phone = normalizarNumero(numero)
  const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-image`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CLIENT_TOKEN ? { 'Client-Token': CLIENT_TOKEN } : {}),
      },
      body: JSON.stringify({ phone, image: imagem, caption: legenda ?? '' }),
    })
    if (!res.ok) {
      console.error('[whatsapp] send-image falhou:', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    console.error('[whatsapp] falha ao enviar imagem:', err)
    return false
  }
}

/**
 * Envia para múltiplos números em paralelo. Ignora números nulos.
 * Retorna a quantidade de envios bem-sucedidos.
 */
export async function enviarWhatsAppEmMassa(
  numeros: (string | null | undefined)[],
  mensagem: string
): Promise<number> {
  if (!whatsappAtivo()) return 0
  const resultados = await Promise.all(
    numeros.map((n) => enviarWhatsApp(n, mensagem))
  )
  return resultados.filter(Boolean).length
}
