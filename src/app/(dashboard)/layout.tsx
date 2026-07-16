'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { LoadingOverlay } from '@/components/layout/LoadingOverlay'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarAberta, setSidebarAberta] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Feedback visual durante a navegação entre páginas */}
      <LoadingOverlay />

      <Sidebar
        aberta={sidebarAberta}
        onFechar={() => setSidebarAberta(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onAbrirSidebar={() => setSidebarAberta(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
