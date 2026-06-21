import { CatalogoTabs } from '@/components/catalogo/CatalogoTabs'

export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <CatalogoTabs />
      {children}
    </div>
  )
}
