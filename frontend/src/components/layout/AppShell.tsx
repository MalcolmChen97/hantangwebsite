import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Header } from './Header'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop/Tablet: sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-60 md:flex-col z-40">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="md:pl-60 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 px-4 pt-3 pb-20 md:pb-6 md:px-6 md:pt-4">
          {children}
        </main>
      </div>

      {/* Mobile: bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  )
}
