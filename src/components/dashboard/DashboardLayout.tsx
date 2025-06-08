import type { ReactNode } from "react"

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  description: string
}

export default function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  return (
    <div className="container mx-auto py-4 max-w-3xl">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
