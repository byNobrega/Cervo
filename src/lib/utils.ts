import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string, fmt = "dd 'de' MMMM 'de' yyyy") {
  return format(parseISO(dateStr), fmt, { locale: ptBR })
}

export function formatDateTime(dateStr: string) {
  return format(parseISO(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function gerarTempId() {
  return `temp_${Math.random().toString(36).slice(2)}_${Date.now()}`
}
