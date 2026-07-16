import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cervo',
  description: 'Cervo · Sistema de gerenciamento de pedidos de mercadoria',
}

// Viewport correto para mobile: evita o "zoom" inicial no iPhone, respeita a
// área segura (notch) e dá comportamento de app (sem zoom por gesto acidental).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
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
