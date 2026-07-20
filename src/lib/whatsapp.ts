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
 * Verifica se a instância do Z-API está ativa e conectada.
 * Retorna um motivo quando NÃO está disponível, para exibir aviso ao usuário:
 *   - 'nao_configurado': faltam credenciais no ambiente
 *   - 'sem_assinatura' : a instância expirou (precisa reativar a assinatura)
 *   - 'desconectado'   : número não está conectado (ler QR Code)
 *   - null             : tudo certo, pode enviar
 */
export async function verificarConexaoWhatsApp(): Promise<
  'nao_configurado' | 'sem_assinatura' | 'desconectado' | null
> {
  if (!whatsappAtivo()) return 'nao_configurado'
  const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/status`
  try {
    const res = await fetch(url, {
      headers: { ...(CLIENT_TOKEN ? { 'Client-Token': CLIENT_TOKEN } : {}) },
    })
    const data = await res.json().catch(() => ({}))
    const erro = String(data?.error ?? '').toLowerCase()
    if (erro.includes('subscribe')) return 'sem_assinatura'
    if (data?.connected === true) return null
    if (data?.connected === false) return 'desconectado'
    // resposta inesperada — trata como indisponível genérico
    return erro ? 'sem_assinatura' : 'desconectado'
  } catch {
    return 'desconectado'
  }
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
