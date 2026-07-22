import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TZDate } from '@date-fns/tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fuso horário do Brasil. Sem isto, o servidor (Vercel roda em UTC) formata as
// datas 3h adiantadas — "criado às 5h" em vez de "às 2h".
const FUSO_BR = 'America/Sao_Paulo'

export function formatDate(dateStr: string, fmt = "dd 'de' MMMM 'de' yyyy") {
  return format(new TZDate(dateStr, FUSO_BR), fmt, { locale: ptBR })
}

export function formatDateTime(dateStr: string) {
  return format(new TZDate(dateStr, FUSO_BR), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

// Data curta dd/MM/yyyy no fuso do Brasil (usada nas listas do WhatsApp).
export function dataCurtaBR(dateStr: string) {
  return format(new TZDate(dateStr, FUSO_BR), 'dd/MM/yyyy')
}

export function gerarTempId() {
  return `temp_${Math.random().toString(36).slice(2)}_${Date.now()}`
}
