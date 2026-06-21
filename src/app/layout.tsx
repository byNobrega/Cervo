import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cervo',
  description: 'Cervo · Sistema de gerenciamento de pedidos de mercadoria',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
