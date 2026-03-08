import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { useMobile } from '@/shared/hooks/useMobile'
import { cn } from '@/shared/lib/utils'
import { useState } from 'react'

export function DashboardLayout() {
  const isMobile = useMobile()
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const isSidebarCollapsed = !isSidebarHovered

  return (
    <div className="min-h-screen bg-background relative flex flex-col font-sans">
      <div className="flex flex-1 relative">
        <AppSidebar 
          onMouseEnter={() => setIsSidebarHovered(true)} 
          onMouseLeave={() => setIsSidebarHovered(false)}
          isHovered={isSidebarHovered}
        />

        <main className={cn(
          "flex-1 p-4 md:p-6 lg:p-10 transition-all duration-300 ease-in-out w-full",
          !isMobile && "pt-4" // Remove left padding logic, just standard padding
        )}>
          <div className="mx-auto max-w-7xl animate-in fade-in-50 duration-500 slide-in-from-bottom-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
